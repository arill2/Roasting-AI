// Vercel Serverless Function — Proxy ke Groq API
// API Key disimpan di Vercel Environment Variables (GROQ_API_KEY)
// Frontend TIDAK punya akses ke key ini

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'
const MAX_CV_LENGTH = 10000
const MAX_TOKENS = 1500

// ─── Simple In-Memory Rate Limiting ───────────────────────────────────────────
// Catatan: di Vercel serverless, setiap invocation bisa di-instance baru,
// jadi ini hanya efektif per-instance. Untuk production serius, gunakan Redis/Upstash.
const rateLimitMap = new Map()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 menit
const RATE_LIMIT_MAX = 5            // max 5 request per IP per menit

function checkRateLimit(ip) {
  const now = Date.now()
  const key = ip || 'unknown'

  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, [])
  }

  const timestamps = rateLimitMap.get(key).filter(t => now - t < RATE_LIMIT_WINDOW)
  rateLimitMap.set(key, timestamps)

  if (timestamps.length >= RATE_LIMIT_MAX) {
    return false
  }

  timestamps.push(now)
  return true
}

// ─── Input Validation ─────────────────────────────────────────────────────────
function validateRequest(body) {
  if (!body || typeof body !== 'object') {
    return 'Request body tidak valid.'
  }

  const { cvText, systemPrompt } = body

  if (!cvText || typeof cvText !== 'string') {
    return 'CV text tidak boleh kosong.'
  }

  if (cvText.trim().length < 50) {
    return 'CV terlalu pendek. Minimal 50 karakter.'
  }

  if (cvText.length > MAX_CV_LENGTH) {
    return `CV terlalu panjang. Maksimal ${MAX_CV_LENGTH.toLocaleString()} karakter.`
  }

  if (!systemPrompt || typeof systemPrompt !== 'string') {
    return 'System prompt tidak valid.'
  }

  if (systemPrompt.length > 5000) {
    return 'System prompt terlalu panjang.'
  }

  return null // no error
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Rate limiting
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || 'unknown'

  if (!checkRateLimit(clientIP)) {
    return res.status(429).json({
      error: 'Terlalu banyak request. Tunggu 1 menit dan coba lagi.'
    })
  }

  // Validate API key exists
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    console.error('[FATAL] GROQ_API_KEY not set in environment variables')
    return res.status(500).json({
      error: 'Server belum dikonfigurasi dengan benar. Hubungi admin.'
    })
  }

  // Validate request body
  const validationError = validateRequest(req.body)
  if (validationError) {
    return res.status(400).json({ error: validationError })
  }

  const { cvText, systemPrompt } = req.body

  try {
    const groqResponse = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Berikut adalah CV yang perlu kamu review dan roast:\n\n${cvText.trim()}` }
        ],
        max_tokens: MAX_TOKENS,
        temperature: 0.85,
        top_p: 0.9
      })
    })

    if (!groqResponse.ok) {
      const errData = await groqResponse.json().catch(() => ({}))
      console.error('[Groq API Error]', groqResponse.status, errData)

      const safeErrors = {
        400: 'Request tidak valid. Coba persingkat CV kamu.',
        401: 'Konfigurasi API bermasalah. Hubungi admin.',
        429: 'AI sedang sibuk. Tunggu beberapa menit dan coba lagi.',
        500: 'Server AI sedang bermasalah. Coba lagi nanti.',
        503: 'Server AI sedang tidak tersedia. Coba lagi nanti.',
      }

      return res.status(groqResponse.status).json({
        error: safeErrors[groqResponse.status] || 'Terjadi kesalahan pada AI. Coba lagi nanti.'
      })
    }

    const data = await groqResponse.json()
    const content = data.choices?.[0]?.message?.content || ''

    return res.status(200).json({ result: content })

  } catch (err) {
    console.error('[Server Error]', err.message)
    return res.status(500).json({
      error: 'Terjadi kesalahan internal. Coba lagi nanti.'
    })
  }
}

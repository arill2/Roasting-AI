// ─── API Configuration ────────────────────────────────────────────────────────
// Di production (Vercel): panggil /api/roast (backend proxy)
// Di development lokal: panggil Groq langsung (pakai VITE_GROQ_API_KEY)

const isDev = import.meta.env.DEV
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

// ─── Rate Limiting (Client-side) ──────────────────────────────────────────────
const COOLDOWN_MS = 12000
let lastRequestTime = 0

function checkRateLimit() {
  const now = Date.now()
  const elapsed = now - lastRequestTime
  if (elapsed < COOLDOWN_MS) {
    const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000)
    throw new Error(`Tunggu ${remaining} detik lagi sebelum mengirim request berikutnya.`)
  }
  lastRequestTime = now
}

// ─── Input Validation ─────────────────────────────────────────────────────────
const MAX_CV_LENGTH = 10000

function validateInput(cvText) {
  if (!cvText || typeof cvText !== 'string') {
    throw new Error('Input CV tidak valid.')
  }
  const trimmed = cvText.trim()
  if (trimmed.length < 50) {
    throw new Error('CV terlalu pendek. Minimal 50 karakter agar bisa di-review.')
  }
  if (trimmed.length > MAX_CV_LENGTH) {
    throw new Error(`CV terlalu panjang (${trimmed.length.toLocaleString()} karakter). Maksimal ${MAX_CV_LENGTH.toLocaleString()} karakter.`)
  }
  return trimmed
}

// ─── Production: Call Backend Proxy ───────────────────────────────────────────
async function roastViaBackend(cvText, systemPrompt) {
  const response = await fetch('/api/roast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cvText, systemPrompt })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error || 'Terjadi kesalahan. Coba lagi nanti.')
  }

  return data.result || ''
}

// ─── Development: Call Groq Directly ──────────────────────────────────────────
async function roastViaDirect(cvText, systemPrompt) {
  const key = import.meta.env.VITE_GROQ_API_KEY
  if (!key || key === 'gsk_your_api_key_here') {
    throw new Error('VITE_GROQ_API_KEY belum diset di file .env')
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Berikut adalah CV yang perlu kamu review dan roast:\n\n${cvText}` }
      ],
      max_tokens: 1500,
      temperature: 0.85,
      top_p: 0.9
    })
  })

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    console.error('[Groq API Error]', response.status, errData)

    const safeErrors = {
      400: 'Request tidak valid. Coba persingkat CV kamu.',
      401: 'Konfigurasi API bermasalah. Hubungi admin.',
      429: 'Terlalu banyak request. Tunggu beberapa menit dan coba lagi.',
      500: 'Server AI sedang bermasalah. Coba lagi nanti.',
    }
    throw new Error(safeErrors[response.status] || `Terjadi kesalahan (kode: ${response.status}). Coba lagi nanti.`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export async function roastCV(cvText, systemPrompt) {
  checkRateLimit()
  const sanitizedCV = validateInput(cvText)

  if (isDev) {
    // Development: langsung ke Groq (pakai VITE_ key)
    return roastViaDirect(sanitizedCV, systemPrompt)
  } else {
    // Production (Vercel): lewat backend proxy
    return roastViaBackend(sanitizedCV, systemPrompt)
  }
}

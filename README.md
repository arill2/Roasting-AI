# CV ROASTER — AI IDE PROJECT PROMPT

## Overview
Buat aplikasi web "CV Roaster" — tool yang menerima upload CV dari mahasiswa Indonesia dan memberikan feedback tajam ala HRD senior menggunakan Groq AI API. Target pengguna: mahasiswa yang mau masuk PTN, daftar beasiswa, atau melamar kerja pertama.

---

## Tech Stack
- **Framework**: React + Vite
- **Styling**: Inline styles (sudah ditentukan di komponen)
- **AI**: Groq API (`llama-3.3-70b-versatile` model)
- **PDF parsing**: pdfjs-dist
- **Environment**: .env untuk API key

---

## Struktur Folder yang Harus Dibuat

```
cv-roaster/
├── .env                      ← API key Groq (WAJIB)
├── .env.example              ← Template env untuk tim
├── .gitignore
├── package.json
├── vite.config.js
├── index.html
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── constants/
    │   └── prompt.js         ← System prompt untuk AI
    ├── services/
    │   └── groqService.js    ← Semua logic panggil Groq API
    ├── utils/
    │   └── pdfParser.js      ← Ekstrak teks dari PDF
    └── components/
        └── CVRoaster.jsx     ← Komponen utama UI
```

---

## File 1: `.env`

```env
VITE_GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> **Catatan**: Prefix `VITE_` wajib agar Vite expose ke frontend. Ganti value dengan API key Groq kamu dari https://console.groq.com

---

## File 2: `.env.example`

```env
# Groq API Key — dapatkan dari https://console.groq.com
VITE_GROQ_API_KEY=gsk_your_api_key_here
```

---

## File 3: `.gitignore`

```
node_modules/
dist/
.env
.DS_Store
```

---

## File 4: `package.json`

```json
{
  "name": "cv-roaster",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "pdfjs-dist": "^4.4.168"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.0"
  }
}
```

---

## File 5: `vite.config.js`

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['pdfjs-dist']
  }
})
```

---

## File 6: `index.html`

```html
<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CV Roaster — Jujur Tanpa Filter</title>
    <meta name="description" content="Upload CV kamu dan terima feedback tajam ala HRD senior. Untuk mahasiswa PTN, beasiswa, dan kerja pertama." />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

---

## File 7: `src/main.jsx`

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

---

## File 8: `src/App.jsx`

```jsx
import CVRoaster from './components/CVRoaster'

export default function App() {
  return <CVRoaster />
}
```

---

## File 9: `src/constants/prompt.js`

```js
export const ROAST_SYSTEM_PROMPT = `Kamu adalah HRD senior Indonesia yang sudah 20 tahun menyeleksi ribuan CV mahasiswa untuk beasiswa PTN, program pertukaran pelajar, dan rekrutmen kampus bergengsi. Kamu terkenal jujur, tajam, dan tidak pernah basa-basi. Gaya kamu seperti Simon Cowell — langsung ke inti masalah, tidak ada basa-basi, tapi kamu juga sangat kompeten sehingga kritikmu sangat berharga.

Kamu akan membaca CV mahasiswa Indonesia dan memberikan feedback dalam bentuk SURAT TERBUKA dari HRD.

FORMAT SURAT (WAJIB DIIKUTI PERSIS):

**SURAT TERBUKA DARI MEJA HRD**
*[tulis tanggal hari ini format Indonesia, contoh: 30 April 2025]*

Kepada Yth. [Nama kandidat jika ada di CV, atau tulis "Kandidat Yang Terhormat"],

[PARAGRAF 1 — KESAN PERTAMA]
Tulis kesan pertama yang sangat jujur dan tajam saat melihat CV ini. Tidak perlu sopan berlebihan. Bisa dimulai dengan "Jujur saja..." atau "Setelah 3 detik melihat CV Anda..." atau "Izinkan saya berterus terang..." dsb. Minimal 4 kalimat.

[PARAGRAF 2 — PEMBEDAHAN FORMAT & VISUAL]
Bedah habis tampilan, layout, font, foto (kalau ada/tidak ada), panjang CV, konsistensi format, penggunaan spasi, header, dsb. Spesifik dan pedas. Minimal 4 kalimat.

[PARAGRAF 3 — PEMBEDAHAN KONTEN]
Bedah isi CV: pengalaman organisasi, prestasi, skills, deskripsi kegiatan. Apakah terlalu generik? Tidak ada angka/data konkret? Kurang relevan dengan tujuan? Terlalu bertele-tele atau terlalu pendek? Kutip bagian spesifik dari CV. Minimal 5 kalimat.

[PARAGRAF 4 — DOSA-DOSA FATAL]
Sebutkan 2-3 "dosa besar" yang paling merusak CV ini. Gunakan analogi atau perbandingan yang menohok tapi relevan dengan konteks Indonesia. Contoh gaya: "Ini seperti datang wawancara pakai sandal jepit..." atau "Menulis 'bisa Microsoft Office' di tahun 2024 itu seperti...". Minimal 4 kalimat.

[PARAGRAF 5 — REKOMENDASI KONKRET]
Meski pedas, berikan 3-5 rekomendasi konkret dan spesifik yang BISA langsung dilakukan untuk memperbaiki CV ini dalam minggu ini. Nomori setiap rekomendasi. Ini bagian yang paling membangun — tetap tajam tapi actionable.

[PARAGRAF PENUTUP]
Tutup dengan 2-3 kalimat yang memorable — bisa ada nada motivasi tapi tetap jujur dan tidak gombal. Tidak perlu manis-manis. Sesuatu yang akan diingat kandidat.

Hormat saya,
**[Buat nama fiktif HRD senior yang terdengar senior dan kredibel, contoh: Bapak Hendra Sutrisno, Ibu Ratna Dewi Kusuma, dll]**
*HRD Senior & Kepala Seleksi, [nama institusi/perusahaan fiktif bergengsi Indonesia]*

ATURAN WAJIB:
- Gunakan Bahasa Indonesia yang natural dan mengalir, bukan formal kaku
- Boleh pakai analogi budaya pop Indonesia, referensi lokal, atau humor satir yang relevan
- JANGAN pernah bilang "CV ini sudah cukup baik" atau memuji tanpa alasan sangat kuat
- Kalau ada bagian CV yang genuinely bagus, boleh akui — tapi dalam konteks keseluruhan yang tetap jujur
- Panjang total surat: minimal 450 kata, maksimal 750 kata
- SELALU kutip bagian spesifik dari CV yang bermasalah dengan tanda kutip
- Konteks seleksi: PTN/beasiswa/program prestasi mahasiswa Indonesia
- JANGAN gunakan bullet point — semua dalam bentuk paragraf mengalir kecuali bagian rekomendasi`

export const PDF_EXTRACT_PROMPT = `Ekstrak semua teks dari dokumen CV/resume ini secara lengkap dan akurat. 
Tampilkan semua konten apa adanya termasuk: nama lengkap, kontak, foto (sebutkan ada/tidak), 
pendidikan, pengalaman kerja/magang, pengalaman organisasi, prestasi/penghargaan, 
skills/kemampuan, sertifikasi, dan informasi lainnya. 
Pertahankan struktur asli sebisa mungkin. 
Jangan tambahkan komentar, analisis, atau teks apapun selain isi CV itu sendiri.`
```

---

## File 10: `src/services/groqService.js`

```js
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

const getApiKey = () => {
  const key = import.meta.env.VITE_GROQ_API_KEY
  if (!key || key === 'gsk_your_api_key_here') {
    throw new Error('VITE_GROQ_API_KEY belum diset di file .env')
  }
  return key
}

export async function roastCV(cvText, systemPrompt) {
  const apiKey = getApiKey()

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Berikut adalah CV yang perlu kamu review dan roast:\n\n${cvText}`
        }
      ],
      max_tokens: 1500,
      temperature: 0.85,
      top_p: 0.9
    })
  })

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(errData?.error?.message || `Groq API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}
```

---

## File 11: `src/utils/pdfParser.js`

```js
import * as pdfjsLib from 'pdfjs-dist'

// Set worker path — pdfjs butuh ini
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString()

export async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  let fullText = ''

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()
    const pageText = textContent.items
      .map(item => item.str)
      .join(' ')
    fullText += pageText + '\n'
  }

  return fullText.trim()
}
```

---

## File 12: `src/components/CVRoaster.jsx`

```jsx
import { useState, useRef } from 'react'
import { roastCV } from '../services/groqService'
import { extractTextFromPDF } from '../utils/pdfParser'
import { ROAST_SYSTEM_PROMPT } from '../constants/prompt'

export default function CVRoaster() {
  const [cvText, setCvText] = useState('')
  const [fileName, setFileName] = useState('')
  const [roastResult, setRoastResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [phase, setPhase] = useState('idle') // idle | reading | roasting | done
  const fileRef = useRef()

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)
    setError('')
    setRoastResult('')

    if (file.type === 'application/pdf') {
      setPhase('reading')
      try {
        const extracted = await extractTextFromPDF(file)
        if (!extracted || extracted.length < 50) {
          throw new Error('Teks terlalu sedikit — PDF mungkin berupa gambar/scan. Coba paste teks manual.')
        }
        setCvText(extracted)
        setPhase('idle')
      } catch (err) {
        setError(err.message || 'Gagal membaca PDF. Coba paste teks CV secara manual.')
        setPhase('idle')
      }
    } else if (file.type === 'text/plain') {
      const text = await file.text()
      setCvText(text)
      setPhase('idle')
    } else {
      setError('Upload PDF atau file .txt ya. Format lain belum didukung.')
    }
  }

  const handleRoast = async () => {
    if (!cvText.trim()) {
      setError('CV-nya kosong! Upload file atau paste teks CV kamu dulu.')
      return
    }
    setLoading(true)
    setError('')
    setRoastResult('')
    setPhase('roasting')

    try {
      const result = await roastCV(cvText, ROAST_SYSTEM_PROMPT)
      setRoastResult(result)
      setPhase('done')
    } catch (err) {
      setError('Error: ' + err.message)
      setPhase('idle')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setCvText('')
    setFileName('')
    setRoastResult('')
    setError('')
    setPhase('idle')
    if (fileRef.current) fileRef.current.value = ''
  }

  const renderText = (text) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
      return (
        <p key={i} style={{ margin: '0 0 10px 0', lineHeight: 1.75 }}>
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**'))
              return <strong key={j}>{part.slice(2, -2)}</strong>
            if (part.startsWith('*') && part.endsWith('*'))
              return <em key={j}>{part.slice(1, -1)}</em>
            return part
          })}
        </p>
      )
    })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      fontFamily: "'Georgia', 'Times New Roman', serif",
      color: '#e8e0d0',
      padding: '0',
    }}>
      {/* ===== HEADER ===== */}
      <div style={{
        borderBottom: '1px solid #2a2a2a',
        padding: '32px 40px 28px',
        background: '#0a0a0a',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{
            fontSize: 11,
            letterSpacing: '0.25em',
            color: '#c0392b',
            textTransform: 'uppercase',
            fontFamily: "'Arial Narrow', Arial, sans-serif",
            marginBottom: 6,
            fontWeight: 700,
          }}>
            ◆ CV ROASTER — EDISI JUJUR TANPA FILTER
          </div>
          <h1 style={{
            fontSize: 28,
            fontWeight: 400,
            margin: 0,
            color: '#f0ead8',
            letterSpacing: '-0.02em',
          }}>
            Kirim CV-mu. Terima Kebenaran.
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 40px 80px' }}>

        {/* ===== INTRO ===== */}
        {phase === 'idle' && !roastResult && (
          <div style={{
            border: '1px solid #c0392b',
            borderLeft: '4px solid #c0392b',
            padding: '20px 24px',
            marginBottom: 36,
            background: 'rgba(192,57,43,0.05)',
          }}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8, color: '#c8bfb0' }}>
              <strong style={{ color: '#e8e0d0' }}>Untuk mahasiswa yang mau lolos PTN, beasiswa, atau kerja pertama.</strong>
              <br />
              Upload CV kamu dan dapatkan feedback jujur ala HRD senior — tidak ada pujian palsu,
              tidak ada basa-basi. Kalau CV kamu lemah, kamu akan tahu persis di mana dan kenapa.
            </p>
          </div>
        )}

        {/* ===== UPLOAD AREA ===== */}
        {phase !== 'done' && (
          <div style={{ marginBottom: 28 }}>
            <label style={{
              display: 'block',
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#888',
              fontFamily: 'Arial, sans-serif',
              marginBottom: 10,
            }}>
              Upload CV (PDF / TXT)
            </label>

            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: '1px dashed #333',
                borderRadius: 2,
                padding: '28px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
                background: fileName ? 'rgba(192,57,43,0.03)' : 'transparent',
                borderColor: fileName ? '#c0392b' : '#333',
              }}
            >
              {fileName ? (
                <div>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>📄</div>
                  <div style={{ fontSize: 14, color: '#e8e0d0' }}>{fileName}</div>
                  {phase === 'reading' && (
                    <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>Membaca isi PDF...</div>
                  )}
                  {cvText && phase !== 'reading' && (
                    <div style={{ fontSize: 12, color: '#5a9a5a', marginTop: 6 }}>
                      ✓ {cvText.length} karakter berhasil dibaca
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>⬆</div>
                  <div style={{ fontSize: 14, color: '#666' }}>Klik untuk upload PDF atau .txt</div>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.txt"
                onChange={handleFile}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        )}

        {/* ===== MANUAL PASTE ===== */}
        {phase !== 'done' && (
          <div style={{ marginBottom: 28 }}>
            <label style={{
              display: 'block',
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#888',
              fontFamily: 'Arial, sans-serif',
              marginBottom: 10,
            }}>
              atau Paste Teks CV Langsung
            </label>
            <textarea
              value={cvText}
              onChange={e => { setCvText(e.target.value); setFileName('') }}
              placeholder="Paste isi CV kamu di sini — nama, pendidikan, pengalaman, prestasi, organisasi, skills..."
              rows={8}
              style={{
                width: '100%',
                background: '#111',
                border: '1px solid #2a2a2a',
                borderRadius: 2,
                color: '#c8bfb0',
                padding: '14px 16px',
                fontSize: 13,
                fontFamily: 'Georgia, serif',
                lineHeight: 1.7,
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        {/* ===== ERROR ===== */}
        {error && (
          <div style={{
            background: 'rgba(192,57,43,0.1)',
            border: '1px solid #c0392b',
            padding: '12px 16px',
            marginBottom: 20,
            fontSize: 13,
            color: '#e74c3c',
          }}>
            {error}
          </div>
        )}

        {/* ===== CTA BUTTON ===== */}
        {phase !== 'done' && (
          <button
            onClick={handleRoast}
            disabled={loading || phase === 'reading' || !cvText.trim()}
            style={{
              width: '100%',
              padding: '16px 24px',
              background: loading ? '#1a1a1a' : '#c0392b',
              color: loading ? '#555' : '#fff',
              border: 'none',
              borderRadius: 2,
              fontSize: 14,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontFamily: 'Arial, sans-serif',
              fontWeight: 700,
              cursor: loading || phase === 'reading' ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {phase === 'reading'
              ? '⏳ Membaca CV...'
              : loading
              ? '🔥 HRD sedang membaca dengan seksama...'
              : '🔥 Roast CV Saya Sekarang'}
          </button>
        )}

        {loading && (
          <div style={{
            textAlign: 'center',
            padding: '40px 0 20px',
            color: '#666',
            fontSize: 13,
            fontStyle: 'italic',
          }}>
            HRD senior sedang menyiapkan pena merah...
          </div>
        )}

        {/* ===== RESULT — SURAT HRD ===== */}
        {roastResult && phase === 'done' && (
          <div style={{ marginTop: 48 }}>
            <div style={{
              fontSize: 11,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: '#c0392b',
              fontFamily: 'Arial, sans-serif',
              marginBottom: 24,
              fontWeight: 700,
            }}>
              ◆ Surat dari Meja HRD
            </div>

            <div style={{
              background: '#f9f5ee',
              color: '#1a1a1a',
              borderRadius: 2,
              padding: '48px 52px',
              border: '1px solid #ddd',
              position: 'relative',
              boxShadow: '0 4px 40px rgba(0,0,0,0.4)',
            }}>
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(0,0,0,0.04) 27px, rgba(0,0,0,0.04) 28px)',
                borderRadius: 2,
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'relative',
                fontSize: 15,
                lineHeight: 1.8,
                fontFamily: 'Georgia, serif',
              }}>
                {renderText(roastResult)}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                onClick={reset}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'transparent',
                  border: '1px solid #333',
                  color: '#888',
                  borderRadius: 2,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'Arial, sans-serif',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                ↩ Roast CV Lain
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(roastResult).then(() => alert('Surat HRD sudah dicopy!'))}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  color: '#c8bfb0',
                  borderRadius: 2,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'Arial, sans-serif',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                📋 Copy Feedback
              </button>
            </div>

            <p style={{
              marginTop: 24,
              fontSize: 12,
              color: '#444',
              textAlign: 'center',
              fontStyle: 'italic',
            }}>
              Feedback ini dihasilkan AI. Gunakan sebagai masukan, bukan vonis final.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## Cara Setup & Jalankan

```bash
# 1. Clone / buat folder project
mkdir cv-roaster && cd cv-roaster

# 2. Install dependencies
npm install

# 3. Isi API key di .env
# Edit file .env dan ganti value VITE_GROQ_API_KEY

# 4. Jalankan dev server
npm run dev

# 5. Buka browser ke http://localhost:5173
```

## Cara Dapat Groq API Key

1. Buka https://console.groq.com
2. Daftar / login
3. Klik "API Keys" → "Create API Key"
4. Copy key yang dihasilkan (format: `gsk_xxx...`)
5. Paste ke `.env` → `VITE_GROQ_API_KEY=gsk_xxx...`

---

## Catatan Penting untuk AI IDE

- **Jangan ubah UI** — styling sudah diset inline sesuai desain asli (dark editorial theme + surat kertas krem)
- **Jangan ganti model Groq** — gunakan `llama-3.3-70b-versatile` untuk kualitas terbaik
- **PDF parsing** menggunakan pdfjs-dist bawaan browser, tanpa backend
- **Temperature 0.85** — sengaja sedikit tinggi agar gaya bahasa surat bervariasi tiap kali
- Kalau ada error CORS saat dev, itu normal untuk beberapa PDF — fallback ke paste manual sudah tersedia
import { useState, useRef, useEffect } from 'react'
import { roastCV } from '../services/groqService'
import { extractTextFromPDF } from '../utils/pdfParser'
import { ROAST_SYSTEM_PROMPT } from '../constants/prompt'
import { canRoast, recordUsage, getSessionInfo } from '../services/voucherService'
import { useScrollReveal } from '../hooks/useScrollReveal'
import VoucherGate from './VoucherGate'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_TEXT_LENGTH = 10000

export default function CVRoaster() {
  const [cvText, setCvText] = useState('')
  const [fileName, setFileName] = useState('')
  const [roastResult, setRoastResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [phase, setPhase] = useState('idle')
  const [sessionTick, setSessionTick] = useState(0)
  const [headerScrolled, setHeaderScrolled] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  const refreshSession = () => setSessionTick(t => t + 1)

  // Scroll-triggered refs
  const [introRef, introVisible] = useScrollReveal()
  const [uploadRef, uploadVisible] = useScrollReveal({ threshold: 0.1 })
  const [pasteRef, pasteVisible] = useScrollReveal({ threshold: 0.1 })
  const [ctaRef, ctaVisible] = useScrollReveal({ threshold: 0.2 })
  const [resultRef, resultVisible] = useScrollReveal({ threshold: 0.05 })
  const [actionsRef, actionsVisible] = useScrollReveal({ threshold: 0.2 })

  // Header blur on scroll
  useEffect(() => {
    const onScroll = () => setHeaderScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleFile = async (e) => {
    const file = e.target.files?.[0] || e
    if (!file || !file.name) return
    setFileName(file.name)
    setError('')
    setRoastResult('')

    // Validasi ukuran file (max 5MB)
    if (file.size && file.size > MAX_FILE_SIZE) {
      setError(`File terlalu besar (${(file.size / 1024 / 1024).toFixed(1)}MB). Maksimal 5MB.`)
      return
    }

    if (file.type === 'application/pdf') {
      setPhase('reading')
      try {
        const extracted = await extractTextFromPDF(file)
        if (!extracted || extracted.length < 50) {
          throw new Error('Teks terlalu sedikit — PDF mungkin berupa gambar/scan. Coba paste teks manual.')
        }
        setCvText(extracted.slice(0, MAX_TEXT_LENGTH))
        setPhase('idle')
      } catch (err) {
        setError(err.message || 'Gagal membaca PDF. Coba paste teks CV secara manual.')
        setPhase('idle')
      }
    } else if (file.type === 'text/plain') {
      const text = await file.text()
      setCvText(text.slice(0, MAX_TEXT_LENGTH))
      setPhase('idle')
    } else {
      setError('Upload PDF atau file .txt ya. Format lain belum didukung.')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile({ ...file, name: file.name, type: file.type, text: () => file.text(), arrayBuffer: () => file.arrayBuffer() })
  }

  const handleRoast = async () => {
    if (!canRoast()) {
      setError('Kuota roast kamu habis. Hubungi kami di WA untuk beli voucher baru.')
      return
    }
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
      recordUsage()
      refreshSession()
      setPhase('done')
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan. Coba lagi nanti.')
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const renderText = (text) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
      return (
        <p key={i} style={{
          margin: '0 0 10px 0',
          lineHeight: 1.75,
          opacity: 0,
          animation: resultVisible ? `fadeInUp 0.5s ${100 + i * 40}ms cubic-bezier(0.16,1,0.3,1) forwards` : 'none',
        }}>
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
      <div
        className="header-blur"
        style={{
          borderBottom: '1px solid rgba(42,42,42,0.6)',
          padding: '32px 40px 28px',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          boxShadow: headerScrolled ? '0 4px 30px rgba(0,0,0,0.5)' : 'none',
          transition: 'box-shadow 0.4s ease',
        }}
      >
        <div className="header-content" style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{
            fontSize: 11,
            letterSpacing: '0.25em',
            color: '#c0392b',
            textTransform: 'uppercase',
            fontFamily: "'Arial Narrow', Arial, sans-serif",
            marginBottom: 6,
            fontWeight: 700,
            opacity: 0,
            animation: 'fadeInDown 0.6s 0.1s cubic-bezier(0.16,1,0.3,1) forwards',
          }}>
            ◆ CV ROASTER — EDISI JUJUR TANPA FILTER
          </div>
          <h1 style={{
            fontSize: 28,
            fontWeight: 400,
            margin: 0,
            color: '#f0ead8',
            letterSpacing: '-0.02em',
            opacity: 0,
            animation: 'fadeInUp 0.7s 0.25s cubic-bezier(0.16,1,0.3,1) forwards',
          }}>
            Kirim CV-mu. Terima Kebenaran.
          </h1>
        </div>
      </div>

      <VoucherGate onStatusChange={refreshSession} />

      <div className="main-content" style={{ maxWidth: 760, margin: '0 auto', padding: '40px 40px 80px' }}>

        {/* ── PAYWALL BANNER ── */}
        {!canRoast() && (
          <div style={{
            border: '1px solid #c0392b',
            borderLeft: '4px solid #c0392b',
            padding: '24px 28px',
            marginBottom: 32,
            background: 'rgba(192,57,43,0.06)',
            textAlign: 'center',
            animation: 'scaleIn 0.5s cubic-bezier(0.16,1,0.3,1)',
          }}>
            <div style={{ fontSize: 24, marginBottom: 12, animation: 'floatSlow 3s infinite ease-in-out' }}>🔒</div>
            <p style={{ margin: '0 0 8px', fontSize: 15, color: '#e8e0d0', fontFamily: 'Georgia, serif' }}>
              Kuota roast kamu sudah habis.
            </p>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#888', fontFamily: 'Arial, sans-serif', lineHeight: 1.7 }}>
              Mau lanjut roast CV? Chat ke WhatsApp kami untuk beli voucher.<br />
              <strong style={{ color: '#c8bfb0' }}>Starter (3x)</strong> &nbsp;|&nbsp;
              <strong style={{ color: '#c8bfb0' }}>Pro (6x)</strong> &nbsp;|&nbsp;
              <strong style={{ color: '#c8bfb0' }}>Unlimited (∞)</strong>
            </p>
            <a
              className="btn-whatsapp"
              href="https://wa.me/6282196726398?text=Halo,%20saya%20mau%20beli%20voucher%20CV%20Roaster"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                padding: '12px 28px',
                background: '#25D366',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: 4,
                fontSize: 13,
                fontFamily: 'Arial, sans-serif',
                fontWeight: 700,
                letterSpacing: '0.05em',
              }}
            >
              💬 Chat WhatsApp Sekarang
            </a>
          </div>
        )}

        {/* ===== INTRO ===== */}
        {phase === 'idle' && !roastResult && (
          <div
            ref={introRef}
            className={`reveal-left ${introVisible ? 'visible' : ''}`}
            style={{
              border: '1px solid #c0392b',
              borderLeft: '4px solid #c0392b',
              padding: '20px 24px',
              marginBottom: 36,
              background: 'rgba(192,57,43,0.05)',
              transitionDelay: '0.1s',
            }}
          >
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
          <div
            ref={uploadRef}
            className={`reveal ${uploadVisible ? 'visible' : ''}`}
            style={{ marginBottom: 28, transitionDelay: '0.15s' }}
          >
            <label style={{
              display: 'block', fontSize: 11, letterSpacing: '0.2em',
              textTransform: 'uppercase', color: '#888',
              fontFamily: 'Arial, sans-serif', marginBottom: 10,
            }}>
              Upload CV (PDF / TXT)
            </label>

            <div
              className="upload-zone"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: '1px dashed #333',
                borderRadius: 4,
                padding: '32px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragOver
                  ? 'rgba(192,57,43,0.08)'
                  : fileName
                    ? 'rgba(192,57,43,0.03)'
                    : 'transparent',
                borderColor: dragOver ? '#c0392b' : fileName ? '#c0392b' : '#333',
              }}
            >
              {fileName ? (
                <div>
                  <div style={{ fontSize: 28, marginBottom: 8, animation: 'scaleIn 0.4s ease' }}>📄</div>
                  <div style={{ fontSize: 14, color: '#e8e0d0', animation: 'fadeIn 0.4s 0.1s both' }}>{fileName}</div>
                  {phase === 'reading' && (
                    <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
                      <span className="loading-dots">
                        Membaca isi PDF <span></span><span></span><span></span>
                      </span>
                    </div>
                  )}
                  {cvText && phase !== 'reading' && (
                    <div style={{
                      fontSize: 12, color: '#5a9a5a', marginTop: 8,
                      animation: 'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1)',
                    }}>
                      ✓ {cvText.length} karakter berhasil dibaca
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{
                    fontSize: 32, marginBottom: 10,
                    animation: dragOver ? 'floatSlow 1s infinite ease-in-out' : 'none',
                    transition: 'transform 0.3s ease',
                  }}>
                    {dragOver ? '📥' : '⬆'}
                  </div>
                  <div style={{ fontSize: 14, color: '#666' }}>
                    {dragOver ? 'Lepaskan file di sini...' : 'Klik atau drag file PDF / .txt ke sini'}
                  </div>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.txt"
                onChange={(e) => handleFile(e)}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        )}

        {/* ===== MANUAL PASTE ===== */}
        {phase !== 'done' && (
          <div
            ref={pasteRef}
            className={`reveal ${pasteVisible ? 'visible' : ''}`}
            style={{ marginBottom: 28, transitionDelay: '0.2s' }}
          >
            <label style={{
              display: 'block', fontSize: 11, letterSpacing: '0.2em',
              textTransform: 'uppercase', color: '#888',
              fontFamily: 'Arial, sans-serif', marginBottom: 10,
            }}>
              atau Paste Teks CV Langsung
            </label>
            <textarea
              className="textarea-cv"
              value={cvText}
              onChange={e => { setCvText(e.target.value); setFileName('') }}
              placeholder="Paste isi CV kamu di sini — nama, pendidikan, pengalaman, prestasi, organisasi, skills..."
              rows={8}
              style={{
                width: '100%', background: '#111',
                border: '1px solid #2a2a2a', borderRadius: 4,
                color: '#c8bfb0', padding: '14px 16px',
                fontSize: 13, fontFamily: 'Georgia, serif',
                lineHeight: 1.7, resize: 'vertical',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        {/* ===== ERROR ===== */}
        {error && (
          <div className="error-shake" style={{
            background: 'rgba(192,57,43,0.1)',
            border: '1px solid #c0392b',
            padding: '12px 16px',
            marginBottom: 20,
            fontSize: 13,
            color: '#e74c3c',
            borderRadius: 4,
            animation: 'shake 0.5s ease, fadeIn 0.3s ease',
          }}>
            {error}
          </div>
        )}

        {/* ===== CTA BUTTON ===== */}
        {phase !== 'done' && (
          <div
            ref={ctaRef}
            className={`reveal ${ctaVisible ? 'visible' : ''}`}
            style={{ transitionDelay: '0.25s' }}
          >
            <button
              className="btn-roast"
              onClick={handleRoast}
              disabled={loading || phase === 'reading' || !cvText.trim()}
              style={{
                width: '100%',
                padding: '18px 24px',
                background: loading ? '#1a1a1a' : 'linear-gradient(135deg, #c0392b, #a93226)',
                color: loading ? '#555' : '#fff',
                border: 'none',
                borderRadius: 4,
                fontSize: 14,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontFamily: 'Arial, sans-serif',
                fontWeight: 700,
                cursor: loading || phase === 'reading' ? 'not-allowed' : 'pointer',
              }}
            >
              {phase === 'reading'
                ? '⏳ Membaca CV...'
                : loading
                  ? '🔥 HRD sedang membaca dengan seksama...'
                  : '🔥 Roast CV Saya Sekarang'}
            </button>
          </div>
        )}

        {/* ===== LOADING STATE ===== */}
        {loading && (
          <div style={{
            textAlign: 'center',
            padding: '48px 0 20px',
            animation: 'fadeIn 0.5s ease',
          }}>
            <div className="loading-dots" style={{ marginBottom: 16 }}>
              <span></span><span></span><span></span>
            </div>
            <div style={{ color: '#666', fontSize: 13, fontStyle: 'italic' }}>
              HRD senior sedang menyiapkan pena merah...
            </div>
          </div>
        )}

        {/* ===== RESULT — SURAT HRD ===== */}
        {roastResult && phase === 'done' && (
          <div ref={resultRef} style={{ marginTop: 48 }}>
            <div style={{
              fontSize: 11, letterSpacing: '0.25em',
              textTransform: 'uppercase', color: '#c0392b',
              fontFamily: 'Arial, sans-serif', marginBottom: 24, fontWeight: 700,
              opacity: 0,
              animation: resultVisible ? 'fadeInUp 0.6s 0.1s cubic-bezier(0.16,1,0.3,1) forwards' : 'none',
            }}>
              ◆ Surat dari Meja HRD
            </div>

            <div
              className="letter-card"
              style={{
                background: '#f9f5ee',
                color: '#1a1a1a',
                borderRadius: 4,
                padding: '48px 52px',
                border: '1px solid #ddd',
                position: 'relative',
                boxShadow: '0 4px 40px rgba(0,0,0,0.4)',
                opacity: 0,
                animation: resultVisible ? 'scaleIn 0.7s 0.2s cubic-bezier(0.16,1,0.3,1) forwards' : 'none',
              }}
            >
              <div className="letter-inner" style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(0,0,0,0.04) 27px, rgba(0,0,0,0.04) 28px)',
                borderRadius: 4,
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
            <div
              ref={actionsRef}
              style={{
                display: 'flex', gap: 12, marginTop: 24,
                opacity: 0,
                animation: actionsVisible ? 'fadeInUp 0.5s 0.1s cubic-bezier(0.16,1,0.3,1) forwards' : 'none',
              }}
            >
              <button
                className="btn-action"
                onClick={reset}
                style={{
                  flex: 1, padding: '14px',
                  background: 'transparent',
                  border: '1px solid #333',
                  color: '#888', borderRadius: 4,
                  fontSize: 13, cursor: 'pointer',
                  fontFamily: 'Arial, sans-serif',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                ↩ Roast CV Lain
              </button>
              <button
                className="btn-action"
                onClick={() => navigator.clipboard.writeText(roastResult).then(() => alert('Surat HRD sudah dicopy!'))}
                style={{
                  flex: 1, padding: '14px',
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  color: '#c8bfb0', borderRadius: 4,
                  fontSize: 13, cursor: 'pointer',
                  fontFamily: 'Arial, sans-serif',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                📋 Copy Feedback
              </button>
            </div>

            <p style={{
              marginTop: 24, fontSize: 12,
              color: '#444', textAlign: 'center',
              fontStyle: 'italic',
              opacity: 0,
              animation: actionsVisible ? 'fadeIn 0.5s 0.3s ease forwards' : 'none',
            }}>
              Feedback ini dihasilkan AI. Gunakan sebagai masukan, bukan vonis final.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

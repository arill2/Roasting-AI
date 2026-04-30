import { useState } from 'react'
import { activateVoucher, getSessionInfo } from '../services/voucherService'
import { TIER_CONFIG } from '../constants/vouchers'

const TIER_BADGE = {
  FREE:      { label: 'FREE',      bg: '#1a1a1a', color: '#888',    border: '#333'    },
  STARTER:   { label: 'STARTER',   bg: '#1a1200', color: '#b8860b', border: '#b8860b' },
  PRO:       { label: 'PRO',       bg: '#001a2e', color: '#2980b9', border: '#2980b9' },
  UNLIMITED: { label: 'UNLIMITED', bg: '#001a0e', color: '#27ae60', border: '#27ae60' },
}

export default function VoucherGate({ onStatusChange }) {
  const [code, setCode]           = useState('')
  const [message, setMessage]     = useState(null)
  const [loading, setLoading]     = useState(false)
  const [showInput, setShowInput] = useState(false)

  const info    = getSessionInfo()
  const badge   = TIER_BADGE[info.tier]
  const isUnlim = info.isUnlimited

  const handleActivate = async () => {
    if (!code.trim()) return
    setLoading(true)
    setMessage(null)

    await new Promise(r => setTimeout(r, 600))

    const result = activateVoucher(code)
    setLoading(false)

    if (result.success) {
      const quotaText = result.quota === Infinity ? 'Unlimited roast' : `${result.quota}x roast`
      setMessage({ type: 'success', text: `✓ Voucher ${result.label} aktif! ${quotaText} siap digunakan.` })
      setCode('')
      setShowInput(false)
      if (onStatusChange) onStatusChange()
    } else {
      setMessage({ type: 'error', text: result.error })
    }
  }

  return (
    <div
      className="voucher-bar"
      style={{
        borderBottom: '1px solid #1e1e1e',
        padding: '14px 40px',
        background: '#0d0d0d',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
        animation: 'fadeIn 0.5s 0.4s cubic-bezier(0.16,1,0.3,1) both',
      }}
    >
      {/* Badge tier */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '5px 12px',
        border: `1px solid ${badge.border}`,
        background: badge.bg,
        borderRadius: 4,
        transition: 'all 0.4s ease',
      }}>
        <span style={{
          width: 6, height: 6,
          borderRadius: '50%',
          background: badge.color,
          display: 'inline-block',
          boxShadow: `0 0 6px ${badge.color}`,
          animation: 'pulseGlow 2s infinite ease-in-out',
        }} />
        <span style={{
          fontSize: 10,
          fontFamily: 'Arial, sans-serif',
          letterSpacing: '0.2em',
          fontWeight: 700,
          color: badge.color,
        }}>
          {badge.label}
        </span>
      </div>

      {/* Sisa kuota */}
      <span style={{
        fontSize: 12, color: '#555', fontFamily: 'Arial, sans-serif',
        transition: 'color 0.3s ease',
      }}>
        {isUnlim
          ? '∞ roast tersisa'
          : info.remaining > 0
          ? `${info.remaining}x roast tersisa`
          : <span style={{ color: '#c0392b' }}>Kuota habis</span>
        }
      </span>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Tombol & input voucher */}
      {!info.voucher && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          animation: showInput ? 'fadeIn 0.3s ease' : 'none',
        }}>
          {showInput ? (
            <>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleActivate()}
                placeholder="STR-XXXXX"
                maxLength={12}
                autoFocus
                style={{
                  background: '#111',
                  border: '1px solid #333',
                  color: '#e8e0d0',
                  padding: '6px 12px',
                  fontSize: 12,
                  fontFamily: 'monospace',
                  letterSpacing: '0.1em',
                  borderRadius: 4,
                  outline: 'none',
                  width: 130,
                  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#c0392b'
                  e.target.style.boxShadow = '0 0 0 2px rgba(192,57,43,0.15)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#333'
                  e.target.style.boxShadow = 'none'
                }}
              />
              <button
                onClick={handleActivate}
                disabled={loading || !code.trim()}
                className="btn-roast"
                style={{
                  padding: '6px 14px',
                  background: loading ? '#1a1a1a' : '#c0392b',
                  color: loading ? '#555' : '#fff',
                  border: 'none',
                  borderRadius: 4,
                  fontSize: 11,
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                {loading ? '...' : 'Aktifkan'}
              </button>
              <button
                onClick={() => { setShowInput(false); setCode(''); setMessage(null) }}
                style={{
                  padding: '6px 10px',
                  background: 'transparent',
                  color: '#555',
                  border: '1px solid #222',
                  borderRadius: 4,
                  fontSize: 11,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                ✕
              </button>
            </>
          ) : (
            <button
              className="btn-voucher"
              onClick={() => setShowInput(true)}
              style={{
                padding: '6px 14px',
                background: 'transparent',
                color: '#888',
                border: '1px solid #2a2a2a',
                borderRadius: 4,
                fontSize: 11,
                fontFamily: 'Arial, sans-serif',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              🎟 Punya Voucher?
            </button>
          )}
        </div>
      )}

      {/* Message */}
      {message && (
        <div style={{
          width: '100%',
          marginTop: 6,
          fontSize: 12,
          color: message.type === 'success' ? '#27ae60' : '#e74c3c',
          fontFamily: 'Arial, sans-serif',
          animation: message.type === 'error' ? 'shake 0.5s ease' : 'fadeIn 0.4s ease',
        }}>
          {message.text}
        </div>
      )}
    </div>
  )
}

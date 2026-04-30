import { VOUCHER_MAP } from '../constants/vouchers'

const STORAGE_KEY = 'cv_roaster_session'
const FREE_QUOTA  = 3
const VALID_TIERS = ['FREE', 'STARTER', 'PRO', 'UNLIMITED']

// ─── Storage Helpers ──────────────────────────────────────────────────────────
function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return validateSessionSchema(parsed) ? parsed : null
  } catch {
    // Data corrupt — hapus dan mulai baru
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

function saveSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

// ─── Schema Validation ───────────────────────────────────────────────────────
function validateSessionSchema(data) {
  if (!data || typeof data !== 'object') return false

  // Validasi tipe data setiap field
  if (typeof data.freeUsed !== 'number' || data.freeUsed < 0 || !Number.isFinite(data.freeUsed)) return false
  if (!VALID_TIERS.includes(data.tier)) return false
  if (data.voucher !== null && typeof data.voucher !== 'string') return false
  if (data.quota !== null && (typeof data.quota !== 'number' || data.quota < 0)) return false
  if (!Array.isArray(data.usageHistory)) return false

  // Cek batas wajar — freeUsed tidak mungkin negatif atau sangat besar
  if (data.freeUsed > 1000) return false

  return true
}

// ─── Session Init ─────────────────────────────────────────────────────────────
export function getOrCreateSession() {
  const existing = loadSession()
  if (existing) return existing

  const fresh = {
    freeUsed: 0,
    voucher: null,
    tier: 'FREE',
    quota: FREE_QUOTA,
    activatedAt: null,
    usageHistory: [],
  }
  saveSession(fresh)
  return fresh
}

// ─── Kuota Check ──────────────────────────────────────────────────────────────
export function canRoast() {
  const session = getOrCreateSession()

  if (session.tier === 'UNLIMITED') return true
  if (session.tier === 'FREE')      return session.freeUsed < FREE_QUOTA

  return session.quota > 0
}

export function getRemainingQuota() {
  const session = getOrCreateSession()

  if (session.tier === 'UNLIMITED') return Infinity
  if (session.tier === 'FREE')      return Math.max(0, FREE_QUOTA - session.freeUsed)

  return Math.max(0, session.quota || 0)
}

export function getSessionInfo() {
  const session = getOrCreateSession()
  const remaining = getRemainingQuota()

  return {
    tier: session.tier,
    voucher: session.voucher,
    remaining,
    isUnlimited: session.tier === 'UNLIMITED',
    isFree: session.tier === 'FREE',
    totalUsed: session.usageHistory.length,
  }
}

// ─── Catat Pemakaian ─────────────────────────────────────────────────────────
export function recordUsage() {
  const session = getOrCreateSession()

  session.usageHistory.push(new Date().toISOString())

  if (session.tier === 'FREE') {
    session.freeUsed = Math.min(session.freeUsed + 1, FREE_QUOTA + 10) // cap to prevent overflow
  } else if (session.tier !== 'UNLIMITED') {
    session.quota = Math.max(0, (session.quota || 0) - 1)
  }

  saveSession(session)
  return getSessionInfo()
}

// ─── Validasi & Aktivasi Voucher ──────────────────────────────────────────────
export function activateVoucher(inputCode) {
  if (!inputCode || typeof inputCode !== 'string') {
    return { success: false, error: 'Kode voucher tidak valid.' }
  }

  const code = inputCode.trim().toUpperCase()

  // Batasi panjang kode — mencegah input aneh
  if (code.length < 5 || code.length > 12) {
    return { success: false, error: 'Format kode voucher tidak valid.' }
  }

  // Validasi format: harus sesuai pola XXX-XXXXX
  if (!/^[A-Z]{3}-[A-Z0-9]{3,8}$/.test(code)) {
    return { success: false, error: 'Format kode voucher tidak valid.' }
  }

  if (!VOUCHER_MAP[code]) {
    return { success: false, error: 'Kode voucher tidak valid atau sudah tidak berlaku.' }
  }

  const session = getOrCreateSession()

  if (session.voucher) {
    return { success: false, error: `Kamu sudah mengaktifkan voucher.` }
  }

  // Cek voucher sudah dipakai di device ini
  let usedVouchers = []
  try {
    usedVouchers = JSON.parse(localStorage.getItem('cv_used_vouchers') || '[]')
    if (!Array.isArray(usedVouchers)) usedVouchers = []
  } catch {
    usedVouchers = []
  }

  if (usedVouchers.includes(code)) {
    return { success: false, error: 'Kode voucher ini sudah pernah digunakan.' }
  }

  // Aktivasi
  const voucherData = VOUCHER_MAP[code]
  session.voucher     = code
  session.tier        = voucherData.tier
  session.quota       = voucherData.quota === Infinity ? null : voucherData.quota
  session.activatedAt = new Date().toISOString()

  saveSession(session)

  usedVouchers.push(code)
  localStorage.setItem('cv_used_vouchers', JSON.stringify(usedVouchers))

  return {
    success: true,
    tier: voucherData.tier,
    label: voucherData.label,
    quota: voucherData.quota,
    color: voucherData.color,
  }
}

// ─── Reset Session (untuk testing) ───────────────────────────────────────────
export function resetSession() {
  localStorage.removeItem(STORAGE_KEY)
}

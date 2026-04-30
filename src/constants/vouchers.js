// Baca voucher dari .env dan parse jadi lookup object
// Format hasil: { 'STR-ABCD1': { tier: 'STARTER', quota: 3 }, ... }

const TIER_CONFIG = {
  STARTER:   { quota: 3,        label: 'Starter',   color: '#b8860b' },
  PRO:       { quota: 6,        label: 'Pro',        color: '#2980b9' },
  UNLIMITED: { quota: Infinity, label: 'Unlimited',  color: '#27ae60' },
}

function parseEnvVouchers(envString, tier) {
  if (!envString) return {}
  return envString.split(',').reduce((acc, code) => {
    const trimmed = code.trim().toUpperCase()
    if (trimmed) acc[trimmed] = { tier, ...TIER_CONFIG[tier] }
    return acc
  }, {})
}

export const VOUCHER_MAP = {
  ...parseEnvVouchers(import.meta.env.VITE_VOUCHERS_STARTER,   'STARTER'),
  ...parseEnvVouchers(import.meta.env.VITE_VOUCHERS_PRO,       'PRO'),
  ...parseEnvVouchers(import.meta.env.VITE_VOUCHERS_UNLIMITED, 'UNLIMITED'),
}

export { TIER_CONFIG }

// Twilio-supported countries for WeddingRingRing
// Using ISO 3166-1 alpha-2 codes
// Focus on main English-speaking markets + Western Europe

export const SUPPORTED_COUNTRIES = [
  // English-speaking markets (primary)
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP' },
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', currency: 'NZD' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', currency: 'EUR' },
  
  // Western Europe (secondary)
  { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', currency: 'EUR' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', currency: 'EUR' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', currency: 'EUR' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', currency: 'EUR' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', currency: 'EUR' },
  
  // Nordic countries (tertiary)
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', currency: 'SEK' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', currency: 'NOK' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', currency: 'DKK' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', currency: 'EUR' },
] as const

export type CountryCode = typeof SUPPORTED_COUNTRIES[number]['code']

export const getCountryByCode = (code: string) => {
  return SUPPORTED_COUNTRIES.find(c => c.code === code)
}

export const getCountryName = (code: string) => {
  return getCountryByCode(code)?.name || code
}

export const DEFAULT_COUNTRY = 'GB'

// Twilio pricing tiers (approximate)
export const PRICING_TIERS = {
  // Tier 1: English-speaking, mature markets
  tier1: ['GB', 'US', 'CA', 'AU', 'NZ', 'IE'],
  // Tier 2: Western Europe
  tier2: ['FR', 'DE', 'ES', 'IT', 'NL', 'BE'],
  // Tier 3: Nordic
  tier3: ['SE', 'NO', 'DK', 'FI']
}

export const getCountryTier = (code: string): 1 | 2 | 3 => {
  if (PRICING_TIERS.tier1.includes(code)) return 1
  if (PRICING_TIERS.tier2.includes(code)) return 2
  return 3
}

// Note: Actual Twilio pricing varies by country
// These are estimates - check Twilio console for exact rates
export const getEstimatedMonthlyCost = (code: string, numEvents: number) => {
  const tier = getCountryTier(code)
  const baseNumberCost = tier === 1 ? 1 : tier === 2 ? 1.5 : 2
  return {
    numbers: numEvents * baseNumberCost,
    currency: getCountryByCode(code)?.currency || 'GBP'
  }
}

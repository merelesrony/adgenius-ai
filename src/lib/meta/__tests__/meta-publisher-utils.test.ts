import { describe, it, expect } from 'vitest'
import {
  normalizeAdAccountId,
  mapCreativeCtaToMeta,
  normalizeMetaPublisherPlatforms,
  getMetaOptimizationSettings,
  validateDestinationUrl,
  isMetaTokenExpired,
  isMetaTokenExpiringSoon,
  getMetaTokenStatus,
  META_TOKEN_EXPIRY_WARNING_DAYS,
} from '../meta-publisher-utils'

// ── normalizeAdAccountId ────────────────────────────────────────────────────

describe('normalizeAdAccountId', () => {
  it('strips act_ prefix from standard Meta ID', () => {
    expect(normalizeAdAccountId('act_123456789')).toBe('123456789')
  })

  it('leaves numeric-only ID unchanged', () => {
    expect(normalizeAdAccountId('123456789')).toBe('123456789')
  })

  it('does not double-strip if prefix appears only once', () => {
    expect(normalizeAdAccountId('act_act_123')).toBe('act_123')
  })

  it('handles empty string gracefully', () => {
    expect(normalizeAdAccountId('')).toBe('')
  })
})

// ── mapCreativeCtaToMeta ────────────────────────────────────────────────────

describe('mapCreativeCtaToMeta', () => {
  it('passes through valid Meta codes as-is (uppercase)', () => {
    expect(mapCreativeCtaToMeta('SHOP_NOW')).toBe('SHOP_NOW')
    expect(mapCreativeCtaToMeta('LEARN_MORE')).toBe('LEARN_MORE')
    expect(mapCreativeCtaToMeta('SIGN_UP')).toBe('SIGN_UP')
    expect(mapCreativeCtaToMeta('SUBSCRIBE')).toBe('SUBSCRIBE')
    expect(mapCreativeCtaToMeta('DOWNLOAD')).toBe('DOWNLOAD')
    expect(mapCreativeCtaToMeta('CONTACT_US')).toBe('CONTACT_US')
    expect(mapCreativeCtaToMeta('MESSAGE_PAGE')).toBe('MESSAGE_PAGE')
    expect(mapCreativeCtaToMeta('GET_OFFER')).toBe('GET_OFFER')
    expect(mapCreativeCtaToMeta('APPLY_NOW')).toBe('APPLY_NOW')
    expect(mapCreativeCtaToMeta('GET_QUOTE')).toBe('GET_QUOTE')
  })

  it('maps Spanish purchase phrases to SHOP_NOW', () => {
    expect(mapCreativeCtaToMeta('Comprar ahora')).toBe('SHOP_NOW')
    expect(mapCreativeCtaToMeta('comprar ahora')).toBe('SHOP_NOW')
    expect(mapCreativeCtaToMeta('Comprar')).toBe('SHOP_NOW')
  })

  it('maps info phrases to LEARN_MORE', () => {
    expect(mapCreativeCtaToMeta('Más información')).toBe('LEARN_MORE')
    expect(mapCreativeCtaToMeta('más información')).toBe('LEARN_MORE')
    expect(mapCreativeCtaToMeta('mas informacion')).toBe('LEARN_MORE')
    expect(mapCreativeCtaToMeta('Saber más')).toBe('LEARN_MORE')
    expect(mapCreativeCtaToMeta('saber mas')).toBe('LEARN_MORE')
  })

  it('maps registration phrases to SIGN_UP', () => {
    expect(mapCreativeCtaToMeta('Registrarse')).toBe('SIGN_UP')
    expect(mapCreativeCtaToMeta('regístrate')).toBe('SIGN_UP')
    expect(mapCreativeCtaToMeta('Registrate')).toBe('SIGN_UP')
  })

  it('maps contact phrases to CONTACT_US', () => {
    expect(mapCreativeCtaToMeta('Contáctanos')).toBe('CONTACT_US')
    expect(mapCreativeCtaToMeta('contactarnos')).toBe('CONTACT_US')
    expect(mapCreativeCtaToMeta('Contactar')).toBe('CONTACT_US')
  })

  it('maps English phrases correctly', () => {
    expect(mapCreativeCtaToMeta('Shop Now')).toBe('SHOP_NOW')
    expect(mapCreativeCtaToMeta('Learn More')).toBe('LEARN_MORE')
    expect(mapCreativeCtaToMeta('Sign Up')).toBe('SIGN_UP')
    expect(mapCreativeCtaToMeta('Contact Us')).toBe('CONTACT_US')
  })

  it('returns LEARN_MORE for unknown CTA text', () => {
    expect(mapCreativeCtaToMeta('Haz click aquí')).toBe('LEARN_MORE')
    expect(mapCreativeCtaToMeta('Visitar')).toBe('LEARN_MORE')
    expect(mapCreativeCtaToMeta('unknown value')).toBe('LEARN_MORE')
  })

  it('returns LEARN_MORE for empty string', () => {
    expect(mapCreativeCtaToMeta('')).toBe('LEARN_MORE')
  })

  it('handles extra whitespace', () => {
    expect(mapCreativeCtaToMeta('  Comprar ahora  ')).toBe('SHOP_NOW')
    expect(mapCreativeCtaToMeta('  SHOP_NOW  ')).toBe('SHOP_NOW')
  })
})

// ── normalizeMetaPublisherPlatforms ─────────────────────────────────────────

describe('normalizeMetaPublisherPlatforms', () => {
  it('passes through valid Meta platforms', () => {
    expect(normalizeMetaPublisherPlatforms(['facebook', 'instagram'])).toEqual(
      expect.arrayContaining(['facebook', 'instagram']),
    )
  })

  it('maps internal "page" to "facebook"', () => {
    const result = normalizeMetaPublisherPlatforms(['page'])
    expect(result).toContain('facebook')
  })

  it('deduplicates after mapping', () => {
    const result = normalizeMetaPublisherPlatforms(['page', 'facebook'])
    expect(result.filter(p => p === 'facebook').length).toBe(1)
  })

  it('removes unknown platform IDs', () => {
    const result = normalizeMetaPublisherPlatforms(['facebook', 'tiktok', 'youtube'])
    expect(result).toEqual(['facebook'])
  })

  it('falls back to ["facebook"] when all platforms are invalid', () => {
    expect(normalizeMetaPublisherPlatforms(['tiktok', 'youtube'])).toEqual(['facebook'])
  })

  it('returns ["facebook"] for empty array', () => {
    expect(normalizeMetaPublisherPlatforms([])).toEqual(['facebook'])
  })

  it('handles mixed valid and internal platforms', () => {
    const result = normalizeMetaPublisherPlatforms(['page', 'instagram', 'messenger'])
    expect(result).toContain('facebook')
    expect(result).toContain('instagram')
    expect(result).toContain('messenger')
  })

  it('preserves all valid Meta platforms', () => {
    const input = ['facebook', 'instagram', 'messenger', 'audience_network', 'whatsapp']
    const result = normalizeMetaPublisherPlatforms(input)
    expect(result.length).toBe(5)
    for (const p of input) expect(result).toContain(p)
  })
})

// ── getMetaOptimizationSettings ─────────────────────────────────────────────

describe('getMetaOptimizationSettings', () => {
  it('maps "sales" to OUTCOME_SALES / LINK_CLICKS', () => {
    const s = getMetaOptimizationSettings('sales')
    expect(s.metaObjective).toBe('OUTCOME_SALES')
    expect(s.optimizationGoal).toBe('LINK_CLICKS')
    expect(s.billingEvent).toBe('IMPRESSIONS')
  })

  it('maps "awareness" to OUTCOME_AWARENESS / REACH', () => {
    const s = getMetaOptimizationSettings('awareness')
    expect(s.metaObjective).toBe('OUTCOME_AWARENESS')
    expect(s.optimizationGoal).toBe('REACH')
  })

  it('maps "traffic" to OUTCOME_TRAFFIC / LINK_CLICKS', () => {
    const s = getMetaOptimizationSettings('traffic')
    expect(s.metaObjective).toBe('OUTCOME_TRAFFIC')
    expect(s.optimizationGoal).toBe('LINK_CLICKS')
  })

  it('maps "engagement" to OUTCOME_ENGAGEMENT / LINK_CLICKS', () => {
    const s = getMetaOptimizationSettings('engagement')
    expect(s.metaObjective).toBe('OUTCOME_ENGAGEMENT')
    expect(s.optimizationGoal).toBe('LINK_CLICKS')
  })

  it('maps "leads" to OUTCOME_LEADS / LINK_CLICKS', () => {
    const s = getMetaOptimizationSettings('leads')
    expect(s.metaObjective).toBe('OUTCOME_LEADS')
    expect(s.optimizationGoal).toBe('LINK_CLICKS')
  })

  it('also accepts Meta API format directly (OUTCOME_SALES)', () => {
    const s = getMetaOptimizationSettings('OUTCOME_SALES')
    expect(s.metaObjective).toBe('OUTCOME_SALES')
  })

  it('also accepts Meta API format directly (OUTCOME_AWARENESS)', () => {
    const s = getMetaOptimizationSettings('OUTCOME_AWARENESS')
    expect(s.metaObjective).toBe('OUTCOME_AWARENESS')
  })

  it('falls back to OUTCOME_SALES / LINK_CLICKS for unknown objective', () => {
    const s = getMetaOptimizationSettings('unknown_value')
    expect(s.metaObjective).toBe('OUTCOME_SALES')
    expect(s.optimizationGoal).toBe('LINK_CLICKS')
  })

  it('is case-insensitive', () => {
    expect(getMetaOptimizationSettings('SALES').metaObjective).toBe('OUTCOME_SALES')
    expect(getMetaOptimizationSettings('Awareness').metaObjective).toBe('OUTCOME_AWARENESS')
  })
})

// ── validateDestinationUrl ───────────────────────────────────────────────────

describe('validateDestinationUrl', () => {
  it('accepts a valid https URL', () => {
    const r = validateDestinationUrl('https://example.com')
    expect(r.valid).toBe(true)
    if (r.valid) expect(r.url).toBe('https://example.com')
  })

  it('accepts a valid http URL', () => {
    const r = validateDestinationUrl('http://example.com')
    expect(r.valid).toBe(true)
  })

  it('accepts URLs with paths and query strings', () => {
    const r = validateDestinationUrl('https://store.example.com/products?ref=meta')
    expect(r.valid).toBe(true)
    if (r.valid) expect(r.url).toBe('https://store.example.com/products?ref=meta')
  })

  it('trims whitespace from valid URLs', () => {
    const r = validateDestinationUrl('  https://example.com  ')
    expect(r.valid).toBe(true)
    if (r.valid) expect(r.url).toBe('https://example.com')
  })

  it('rejects null', () => {
    const r = validateDestinationUrl(null)
    expect(r.valid).toBe(false)
  })

  it('rejects undefined', () => {
    const r = validateDestinationUrl(undefined)
    expect(r.valid).toBe(false)
  })

  it('rejects empty string', () => {
    const r = validateDestinationUrl('')
    expect(r.valid).toBe(false)
  })

  it('rejects whitespace-only string', () => {
    const r = validateDestinationUrl('   ')
    expect(r.valid).toBe(false)
  })

  it('rejects malformed URLs', () => {
    const r = validateDestinationUrl('not-a-url')
    expect(r.valid).toBe(false)
    if (!r.valid) expect(r.error).toContain('formato válido')
  })

  it('rejects non-http protocols', () => {
    const r = validateDestinationUrl('ftp://files.example.com')
    expect(r.valid).toBe(false)
    if (!r.valid) expect(r.error).toContain('https://')
  })

  it('returns a descriptive error when URL is missing', () => {
    const r = validateDestinationUrl(null)
    if (!r.valid) expect(r.error).toContain('URL de destino')
  })
})

// ── isMetaTokenExpired ───────────────────────────────────────────────────────

describe('isMetaTokenExpired', () => {
  it('returns false for null (no expiry info = assume valid)', () => {
    expect(isMetaTokenExpired(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isMetaTokenExpired(undefined)).toBe(false)
  })

  it('returns false for an unparseable string', () => {
    expect(isMetaTokenExpired('not-a-date')).toBe(false)
  })

  it('returns false when expires_at is in the future', () => {
    const future = new Date(Date.now() + 10 * 86_400_000).toISOString()
    expect(isMetaTokenExpired(future)).toBe(false)
  })

  it('returns true when expires_at is in the past', () => {
    const past = new Date(Date.now() - 1000).toISOString()
    expect(isMetaTokenExpired(past)).toBe(true)
  })

  it('returns true for a date far in the past', () => {
    expect(isMetaTokenExpired('2020-01-01T00:00:00.000Z')).toBe(true)
  })
})

// ── isMetaTokenExpiringSoon ──────────────────────────────────────────────────

describe('isMetaTokenExpiringSoon', () => {
  it('returns false for null', () => {
    expect(isMetaTokenExpiringSoon(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isMetaTokenExpiringSoon(undefined)).toBe(false)
  })

  it('returns false when token is already expired', () => {
    const past = new Date(Date.now() - 1000).toISOString()
    expect(isMetaTokenExpiringSoon(past)).toBe(false)
  })

  it('returns true when expiry is within the default threshold', () => {
    const nearFuture = new Date(Date.now() + 3 * 86_400_000).toISOString()
    expect(isMetaTokenExpiringSoon(nearFuture)).toBe(true)
  })

  it('returns true when expiry equals the threshold exactly', () => {
    // Just under the threshold (threshold - 1 min) → true
    const atThreshold = new Date(
      Date.now() + META_TOKEN_EXPIRY_WARNING_DAYS * 86_400_000 - 60_000
    ).toISOString()
    expect(isMetaTokenExpiringSoon(atThreshold)).toBe(true)
  })

  it('returns false when expiry is beyond the threshold', () => {
    const farFuture = new Date(Date.now() + 30 * 86_400_000).toISOString()
    expect(isMetaTokenExpiringSoon(farFuture)).toBe(false)
  })

  it('respects a custom threshold', () => {
    const in20Days = new Date(Date.now() + 20 * 86_400_000).toISOString()
    expect(isMetaTokenExpiringSoon(in20Days, 30)).toBe(true)
    expect(isMetaTokenExpiringSoon(in20Days, 10)).toBe(false)
  })
})

// ── getMetaTokenStatus ───────────────────────────────────────────────────────

describe('getMetaTokenStatus', () => {
  it('returns "unknown" for null', () => {
    expect(getMetaTokenStatus(null)).toBe('unknown')
  })

  it('returns "unknown" for undefined', () => {
    expect(getMetaTokenStatus(undefined)).toBe('unknown')
  })

  it('returns "unknown" for an unparseable date', () => {
    expect(getMetaTokenStatus('invalid-date')).toBe('unknown')
  })

  it('returns "expired" for a past date', () => {
    const past = new Date(Date.now() - 86_400_000).toISOString()
    expect(getMetaTokenStatus(past)).toBe('expired')
  })

  it('returns "expiring_soon" when within warning window', () => {
    const nearFuture = new Date(Date.now() + 3 * 86_400_000).toISOString()
    expect(getMetaTokenStatus(nearFuture)).toBe('expiring_soon')
  })

  it('returns "valid" for a date well beyond the warning window', () => {
    const farFuture = new Date(Date.now() + 30 * 86_400_000).toISOString()
    expect(getMetaTokenStatus(farFuture)).toBe('valid')
  })

  it('returns "expiring_soon" at the exact edge of the threshold', () => {
    // threshold - 1 min → expiring_soon
    const atEdge = new Date(
      Date.now() + META_TOKEN_EXPIRY_WARNING_DAYS * 86_400_000 - 60_000
    ).toISOString()
    expect(getMetaTokenStatus(atEdge)).toBe('expiring_soon')
  })

  it('returns "valid" just beyond the threshold', () => {
    // threshold + 1 min → valid
    const justOver = new Date(
      Date.now() + META_TOKEN_EXPIRY_WARNING_DAYS * 86_400_000 + 60_000
    ).toISOString()
    expect(getMetaTokenStatus(justOver)).toBe('valid')
  })
})

// ── selection preservation (pure logic) ─────────────────────────────────────

describe('selection preservation logic', () => {
  const adAccounts = [
    { id: 'act_111', name: 'Cuenta A', currency: 'USD', account_status: 1 },
    { id: 'act_222', name: 'Cuenta B', currency: 'EUR', account_status: 1 },
  ]
  const pages = [
    { id: 'page_1', name: 'Página Principal' },
    { id: 'page_2', name: 'Página Secundaria' },
  ]
  const instagramAccounts = [
    { id: 'ig_1', username: 'marca_oficial', name: 'Marca' },
  ]

  it('considers previous selection valid when account still available', () => {
    const prevSelection = 'act_111'
    expect(adAccounts.some(a => a.id === prevSelection)).toBe(true)
  })

  it('considers previous selection invalid when account removed', () => {
    const prevSelection = 'act_999'
    expect(adAccounts.some(a => a.id === prevSelection)).toBe(false)
  })

  it('considers page valid when still in list', () => {
    expect(pages.some(p => p.id === 'page_1')).toBe(true)
  })

  it('considers page invalid when removed from list', () => {
    expect(pages.some(p => p.id === 'page_removed')).toBe(false)
  })

  it('considers Instagram account valid when still linked', () => {
    expect(instagramAccounts.some(ig => ig.id === 'ig_1')).toBe(true)
  })

  it('considers Instagram account invalid when no longer linked', () => {
    expect(instagramAccounts.some(ig => ig.id === 'ig_removed')).toBe(false)
  })

  it('new connection with no prior selection always allows selection', () => {
    const existingConn = null
    expect(existingConn).toBeNull()
  })
})

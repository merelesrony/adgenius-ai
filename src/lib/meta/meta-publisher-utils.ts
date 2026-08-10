// ────────────────────────────────────────────────────────────────────────────
// Meta Publisher Utilities
// Pure functions — no side effects, no API calls, no server-only imports.
// Safe to import from both server and client components.
// ────────────────────────────────────────────────────────────────────────────

import type { MetaTokenStatus } from './meta-types'

// ── Token Status ────────────────────────────────────────────────────────────

/** Days before expiry at which we warn the user to reconnect. */
export const META_TOKEN_EXPIRY_WARNING_DAYS = 7

/**
 * Returns true when the stored expires_at timestamp is in the past.
 * Returns false when expires_at is null/undefined/unparseable (unknown → assume valid).
 */
export function isMetaTokenExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false
  const ts = new Date(expiresAt).getTime()
  if (isNaN(ts)) return false
  return ts < Date.now()
}

/**
 * Returns true when the token will expire within `thresholdDays` days but
 * has not expired yet. Returns false if already expired or no expiry info.
 */
export function isMetaTokenExpiringSoon(
  expiresAt: string | null | undefined,
  thresholdDays = META_TOKEN_EXPIRY_WARNING_DAYS,
): boolean {
  if (!expiresAt) return false
  const ts = new Date(expiresAt).getTime()
  if (isNaN(ts)) return false
  if (ts < Date.now()) return false
  return ts - Date.now() <= thresholdDays * 86_400_000
}

/**
 * Derives the UI-visible token status from the stored expires_at string.
 * Does NOT make any API call — use inspectMetaToken() for live validation.
 */
export function getMetaTokenStatus(expiresAt: string | null | undefined): MetaTokenStatus {
  if (!expiresAt) return 'unknown'
  const ts = new Date(expiresAt).getTime()
  if (isNaN(ts)) return 'unknown'
  if (ts < Date.now()) return 'expired'
  if (ts - Date.now() <= META_TOKEN_EXPIRY_WARNING_DAYS * 86_400_000) return 'expiring_soon'
  return 'valid'
}

// ── Ad Account ID ──────────────────────────────────────────────────────────

/**
 * Meta's /me/adaccounts returns IDs as "act_123456789".
 * All API endpoint paths need the numeric part only:
 *   CORRECT:  /act_123456789/campaigns
 *   WRONG:    /act_act_123456789/campaigns  ← double prefix
 *
 * Call this once before building any API path.
 */
export function normalizeAdAccountId(id: string): string {
  return id.replace(/^act_/, '')
}

// ── CTA Mapping ────────────────────────────────────────────────────────────

export type MetaCtaType =
  | 'SHOP_NOW'
  | 'LEARN_MORE'
  | 'SIGN_UP'
  | 'SUBSCRIBE'
  | 'DOWNLOAD'
  | 'BOOK_TRAVEL'
  | 'CONTACT_US'
  | 'MESSAGE_PAGE'
  | 'GET_OFFER'
  | 'WATCH_MORE'
  | 'APPLY_NOW'
  | 'GET_QUOTE'

const META_CTA_VALID_CODES = new Set<string>([
  'SHOP_NOW',
  'LEARN_MORE',
  'SIGN_UP',
  'SUBSCRIBE',
  'DOWNLOAD',
  'BOOK_TRAVEL',
  'CONTACT_US',
  'MESSAGE_PAGE',
  'GET_OFFER',
  'WATCH_MORE',
  'APPLY_NOW',
  'GET_QUOTE',
])

// Source entries use standard orthography; accent stripping is applied at
// build time so the map is accent-insensitive at lookup time.
const CTA_SOURCE_MAP: Array<[string, MetaCtaType]> = [
  // Spanish — purchases
  ['comprar ahora', 'SHOP_NOW'],
  ['comprar ya', 'SHOP_NOW'],
  ['comprar', 'SHOP_NOW'],
  ['tienda', 'SHOP_NOW'],
  ['ir a la tienda', 'SHOP_NOW'],
  // Spanish — info
  ['más información', 'LEARN_MORE'],
  ['más información sobre esto', 'LEARN_MORE'],
  ['saber más', 'LEARN_MORE'],
  ['ver más', 'LEARN_MORE'],
  ['conocer más', 'LEARN_MORE'],
  // Spanish — sign up
  ['registrarse', 'SIGN_UP'],
  ['regístrate', 'SIGN_UP'],
  ['crear cuenta', 'SIGN_UP'],
  ['registro', 'SIGN_UP'],
  // Spanish — subscribe
  ['suscribirse', 'SUBSCRIBE'],
  ['suscríbete', 'SUBSCRIBE'],
  ['suscripción', 'SUBSCRIBE'],
  // Spanish — download
  ['descargar', 'DOWNLOAD'],
  ['descarga', 'DOWNLOAD'],
  ['descargar ahora', 'DOWNLOAD'],
  // Spanish — book
  ['reservar', 'BOOK_TRAVEL'],
  ['reserva', 'BOOK_TRAVEL'],
  ['reservar ahora', 'BOOK_TRAVEL'],
  // Spanish — contact
  ['contactarnos', 'CONTACT_US'],
  ['contáctanos', 'CONTACT_US'],
  ['contactar', 'CONTACT_US'],
  ['contáctenos', 'CONTACT_US'],
  // Spanish — message
  ['enviar mensaje', 'MESSAGE_PAGE'],
  ['mensaje', 'MESSAGE_PAGE'],
  ['enviar un mensaje', 'MESSAGE_PAGE'],
  // Spanish — offer
  ['obtener oferta', 'GET_OFFER'],
  ['ver oferta', 'GET_OFFER'],
  ['ver la oferta', 'GET_OFFER'],
  // Spanish — watch
  ['ver más videos', 'WATCH_MORE'],
  ['ver videos', 'WATCH_MORE'],
  // Spanish — apply
  ['aplicar ahora', 'APPLY_NOW'],
  ['aplicar', 'APPLY_NOW'],
  ['postular', 'APPLY_NOW'],
  ['postular ahora', 'APPLY_NOW'],
  // Spanish — quote
  ['cotizar', 'GET_QUOTE'],
  ['obtener cotización', 'GET_QUOTE'],
  ['solicitar cotización', 'GET_QUOTE'],
  ['pedir cotización', 'GET_QUOTE'],
  // English (AI can mix languages)
  ['shop now', 'SHOP_NOW'],
  ['buy now', 'SHOP_NOW'],
  ['learn more', 'LEARN_MORE'],
  ['sign up', 'SIGN_UP'],
  ['subscribe', 'SUBSCRIBE'],
  ['download', 'DOWNLOAD'],
  ['book now', 'BOOK_TRAVEL'],
  ['contact us', 'CONTACT_US'],
  ['send message', 'MESSAGE_PAGE'],
  ['get offer', 'GET_OFFER'],
  ['watch more', 'WATCH_MORE'],
  ['apply now', 'APPLY_NOW'],
  ['get quote', 'GET_QUOTE'],
]

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

// Precomputed at module load — O(1) lookup at runtime.
const CTA_NORMALIZED_MAP: Record<string, MetaCtaType> = Object.fromEntries(
  CTA_SOURCE_MAP.map(([key, val]) => [stripAccents(key.toLowerCase()), val]),
)

/**
 * Maps any CTA string (AI-generated text or existing Meta code) to a valid
 * Meta CTA type. Falls back to LEARN_MORE for unknown values.
 */
export function mapCreativeCtaToMeta(cta: string): MetaCtaType {
  if (!cta) return 'LEARN_MORE'
  const trimmed = cta.trim()

  // Already a valid Meta API code
  if (META_CTA_VALID_CODES.has(trimmed.toUpperCase())) {
    return trimmed.toUpperCase() as MetaCtaType
  }

  // Accent-insensitive lowercase lookup
  const normalized = stripAccents(trimmed.toLowerCase())
  if (normalized in CTA_NORMALIZED_MAP) return CTA_NORMALIZED_MAP[normalized]!

  console.log('[Meta Publisher] unknown CTA, using LEARN_MORE fallback', { original: cta })
  return 'LEARN_MORE'
}

// ── Publisher Platforms ─────────────────────────────────────────────────────

export type MetaPublisherPlatform =
  | 'facebook'
  | 'instagram'
  | 'messenger'
  | 'audience_network'
  | 'whatsapp'

const VALID_META_PLATFORMS = new Set<MetaPublisherPlatform>([
  'facebook',
  'instagram',
  'messenger',
  'audience_network',
  'whatsapp',
])

// Internal builder IDs that don't map 1:1 to Meta publisher_platforms.
const INTERNAL_PLATFORM_MAP: Record<string, MetaPublisherPlatform> = {
  // 'page' is an internal builder concept for "Página de Facebook" — map to facebook feed.
  page: 'facebook',
}

/**
 * Converts builder platform IDs to valid Meta publisher_platforms values.
 * Removes unknowns, deduplicates, and falls back to ['facebook'] if empty.
 */
export function normalizeMetaPublisherPlatforms(
  platforms: string[],
): MetaPublisherPlatform[] {
  const seen = new Set<MetaPublisherPlatform>()
  for (const p of platforms) {
    const lower = p.toLowerCase()
    if (VALID_META_PLATFORMS.has(lower as MetaPublisherPlatform)) {
      seen.add(lower as MetaPublisherPlatform)
    } else if (lower in INTERNAL_PLATFORM_MAP) {
      seen.add(INTERNAL_PLATFORM_MAP[lower]!)
    }
    // else: skip unmapped values silently
  }
  return seen.size > 0 ? [...seen] : ['facebook']
}

// ── Optimization Settings ───────────────────────────────────────────────────

export interface MetaOptimizationSettings {
  /** Meta API campaign objective — OUTCOME_* format (v21.0+) */
  metaObjective: string
  /**
   * Compatible optimization_goal for this objective.
   * Uses LINK_CLICKS for most objectives to avoid requiring a pixel (SALES)
   * or Facebook Lead Forms (LEADS). REACH for awareness.
   */
  optimizationGoal: string
  billingEvent: 'IMPRESSIONS' | 'LINK_CLICKS'
}

/**
 * Maps an internal objective string (AI-generated or stored in DB) to
 * the correct Meta API OUTCOME_* objective and a compatible optimization goal.
 *
 * Internal values: 'sales' | 'awareness' | 'leads' | 'traffic' | 'engagement'
 * Also accepts Meta API formats directly (OUTCOME_*) for round-tripping.
 *
 * Defaults to OUTCOME_TRAFFIC / LINK_CLICKS for unknown values — safest
 * option that works without pixel or Lead Form setup.
 */
export function getMetaOptimizationSettings(
  objective: string,
): MetaOptimizationSettings {
  const lower = objective.toLowerCase().trim()

  switch (lower) {
    case 'awareness':
    case 'brand_awareness':
    case 'reach':
    case 'outcome_awareness':
      return {
        metaObjective: 'OUTCOME_AWARENESS',
        // REACH is the safest goal for awareness campaigns; no pixel needed.
        optimizationGoal: 'REACH',
        billingEvent: 'IMPRESSIONS',
      }

    case 'traffic':
    case 'link_clicks':
    case 'outcome_traffic':
      return {
        metaObjective: 'OUTCOME_TRAFFIC',
        optimizationGoal: 'LINK_CLICKS',
        billingEvent: 'IMPRESSIONS',
      }

    case 'engagement':
    case 'post_engagement':
    case 'outcome_engagement':
      return {
        metaObjective: 'OUTCOME_ENGAGEMENT',
        // LINK_CLICKS for new ads; POST_ENGAGEMENT requires an existing page post.
        optimizationGoal: 'LINK_CLICKS',
        billingEvent: 'IMPRESSIONS',
      }

    case 'leads':
    case 'lead_generation':
    case 'outcome_leads':
      return {
        metaObjective: 'OUTCOME_LEADS',
        // LINK_CLICKS for link-based lead capture (no Facebook Lead Form required).
        // Switch to LEAD_GENERATION when Lead Forms are set up.
        optimizationGoal: 'LINK_CLICKS',
        billingEvent: 'IMPRESSIONS',
      }

    case 'sales':
    case 'conversions':
    case 'outcome_sales':
    default:
      // AdGenius uses OUTCOME_TRAFFIC as the publishable fallback when no pixel/CAPI
      // is configured. OUTCOME_SALES requires conversion signal (pixel or CAPI); without
      // it, Meta rejects the Ad Set with error 100 / subcode 1885097.
      // TODO: switch to OUTCOME_SALES + OFFSITE_CONVERSIONS once a pixel is set up.
      return {
        metaObjective: 'OUTCOME_TRAFFIC',
        optimizationGoal: 'LINK_CLICKS',
        billingEvent: 'IMPRESSIONS',
      }
  }
}

// ── Destination URL Validation ──────────────────────────────────────────────

export type UrlValidationResult =
  | { valid: true; url: string }
  | { valid: false; error: string }

/**
 * Validates a destination URL for use in Meta ad creatives.
 * link_data.link is required by Meta and must be an absolute URL.
 */
export function validateDestinationUrl(
  url: string | null | undefined,
): UrlValidationResult {
  if (!url || url.trim() === '') {
    return {
      valid: false,
      error:
        'La campaña necesita una URL de destino antes de publicarse en Meta. ' +
        'Agrega el sitio web de tu negocio en Configuración de perfil.',
    }
  }

  const trimmed = url.trim()

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return {
      valid: false,
      error: `La URL de destino "${trimmed}" no tiene un formato válido (ej: https://mitienda.com).`,
    }
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return {
      valid: false,
      error: 'La URL de destino debe comenzar con https:// o http://.',
    }
  }

  return { valid: true, url: trimmed }
}

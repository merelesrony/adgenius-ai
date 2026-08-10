export type PublishStatus =
  | 'draft'
  | 'validating'
  | 'ready'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'partial_failure'

export interface MetaPublishTarget {
  adAccountId: string
  pageId?: string | null
  instagramId?: string | null
}

export interface MetaCampaignSpec {
  name: string
  objective: string
  dailyBudgetCents: number  // Meta's currency smallest unit (cents for USD, full units for PYG)
  currency: string          // ISO 4217, from Meta's ad account
  country: string           // ISO 3166-1 alpha-2
  city?: string | null
  radiusKm?: number | null
  ageMin: number
  ageMax: number
  gender: 'all' | 'male' | 'female'
  /** Accepts plain name strings or { id, name } objects when interest IDs are available */
  interests: Array<string | { id?: string; name: string }>
  platforms: string[]
}

export interface MetaAdCreativeSpec {
  headline: string
  primaryText: string
  description?: string | null
  cta: string
  imageUrl?: string | null
  /** Absolute URL used for link_data.link — required by Meta API */
  destinationUrl: string
}

export interface MetaPublishPayload {
  campaignId: string
  userId: string
  target: MetaPublishTarget
  campaign: MetaCampaignSpec
  creative: MetaAdCreativeSpec
}

export interface MetaPublishResult {
  success: boolean
  reason?: 'META_PUBLISH_DISABLED' | 'ALREADY_PUBLISHING' | 'PREFLIGHT_FAILED' | 'PARTIAL_FAILURE' | 'ERROR'
  publishStatus: PublishStatus
  metaCampaignId?: string
  metaAdSetId?: string
  metaCreativeId?: string
  metaAdId?: string
  error?: string
}

// Internal result from a single Meta object creation call
export interface MetaObjectResult {
  id: string
}

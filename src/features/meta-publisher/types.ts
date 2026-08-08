// Meta publisher types — interfaces only; actual publishing not yet implemented.

export type MetaPublishStatus = 'idle' | 'publishing' | 'success' | 'error'

export interface MetaPublishTarget {
  adAccountId: string
  pageId?: string | null
  instagramId?: string | null
}

export interface MetaCampaignSpec {
  name: string
  objective: string
  dailyBudget: number
  currency: string
  country: string
  city?: string
  radius?: number
  ageMin: number
  ageMax: number
  gender: string
  interests: string[]
  platforms: string[]
}

export interface MetaAdCreativeSpec {
  headline: string
  primaryText: string
  description?: string
  cta: string
  imageUrl?: string | null
}

export interface MetaPublishPayload {
  target: MetaPublishTarget
  campaign: MetaCampaignSpec
  creative: MetaAdCreativeSpec
}

export interface MetaPublishResult {
  success: boolean
  campaignId?: string
  adSetId?: string
  adId?: string
  error?: string
}

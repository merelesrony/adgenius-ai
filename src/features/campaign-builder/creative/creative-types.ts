export type CreativeVariant = 'premium' | 'lifestyle' | 'minimal'

export interface GeneratedCreative {
  id: string              // 'premium' | 'lifestyle' | 'minimal'
  variant: CreativeVariant
  variantLabel: string    // 'Premium / Luxury'
  imageUrl: string        // Pollinations URL
  imagePrompt: string     // Stored so we can regenerate with new seed
  headline: string
  primaryText: string
  description: string
  cta: string
  style: string
  concept: string
  format: string
  createdAt: string
}

import type { VisualProductDNA } from '@/types/visual-dna'

export type { VisualProductDNA }

export interface BrandKit {
  colors: string[]
  visualStyle: string
  toneOfVoice: string
  photographyStyle: string
  recommendedTypography: string
  visualDNA?: VisualProductDNA | null
}

// Shape returned by generateAdCreative() / API route
export interface AdCreativeResult {
  creatives: Array<{
    variant: CreativeVariant
    variantLabel: string
    headline: string
    primaryText: string
    description: string
    cta: string
    imagePrompt: string
    style: string
    concept: string
  }>
  brandKit: BrandKit
}

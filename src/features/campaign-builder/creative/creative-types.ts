export type CreativeVariant = 'premium' | 'lifestyle' | 'minimal' | 'original'

export interface GeneratedCreative {
  id: string
  variant: CreativeVariant
  variantLabel: string
  imageUrl: string
  imagePrompt: string
  headline: string
  primaryText: string
  description: string
  cta: string
  style: string
  concept: string
  format: string
  createdAt: string
  imageSource?: 'original' | 'ai'
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

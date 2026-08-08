import type { GeneratedCreative, BrandKit } from './creative/creative-types'

export type { GeneratedCreative, BrandKit }

export type BuilderStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
export type BuilderMode = 'auto' | 'advanced'

export type ProductMode = 'existing' | 'ai' | 'manual' | 'image'
export type ProductImageMode = 'image_ai_variants' | 'original_only'

export type MetaPlatform = 'page' | 'facebook' | 'instagram' | 'messenger' | 'whatsapp'

export interface SelectedProduct {
  id: string
  name: string
  description: string | null
  category: string | null
  price: number | null
  currency: string | null
  image: string | null
  /** Set when the user explicitly wrote a description — this is the source of truth for copy generation */
  userProvidedDescription?: string | null
}

export interface AudienceStrategy {
  ageMin: number
  ageMax: number
  gender: 'all' | 'male' | 'female'
  interests: string[]
  behaviors: string[]
}

export interface CampaignStrategy {
  objective: string
  objectiveLabel: string
  recommendedCTA: string
  headline: string
  primaryText: string
  description: string
  audience: AudienceStrategy
  location: {
    country: string
    city: string | null
    radius: number
  }
  budgetRecommendation: {
    daily: number
    reason: string
  }
  creativeDirection: {
    style: string
    format: string
    concept: string
  }
}

// ── Persisted session shape (mirrors campaign_builder_sessions table) ─────────

export interface BuilderSessionBudget {
  dailyBudget: string
  currency: string
  totalBudget: string
}

export interface BuilderSessionDestination {
  country: string
  city: string
  radius: string
}

export interface BuilderSession {
  id: string
  user_id: string
  current_step: BuilderStep
  status: 'draft' | 'completed' | 'abandoned' | 'paused'
  // Navigation state — persisted as of migration 013 (null for pre-migration rows)
  max_unlocked_step: number | null
  last_completed_step: number | null
  has_pending_regeneration: boolean | null
  builder_mode: string | null
  product_mode: string | null
  product_image_mode: string | null
  // Campaign data
  selected_product: SelectedProduct | null
  budget: BuilderSessionBudget | null
  destination: BuilderSessionDestination | null
  platforms: MetaPlatform[] | null
  ai_strategy: CampaignStrategy | null
  creatives: GeneratedCreative[] | null
  brand_kit: BrandKit | null
  selected_creative_id: string | null
  created_at: string
  updated_at: string
}

// ── Context state ─────────────────────────────────────────────────────────────

export interface BuilderState {
  step: BuilderStep
  // Navigation
  maxUnlockedStep: BuilderStep
  lastCompletedStep: number
  hasPendingRegeneration: boolean
  // Session metadata
  sessionId: string | null
  isSaving: boolean
  lastSaved: string | null
  // Step 1 — Product
  productMode: ProductMode | null
  selectedProduct: SelectedProduct | null
  productName: string
  productDescription: string
  productCategory: string
  productImageMode: ProductImageMode | null
  // Step 2 — Budget
  dailyBudget: string
  currency: string
  totalBudget: string
  // Step 3 — Destination
  country: string
  city: string
  radius: string
  // Step 4 — Meta platforms
  platforms: MetaPlatform[]
  // Step 5 — AI strategy result
  aiStrategy: CampaignStrategy | null
  // Step 7 — Creative Engine
  generatedCreatives: GeneratedCreative[]
  brandKit: BrandKit | null
  selectedCreativeId: string | null
  // UX mode
  builderMode: BuilderMode
}

export type BuilderAction =
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; payload: BuilderStep }
  | { type: 'SET_PRODUCT_MODE'; payload: ProductMode | null }
  | { type: 'SET_SELECTED_PRODUCT'; payload: SelectedProduct }
  | { type: 'SET_PRODUCT_NAME'; payload: string }
  | { type: 'SET_PRODUCT_DESCRIPTION'; payload: string }
  | { type: 'SET_PRODUCT_CATEGORY'; payload: string }
  | { type: 'SET_PRODUCT_IMAGE_MODE'; payload: ProductImageMode | null }
  | { type: 'SET_DAILY_BUDGET'; payload: string }
  | { type: 'SET_CURRENCY'; payload: string }
  | { type: 'SET_TOTAL_BUDGET'; payload: string }
  | { type: 'SET_COUNTRY'; payload: string }
  | { type: 'SET_CITY'; payload: string }
  | { type: 'SET_RADIUS'; payload: string }
  | { type: 'TOGGLE_PLATFORM'; payload: MetaPlatform }
  | { type: 'SET_PLATFORMS'; payload: MetaPlatform[] }
  | { type: 'SET_AI_STRATEGY'; payload: CampaignStrategy }
  | { type: 'SET_GENERATED_CREATIVES'; payload: GeneratedCreative[] }
  | { type: 'SET_BRAND_KIT'; payload: BrandKit }
  | { type: 'SET_SELECTED_CREATIVE'; payload: string }
  | { type: 'EDIT_CREATIVE'; payload: { id: string } & Partial<Pick<GeneratedCreative, 'headline' | 'primaryText' | 'description' | 'cta'>> }
  | { type: 'REGENERATE_CREATIVE_IMAGE'; payload: { id: string; imageUrl: string } }
  | { type: 'LOAD_SESSION'; payload: BuilderSession }
  | { type: 'SET_SESSION_ID'; payload: string }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'MARK_SAVED'; payload: string }
  | { type: 'SET_BUILDER_MODE'; payload: BuilderMode }
  | { type: 'SET_PENDING_REGENERATION'; payload: boolean }
  | { type: 'RESET' }

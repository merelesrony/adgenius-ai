'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  SelectedProduct, BuilderStep, MetaPlatform,
  CampaignStrategy, BuilderSession,
  BuilderSessionBudget, BuilderSessionDestination,
  GeneratedCreative, BrandKit,
} from './types'
import type { VisualProductDNA } from '@/types/visual-dna'
import type { Json } from '@/types/database'

// ── Product creation ──────────────────────────────────────────────────────────

export async function createProductFromBuilderAction(data: {
  name: string
  description: string
  category: string
  price: number | null
  currency: string
  images?: string[]
  visualDNA?: VisualProductDNA | null
}): Promise<{ success: boolean; product?: SelectedProduct; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autorizado' }

    const imagesJson = data.images && data.images.length > 0
      ? JSON.parse(JSON.stringify(data.images))
      : null

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        user_id: user.id,
        name: data.name.trim(),
        description: data.description.trim(),
        category: data.category,
        price: data.price,
        currency: data.currency,
        is_active: true,
        images: imagesJson,
        visual_dna: data.visualDNA ? (data.visualDNA as unknown as Json) : null,
        master_visual_prompt: data.visualDNA?.masterPrompt ?? null,
        analyzed_at: data.visualDNA?.analyzedAt ?? null,
      })
      .select()
      .single()

    if (error || !product) {
      return { success: false, error: error?.message ?? 'Error creando producto' }
    }

    const firstImage = data.images?.[0] ?? null

    return {
      success: true,
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        currency: product.currency,
        image: firstImage,
      },
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

// ── Session persistence ───────────────────────────────────────────────────────

type UpsertInput = {
  sessionId: string | null
  currentStep: BuilderStep
  // Navigation state
  maxUnlockedStep: number
  lastCompletedStep: number
  hasPendingRegeneration: boolean
  builderMode: string
  productMode: string | null
  productImageMode: string | null
  // Campaign data
  selectedProduct: SelectedProduct | null
  budget: BuilderSessionBudget
  destination: BuilderSessionDestination
  platforms: MetaPlatform[]
  aiStrategy: CampaignStrategy | null
  creatives: GeneratedCreative[] | null
  brandKit: BrandKit | null
  selectedCreativeId: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any

export async function upsertBuilderSessionAction(
  data: UpsertInput,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase: AnyClient = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('[BUILDER SAVE] auth check', {
      userId: user?.id ?? null,
      authError: authError?.message ?? null,
      sessionId: data.sessionId,
      step: data.currentStep,
    })

    if (!user) {
      console.error('[BUILDER SAVE] No user — aborting save')
      return { success: false, error: 'No autorizado' }
    }

    // Base payload — columns that existed before migration 013
    const basePayload = {
      current_step: data.currentStep,
      selected_product: data.selectedProduct ?? null,
      budget: data.budget,
      destination: data.destination,
      platforms: data.platforms,
      ai_strategy: data.aiStrategy ?? null,
      creatives: data.creatives ?? null,
      brand_kit: data.brandKit ?? null,
      selected_creative_id: data.selectedCreativeId ?? null,
    }

    // Navigation extensions — added in migration 013
    // Sent on every save; silently omitted if the migration has not been applied yet.
    const navExtensions = {
      max_unlocked_step: data.maxUnlockedStep,
      last_completed_step: data.lastCompletedStep,
      has_pending_regeneration: data.hasPendingRegeneration,
      builder_mode: data.builderMode,
      product_mode: data.productMode ?? null,
      product_image_mode: data.productImageMode ?? null,
    }

    const payload = { ...basePayload, ...navExtensions }

    // Helper: true when the error is a missing-column schema-cache issue,
    // which means migration 013 has not been applied yet.
    function isSchemaCacheError(msg: string | undefined): boolean {
      if (!msg) return false
      return msg.includes('schema cache') || msg.includes('Could not find the')
    }

    async function doUpdate(p: typeof payload | typeof basePayload) {
      return supabase
        .from('campaign_builder_sessions')
        .update(p)
        .eq('id', data.sessionId!)
        .eq('user_id', user.id)
    }

    async function doInsert(p: typeof payload | typeof basePayload) {
      return supabase
        .from('campaign_builder_sessions')
        .insert({ user_id: user.id, status: 'draft', ...p })
        .select('id')
        .single()
    }

    if (data.sessionId) {
      // ── UPDATE existing row ──
      let { error } = await doUpdate(payload)

      // If migration 013 columns are missing, retry with legacy payload
      if (error && isSchemaCacheError(error.message)) {
        console.warn('[BUILDER SAVE] Migration 013 not applied — retrying without nav fields');
        ({ error } = await doUpdate(basePayload))
      }

      if (error) {
        console.error('[BUILDER SAVE] UPDATE error:', error)
        return { success: false, error: error.message }
      }
      return { success: true, id: data.sessionId }

    } else {
      // ── INSERT new row ──
      let { data: row, error } = await doInsert(payload)

      // If migration 013 columns are missing, retry with legacy payload
      if (error && isSchemaCacheError(error.message)) {
        console.warn('[BUILDER SAVE] Migration 013 not applied — retrying without nav fields');
        ({ data: row, error } = await doInsert(basePayload))
      }

      if (error) {
        console.error('[BUILDER SAVE] INSERT error:', error)
        return { success: false, error: error.message }
      }
      if (!row?.id) {
        console.error('[BUILDER SAVE] INSERT returned no row')
        return { success: false, error: 'No se creó la sesión' }
      }

      return { success: true, id: row.id as string }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error inesperado'
    console.error('[BUILDER SAVE] EXCEPTION:', msg)
    return { success: false, error: msg }
  }
}

export async function resumeSessionAction(
  sessionId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase: AnyClient = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autorizado' }

    const { error } = await supabase
      .from('campaign_builder_sessions')
      .update({ status: 'draft' })
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .eq('status', 'paused') // only flip paused sessions back to draft

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

export async function closeBuilderSessionAction(
  sessionId: string,
  status: 'completed' | 'abandoned' | 'paused' = 'abandoned',
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase: AnyClient = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autorizado' }

    const { error } = await supabase
      .from('campaign_builder_sessions')
      .update({ status })
      .eq('id', sessionId)
      .eq('user_id', user.id)

    if (error) {
      console.error('[BUILDER CLOSE] error:', error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

// Kept for backwards compatibility
export async function saveDraftAction(): Promise<{
  success: boolean
  error?: string
  id?: string
}> {
  return { success: false, error: 'Usa upsertBuilderSessionAction directamente.' }
}

// ── Server-side session fetch ─────────────────────────────────────────────────

// ── Campaign Assembly ─────────────────────────────────────────────────────────

export interface CampaignAssemblyInput {
  sessionId: string | null
  productMode: 'existing' | 'ai' | 'manual' | 'image' | null
  selectedProduct: SelectedProduct | null
  productName: string
  productDescription: string
  productCategory: string
  dailyBudget: string
  currency: string
  totalBudget: string
  country: string
  city: string
  radius: string
  platforms: MetaPlatform[]
  aiStrategy: CampaignStrategy | null
  generatedCreatives: GeneratedCreative[]
  selectedCreativeId: string | null
  brandKit: BrandKit | null
}

function calcScore(
  creative: GeneratedCreative | undefined,
  aiStrategy: CampaignStrategy | null,
  dailyBudget: number,
) {
  const copy = creative
    ? (creative.headline?.length > 5 ? 7 : 0)
      + (creative.primaryText?.length > 20 ? 8 : 0)
      + (creative.description?.length > 5 ? 5 : 0)
      + (creative.cta ? 5 : 0)
    : 0

  const audience = aiStrategy
    ? 10
      + (aiStrategy.audience.interests.length >= 1 ? 10 : 0)
      + (aiStrategy.audience.interests.length >= 3 ? 5 : 0)
    : 0

  const creativeScore = creative?.imageUrl ? 25 : 0

  const budget = dailyBudget >= 10 ? 25 : dailyBudget >= 5 ? 15 : dailyBudget > 0 ? 10 : 0

  return {
    total: Math.min(100, copy + audience + creativeScore + budget),
    breakdown: { copy, audience, creative: creativeScore, budget },
  }
}

export async function createCampaignFromBuilderAction(
  input: CampaignAssemblyInput,
): Promise<{ success: boolean; campaignId?: string; error?: string }> {
  try {
    const supabase: AnyClient = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autorizado' }

    if (!input.aiStrategy) return { success: false, error: 'Falta la estrategia IA' }
    if (!input.generatedCreatives.length) return { success: false, error: 'No hay creativos generados' }
    if (!input.selectedCreativeId) return { success: false, error: 'Selecciona un creativo antes de continuar' }

    const selectedCreative = input.generatedCreatives.find((c) => c.id === input.selectedCreativeId)
      ?? input.generatedCreatives[0]

    const productName =
      (input.productMode === 'existing' || input.productMode === 'ai' || input.productMode === 'image') && input.selectedProduct
        ? input.selectedProduct.name
        : input.productName || 'Producto'

    const daily = parseFloat(input.dailyBudget) || 0
    const total = parseFloat(input.totalBudget) || 0
    const radiusKm = parseInt(input.radius) || 50

    const { total: score, breakdown } = calcScore(selectedCreative, input.aiStrategy, daily)

    const aiCopy = {
      headline: selectedCreative.headline,
      body: selectedCreative.primaryText,
      description: selectedCreative.description,
      cta: selectedCreative.cta,
    }

    const { data: campaign, error: campError } = await supabase
      .from('campaigns')
      .insert({
        user_id: user.id,
        name: `${productName} — IA`,
        status: 'draft',
        product_id: input.selectedProduct?.id ?? null,
        product_name: productName,
        product_description:
          input.selectedProduct?.description ?? input.productDescription ?? null,
        product_category:
          input.selectedProduct?.category ?? input.productCategory ?? null,
        product_price: input.selectedProduct?.price ?? null,
        product_currency: input.selectedProduct?.currency ?? input.currency,
        currency: input.currency,
        daily_budget: daily > 0 ? daily : null,
        total_budget: total > 0 ? total : null,
        objective: input.aiStrategy.objective,
        audience_mode: 'ai',
        target_country: input.country,
        target_city: input.city || null,
        target_radius_km: radiusKm,
        target_age_min: input.aiStrategy.audience.ageMin,
        target_age_max: input.aiStrategy.audience.ageMax,
        target_gender: input.aiStrategy.audience.gender,
        target_interests: input.aiStrategy.audience.interests,
        target_languages: ['Español'],
        ai_copy: aiCopy,
        ai_generated: true,
        ai_recommendations: input.aiStrategy.audience.behaviors,
        ai_score_breakdown: breakdown,
        campaign_score: score,
        flyer_url: selectedCreative.imageUrl,
        platforms: input.platforms,
        brand_kit: input.brandKit ?? null,
        ai_strategy: input.aiStrategy,
      })
      .select('id')
      .single()

    if (campError || !campaign?.id) {
      console.error('[createCampaignFromBuilderAction] campaign insert error:', campError)
      return { success: false, error: campError?.message ?? 'Error creando la campaña' }
    }

    const campaignId = campaign.id as string

    // Insert all creative variants
    const creativeRows = input.generatedCreatives.map((c) => ({
      user_id: user.id,
      campaign_id: campaignId,
      product_id: input.selectedProduct?.id ?? null,
      image_url: c.imageUrl,
      prompt: c.imagePrompt,
      model: 'flux-realism',
      format: c.format,
      is_primary: c.id === input.selectedCreativeId,
      headline: c.headline,
      primary_text: c.primaryText,
      description: c.description,
      cta: c.cta,
      variant: c.variant,
      variant_label: c.variantLabel,
    }))

    const { error: creativesError } = await supabase
      .from('campaign_creatives')
      .insert(creativeRows)

    if (creativesError) {
      console.error('[createCampaignFromBuilderAction] creatives insert error:', creativesError)
      // Non-fatal — campaign is created, just log
    }

    // Mark builder session as completed
    if (input.sessionId) {
      await supabase
        .from('campaign_builder_sessions')
        .update({ status: 'completed', campaign_id: campaignId })
        .eq('id', input.sessionId)
        .eq('user_id', user.id)
    }

    revalidatePath('/campaigns')
    revalidatePath(`/campaigns/${campaignId}`)
    revalidatePath(`/campaigns/${campaignId}/review`)

    return { success: true, campaignId }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error inesperado'
    console.error('[createCampaignFromBuilderAction] exception:', msg)
    return { success: false, error: msg }
  }
}

export async function getLatestDraftSessionAction(): Promise<{
  success: boolean
  session?: BuilderSession
  error?: string
}> {
  try {
    const supabase: AnyClient = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autorizado' }

    const { data: row, error } = await supabase
      .from('campaign_builder_sessions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['draft', 'paused'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) return { success: false, error: error.message }
    if (!row) return { success: true }

    return { success: true, session: row as BuilderSession }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

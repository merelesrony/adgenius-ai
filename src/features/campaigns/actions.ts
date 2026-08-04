'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'
import type { Database } from '@/types/database'
import { checkCampaignLimit } from '@/lib/campaign-limit'
import type { AudienceResult, ScoreResult } from './types'
import { convertFromUSD } from '@/lib/currency'
import type { MarketingStrategy } from '@/features/ai-strategy/types'

export interface CreateFromStrategyInput {
  strategy: MarketingStrategy
  productName: string
  productDescription?: string
  productPrice?: number | null
  productCurrency: string
  imageUrl?: string | null
  strategyId?: string
}

export async function createCampaignFromStrategyAction(
  input: CreateFromStrategyInput,
): Promise<ActionResult<string>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { canCreate, limit, count } = await checkCampaignLimit(supabase, user.id)
    if (!canCreate) {
      return {
        success: false,
        error: `Límite de campañas alcanzado. Tu plan permite ${limit} campañas activas y ya tienes ${count}.`,
      }
    }

    const { strategy, productName, productDescription, productPrice, productCurrency, imageUrl } = input
    const { productAnalysis, recommendedObjective, targetAudience, budgetRecommendation, adCopy } = strategy

    // Use user's business profile for default country/city
    const { data: business } = await supabase
      .from('businesses')
      .select('country, city')
      .eq('user_id', user.id)
      .maybeSingle()

    const defaultCountry = business?.country ?? ''
    const defaultCity = business?.city ?? null

    // Convert budget from USD to user's currency
    const dailyBudget = Math.round(convertFromUSD(budgetRecommendation.testingUSD, productCurrency))

    const aiCopy = {
      headline: adCopy.headline,
      body: adCopy.primaryText,
      description: adCopy.primaryText.slice(0, 90),
      cta: adCopy.cta,
    }

    const aiAudience = {
      ageMin: targetAudience.ageMin,
      ageMax: targetAudience.ageMax,
      gender: targetAudience.gender,
      interests: targetAudience.interests,
      languages: ['es'],
      explanation: `Audiencia generada por IA para ${productAnalysis.detectedCategory}`,
    }

    const today = new Date().toISOString().split('T')[0]

    const { data: campaignRaw, error } = await supabase
      .from('campaigns')
      .insert({
        user_id: user.id,
        name: `${productName} — IA`,
        status: 'draft',
        objective: recommendedObjective.value,
        product_name: productName,
        product_description: productDescription ?? null,
        product_price: productPrice ?? null,
        product_currency: productCurrency,
        product_category: productAnalysis.detectedCategory,
        currency: productCurrency,
        flyer_url: imageUrl ?? null,
        daily_budget: dailyBudget,
        start_date: today,
        end_date: null,
        target_country: defaultCountry,
        target_city: defaultCity,
        target_radius_km: 20,
        audience_mode: 'ai',
        target_age_min: targetAudience.ageMin,
        target_age_max: targetAudience.ageMax,
        target_gender: targetAudience.gender,
        target_interests: JSON.parse(JSON.stringify(targetAudience.interests)),
        target_languages: ['es'],
        ai_copy: JSON.parse(JSON.stringify(aiCopy)),
        ai_audience: JSON.parse(JSON.stringify(aiAudience)),
        ai_generated: true,
        ai_recommendations: JSON.parse(JSON.stringify(targetAudience.behaviors ?? [])),
      })
      .select('id')
      .single()

    const campaign = campaignRaw as { id: string } | null
    if (error || !campaign) {
      console.error('[createCampaignFromStrategyAction]', error)
      return { success: false, error: 'Error al crear la campaña' }
    }

    await supabase.from('ai_usage').insert({
      user_id: user.id,
      type: 'strategy_to_campaign',
      campaign_id: campaign.id,
    })

    revalidatePath('/campaigns')
    revalidatePath('/dashboard')
    return { success: true, data: campaign.id }
  } catch (err) {
    console.error('[createCampaignFromStrategyAction]', err)
    return { success: false, error: 'Error inesperado al crear la campaña' }
  }
}

interface SaveCampaignInput {
  name: string
  objective: string
  country: string
  city: string | null
  radiusKm: number
  productId: string | null | undefined
  productName: string
  productPrice: number | null
  productCurrency: string
  productCategory: string
  productDescription: string
  productImages: string[]
  dailyBudget: number | null
  startDate: string
  endDate: string | null | undefined
  audienceMode: 'manual' | 'ai'
  targetAgeMin: number
  targetAgeMax: number
  targetGender: 'all' | 'male' | 'female'
  targetInterests: string[]
  targetLanguages: string[]
  aiHeadline: string
  aiBodyCopy: string
  aiDescription: string
  aiCTA: string
  aiAudienceResult: AudienceResult | null
  campaignScore: ScoreResult | null
  aiGenerated: boolean
}

export async function saveCampaignAction(input: SaveCampaignInput): Promise<ActionResult<string>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'No autenticado' }

    const { canCreate, limit, count } = await checkCampaignLimit(supabase, user.id)
    if (!canCreate) {
      return {
        success: false,
        error: `Límite de campañas alcanzado. Tu plan permite ${limit} campañas activas y ya tienes ${count}.`,
      }
    }

    const aiCopy = input.aiGenerated ? {
      headline: input.aiHeadline,
      body: input.aiBodyCopy,
      description: input.aiDescription,
      cta: input.aiCTA,
    } : null

    const aiAudience = input.audienceMode === 'ai' && input.aiAudienceResult
      ? input.aiAudienceResult
      : null

    const { data: campaignRaw, error } = await supabase
      .from('campaigns')
      .insert({
        user_id: user.id,
        product_id: input.productId || null,
        name: input.name,
        status: input.aiGenerated ? 'pending' : 'draft',
        objective: input.objective,
        target_country: input.country,
        target_city: input.city,
        target_radius_km: input.radiusKm,
        audience_mode: input.audienceMode,
        target_age_min: input.targetAgeMin,
        target_age_max: input.targetAgeMax,
        target_gender: input.targetGender,
        target_interests: JSON.parse(JSON.stringify(input.targetInterests)),
        target_languages: JSON.parse(JSON.stringify(input.targetLanguages)),
        daily_budget: input.dailyBudget,
        start_date: input.startDate || null,
        end_date: input.endDate || null,
        ai_copy: aiCopy ? JSON.parse(JSON.stringify(aiCopy)) : null,
        ai_audience: aiAudience ? JSON.parse(JSON.stringify(aiAudience)) : null,
        ai_generated: input.aiGenerated,
        campaign_score: input.campaignScore?.total ?? null,
        ai_score_breakdown: input.campaignScore?.breakdown ? JSON.parse(JSON.stringify(input.campaignScore.breakdown)) : null,
        ai_recommendations: JSON.parse(JSON.stringify(input.campaignScore?.recommendations ?? [])),
        product_name: input.productName,
        product_description: input.productDescription,
        product_price: input.productPrice,
        product_currency: input.productCurrency,
        product_category: input.productCategory,
      })
      .select('id')
      .single()

    const campaign = campaignRaw as { id: string } | null
    if (error || !campaign) {
      console.error('[saveCampaignAction]', error)
      return { success: false, error: 'Error al guardar la campaña' }
    }

    // Log AI usage if content was generated
    if (input.aiGenerated) {
      await supabase.from('ai_usage').insert({
        user_id: user.id,
        type: 'copy',
        campaign_id: campaign.id,
        tokens_used: null,
      })
    }

    revalidatePath('/campaigns')
    revalidatePath('/dashboard')

    return { success: true, data: campaign.id }
  } catch (err) {
    console.error('[saveCampaignAction]', err)
    return { success: false, error: 'Error inesperado al guardar la campaña' }
  }
}

export async function updateCampaignStatusAction(
  campaignId: string,
  status: 'draft' | 'pending' | 'active' | 'paused' | 'completed'
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'No autenticado' }

    const { error } = await supabase
      .from('campaigns')
      .update({ status })
      .eq('id', campaignId)
      .eq('user_id', user.id)

    if (error) return { success: false, error: 'Error actualizando el estado' }

    revalidatePath(`/campaigns/${campaignId}`)
    revalidatePath('/campaigns')
    revalidatePath('/dashboard')

    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error inesperado' }
  }
}

export async function duplicateCampaignAction(campaignId: string): Promise<ActionResult<string>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { canCreate, limit, count } = await checkCampaignLimit(supabase, user.id)
    if (!canCreate) {
      return {
        success: false,
        error: `Límite de campañas alcanzado. Tu plan permite ${limit} campañas activas y ya tienes ${count}.`,
      }
    }

    const { data: original, error: fetchError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !original) return { success: false, error: 'Campaña no encontrada' }

    type CampaignInsert = Database['public']['Tables']['campaigns']['Insert']
    const toInsert: CampaignInsert = {
      user_id: user.id,
      name: `Copia de ${original.name}`,
      status: 'draft',
      product_id: original.product_id,
      objective: original.objective,
      target_country: original.target_country,
      target_city: original.target_city,
      target_radius_km: original.target_radius_km,
      audience_mode: original.audience_mode,
      target_age_min: original.target_age_min,
      target_age_max: original.target_age_max,
      target_gender: original.target_gender,
      target_interests: original.target_interests,
      target_languages: original.target_languages,
      daily_budget: original.daily_budget,
      currency: original.currency,
      total_budget: original.total_budget,
      start_date: original.start_date,
      end_date: original.end_date,
      ai_copy: original.ai_copy,
      ai_audience: original.ai_audience,
      ai_generated: original.ai_generated,
      campaign_score: original.campaign_score,
      ai_score_breakdown: original.ai_score_breakdown,
      ai_recommendations: original.ai_recommendations,
      product_name: original.product_name,
      product_description: original.product_description,
      product_price: original.product_price,
      product_currency: original.product_currency,
      product_category: original.product_category,
    }

    const { data: duplicate, error: insertError } = await supabase
      .from('campaigns')
      .insert(toInsert)
      .select('id')
      .single()

    const duplicateRow = duplicate as { id: string } | null
    if (insertError || !duplicateRow) {
      console.error('[duplicateCampaignAction]', insertError)
      return { success: false, error: 'Error al duplicar la campaña' }
    }

    revalidatePath('/campaigns')
    revalidatePath('/dashboard')
    return { success: true, data: duplicateRow.id }
  } catch (err) {
    console.error('[duplicateCampaignAction]', err)
    return { success: false, error: 'Error inesperado al duplicar la campaña' }
  }
}

export async function deleteCampaignAction(campaignId: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'No autenticado' }

    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaignId)
      .eq('user_id', user.id)

    if (error) return { success: false, error: 'Error eliminando la campaña' }

    revalidatePath('/campaigns')
    revalidatePath('/dashboard')

    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error inesperado' }
  }
}

const updateCampaignSchema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres').max(100),
  objective: z.enum(['awareness', 'traffic', 'engagement', 'leads', 'sales']),
  target_country: z.string().min(1, 'Selecciona un país'),
  target_city: z.string().nullable().optional(),
  target_radius_km: z.number().min(1).max(500),
  daily_budget: z.number().positive().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  audience_mode: z.enum(['manual', 'ai']),
  target_age_min: z.number().min(18).max(64),
  target_age_max: z.number().min(19).max(65),
  target_gender: z.enum(['all', 'male', 'female']),
  target_interests: z.array(z.string()),
  target_languages: z.array(z.string()),
  ai_copy: z.object({
    headline: z.string(),
    body: z.string(),
    description: z.string(),
    cta: z.string(),
  }).nullable().optional(),
  flyer_url: z.string().nullable().optional(),
})

export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>

export async function updateCampaignAction(
  campaignId: string,
  input: UpdateCampaignInput,
): Promise<ActionResult<void>> {
  try {
    const parsed = updateCampaignSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const d = parsed.data

    type CampaignUpdate = Database['public']['Tables']['campaigns']['Update']
    const toUpdate: CampaignUpdate = {
      name: d.name,
      objective: d.objective,
      target_country: d.target_country,
      target_city: d.target_city ?? null,
      target_radius_km: d.target_radius_km,
      daily_budget: d.daily_budget ?? null,
      start_date: d.start_date ?? null,
      end_date: d.end_date ?? null,
      audience_mode: d.audience_mode,
      target_age_min: d.target_age_min,
      target_age_max: d.target_age_max,
      target_gender: d.target_gender,
      target_interests: JSON.parse(JSON.stringify(d.target_interests)),
      target_languages: JSON.parse(JSON.stringify(d.target_languages)),
      ai_copy: d.ai_copy ? JSON.parse(JSON.stringify(d.ai_copy)) : null,
      ...(d.flyer_url !== undefined && { flyer_url: d.flyer_url }),
    }

    const { error } = await supabase
      .from('campaigns')
      .update(toUpdate)
      .eq('id', campaignId)
      .eq('user_id', user.id)

    if (error) {
      console.error('[updateCampaignAction]', error)
      return { success: false, error: 'Error al actualizar la campaña' }
    }

    revalidatePath(`/campaigns/${campaignId}`)
    revalidatePath(`/campaigns/${campaignId}/edit`)
    revalidatePath('/campaigns')
    revalidatePath('/dashboard')

    return { success: true, data: undefined }
  } catch (err) {
    console.error('[updateCampaignAction]', err)
    return { success: false, error: 'Error inesperado al actualizar la campaña' }
  }
}

// ── Campaign Optimizer actions ────────────────────────────────────────────────

type AiCopyObject = { headline?: string; body?: string; description?: string; cta?: string }

export async function applyCampaignOptimizationAction(
  optimizationId: string,
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    // Load the optimization
    const { data: optRaw } = await supabase
      .from('campaign_optimizations')
      .select('*')
      .eq('id', optimizationId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!optRaw) return { success: false, error: 'Mejora no encontrada' }

    const opt = optRaw as Database['public']['Tables']['campaign_optimizations']['Row']
    const campaignId = opt.campaign_id
    const afterValue = opt.after_value ?? ''

    // Load current campaign for merging
    const { data: campRaw } = await supabase
      .from('campaigns')
      .select('ai_copy, daily_budget')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .maybeSingle()

    const currentCopy = (campRaw?.ai_copy ?? {}) as AiCopyObject

    let campaignUpdate: Database['public']['Tables']['campaigns']['Update'] = {}

    switch (opt.type) {
      case 'copy': {
        let parsed: AiCopyObject = {}
        try { parsed = JSON.parse(afterValue) } catch { parsed = { headline: afterValue } }
        campaignUpdate = { ai_copy: { ...currentCopy, ...parsed } }
        break
      }
      case 'cta': {
        campaignUpdate = { ai_copy: { ...currentCopy, cta: afterValue } }
        break
      }
      case 'audience': {
        try {
          const a = JSON.parse(afterValue) as { ageMin?: number; ageMax?: number; gender?: string; interests?: string[] }
          if (a.ageMin) campaignUpdate.target_age_min = a.ageMin
          if (a.ageMax) campaignUpdate.target_age_max = a.ageMax
          if (a.gender) campaignUpdate.target_gender = a.gender as 'all' | 'male' | 'female'
          if (a.interests) campaignUpdate.target_interests = a.interests
        } catch { /* malformed JSON — skip */ }
        break
      }
      case 'budget': {
        const n = parseFloat(afterValue)
        if (!isNaN(n) && n > 0) campaignUpdate = { daily_budget: n }
        break
      }
      case 'creative':
      default:
        break
    }

    if (Object.keys(campaignUpdate).length > 0) {
      const { error: updateError } = await supabase
        .from('campaigns')
        .update(campaignUpdate)
        .eq('id', campaignId)
        .eq('user_id', user.id)
      if (updateError) return { success: false, error: 'Error al actualizar la campaña' }
    }

    await supabase
      .from('campaign_optimizations')
      .update({ status: 'accepted' })
      .eq('id', optimizationId)
      .eq('user_id', user.id)

    revalidatePath(`/campaigns/${campaignId}/review`)
    revalidatePath(`/campaigns/${campaignId}`)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error inesperado' }
  }
}

export async function rejectCampaignOptimizationAction(
  optimizationId: string,
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { data: optRaw } = await supabase
      .from('campaign_optimizations')
      .select('campaign_id')
      .eq('id', optimizationId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!optRaw) return { success: false, error: 'Mejora no encontrada' }

    await supabase
      .from('campaign_optimizations')
      .update({ status: 'rejected' })
      .eq('id', optimizationId)
      .eq('user_id', user.id)

    const campaignId = (optRaw as { campaign_id: string }).campaign_id
    revalidatePath(`/campaigns/${campaignId}/review`)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error inesperado' }
  }
}

export async function saveOptimizedCreativeAction(
  campaignId: string,
  creative: {
    imageUrl: string
    imagePrompt: string
    headline: string
    primaryText: string
    description: string
    cta: string
    variant: string
    variantLabel: string
    format: string
  },
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    // Unmark all existing primaries for this campaign
    await supabase
      .from('campaign_creatives')
      .update({ is_primary: false })
      .eq('campaign_id', campaignId)
      .eq('user_id', user.id)

    // Insert new primary creative
    const { error } = await supabase.from('campaign_creatives').insert({
      user_id: user.id,
      campaign_id: campaignId,
      image_url: creative.imageUrl,
      prompt: creative.imagePrompt,
      model: 'flux-realism',
      format: creative.format,
      is_primary: true,
      headline: creative.headline,
      primary_text: creative.primaryText,
      description: creative.description,
      cta: creative.cta,
      variant: creative.variant,
      variant_label: creative.variantLabel,
    })
    if (error) return { success: false, error: 'Error al guardar el creativo' }

    // Update campaign flyer_url
    await supabase
      .from('campaigns')
      .update({ flyer_url: creative.imageUrl })
      .eq('id', campaignId)
      .eq('user_id', user.id)

    revalidatePath(`/campaigns/${campaignId}/review`)
    revalidatePath(`/campaigns/${campaignId}`)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error inesperado' }
  }
}

export async function updateCampaignCopyAction(
  campaignId: string,
  copy: { headline: string; body: string; description: string; cta: string },
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { error } = await supabase
      .from('campaigns')
      .update({ ai_copy: copy })
      .eq('id', campaignId)
      .eq('user_id', user.id)

    if (error) return { success: false, error: 'Error al guardar el copy' }

    revalidatePath(`/campaigns/${campaignId}/review`)
    revalidatePath(`/campaigns/${campaignId}`)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error inesperado' }
  }
}

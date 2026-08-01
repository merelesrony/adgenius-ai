'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'
import type { Database } from '@/types/database'
import { checkCampaignLimit } from '@/lib/campaign-limit'
import type { AudienceResult, ScoreResult } from './types'

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

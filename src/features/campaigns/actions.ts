'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'
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

    // Check plan limit
    const { data: canCreate } = await supabase.rpc(
      'check_campaign_limit',
      { p_user_id: user.id }
    )
    if (canCreate === false) {
      return {
        success: false,
        error: 'Límite de campañas alcanzado. Actualiza tu plan para crear más campañas.',
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

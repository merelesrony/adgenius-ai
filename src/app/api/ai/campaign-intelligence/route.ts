import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { analyzeCampaignIntelligence } from '@/lib/ai/AIManager'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any

const schema = z.object({ campaignId: z.string().uuid() })

export async function POST(req: NextRequest) {
  try {
    const supabase: AnyClient = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'campaignId inválido' }, { status: 400 })

    const { campaignId } = parsed.data

    // Load campaign + linked product (for Visual DNA) in parallel
    const [{ data: campaignRaw, error: campError }, { data: businessRaw }] = await Promise.all([
      supabase.from('campaigns').select('*').eq('id', campaignId).eq('user_id', user.id).maybeSingle(),
      supabase.from('businesses').select('country').eq('user_id', user.id).maybeSingle(),
    ])

    if (campError || !campaignRaw) {
      return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 })
    }

    const campaign = campaignRaw
    const aiCopy = campaign.ai_copy as { headline: string; body: string; description: string; cta: string } | null
    const interests = campaign.target_interests as string[] | null
    const platforms = campaign.platforms as string[] | null
    const brandKit = campaign.brand_kit as object | null
    const aiStrategy = campaign.ai_strategy as { audience?: { interests?: string[] } } | null

    // Prefer target interests from campaign, fall back to strategy interests
    const effectiveInterests: string[] = Array.isArray(interests) && interests.length > 0
      ? interests
      : (aiStrategy?.audience?.interests ?? [])

    // Determine country: campaign targeting > user's business country
    const effectiveCountry = campaign.target_country
      ?? (businessRaw as { country?: string } | null)?.country
      ?? 'US'

    // Check for visual DNA via product link
    let hasVisualDNA = false
    if (campaign.product_id) {
      const { data: prod } = await supabase
        .from('products')
        .select('visual_dna')
        .eq('id', campaign.product_id)
        .maybeSingle()
      hasVisualDNA = !!(prod?.visual_dna)
    }

    const result = await analyzeCampaignIntelligence({
      productName: campaign.product_name ?? 'Producto sin nombre',
      productDescription: campaign.product_description ?? null,
      productCategory: campaign.product_category ?? null,
      productPrice: campaign.product_price ?? null,
      productCurrency: campaign.product_currency ?? campaign.currency ?? 'USD',
      objective: campaign.objective ?? 'sales',
      dailyBudget: campaign.daily_budget ?? null,
      budgetCurrency: campaign.currency ?? campaign.product_currency ?? 'USD',
      country: effectiveCountry,
      city: campaign.target_city ?? null,
      targetAgeMin: campaign.target_age_min ?? null,
      targetAgeMax: campaign.target_age_max ?? null,
      targetGender: campaign.target_gender ?? 'all',
      targetInterests: effectiveInterests,
      platforms: Array.isArray(platforms) ? platforms : [],
      aiCopy,
      hasCreative: !!(campaign.flyer_url),
      hasVisualDNA,
      hasBrandKit: !!brandKit,
      currentScore: campaign.campaign_score ?? null,
    })

    // Save review to history — non-blocking (migration may not be applied yet)
    supabase.from('campaign_ai_reviews').insert({
      campaign_id: campaignId,
      user_id: user.id,
      score: result.overallScore,
      sub_scores: result.subScores,
      findings: result.findings,
      recommendations: result.recommendations,
      prediction: result.prediction,
      risks: result.risks,
      coach_advice: result.coachAdvice,
      quick_wins: result.quickWins,
      summary: result.summary,
    }).then(({ error }: { error: { message: string } | null }) => {
      if (error) console.warn('[campaign-intelligence] history insert failed (migration 014 may not be applied):', error.message)
    })

    // Track AI usage — non-blocking
    supabase.from('ai_usage').insert({ user_id: user.id, type: 'copy', tokens_used: null })
      .then(() => { /* fire and forget */ })

    return NextResponse.json(result)
  } catch (err) {
    console.error('[campaign-intelligence]', err)
    const message = err instanceof Error ? err.message : 'Error inesperado'
    return NextResponse.json({ error: 'Error al analizar la campaña', detail: message }, { status: 500 })
  }
}

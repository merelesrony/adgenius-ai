import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { analyzeCampaignOptimization } from '@/lib/ai/AIManager'
import type { Database } from '@/types/database'

type CampaignRow = Database['public']['Tables']['campaigns']['Row']
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
    if (!parsed.success) {
      return NextResponse.json({ error: 'campaignId inválido' }, { status: 400 })
    }

    const { campaignId } = parsed.data

    // Load campaign
    const { data: campaignRaw, error: campError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (campError || !campaignRaw) {
      return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 })
    }

    const campaign = campaignRaw as CampaignRow
    const aiCopy = campaign.ai_copy as { headline: string; body: string; description: string; cta: string } | null
    const interests = campaign.target_interests as string[] | null

    // Run AI analysis
    const result = await analyzeCampaignOptimization({
      productName: campaign.product_name ?? 'Producto',
      productDescription: campaign.product_description ?? null,
      productCategory: campaign.product_category ?? null,
      productPrice: campaign.product_price ?? null,
      productCurrency: campaign.product_currency ?? campaign.currency ?? 'USD',
      objective: campaign.objective ?? 'sales',
      dailyBudget: campaign.daily_budget ?? null,
      budgetCurrency: campaign.currency ?? campaign.product_currency ?? 'USD',
      country: campaign.target_country ?? 'AR',
      city: campaign.target_city ?? null,
      targetAgeMin: campaign.target_age_min ?? null,
      targetAgeMax: campaign.target_age_max ?? null,
      targetGender: campaign.target_gender ?? 'all',
      targetInterests: Array.isArray(interests) ? interests : [],
      aiCopy,
      hasCreative: !!(campaign.flyer_url),
    })

    // Replace old pending optimizations for this campaign
    await supabase
      .from('campaign_optimizations')
      .delete()
      .eq('campaign_id', campaignId)
      .eq('user_id', user.id)
      .eq('status', 'pending')

    // Insert new improvements
    if (result.improvements.length > 0) {
      const rows = result.improvements.map((imp) => ({
        campaign_id: campaignId,
        user_id: user.id,
        type: imp.type,
        priority: imp.priority,
        problem: imp.problem,
        recommendation: imp.recommendation,
        before_value: imp.before,
        after_value: imp.after,
        status: 'pending',
      }))
      await supabase.from('campaign_optimizations').insert(rows)
    }

    // Update campaign with optimizer metadata
    await supabase
      .from('campaigns')
      .update({
        optimizer_score: result.score,
        optimizer_summary: result.summary,
        optimizer_strengths: result.strengths,
        optimizer_run_at: new Date().toISOString(),
      })
      .eq('id', campaignId)
      .eq('user_id', user.id)

    await supabase.from('ai_usage').insert({ user_id: user.id, type: 'copy', tokens_used: null })

    return NextResponse.json(result)
  } catch (err) {
    console.error('[optimize-campaign]', err)
    const message = err instanceof Error ? err.message : 'Error inesperado'
    return NextResponse.json({ error: 'Error al analizar la campaña', detail: message }, { status: 500 })
  }
}

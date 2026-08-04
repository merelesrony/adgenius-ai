import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CampaignReview } from '@/features/campaigns/components/campaign-review'
import type { Database } from '@/types/database'

type CampaignRow = Database['public']['Tables']['campaigns']['Row']
type CreativeRow = Database['public']['Tables']['campaign_creatives']['Row']
type OptimizationRow = Database['public']['Tables']['campaign_optimizations']['Row']

export const metadata: Metadata = { title: 'Revisar campaña — AdGenius AI' }

export default async function ReviewCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: campaignRaw } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  const campaign = campaignRaw as CampaignRow | null
  if (!campaign) notFound()

  // Load all creatives for this campaign (primary first)
  let creatives: CreativeRow[] = []
  try {
    const { data: rawCreatives } = await supabase
      .from('campaign_creatives')
      .select('*')
      .eq('campaign_id', id)
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false })
    creatives = (rawCreatives ?? []) as CreativeRow[]
  } catch {
    // non-critical
  }

  // Load optimizer suggestions
  let optimizations: OptimizationRow[] = []
  try {
    const { data: optsRaw } = await supabase
      .from('campaign_optimizations')
      .select('*')
      .eq('campaign_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    optimizations = (optsRaw ?? []) as OptimizationRow[]
  } catch {
    // non-critical — table may not exist yet if migration hasn't run
  }

  const primaryCreative = creatives.find((c) => c.is_primary) ?? creatives[0] ?? null
  const creativeUrl = primaryCreative?.image_url ?? campaign.flyer_url ?? null

  return (
    <CampaignReview
      campaign={campaign}
      creativeUrl={creativeUrl}
      creatives={creatives}
      optimizations={optimizations}
    />
  )
}

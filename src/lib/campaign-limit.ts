import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export interface CampaignLimitResult {
  canCreate: boolean
  count: number
  limit: number
  planName: string
}

type PlanShape = { display_name: string; campaign_limit: number }
type SubShape = { plan: PlanShape | null }

/**
 * Checks whether a user can create a new campaign.
 * Falls back to the Starter defaults (limit = 5) when no active subscription is found,
 * instead of blocking the user like the check_campaign_limit RPC does.
 */
export async function checkCampaignLimit(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<CampaignLimitResult> {
  const [{ data: subRaw }, { count }] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('plan:plans(display_name, campaign_limit)')
      .eq('user_id', userId)
      .in('status', ['active', 'trial'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('status', 'in', '("completed","failed")'),
  ])

  const sub = subRaw as SubShape | null
  const plan = sub?.plan ?? null
  const limit = plan?.campaign_limit ?? 5
  const planName = plan?.display_name ?? 'Starter'
  const activeCount = count ?? 0
  const canCreate = limit === -1 || activeCount < limit

  console.log('[checkCampaignLimit]', {
    userId,
    planName,
    subscriptionFound: plan !== null,
    limit,
    activeCount,
    canCreate,
  })

  return { canCreate, count: activeCount, limit, planName }
}

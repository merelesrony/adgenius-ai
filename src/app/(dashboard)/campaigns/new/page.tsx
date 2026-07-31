import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CampaignWizard } from '@/features/campaigns/wizard/wizard-shell'
import type { ExistingProduct, PlanLimitInfo } from '@/features/campaigns/types'

export const metadata: Metadata = { title: 'Nueva campaña — AdGenius AI' }

export default async function NewCampaignPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  type PlanShape = { name: string; display_name: string; campaign_limit: number }
  type SubShape = { plan: PlanShape | null }

  // Fetch plan info + products in parallel
  const [{ data: canCreate }, { data: productsRaw }, { data: subRaw }] = await Promise.all([
    supabase.rpc('check_campaign_limit', { p_user_id: user.id }),
    supabase
      .from('products')
      .select('id, name, description, price, currency, category, images')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('subscriptions')
      .select('*, plan:plans(name, display_name, campaign_limit)')
      .eq('user_id', user.id)
      .in('status', ['active', 'trial'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const subscription = subRaw as SubShape | null
  const plan = subscription?.plan ?? null

  // Count current campaigns
  const { count: currentCount } = await supabase
    .from('campaigns')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .not('status', 'in', '("completed","failed")')

  const planLimit: PlanLimitInfo = {
    canCreate: canCreate !== false,
    currentCount: currentCount ?? 0,
    limit: plan?.campaign_limit ?? 5,
    planName: plan?.display_name ?? 'Starter',
  }

  if (!planLimit.canCreate) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-4">
          <div className="flex size-14 mx-auto items-center justify-center rounded-2xl bg-destructive/10">
            <AlertTriangle className="size-7 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Límite de campañas alcanzado
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Tu plan <strong>{planLimit.planName}</strong> permite{' '}
              {planLimit.limit === -1 ? 'campañas ilimitadas' : `${planLimit.limit} campañas activas`}.
              Actualmente tienes <strong>{planLimit.currentCount}</strong> campañas activas.
            </p>
          </div>
          <Link
            href="/subscription"
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand/90 transition-colors"
          >
            Actualizar plan
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <CampaignWizard
      existingProducts={(productsRaw ?? []) as ExistingProduct[]}
      planLimit={planLimit}
      userId={user.id}
    />
  )
}

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { checkCampaignLimit } from '@/lib/campaign-limit'
import { CampaignWizard } from '@/features/campaigns/wizard/wizard-shell'
import type { ExistingProduct, PlanLimitInfo } from '@/features/campaigns/types'

export const metadata: Metadata = { title: 'Nueva campaña — AdGenius AI' }

export default async function NewCampaignPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch plan limit check and products in parallel
  const [limitResult, { data: productsRaw }] = await Promise.all([
    checkCampaignLimit(supabase, user.id),
    supabase
      .from('products')
      .select('id, name, description, price, currency, category, images')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const planLimit: PlanLimitInfo = {
    canCreate: limitResult.canCreate,
    currentCount: limitResult.count,
    limit: limitResult.limit,
    planName: limitResult.planName,
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

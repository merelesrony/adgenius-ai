import { createClient } from '@/lib/supabase/server'
import { BuilderShell } from '@/features/campaign-builder/components/builder-shell'
import { Wand2 } from 'lucide-react'
import type { BuilderSession } from '@/features/campaign-builder/types'

export const metadata = {
  title: 'Smart Campaign Builder — AdGenius AI',
  description: 'Crea campañas publicitarias inteligentes paso a paso',
}

export default async function CampaignBuilderPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: products }, { data: draftRow }] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .eq('user_id', user?.id ?? '')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),

    supabase
      .from('campaign_builder_sessions')
      .select('*')
      .eq('user_id', user?.id ?? '')
      .in('status', ['draft', 'paused'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const initialSession = (draftRow ?? null) as BuilderSession | null

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <div className="flex items-center justify-center size-9 rounded-xl bg-gradient-to-br from-brand to-purple-600 shrink-0">
            <Wand2 className="size-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground leading-none">
              Smart Campaign Builder
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Crea tu campaña en 6 pasos simples
            </p>
          </div>
        </div>
      </div>

      {/* Builder content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <BuilderShell products={products ?? []} initialSession={initialSession} userId={user?.id ?? ''} />
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PlusCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import type { Database } from '@/types/database'
import { CampaignList } from '@/features/campaigns/components/campaign-list'

type CampaignRow = Database['public']['Tables']['campaigns']['Row']

export const metadata: Metadata = { title: 'Campañas' }

export default async function CampaignsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: campaignsRaw } = await supabase
    .from('campaigns')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const campaigns = (campaignsRaw ?? []) as CampaignRow[]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Campañas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestiona tus campañas de Facebook Ads
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button size="sm" className="gap-2">
            <PlusCircle className="size-4" />
            Nueva campaña
          </Button>
        </Link>
      </div>

      <CampaignList campaigns={campaigns} />
    </div>
  )
}

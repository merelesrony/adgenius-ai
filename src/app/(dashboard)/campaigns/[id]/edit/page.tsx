import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import { EditCampaignForm } from '@/features/campaigns/components/edit-campaign-form'

type CampaignRow = Database['public']['Tables']['campaigns']['Row']

export const metadata: Metadata = { title: 'Editar campaña — AdGenius AI' }

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
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

  return <EditCampaignForm campaign={campaign} />
}

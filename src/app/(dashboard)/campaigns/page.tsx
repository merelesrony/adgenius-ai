import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PlusCircle, Megaphone } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import type { Database } from '@/types/database'

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

  const campaigns = campaignsRaw as CampaignRow[] | null

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
          <Button size="sm">
            <PlusCircle className="size-4" />
            Nueva campaña
          </Button>
        </Link>
      </div>

      <div className="rounded-lg border border-border bg-card">
        {!campaigns || campaigns.length === 0 ? (
          <EmptyState
            icon={<Megaphone className="size-7 text-muted-foreground" />}
            title="Sin campañas"
            description="Crea tu primera campaña y usa IA para generar el copy y la audiencia ideal para tu negocio."
            action={{ label: 'Crear primera campaña', href: '/campaigns/new' }}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden md:table-cell">Modo</TableHead>
                <TableHead className="hidden lg:table-cell">Presupuesto/día</TableHead>
                <TableHead className="hidden sm:table-cell">Creada</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link
                      href={`/campaigns/${c.id}`}
                      className="font-medium text-foreground hover:text-brand transition-colors"
                    >
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {c.audience_mode === 'ai' ? 'IA' : 'Manual'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {c.daily_budget ? `$${c.daily_budget} ${c.currency}` : '—'}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {formatDate(c.created_at)}
                  </TableCell>
                  <TableCell>
                    <Link href={`/campaigns/${c.id}`}>
                      <Button variant="ghost" size="sm">Ver</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

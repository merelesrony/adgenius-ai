import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Megaphone, Box, Sparkles, TrendingUp, PlusCircle,
  ArrowRight, Star, CheckCircle2, FileEdit,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import { callRpc } from '@/lib/supabase/rpc'
import { StatCard } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatRelativeDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  type PlanRow = { display_name: string; ai_generations_limit: number; campaign_limit: number }
  type SubRow = { status: string; plan: PlanRow | null }
  type CampaignRow = { id: string; name: string; status: string; ai_generated: boolean; campaign_score: number | null; created_at: string }

  const statsArgs: Database['public']['Functions']['get_campaign_stats']['Args'] = {
    p_user_id: user.id
  }

  const [
    { count: totalCampaigns },
    { count: productCount },
    { data: subRaw },
    { data: recentRaw },
    { count: aiUsedCount },
  ] = await Promise.all([
    supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_active', true),
    supabase.from('subscriptions').select('*, plan:plans(*)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('campaigns').select('id, name, status, ai_generated, campaign_score, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('ai_usage').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ])

  const { data: campaignStats } = await callRpc(supabase, 'get_campaign_stats', statsArgs)

  const subscription = subRaw as SubRow | null
  const recentCampaigns = recentRaw as CampaignRow[] | null
  const plan = subscription?.plan ?? null
  const aiLimit = plan?.ai_generations_limit ?? 20
  const aiUsed = aiUsedCount ?? 0
  const aiRemaining = aiLimit === -1 ? '∞' : String(Math.max(0, aiLimit - aiUsed))

  const stats = Array.isArray(campaignStats) ? campaignStats[0] : null

  const { data: canCreate } = await callRpc(supabase, 'check_campaign_limit', { p_user_id: user.id })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Resumen de tu actividad en AdGenius AI
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button size="sm" disabled={canCreate === false}>
            <PlusCircle className="size-4" />
            Nueva campaña
          </Button>
        </Link>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Campañas"
          value={totalCampaigns ?? 0}
          description="Total creadas"
          icon={<Megaphone />}
        />
        <StatCard
          title="Productos"
          value={productCount ?? 0}
          description="Activos"
          icon={<Box />}
        />
        <StatCard
          title="Plan actual"
          value={plan?.display_name ?? 'Starter'}
          description={subscription ? `Estado: ${subscription.status}` : 'Sin suscripción'}
          icon={<TrendingUp />}
        />
        <StatCard
          title="Generaciones IA"
          value={`${aiUsed} / ${aiLimit === -1 ? '∞' : aiLimit}`}
          description={`${aiRemaining} restantes este mes`}
          icon={<Sparkles />}
        />
      </div>

      {/* Campaign status breakdown */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <FileEdit className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.draft_count ?? 0}</p>
              <p className="text-xs text-muted-foreground">Borradores</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-brand/10">
              <CheckCircle2 className="size-5 text-brand" />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand">{stats.ready_count ?? 0}</p>
              <p className="text-xs text-muted-foreground">Listas con IA</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-500/10">
              <Star className="size-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats.avg_score != null ? `${stats.avg_score}` : '—'}
              </p>
              <p className="text-xs text-muted-foreground">Score promedio</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent campaigns */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-sm font-semibold text-card-foreground">Campañas recientes</h2>
          <Link href="/campaigns" className="flex items-center gap-1 text-xs text-brand hover:underline">
            Ver todas
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {!recentCampaigns || recentCampaigns.length === 0 ? (
          <EmptyState
            icon={<Megaphone className="size-7 text-muted-foreground" />}
            title="Sin campañas todavía"
            description="Crea tu primera campaña publicitaria con ayuda de IA."
            action={{ label: 'Crear campaña', href: '/campaigns/new' }}
            className="py-10"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden sm:table-cell">Score</TableHead>
                <TableHead className="hidden sm:table-cell">Creada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentCampaigns.map((row) => {
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/campaigns/${row.id}`}
                          className="font-medium text-foreground hover:text-brand transition-colors"
                        >
                          {row.name}
                        </Link>
                        {row.ai_generated && (
                          <Sparkles className="size-3 text-brand shrink-0" aria-label="IA" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.status as 'draft' | 'active' | 'paused' | 'pending' | 'completed' | 'failed'} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {row.campaign_score != null ? (
                        <span className={
                          row.campaign_score >= 70 ? 'text-brand font-medium' :
                          row.campaign_score >= 40 ? 'text-amber-500 font-medium' :
                          'text-muted-foreground'
                        }>
                          {row.campaign_score}/100
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                      {formatRelativeDate(row.created_at)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

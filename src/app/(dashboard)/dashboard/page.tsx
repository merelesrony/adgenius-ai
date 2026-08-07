import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Megaphone, Box, Sparkles, TrendingUp,
  ArrowRight, Star, CheckCircle2, FileEdit, Activity,
  ChevronRight, Wand2, Users, Type, Palette, MonitorSmartphone,
  Clock,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import { callRpc } from '@/lib/supabase/rpc'
import { checkCampaignLimit } from '@/lib/campaign-limit'
import { StatCard } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatRelativeDate, cn } from '@/lib/utils'
import { AnalyticsChart } from '@/components/dashboard/analytics-chart'
import { AnimatedSection } from '@/components/dashboard/animated-section'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  type PlanRow = { display_name: string; ai_generations_limit: number; campaign_limit: number }
  type SubRow = { status: string; plan: PlanRow | null }
  type CampaignRow = {
    id: string
    name: string
    status: string
    ai_generated: boolean
    campaign_score: number | null
    created_at: string
  }

  const statsArgs: Database['public']['Functions']['get_campaign_stats']['Args'] = {
    p_user_id: user.id,
  }

  const [
    { count: totalCampaigns },
    { count: productCount },
    { data: subRaw },
    { data: recentRaw },
    { count: aiUsedCount },
    { data: draftSessionRaw },
  ] = await Promise.all([
    supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true),
    supabase
      .from('subscriptions')
      .select('*, plan:plans(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('campaigns')
      .select('id, name, status, ai_generated, campaign_score, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('ai_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte(
        'created_at',
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      ),
    supabase
      .from('campaign_builder_sessions')
      .select('id, updated_at')
      .eq('user_id', user.id)
      .in('status', ['draft', 'paused'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const { data: campaignStats } = await callRpc(supabase, 'get_campaign_stats', statsArgs)

  const draftSession = draftSessionRaw as { id: string; updated_at: string } | null
  const subscription = subRaw as SubRow | null
  const recentCampaigns = recentRaw as CampaignRow[] | null
  const plan = subscription?.plan ?? null
  const aiLimit = plan?.ai_generations_limit ?? 20
  const aiUsed = aiUsedCount ?? 0
  const aiRemaining = aiLimit === -1 ? '∞' : String(Math.max(0, aiLimit - aiUsed))
  const aiLimitDisplay = aiLimit === -1 ? '∞' : aiLimit
  const aiProgressPct =
    aiLimit === -1 ? 10 : Math.min(100, Math.round((aiUsed / (aiLimit || 1)) * 100))

  const stats = Array.isArray(campaignStats) ? campaignStats[0] : null

  const { canCreate } = await checkCampaignLimit(supabase, user.id)
  const isNewUser = (totalCampaigns ?? 0) === 0 && (productCount ?? 0) === 0

  const AI_BENEFITS = [
    { icon: Users,             label: 'Segmentación automática' },
    { icon: Type,              label: 'Copy profesional' },
    { icon: Palette,           label: 'Creativos con IA' },
    { icon: MonitorSmartphone, label: 'Preview en Meta' },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <AnimatedSection>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Inicio</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Bienvenido a AdGenius AI
            </p>
          </div>
          <Link href="/campaign-builder">
            <Button disabled={!canCreate} className="gap-2">
              <Wand2 className="size-4" />
              Crear campaña con IA
            </Button>
          </Link>
        </div>
      </AnimatedSection>

      {/* In-progress builder session banner */}
      {draftSession && (
        <AnimatedSection delay={0.01}>
          <div className="rounded-2xl border border-amber-400/40 bg-amber-50/70 dark:bg-amber-900/15 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex items-center justify-center size-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 shrink-0">
                <Clock className="size-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  Tienes una campaña en progreso
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Tu borrador está guardado — puedes continuar donde lo dejaste
                </p>
              </div>
            </div>
            <Link href="/campaign-builder" className="shrink-0">
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5 border-0 w-full sm:w-auto">
                <ArrowRight className="size-3.5" />
                Continuar campaña
              </Button>
            </Link>
          </div>
        </AnimatedSection>
      )}

      {/* Hero CTA — AI campaign builder */}
      <AnimatedSection delay={0.02}>
        {isNewUser ? (
          /* Onboarding welcome for new users */
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-brand via-brand to-purple-600 p-6 sm:p-8 text-white">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex-1 space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                  <Sparkles className="size-3" />
                  Para ti — sin experiencia en publicidad
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
                  No necesitas saber publicidad digital.
                </h2>
                <p className="text-white/80 text-sm leading-relaxed max-w-md">
                  Sube tu producto y la IA hará el trabajo. Estrategia, audiencia, copy y creativos en minutos.
                </p>
                <Link href="/campaign-builder">
                  <Button size="lg" className="bg-white text-brand hover:bg-white/90 gap-2 mt-2 font-bold">
                    <Wand2 className="size-4" />
                    Comenzar
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:w-52 shrink-0">
                {AI_BENEFITS.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2.5">
                    <Icon className="size-3.5 shrink-0" />
                    <span className="text-[11px] font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Returning user — compact AI campaign CTA */
          <div className="rounded-2xl border border-brand/20 bg-gradient-to-r from-brand/5 to-purple-500/5 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex items-center justify-center size-10 rounded-xl bg-brand/10 shrink-0">
                <Wand2 className="size-5 text-brand" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Crear campaña con IA</p>
                <p className="text-xs text-muted-foreground">
                  Crea campañas profesionales sin saber Facebook Ads
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {AI_BENEFITS.map(({ icon: Icon, label }) => (
                <span key={label} className="hidden xl:inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
                  <Icon className="size-3" />{label}
                </span>
              ))}
              <Link href="/campaign-builder">
                <Button size="sm" className="gap-1.5 ml-2">
                  <Wand2 className="size-3.5" />
                  Crear ahora
                </Button>
              </Link>
            </div>
          </div>
        )}
      </AnimatedSection>

      {/* Stat cards */}
      <AnimatedSection delay={0.05}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Campañas"
            value={totalCampaigns ?? 0}
            description="Total creadas"
            icon={<Megaphone />}
            iconColor="blue"
          />
          <StatCard
            title="Productos"
            value={productCount ?? 0}
            description="Activos"
            icon={<Box />}
            iconColor="purple"
          />
          <StatCard
            title="IA este mes"
            value={`${aiUsed} / ${aiLimitDisplay}`}
            description={`${aiRemaining} generaciones restantes`}
            icon={<Sparkles />}
            iconColor="indigo"
          />
          <StatCard
            title="Plan actual"
            value={plan?.display_name ?? 'Starter'}
            description={subscription ? subscription.status : 'Sin suscripción'}
            icon={<TrendingUp />}
            iconColor="green"
          />
        </div>
      </AnimatedSection>

      {/* Main content grid */}
      <AnimatedSection delay={0.1}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left column: chart + recent campaigns */}
          <div className="xl:col-span-2 space-y-6">
            <AnalyticsChart />

            {/* Recent campaigns */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Campañas recientes</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Últimas 5 actualizadas</p>
                </div>
                <Link
                  href="/campaigns"
                  className="flex items-center gap-1 text-xs font-medium text-brand hover:text-brand/80 transition-colors"
                >
                  Ver todas
                  <ArrowRight className="size-3" />
                </Link>
              </div>

              {!recentCampaigns || recentCampaigns.length === 0 ? (
                <EmptyState
                  icon={<Megaphone className="size-7 text-muted-foreground" />}
                  title="Sin campañas todavía"
                  description="Crea tu primera campaña publicitaria con ayuda de IA."
                  action={{ label: 'Crear campaña con IA', href: '/campaign-builder' }}
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
                    {recentCampaigns.map((row) => (
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
                              <Sparkles
                                className="size-3 text-brand shrink-0"
                                aria-label="IA"
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={
                              row.status as
                                | 'draft'
                                | 'active'
                                | 'paused'
                                | 'pending'
                                | 'completed'
                                | 'failed'
                            }
                          />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                          {row.campaign_score != null ? (
                            <span
                              className={cn(
                                'font-medium',
                                row.campaign_score >= 70
                                  ? 'text-success'
                                  : row.campaign_score >= 40
                                    ? 'text-amber-500'
                                    : 'text-muted-foreground'
                              )}
                            >
                              {row.campaign_score}/100
                            </span>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                          {formatRelativeDate(row.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          {/* Right column: status + plan + quick actions */}
          <div className="space-y-4">
            {/* Campaign status breakdown */}
            {stats && (
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Estado de campañas</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Distribución actual</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
                        <FileEdit className="size-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm text-foreground">Borradores</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {stats.draft_count ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand/10">
                        <CheckCircle2 className="size-4 text-brand" />
                      </div>
                      <span className="text-sm text-foreground">Listas con IA</span>
                    </div>
                    <span className="text-sm font-bold text-brand">
                      {stats.ready_count ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                        <Star className="size-4 text-amber-500" />
                      </div>
                      <span className="text-sm text-foreground">Score promedio</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {stats.avg_score != null ? stats.avg_score : '—'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Plan card with gradient */}
            <div className="rounded-2xl bg-gradient-to-br from-brand to-purple-600 p-5 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4" />
                  <span className="text-sm font-bold">{plan?.display_name ?? 'Starter'}</span>
                </div>
                <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full capitalize">
                  {subscription?.status ?? 'trial'}
                </span>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-white/80">Generaciones IA</span>
                  <span className="font-semibold">
                    {aiUsed} / {aiLimitDisplay}
                  </span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all"
                    style={{ width: `${aiProgressPct}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-xs text-white/80">
                <span>
                  Campañas: {totalCampaigns ?? 0} / {plan?.campaign_limit ?? '—'}
                </span>
                <span>{aiRemaining} restantes</span>
              </div>
            </div>

            {/* Quick actions */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Acciones rápidas</h3>
              <div className="space-y-1">
                {(
                  [
                    { label: 'Crear campaña con IA', href: '/campaign-builder', icon: Wand2 },
                    { label: 'Ver campañas', href: '/campaigns', icon: Megaphone },
                    { label: 'Mis productos', href: '/products', icon: Box },
                    { label: 'Analíticas', href: '/analytics', icon: Activity },
                  ] as const
                ).map(({ label, href, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 p-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors group"
                  >
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-muted group-hover:bg-brand/10 transition-colors">
                      <Icon className="size-3.5 group-hover:text-brand transition-colors" />
                    </div>
                    <span>{label}</span>
                    <ChevronRight className="size-3.5 ml-auto opacity-0 group-hover:opacity-100 text-brand transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </div>
  )
}

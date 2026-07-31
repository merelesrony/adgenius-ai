import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Megaphone, Package, DollarSign, Users,
  MapPin, Sparkles, Star, Edit2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CampaignScore } from '@/features/campaigns/components/campaign-score'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { ScoreResult } from '@/features/campaigns/types'
import { CAMPAIGN_OBJECTIVES, COUNTRIES } from '@/constants/options'
import type { Database } from '@/types/database'

type CampaignRow = Database['public']['Tables']['campaigns']['Row']
type ProductRow = Database['public']['Tables']['products']['Row']
type CampaignWithProduct = CampaignRow & { product: ProductRow | null }

export const metadata: Metadata = { title: 'Detalle de campaña' }

interface SectionProps {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}

function Section({ title, icon: Icon, children }: SectionProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
        <Icon className="size-4 text-brand" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value || '—'}</span>
    </div>
  )
}

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: campaignRaw } = await supabase
    .from('campaigns')
    .select('*, product:products(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  const campaign = campaignRaw as CampaignWithProduct | null
  if (!campaign) notFound()

  type AiCopy = { headline: string; body: string; description: string; cta: string } | null
  const aiCopy = campaign.ai_copy as AiCopy
  type AiAudience = { ageMin: number; ageMax: number; gender: string; interests: string[]; languages: string[]; explanation?: string } | null
  const aiAudience = campaign.ai_audience as AiAudience

  const campaignScore = campaign.campaign_score != null ? {
    total: campaign.campaign_score,
    breakdown: (campaign.ai_score_breakdown as ScoreResult['breakdown'] | null) ?? { copy: 0, audience: 0, budget: 0, targeting: 0 },
    recommendations: (campaign.ai_recommendations as string[] | null) ?? [],
  } satisfies ScoreResult : null

  const countryLabel = COUNTRIES.find((c) => c.value === campaign.target_country)?.label ?? campaign.target_country ?? '—'
  const objectiveLabel = CAMPAIGN_OBJECTIVES.find((o) => o.value === campaign.objective)?.label ?? '—'
  const interests = campaign.target_interests as string[] | null
  const product = campaign.product

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            href="/campaigns"
            className="mt-0.5 flex size-8 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{campaign.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={campaign.status} />
              {campaign.ai_generated && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 text-brand px-2 py-0.5 text-xs font-medium">
                  <Sparkles className="size-3" />
                  IA
                </span>
              )}
              {campaignScore && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted text-foreground px-2 py-0.5 text-xs font-medium">
                  <Star className="size-3 text-amber-400" />
                  {campaignScore.total}/100
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <Edit2 className="size-4" />
            Editar
          </Button>
          <Button size="sm" disabled>
            Publicar en Meta
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Campaign info */}
          <Section title="Información de la campaña" icon={Megaphone}>
            <InfoRow label="Nombre" value={campaign.name} />
            <InfoRow label="Objetivo" value={objectiveLabel} />
            <InfoRow label="Estado" value={campaign.status} />
            <InfoRow label="Creada" value={formatDate(campaign.created_at)} />
          </Section>

          {/* Product */}
          <Section title="Producto / Servicio" icon={Package}>
            <InfoRow
              label="Nombre"
              value={product?.name ?? campaign.product_name ?? '—'}
            />
            <InfoRow
              label="Precio"
              value={
                product?.price != null
                  ? formatCurrency(product.price, product.currency ?? 'USD')
                  : campaign.product_price != null
                    ? formatCurrency(campaign.product_price, campaign.product_currency ?? 'USD')
                    : '—'
              }
            />
            <InfoRow
              label="Categoría"
              value={product?.category ?? campaign.product_category ?? '—'}
            />
            {(product?.description ?? campaign.product_description) && (
              <div className="pt-2 mt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Descripción</p>
                <p className="text-sm text-foreground">
                  {product?.description ?? campaign.product_description ?? ''}
                </p>
              </div>
            )}
          </Section>

          {/* AI Copy */}
          {aiCopy && (
            <Section title="Copy generado por IA" icon={Sparkles}>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Título</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{aiCopy.headline}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Copy principal</p>
                  <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap">{aiCopy.body}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Descripción</p>
                  <p className="text-sm text-foreground mt-0.5">{aiCopy.description}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CTA</p>
                  <span className="inline-block mt-1 rounded-md bg-brand text-white text-xs font-semibold px-3 py-1.5">
                    {aiCopy.cta}
                  </span>
                </div>
              </div>
            </Section>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Campaign score */}
          {campaignScore && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Star className="size-4 text-amber-400" />
                Puntuación
              </h3>
              <CampaignScore score={campaignScore} />
            </div>
          )}

          {/* Budget */}
          <Section title="Presupuesto" icon={DollarSign}>
            <InfoRow
              label="Presupuesto/día"
              value={campaign.daily_budget ? `$${campaign.daily_budget} ${campaign.currency}` : '—'}
            />
            <InfoRow
              label="Inicio"
              value={campaign.start_date ? formatDate(campaign.start_date) : '—'}
            />
            <InfoRow
              label="Fin"
              value={campaign.end_date ? formatDate(campaign.end_date) : 'Sin fecha fin'}
            />
          </Section>

          {/* Audience */}
          <Section title="Audiencia" icon={Users}>
            <InfoRow
              label="Modo"
              value={campaign.audience_mode === 'ai' ? 'Generada por IA' : 'Manual'}
            />
            <InfoRow
              label="Edad"
              value={`${campaign.target_age_min}–${campaign.target_age_max} años`}
            />
            <InfoRow
              label="Género"
              value={
                campaign.target_gender === 'all' ? 'Todos' :
                campaign.target_gender === 'male' ? 'Hombres' : 'Mujeres'
              }
            />
            {interests && interests.length > 0 && (
              <div className="pt-2 mt-1 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-2">Intereses</p>
                <div className="flex flex-wrap gap-1">
                  {interests.map((int) => (
                    <span
                      key={int}
                      className="rounded-md bg-brand/10 text-brand px-2 py-0.5 text-xs"
                    >
                      {int}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {aiAudience?.explanation && (
              <div className="pt-2 mt-1 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Análisis IA</p>
                <p className="text-xs text-foreground italic">&ldquo;{aiAudience.explanation}&rdquo;</p>
              </div>
            )}
          </Section>

          {/* Location */}
          <Section title="Ubicación" icon={MapPin}>
            <InfoRow label="País" value={countryLabel} />
            <InfoRow label="Ciudad" value={campaign.target_city ?? 'Todo el país'} />
            <InfoRow label="Radio" value={`${campaign.target_radius_km} km`} />
          </Section>
        </div>
      </div>
    </div>
  )
}

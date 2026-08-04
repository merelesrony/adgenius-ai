'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Target, Users, DollarSign, Clock, Palette, PenTool,
  Settings, Megaphone, Copy, Loader2, ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { formatCurrency, convertFromUSD } from '@/lib/currency'
import { createCampaignFromStrategyAction } from '@/features/campaigns/actions'
import type { MarketingStrategy } from '../types'

interface StrategyResultProps {
  strategy: MarketingStrategy
  productName: string
  productDescription: string
  productPrice?: number | null
  productCurrency: string
  imageUrl?: string | null
  onReset: () => void
}

const PRICE_LEVEL_LABELS: Record<string, string> = {
  economy: 'Económico',
  mid: 'Precio medio',
  premium: 'Premium',
  luxury: 'Lujo',
}

const GENDER_LABELS: Record<string, string> = {
  all: 'Todos',
  male: 'Masculino',
  female: 'Femenino',
}

function SectionCard({
  icon: Icon,
  title,
  accentClass,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  accentClass: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className={cn('flex items-center gap-2.5 px-4 py-3 border-b border-border', accentClass)}>
        <Icon className="size-4 shrink-0" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-brand/10 text-brand px-2.5 py-0.5 text-xs font-medium">
      {children}
    </span>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs font-medium text-foreground text-right">{value}</span>
    </div>
  )
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => toast.success(`${label} copiado`))
}

export function StrategyResult({
  strategy,
  productName,
  productDescription,
  productPrice,
  productCurrency,
  imageUrl,
  onReset,
}: StrategyResultProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const { productAnalysis, recommendedObjective, targetAudience, budgetRecommendation,
    schedule, visualStrategy, adCopy, metaAdsConfig } = strategy

  const testingAmt = Math.round(convertFromUSD(budgetRecommendation.testingUSD, productCurrency))
  const scalingAmt = Math.round(convertFromUSD(budgetRecommendation.scalingUSD, productCurrency))
  const maximumAmt = Math.round(convertFromUSD(budgetRecommendation.maximumUSD, productCurrency))

  function handleCreateCampaign() {
    startTransition(async () => {
      const result = await createCampaignFromStrategyAction({
        strategy,
        productName,
        productDescription,
        productPrice,
        productCurrency,
        imageUrl,
      })
      if (result.success && result.data) {
        toast.success('Campaña creada. Abriendo revisión...')
        router.push(`/campaigns/${result.data}/review`)
      } else if (!result.success) {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Estrategia generada</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Para: <span className="font-medium text-foreground">{productName}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
        >
          Nueva estrategia
        </button>
      </div>

      {/* 1. Análisis del producto */}
      <SectionCard icon={Target} title="1. Análisis del Producto" accentClass="bg-blue-500/5">
        <div className="space-y-0">
          <InfoRow label="Categoría detectada" value={productAnalysis.detectedCategory} />
          <InfoRow label="Industria" value={productAnalysis.industry} />
          <InfoRow label="Tipo de cliente" value={productAnalysis.clientType} />
          <InfoRow label="Nivel de precio" value={PRICE_LEVEL_LABELS[productAnalysis.priceLevel] ?? productAnalysis.priceLevel} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
          <span className="font-medium text-foreground">Posicionamiento: </span>
          {productAnalysis.positioning}
        </p>
      </SectionCard>

      {/* 2. Objetivo recomendado */}
      <SectionCard icon={Target} title="2. Objetivo de Campaña" accentClass="bg-green-500/5">
        <div className="flex items-center gap-2 mb-2">
          <span className="rounded-full bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1 text-xs font-semibold">
            ✓ {recommendedObjective.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{recommendedObjective.reason}</p>
      </SectionCard>

      {/* 3. Audiencia ideal */}
      <SectionCard icon={Users} title="3. Audiencia Ideal" accentClass="bg-purple-500/5">
        <div className="space-y-3">
          <InfoRow label="Edad" value={`${targetAudience.ageMin}–${targetAudience.ageMax} años`} />
          <InfoRow label="Género" value={GENDER_LABELS[targetAudience.gender] ?? targetAudience.gender} />
          <div>
            <p className="text-xs text-muted-foreground mb-2">Intereses</p>
            <div className="flex flex-wrap gap-1.5">
              {targetAudience.interests.map((i) => <Tag key={i}>{i}</Tag>)}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Comportamientos</p>
            <div className="flex flex-wrap gap-1.5">
              {targetAudience.behaviors.map((b) => (
                <span key={b} className="inline-flex items-center rounded-full bg-muted text-muted-foreground px-2.5 py-0.5 text-xs">
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* 4. Presupuesto */}
      <SectionCard icon={DollarSign} title="4. Presupuesto Recomendado" accentClass="bg-amber-500/5">
        <div className="grid grid-cols-3 gap-3 mb-3">
          {[
            { emoji: '💡', label: 'Prueba', amount: testingAmt },
            { emoji: '🚀', label: 'Escala', amount: scalingAmt },
            { emoji: '⚡', label: 'Máximo', amount: maximumAmt },
          ].map(({ emoji, label, amount }) => (
            <div key={label} className="rounded-lg border border-border bg-muted/40 p-3 text-center">
              <p className="text-lg mb-1">{emoji}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
              <p className="text-sm font-semibold text-foreground mt-0.5 leading-tight">
                {formatCurrency(amount, productCurrency)}
                <span className="text-[10px] font-normal text-muted-foreground">/día</span>
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{budgetRecommendation.explanation}</p>
      </SectionCard>

      {/* 5. Horarios */}
      <SectionCard icon={Clock} title="5. Mejores Horarios" accentClass="bg-cyan-500/5">
        <div className="space-y-0 mb-3">
          <InfoRow label="Días recomendados" value={schedule.bestDays.join(', ')} />
          <InfoRow label="Franja horaria" value={schedule.bestHours} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border/50">
          {schedule.explanation}
        </p>
      </SectionCard>

      {/* 6. Estrategia visual */}
      <SectionCard icon={Palette} title="6. Estrategia Visual" accentClass="bg-pink-500/5">
        <div className="space-y-0 mb-3">
          <InfoRow label="Tipo de creativo" value={visualStrategy.creativeType} />
          <InfoRow label="Estilo visual" value={visualStrategy.style} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border/50">
          {visualStrategy.description}
        </p>
      </SectionCard>

      {/* 7. Copy publicitario */}
      <SectionCard icon={PenTool} title="7. Copy Publicitario" accentClass="bg-orange-500/5">
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Headline</p>
              <button type="button" onClick={() => copyToClipboard(adCopy.headline, 'Headline')}
                className="text-muted-foreground hover:text-foreground transition-colors">
                <Copy className="size-3" />
              </button>
            </div>
            <p className="text-sm font-semibold text-foreground rounded-lg bg-muted/50 px-3 py-2">
              {adCopy.headline}
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Texto principal</p>
              <button type="button" onClick={() => copyToClipboard(adCopy.primaryText, 'Texto principal')}
                className="text-muted-foreground hover:text-foreground transition-colors">
                <Copy className="size-3" />
              </button>
            </div>
            <p className="text-xs text-foreground leading-relaxed rounded-lg bg-muted/50 px-3 py-2">
              {adCopy.primaryText}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium shrink-0">CTA:</p>
            <span className="rounded-full bg-brand/10 text-brand px-3 py-1 text-xs font-semibold">
              {adCopy.cta}
            </span>
          </div>
        </div>
      </SectionCard>

      {/* 8. Configuración Meta Ads */}
      <SectionCard icon={Settings} title="8. Configuración Meta Ads" accentClass="bg-slate-500/5">
        <div className="space-y-0 mb-3">
          <InfoRow label="Objetivo" value={metaAdsConfig.objective} />
          <InfoRow label="Optimización" value={metaAdsConfig.optimization} />
          <InfoRow label="Ubicaciones" value={metaAdsConfig.placements.join(' · ')} />
        </div>
        {metaAdsConfig.notes && (
          <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border/50">
            {metaAdsConfig.notes}
          </p>
        )}
      </SectionCard>

      {/* CTA — crear campaña */}
      <div className="rounded-xl border border-brand/20 bg-gradient-to-r from-brand/5 to-purple-500/5 p-4 space-y-3">
        <div>
          <p className="text-sm font-semibold text-foreground">¿Listo para crear tu campaña?</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            La estrategia completa se convertirá en una campaña lista para revisar. No se vuelve a llamar a la IA.
          </p>
        </div>
        <Button
          className="w-full gap-2 shadow-sm"
          onClick={handleCreateCampaign}
          loading={isPending}
          disabled={isPending}
        >
          {isPending ? (
            <><Loader2 className="size-4 animate-spin" /> Creando campaña...</>
          ) : (
            <><Megaphone className="size-4" /> Crear campaña con esta estrategia <ChevronRight className="size-3.5 ml-auto" /></>
          )}
        </Button>
        <p className="text-[10px] text-muted-foreground text-center">
          Se creará como borrador · Podrás revisar, editar y publicar después
        </p>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle, Package, DollarSign, MapPin, Target,
  Sparkles, RotateCcw, ExternalLink, Trophy, Rocket,
  AlertCircle, Loader2, Link2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCampaignBuilder } from '../context'
import { META_PLATFORMS } from '../constants'
import { formatCurrency } from '@/lib/currency'
import { COUNTRIES } from '@/constants/options'
import { createCampaignFromBuilderAction } from '../actions'

export function Step8Final() {
  const router = useRouter()
  const { state, dispatch } = useCampaignBuilder()
  const {
    sessionId, selectedCreativeId, generatedCreatives,
    productMode, selectedProduct, productName,
    dailyBudget, currency, totalBudget,
    country, city, platforms, aiStrategy,
    productDescription, productCategory, radius,
    brandKit,
  } = state

  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const selectedCreative = generatedCreatives.find(c => c.id === selectedCreativeId) ?? generatedCreatives[0]
  const countryLabel = COUNTRIES.find(c => c.value === country)?.label ?? country
  const daily = parseFloat(dailyBudget) || 0
  const total = parseFloat(totalBudget) || 0

  const usesSelectedProduct =
    productMode === 'existing' || productMode === 'ai' || productMode === 'image'

  const displayName = usesSelectedProduct && selectedProduct
    ? selectedProduct.name
    : productName || '—'

  const missingFields: string[] = []
  if (!productName && !selectedProduct) missingFields.push('producto')
  if (!aiStrategy) missingFields.push('estrategia IA')
  if (!generatedCreatives.length) missingFields.push('creativos')
  if (!selectedCreativeId && !generatedCreatives.length) missingFields.push('creativo seleccionado')
  const canCreate = missingFields.length === 0

  async function handleCreate() {
    if (!canCreate || isCreating) return
    setCreateError(null)
    setIsCreating(true)

    try {
      const result = await createCampaignFromBuilderAction({
        sessionId,
        productMode,
        selectedProduct,
        productName,
        productDescription,
        productCategory,
        dailyBudget,
        currency,
        totalBudget,
        country,
        city,
        radius,
        platforms,
        aiStrategy,
        generatedCreatives,
        selectedCreativeId,
        brandKit,
      })

      if (result.success && result.campaignId) {
        toast.success('¡Campaña creada exitosamente!', {
          description: 'Tu campaña IA está lista para revisar.',
          duration: 4000,
        })
        dispatch({ type: 'RESET' })
        router.push(`/campaigns/${result.campaignId}/review`)
      } else {
        setCreateError(result.error ?? 'Error desconocido')
        toast.error(result.error ?? 'No se pudo crear la campaña')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado'
      setCreateError(msg)
      toast.error(msg)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-brand/10 mx-auto">
          <Trophy className="size-8 text-brand" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">¡Campaña lista!</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Tu estrategia de campaña está completa. Crea tu campaña IA para revisarla y publicarla.
          </p>
        </div>
      </div>

      {/* Selected Creative */}
      {selectedCreative && (
        <div className="rounded-xl border border-brand/30 bg-card overflow-hidden ring-1 ring-brand/20">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-brand/5">
            <Sparkles className="size-4 text-brand" />
            <span className="text-xs font-semibold uppercase tracking-wider text-brand flex-1">
              Creativo seleccionado — {selectedCreative.variantLabel}
            </span>
            <CheckCircle className="size-4 text-brand" />
          </div>
          <div className="p-4 flex gap-4">
            <div className="size-20 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/40">
              {selectedCreative.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedCreative.imageUrl}
                  alt={selectedCreative.headline}
                  className="size-full object-cover"
                />
              ) : (
                <div className="size-full bg-gradient-to-br from-muted to-muted/60 animate-pulse" />
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <p className="text-sm font-bold text-foreground leading-tight">{selectedCreative.headline}</p>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{selectedCreative.primaryText}</p>
              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
                {selectedCreative.cta}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Summary */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Resumen de campaña
          </span>
        </div>
        <div className="divide-y divide-border/40">
          <div className="flex items-center gap-3 px-4 py-3">
            <Package className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Producto</p>
              <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
            </div>
          </div>
          {aiStrategy && (
            <div className="flex items-center gap-3 px-4 py-3">
              <Target className="size-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Objetivo</p>
                <p className="text-sm font-semibold text-foreground">{aiStrategy.objectiveLabel}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 px-4 py-3">
            <DollarSign className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Presupuesto</p>
              <p className="text-sm font-semibold text-foreground">
                {daily > 0 ? `${formatCurrency(daily, currency)}/día` : '—'}
                {total > 0 && (
                  <span className="text-xs font-normal text-muted-foreground ml-2">
                    (total: {formatCurrency(total, currency)})
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <MapPin className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ubicación</p>
              <p className="text-sm font-semibold text-foreground">
                {countryLabel}{city ? `, ${city}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 px-4 py-3">
            <Target className={cn('size-4 text-muted-foreground shrink-0 mt-0.5')} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Plataformas</p>
              <div className="flex flex-wrap gap-1">
                {platforms.map((id) => {
                  const p = META_PLATFORMS.find((m) => m.id === id)
                  return p ? (
                    <span key={id} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
                      {p.label}
                    </span>
                  ) : null
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meta Ads card */}
      <MetaAdsCard />

      {/* Error */}
      {createError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2.5">
          <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive leading-relaxed">{createError}</p>
        </div>
      )}

      {/* Missing fields warning */}
      {!canCreate && (
        <div className="rounded-xl border border-amber-300/30 bg-amber-50/30 dark:bg-amber-900/10 p-3 flex items-start gap-2.5">
          <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            Faltan datos: {missingFields.join(', ')}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          className="flex-1 gap-2"
          onClick={handleCreate}
          disabled={!canCreate || isCreating}
        >
          {isCreating ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creando campaña...
            </>
          ) : (
            <>
              <Rocket className="size-4" />
              Crear mi campaña IA
            </>
          )}
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => dispatch({ type: 'RESET' })}
          disabled={isCreating}
        >
          <RotateCcw className="size-4" />
          Empezar de nuevo
        </Button>
      </div>
    </div>
  )
}

function MetaAdsCard() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-muted/30">
        <div className="size-5 rounded bg-[#1877F2] flex items-center justify-center shrink-0">
          <span className="text-white text-[10px] font-bold leading-none">f</span>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex-1">
          Meta Ads
        </span>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <ExternalLink className="size-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium text-foreground">Publicación manual en Meta</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Descarga el creativo y usa los datos de campaña para configurarla en Meta Ads Manager.
              Pronto podrás publicar directamente desde AdGenius.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <a
            href="https://www.facebook.com/adsmanager"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
          >
            Abrir Meta Ads Manager
            <ExternalLink className="size-3" />
          </a>
          <span className="text-muted-foreground/30">·</span>
          <a
            href="/settings"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Link2 className="size-3" />
            Configurar conexión
          </a>
        </div>
      </div>
    </div>
  )
}

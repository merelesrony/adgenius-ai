'use client'

import * as React from 'react'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Megaphone, Package, DollarSign, Users, Sparkles,
  Target, MapPin, Calendar, Save, AlertCircle, Star,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { CampaignScore } from '../components/campaign-score'
import { saveCampaignAction } from '../actions'
import { useWizard } from '../context'
import { CAMPAIGN_OBJECTIVES, COUNTRIES } from '@/constants/options'
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency'

function SectionRow({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground mt-0.5">
        <Icon className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground mt-0.5 leading-snug">{value || '—'}</p>
      </div>
    </div>
  )
}

function AdPreview({ headline, body, description, cta, productName, images }: {
  headline: string; body: string; description: string; cta: string;
  productName: string; images: string[]
}) {
  const [imgError, setImgError] = React.useState(false)
  const imageUrl = images.length > 0 ? images[0] : null
  const showImage = !!imageUrl && !imgError

  // Reset error state when the image URL changes
  React.useEffect(() => { setImgError(false) }, [imageUrl])

  return (
    <div className="rounded-xl border border-border bg-white dark:bg-card overflow-hidden shadow-sm max-w-sm mx-auto">
      {/* Facebook-style ad header */}
      <div className="flex items-center gap-2 p-3 border-b border-border/50">
        <div className="size-8 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold">
          {productName.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground leading-tight">{productName}</p>
          <p className="text-[10px] text-muted-foreground">Publicidad · 🌐</p>
        </div>
      </div>

      {/* Ad body copy */}
      <div className="px-3 py-2">
        <p className="text-xs text-foreground leading-relaxed">{body || 'Tu copy aparecerá aquí...'}</p>
      </div>

      {/* Image */}
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt="Imagen del anuncio"
          className="w-full aspect-video object-cover"
          onError={() => setImgError(true)}
          loading="eager"
          crossOrigin="anonymous"
        />
      ) : imageUrl && imgError ? (
        <div className="w-full aspect-video bg-muted/60 flex flex-col items-center justify-center gap-1 px-3">
          <Package className="size-8 text-muted-foreground/40" />
          <p className="text-[10px] text-muted-foreground text-center">
            No se pudo cargar la imagen
          </p>
        </div>
      ) : (
        <div className="w-full aspect-video bg-gradient-to-br from-brand/10 to-brand/20 flex items-center justify-center">
          <Package className="size-10 text-brand/30" />
        </div>
      )}

      {/* Headline & CTA */}
      <div className="p-3 bg-muted/30 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold text-foreground leading-tight truncate">
            {headline || 'TÍTULO DEL ANUNCIO'}
          </p>
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
            {description || 'Descripción corta aquí...'}
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-md bg-foreground/10 hover:bg-foreground/20 px-3 py-1.5 text-[11px] font-semibold text-foreground transition-colors"
        >
          {cta || 'Más información'}
        </button>
      </div>
    </div>
  )
}

export function StepPreview() {
  const { data, back } = useWizard()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)

  const countryLabel = COUNTRIES.find((c) => c.value === data.country)?.label ?? data.country
  const objectiveLabel = CAMPAIGN_OBJECTIVES.find((o) => o.value === data.objective)?.label ?? data.objective

  const audienceSummary = data.audienceMode === 'ai' && data.aiAudienceResult
    ? `IA — ${data.aiAudienceResult.ageMin}-${data.aiAudienceResult.ageMax} años, ${
        data.aiAudienceResult.gender === 'all' ? 'todos' :
        data.aiAudienceResult.gender === 'male' ? 'hombres' : 'mujeres'
      }, ${data.aiAudienceResult.interests.slice(0, 2).join(', ')}`
    : `Manual — ${data.targetAgeMin}-${data.targetAgeMax} años, ${
        data.targetGender === 'all' ? 'todos' :
        data.targetGender === 'male' ? 'hombres' : 'mujeres'
      }${data.targetInterests.length > 0 ? `, ${data.targetInterests.slice(0, 2).join(', ')}` : ''}`

  async function handleSave() {
    setSaveError(null)
    startTransition(async () => {
      const result = await saveCampaignAction({
        name: data.name,
        objective: data.objective,
        country: data.country,
        city: data.city || null,
        radiusKm: data.radiusKm,
        productId: data.existingProductId,
        productName: data.productName,
        productPrice: data.productPrice,
        productCurrency: data.productCurrency,
        productCategory: data.productCategory,
        productDescription: data.productDescription,
        productImages: data.productImages,
        dailyBudget: data.dailyBudget,
        startDate: data.startDate,
        endDate: data.endDate,
        audienceMode: data.audienceMode,
        targetAgeMin: data.targetAgeMin,
        targetAgeMax: data.targetAgeMax,
        targetGender: data.targetGender,
        targetInterests: data.targetInterests,
        targetLanguages: data.audienceMode === 'ai' && data.aiAudienceResult
          ? data.aiAudienceResult.languages
          : data.targetLanguages,
        aiHeadline: data.aiHeadline,
        aiBodyCopy: data.aiBodyCopy,
        aiDescription: data.aiDescription,
        aiCTA: data.aiCTA,
        aiAudienceResult: data.aiAudienceResult,
        campaignScore: data.campaignScore,
        aiGenerated: data.aiGenerated,
      })

      if (result.success) {
        toast.success('¡Campaña guardada con éxito!')
        router.push(`/campaigns/${result.data}`)
      } else {
        setSaveError(result.error)
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Ad Preview */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Vista previa del anuncio</h3>
        <AdPreview
          headline={data.aiHeadline}
          body={data.aiBodyCopy}
          description={data.aiDescription}
          cta={data.aiCTA}
          productName={data.productName}
          images={data.productImages}
        />
      </div>

      {/* Campaign Score */}
      {data.campaignScore && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Star className="size-4 text-brand" />
            <h3 className="text-sm font-semibold text-foreground">Puntuación</h3>
          </div>
          <CampaignScore score={data.campaignScore} />
        </div>
      )}

      {/* Summary */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <p className="text-sm font-semibold text-foreground">Resumen de la campaña</p>
        </div>
        <div className="px-4">
          <SectionRow label="Nombre" value={data.name} icon={Megaphone} />
          <SectionRow label="Objetivo" value={objectiveLabel} icon={Target} />
          <SectionRow label="Producto" value={data.productName} icon={Package} />
          <SectionRow
            label="Ubicación"
            value={`${countryLabel}${data.city ? ` · ${data.city}` : ''} (${data.radiusKm} km)`}
            icon={MapPin}
          />
          <SectionRow
            label="Presupuesto/día"
            value={data.dailyBudget
              ? formatCurrency(data.dailyBudget, data.productCurrency || DEFAULT_CURRENCY) + '/día'
              : '—'}
            icon={DollarSign}
          />
          <SectionRow
            label="Fechas"
            value={`${data.startDate}${data.endDate ? ` → ${data.endDate}` : ' (sin fecha fin)'}`}
            icon={Calendar}
          />
          <SectionRow label="Audiencia" value={audienceSummary} icon={Users} />
          <SectionRow
            label="Copy IA"
            value={data.aiGenerated ? '✓ Generado' : '✗ Sin generar'}
            icon={Sparkles}
          />
        </div>
      </div>

      {saveError && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-3">
          <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{saveError}</p>
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={back}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
        >
          ← Anterior
        </button>
        <Button
          onClick={handleSave}
          loading={isPending}
          size="lg"
          className={cn(
            'shadow-md',
            data.aiGenerated && 'shadow-brand/20',
          )}
        >
          <Save className="size-4" />
          Guardar campaña
        </Button>
      </div>
    </div>
  )
}

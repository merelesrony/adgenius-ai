'use client'

import { useState, useEffect, useRef } from 'react'
import { Palette, Sparkles, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCampaignBuilder } from '../../context'
import { buildAdImageUrl, randomSeed } from '../creative-engine'
import { CreativeVariants } from './creative-variants'
import { BrandKitCard } from './brand-kit-card'
import { AdPreview } from './ad-preview'
import type { GeneratedCreative, AdCreativeResult } from '../creative-types'

const GEN_STEPS = [
  'Analizando producto y audiencia...',
  'Generando concepto creativo A...',
  'Generando concepto creativo B...',
  'Generando concepto creativo C...',
  'Definiendo identidad de marca...',
] as const

type Phase = 'generating' | 'done' | 'error'

export function CreativeGenerator() {
  const { state, dispatch } = useCampaignBuilder()
  const { aiStrategy, selectedProduct, productName, productDescription, dailyBudget, currency, platforms, generatedCreatives, brandKit } = state

  const hasCached = generatedCreatives.length > 0
  const [phase, setPhase] = useState<Phase>(hasCached ? 'done' : 'generating')
  const [genStep, setGenStep] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [previewCreative, setPreviewCreative] = useState<GeneratedCreative | null>(
    hasCached ? (generatedCreatives.find(c => c.id === state.selectedCreativeId) ?? generatedCreatives[0]) : null,
  )
  const [showPreview, setShowPreview] = useState(false)
  const hasStarted = useRef(hasCached) // skip generation if cache exists
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  function clearTimers() {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  async function generate() {
    setPhase('generating')
    setGenStep(0)
    setErrorMsg(null)

    timersRef.current = GEN_STEPS.slice(1).map((_, i) =>
      setTimeout(() => setGenStep(i + 1), (i + 1) * 1200),
    )

    try {
      const productFinal = (state.productMode === 'existing' || state.productMode === 'ai') && selectedProduct
        ? selectedProduct
        : null

      const res = await fetch('/api/ai/generate-ad-creative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productFinal?.name ?? productName,
          productDescription: productFinal?.description ?? productDescription,
          productCategory: productFinal?.category ?? null,
          productPrice: productFinal?.price ?? null,
          productCurrency: productFinal?.currency ?? currency,
          ageMin: aiStrategy?.audience.ageMin ?? 18,
          ageMax: aiStrategy?.audience.ageMax ?? 65,
          gender: aiStrategy?.audience.gender ?? 'all',
          interests: aiStrategy?.audience.interests ?? [],
          objective: aiStrategy?.objective ?? 'sales',
          objectiveLabel: aiStrategy?.objectiveLabel ?? 'Ventas',
          recommendedCTA: aiStrategy?.recommendedCTA ?? 'Comprar ahora',
          dailyBudget: parseFloat(dailyBudget) || 10,
          budgetCurrency: currency,
          creativeStyle: aiStrategy?.creativeDirection.style ?? 'Profesional',
          creativeConcept: aiStrategy?.creativeDirection.concept ?? 'Producto como protagonista',
          platforms,
        }),
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw: any = await res.json()
      if (!res.ok) throw new Error((raw as { error?: string }).error ?? 'Error generando creativos')
      const data: AdCreativeResult = raw as AdCreativeResult

      // Build Pollinations URLs client-side
      const creatives: GeneratedCreative[] = data.creatives.map((c) => ({
        id: c.variant,
        variant: c.variant,
        variantLabel: c.variantLabel,
        imageUrl: buildAdImageUrl(c.imagePrompt, randomSeed()),
        imagePrompt: c.imagePrompt,
        headline: c.headline,
        primaryText: c.primaryText,
        description: c.description,
        cta: c.cta,
        style: c.style,
        concept: c.concept,
        format: 'square',
        createdAt: new Date().toISOString(),
      }))

      clearTimers()
      setGenStep(GEN_STEPS.length - 1)
      dispatch({ type: 'SET_GENERATED_CREATIVES', payload: creatives })
      dispatch({ type: 'SET_BRAND_KIT', payload: data.brandKit })
      timersRef.current = [setTimeout(() => {
        setPreviewCreative(creatives[0])
        setPhase('done')
      }, 600)]
    } catch (err) {
      clearTimers()
      setErrorMsg(err instanceof Error ? err.message : 'Error generando creativos')
      setPhase('error')
    }
  }

  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true
    generate()
    return () => clearTimers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleRegenerate(id: string) {
    const creative = generatedCreatives.find(c => c.id === id)
    if (!creative) return
    const newUrl = buildAdImageUrl(creative.imagePrompt, randomSeed())
    dispatch({ type: 'REGENERATE_CREATIVE_IMAGE', payload: { id, imageUrl: newUrl } })
    if (previewCreative?.id === id) {
      setPreviewCreative({ ...previewCreative, imageUrl: newUrl })
    }
  }

  function handleEdit(id: string, patch: Partial<Pick<GeneratedCreative, 'headline' | 'primaryText' | 'description' | 'cta'>>) {
    dispatch({ type: 'EDIT_CREATIVE', payload: { id, ...patch } })
    if (previewCreative?.id === id) {
      setPreviewCreative({ ...previewCreative, ...patch })
    }
  }

  function handleSelect(id: string) {
    dispatch({ type: 'SET_SELECTED_CREATIVE', payload: id })
    const c = generatedCreatives.find(cr => cr.id === id)
    if (c) setPreviewCreative(c)
    dispatch({ type: 'NEXT_STEP' })
  }

  // ── Rendering ──────────────────────────────────────────────────────────────

  if (phase === 'generating') {
    const pct = Math.round(((genStep + 1) / GEN_STEPS.length) * 100)
    return (
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-brand/10 mx-auto">
            <Palette className="size-8 text-brand animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Creative Engine</h2>
            <p className="text-sm text-muted-foreground mt-1">Creando 3 variantes de anuncios profesionales...</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          {GEN_STEPS.map((label, i) => {
            const done = genStep > i
            const current = genStep === i
            return (
              <div key={label} className={cn('flex items-center gap-2.5 text-sm', i > genStep && 'opacity-30')}>
                <div className="size-2 rounded-full shrink-0">
                  {done ? (
                    <div className="size-2 rounded-full bg-success" />
                  ) : current ? (
                    <div className="size-2 rounded-full bg-brand animate-pulse" />
                  ) : (
                    <div className="size-2 rounded-full bg-border" />
                  )}
                </div>
                <span className={cn(done && 'text-foreground', current && 'text-brand font-medium', i > genStep && 'text-muted-foreground')}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progreso</span>
            <span className="font-semibold text-foreground">{pct}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-brand to-purple-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-destructive/10 mx-auto">
            <AlertCircle className="size-7 text-destructive" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Error generando creativos</h2>
            <p className="text-sm text-muted-foreground mt-1">{errorMsg}</p>
          </div>
        </div>
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => { hasStarted.current = false; generate() }} className="gap-2">
            <RefreshCw className="size-4" /> Intentar de nuevo
          </Button>
        </div>
      </div>
    )
  }

  // Phase "done"
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-success/10 mx-auto mb-2">
          <Sparkles className="size-6 text-success" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Tu anuncio está listo</h2>
        <p className="text-sm text-muted-foreground">Elige la variante que más te guste y personalízala</p>
      </div>

      {/* 3 Variant cards */}
      <CreativeVariants
        creatives={generatedCreatives}
        selectedId={state.selectedCreativeId}
        onSelect={handleSelect}
        onEdit={handleEdit}
        onRegenerate={handleRegenerate}
        onPreview={(c) => { setPreviewCreative(c); setShowPreview(true) }}
      />

      {/* Brand Kit */}
      {brandKit && <BrandKitCard brandKit={brandKit} />}

      {/* Ad Preview toggle */}
      {previewCreative && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <button
            type="button"
            onClick={() => setShowPreview(v => !v)}
            className="w-full flex items-center gap-2.5 px-4 py-3 border-b border-border bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            {showPreview ? <EyeOff className="size-4 text-muted-foreground" /> : <Eye className="size-4 text-muted-foreground" />}
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex-1 text-left">
              Vista previa — {previewCreative.variantLabel}
            </span>
          </button>
          {showPreview && (
            <div className="p-4">
              <AdPreview creative={previewCreative} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

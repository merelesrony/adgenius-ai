'use client'

import { useState, useEffect, useRef } from 'react'
import { Palette, Sparkles, AlertCircle, RefreshCw, Eye, EyeOff, XCircle, X, CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCampaignBuilder } from '../../context'
import { aiAbortRegistry } from '../../ai-abort-registry'
// Image generation is handled server-side via /api/ai/generate-image
import { CreativeVariants } from './creative-variants'
import { BrandKitCard } from './brand-kit-card'
import { AdPreview } from './ad-preview'
import type { GeneratedCreative, AdCreativeResult } from '../creative-types'
import type { ProductImageMode } from '../../types'

const GEN_STEPS = [
  'Analizando producto y audiencia...',
  'Generando concepto creativo A...',
  'Generando concepto creativo B...',
  'Generando concepto creativo C...',
  'Definiendo identidad de marca...',
] as const

function shouldGenerateAiImages(productImageMode: ProductImageMode | null): boolean {
  return productImageMode !== 'original_only'
}

type Phase = 'generating' | 'done' | 'error' | 'cancelled'

export function CreativeGenerator() {
  const { state, dispatch } = useCampaignBuilder()
  const {
    aiStrategy, selectedProduct, productName, productDescription,
    dailyBudget, currency, platforms, generatedCreatives, brandKit,
    productImageMode,
  } = state

  const hasCached = generatedCreatives.length > 0
  const [phase, setPhase] = useState<Phase>(hasCached ? 'done' : 'generating')
  const [genStep, setGenStep] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [previewCreative, setPreviewCreative] = useState<GeneratedCreative | null>(
    hasCached ? (generatedCreatives.find(c => c.id === state.selectedCreativeId) ?? generatedCreatives[0]) : null,
  )
  const [showPreview, setShowPreview] = useState(false)
  const [activeFormat, setActiveFormat] = useState<'1:1' | '9:16' | '4:5' | '1.91:1'>('1:1')
  const hasStarted = useRef(hasCached) // skip generation if cache exists
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const abortRef = useRef<AbortController | null>(null)

  function clearTimers() {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  function handleCancel() {
    clearTimers()
    abortRef.current?.abort()
    setPhase('cancelled')
  }

  async function generate() {
    setPhase('generating')
    setGenStep(0)
    setErrorMsg(null)

    abortRef.current?.abort()
    if (abortRef.current) aiAbortRegistry.unregister(abortRef.current)
    const controller = new AbortController()
    abortRef.current = controller
    aiAbortRegistry.register(controller)

    timersRef.current = GEN_STEPS.slice(1).map((_, i) =>
      setTimeout(() => setGenStep(i + 1), (i + 1) * 1200),
    )

    try {
      const productFinal =
        (state.productMode === 'existing' || state.productMode === 'ai' || state.productMode === 'image') && selectedProduct
          ? selectedProduct
          : null

      const originalImageUrl = productFinal?.image ?? null
      const isOriginalOnly = productImageMode === 'original_only'
      const isAiVariants = productImageMode === 'image_ai_variants' && !!originalImageUrl
      const generateImages = shouldGenerateAiImages(productImageMode)

      // ── Shared copy-generation payload ────────────────────────────────────────
      const copyPayload = {
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
        // Pass seller's original text so AI treats it as authoritative
        userProductDescription: productFinal?.userProvidedDescription ?? null,
      }

      // ── BRANCH A: original_only ────────────────────────────────────────────────
      // Use the uploaded image as-is; generate copy but skip all image API calls
      if (isOriginalOnly) {
        const res = await fetch('/api/ai/generate-ad-creative', {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(copyPayload),
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw: any = await res.json()
        if (!res.ok) throw new Error((raw as { error?: string }).error ?? 'Error generando copy')
        const data = raw as AdCreativeResult

        const firstCopy = data.creatives[0]
        const singleCreative: GeneratedCreative = {
          id: 'original',
          variant: 'original',
          variantLabel: 'Tu imagen original',
          imageUrl: originalImageUrl ?? '',
          imagePrompt: '',
          headline: firstCopy.headline,
          primaryText: firstCopy.primaryText,
          description: firstCopy.description,
          cta: firstCopy.cta,
          style: firstCopy.style,
          concept: firstCopy.concept,
          format: 'square',
          createdAt: new Date().toISOString(),
          imageSource: 'original',
        }

        clearTimers()
        setGenStep(GEN_STEPS.length - 1)
        dispatch({ type: 'SET_GENERATED_CREATIVES', payload: [singleCreative] })
        dispatch({ type: 'SET_BRAND_KIT', payload: data.brandKit })
        dispatch({ type: 'SET_SELECTED_CREATIVE', payload: 'original' })
        timersRef.current = [setTimeout(() => {
          setPreviewCreative(singleCreative)
          setPhase('done')
        }, 600)]
        return
      }

      // ── BRANCH B: image_ai_variants ────────────────────────────────────────────
      // Keep original image as card 0; generate 3 AI variants with images
      if (isAiVariants) {
        const originalCreative: GeneratedCreative = {
          id: 'original',
          variant: 'original',
          variantLabel: 'Tu imagen original',
          imageUrl: originalImageUrl!,
          imagePrompt: '',
          headline: aiStrategy?.headline ?? productFinal?.name ?? productName,
          primaryText: aiStrategy?.primaryText ?? productFinal?.description ?? productDescription ?? '',
          description: aiStrategy?.description ?? '',
          cta: aiStrategy?.recommendedCTA ?? 'Comprar ahora',
          style: 'Original',
          concept: 'Fotografía real del producto',
          format: 'square',
          createdAt: new Date().toISOString(),
          imageSource: 'original',
        }

        const res = await fetch('/api/ai/generate-ad-creative', {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(copyPayload),
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw: any = await res.json()
        if (!res.ok) throw new Error((raw as { error?: string }).error ?? 'Error generando creativos')
        const data = raw as AdCreativeResult

        const aiCreatives: GeneratedCreative[] = data.creatives.map((c) => ({
          id: c.variant,
          variant: c.variant,
          variantLabel: c.variantLabel,
          imageUrl: '',
          imagePrompt: c.imagePrompt,
          headline: c.headline,
          primaryText: c.primaryText,
          description: c.description,
          cta: c.cta,
          style: c.style,
          concept: c.concept,
          format: 'square',
          createdAt: new Date().toISOString(),
          imageSource: 'ai' as const,
        }))

        const allCreatives = [originalCreative, ...aiCreatives]

        clearTimers()
        setGenStep(GEN_STEPS.length - 1)
        dispatch({ type: 'SET_GENERATED_CREATIVES', payload: allCreatives })
        dispatch({ type: 'SET_BRAND_KIT', payload: data.brandKit })
        timersRef.current = [setTimeout(() => {
          setPreviewCreative(allCreatives[0])
          setPhase('done')
        }, 600)]

        // Generate images for AI variants only (not for original)
        void Promise.all(
          data.creatives.map(async (c) => {
            try {
              const imgRes = await fetch('/api/ai/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: c.imagePrompt }),
              })
              const imgData = await imgRes.json() as { imageUrl?: string }
              if (imgData.imageUrl) {
                dispatch({ type: 'REGENERATE_CREATIVE_IMAGE', payload: { id: c.variant, imageUrl: imgData.imageUrl } })
              }
            } catch (err) {
              console.error('[generate-image] variant', c.variant, err)
            }
          }),
        )
        return
      }

      // ── BRANCH C: default (no image uploaded) ─────────────────────────────────
      // Standard 3 AI variants with image generation
      const res = await fetch('/api/ai/generate-ad-creative', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(copyPayload),
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw: any = await res.json()
      if (!res.ok) throw new Error((raw as { error?: string }).error ?? 'Error generando creativos')
      const data: AdCreativeResult = raw as AdCreativeResult

      const creatives: GeneratedCreative[] = data.creatives.map((c) => ({
        id: c.variant,
        variant: c.variant,
        variantLabel: c.variantLabel,
        imageUrl: '',
        imagePrompt: c.imagePrompt,
        headline: c.headline,
        primaryText: c.primaryText,
        description: c.description,
        cta: c.cta,
        style: c.style,
        concept: c.concept,
        format: 'square',
        createdAt: new Date().toISOString(),
        imageSource: 'ai' as const,
      }))

      clearTimers()
      setGenStep(GEN_STEPS.length - 1)
      dispatch({ type: 'SET_GENERATED_CREATIVES', payload: creatives })
      dispatch({ type: 'SET_BRAND_KIT', payload: data.brandKit })
      timersRef.current = [setTimeout(() => {
        setPreviewCreative(creatives[0])
        setPhase('done')
      }, 600)]

      if (generateImages) {
        void Promise.all(
          data.creatives.map(async (c) => {
            try {
              const imgRes = await fetch('/api/ai/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: c.imagePrompt }),
              })
              const imgData = await imgRes.json() as { imageUrl?: string }
              if (imgData.imageUrl) {
                dispatch({ type: 'REGENERATE_CREATIVE_IMAGE', payload: { id: c.variant, imageUrl: imgData.imageUrl } })
              }
            } catch (err) {
              console.error('[generate-image] variant', c.variant, err)
            }
          }),
        )
      }
    } catch (err) {
      clearTimers()
      if (err instanceof Error && err.name === 'AbortError') {
        setPhase('cancelled')
        return
      }
      setErrorMsg(err instanceof Error ? err.message : 'Error generando creativos')
      setPhase('error')
    }
  }

  // Unregister controller on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) aiAbortRegistry.unregister(abortRef.current)
    }
  }, [])

  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true
    generate()
    return () => clearTimers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleRegenerate(id: string): Promise<void> {
    const creative = generatedCreatives.find(c => c.id === id)
    if (!creative) return
    // Never regenerate the original uploaded image
    if (creative.imageSource === 'original') return
    // Clear to trigger loading state in the card
    dispatch({ type: 'REGENERATE_CREATIVE_IMAGE', payload: { id, imageUrl: '' } })
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: creative.imagePrompt }),
      })
      const data = await res.json() as { imageUrl?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Error generando imagen')
      if (data.imageUrl) {
        dispatch({ type: 'REGENERATE_CREATIVE_IMAGE', payload: { id, imageUrl: data.imageUrl } })
        if (previewCreative?.id === id) {
          setPreviewCreative(prev => prev ? { ...prev, imageUrl: data.imageUrl! } : prev)
        }
      }
    } catch (err) {
      console.error('[regenerate-image]', err)
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
    // Selection is confirmed — user advances via the "Continuar" nav button
  }

  // ── Rendering ──────────────────────────────────────────────────────────────

  if (phase === 'cancelled') {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl mx-auto bg-muted/60">
            <XCircle className="size-8 text-muted-foreground/60" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Generación cancelada</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Puedes generar nuevamente o volver a la revisión de estrategia.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3">
          <Button
            className="gap-2 px-8"
            onClick={() => { hasStarted.current = false; generate() }}
          >
            <RefreshCw className="size-4" />
            Generar creativos nuevamente
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch({ type: 'GO_TO_STEP', payload: 6 as import('../../types').BuilderStep })}
            className="text-muted-foreground gap-1.5"
          >
            Volver a la revisión
          </Button>
        </div>
      </div>
    )
  }

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
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center gap-1.5 mx-auto text-xs text-muted-foreground hover:text-foreground transition-colors py-1 px-3 rounded-full hover:bg-muted/60"
          >
            <X className="size-3" />
            Cancelar
          </button>
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
  const doneTitle = productImageMode === 'original_only'
    ? 'Tu imagen está lista'
    : productImageMode === 'image_ai_variants'
    ? '4 creativos generados'
    : 'Tu anuncio está listo'

  const doneSubtitle = productImageMode === 'original_only'
    ? 'Revisa el copy generado para tu imagen original'
    : productImageMode === 'image_ai_variants'
    ? 'Tu imagen original + 3 variantes IA — elige la que más te guste'
    : 'Elige la variante que más te guste y personalízala'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-success/10 mx-auto mb-2">
          <Sparkles className="size-6 text-success" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">{doneTitle}</h2>
        <p className="text-sm text-muted-foreground">{doneSubtitle}</p>
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
            <div className="p-4 space-y-4">
              {/* Format selector */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[10px] text-muted-foreground shrink-0 font-medium">Formato:</span>
                {(
                  [
                    { id: '1:1', label: 'Instagram Feed', icon: '□' },
                    { id: '9:16', label: 'Story / WhatsApp', icon: '▯' },
                    { id: '4:5', label: 'Facebook Feed', icon: '▭' },
                    { id: '1.91:1', label: 'Landscape', icon: '▬' },
                  ] as const
                ).map(({ id, label, icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveFormat(id)}
                    className={cn(
                      'flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full border shrink-0 transition-all',
                      activeFormat === id
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-border bg-muted/30 text-muted-foreground hover:border-brand/40',
                    )}
                  >
                    <span className="text-[8px]">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
              {/* Preview with aspect ratio constraint */}
              <div
                className="w-full mx-auto overflow-hidden rounded-xl"
                style={{
                  maxWidth: activeFormat === '9:16' ? '280px' : activeFormat === '1.91:1' ? '100%' : '360px',
                  aspectRatio: activeFormat,
                }}
              >
                <div className="w-full h-full overflow-hidden">
                  <AdPreview creative={previewCreative} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Continue bar ─────────────────────────────────────────────────────── */}
      {/* Spacer so fixed bar doesn't cover content on mobile */}
      <div className="h-20 sm:hidden" aria-hidden="true" />

      {/* Fixed on mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.75rem)' }}>
        {state.selectedCreativeId ? (
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <CheckCircle className="size-4 text-success shrink-0" />
              <span className="text-sm font-semibold text-foreground truncate">Creativo seleccionado</span>
            </div>
            <Button onClick={() => dispatch({ type: 'NEXT_STEP' })} className="gap-2 shrink-0">
              Continuar
              <ArrowRight className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="size-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
              <span className="text-sm text-muted-foreground truncate">Selecciona un creativo para continuar</span>
            </div>
            <Button disabled className="gap-2 shrink-0">
              Continuar
              <ArrowRight className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Inline on desktop */}
      <div className="hidden sm:block rounded-2xl border border-border bg-card p-4">
        {state.selectedCreativeId ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <CheckCircle className="size-5 text-success shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">Creativo seleccionado</p>
                <p className="text-xs text-muted-foreground">Listo para continuar</p>
              </div>
            </div>
            <Button onClick={() => dispatch({ type: 'NEXT_STEP' })} className="gap-2">
              Continuar al paso siguiente
              <ArrowRight className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="size-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
              <p className="text-sm text-muted-foreground">Selecciona un creativo arriba para continuar</p>
            </div>
            <Button disabled className="gap-2">
              Continuar
              <ArrowRight className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Sparkles, Check, RefreshCw, AlertCircle, Download,
  Megaphone, ChevronDown, Package, Zap, TrendingUp,
  Loader2, Clock, RotateCcw, Star, Target, Heart,
  BarChart2, CheckCircle2, XCircle, Wand2, Ban, X,
  Fingerprint, SlidersHorizontal, ScanSearch,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import {
  CREATIVE_PRESETS, CREATIVE_MODELS, FORMAT_DIMENSIONS, CATEGORY_TO_PRESET,
} from '@/constants/options'
import type { CreativePreset, CreativeModel, CreativeFormat } from '@/constants/options'
import { assignCreativeToCampaignAction, saveProductVisualDNAAction } from '../actions'
import type { Database } from '@/types/database'
import type { VariantType, CreativeBrief, CreativeScore } from '@/types/creative'
import { VARIANT_CONFIG, OBJECTIVE_OPTIONS } from '@/types/creative'
import type { VisualProductDNA } from '@/types/visual-dna'

type ProductRow = Database['public']['Tables']['products']['Row']
type CampaignBasic = { id: string; name: string; status: string }

interface CreativeStudioTabProps {
  products: ProductRow[]
  campaigns: CampaignBasic[]
  userId: string
}

const FORMAT_OPTIONS: { value: CreativeFormat; label: string; icon: string }[] = [
  { value: 'square',    label: 'Cuadrado',   icon: '▪' },
  { value: 'landscape', label: 'Horizontal', icon: '▬' },
  { value: 'portrait',  label: 'Vertical',   icon: '▮' },
  { value: 'story',     label: 'Historia',   icon: '▯' },
]

type VariantStatus = 'idle' | 'queued' | 'generating' | 'completed' | 'error' | 'cancelled'

interface StudioVariant {
  type: VariantType
  status: VariantStatus
  imageUrl?: string
  creativeId?: string | null
  prompt?: string
  brief?: CreativeBrief
  score?: CreativeScore
  error?: string
}

interface GenerateResponse {
  imageUrl?: string
  creativeId?: string | null
  prompt?: string
  brief?: CreativeBrief
  score?: CreativeScore
  variantType?: VariantType
  platformFormat?: string
  provider?: string
  error?: string
}

const INITIAL_VARIANTS: StudioVariant[] = [
  { type: 'conversion', status: 'idle' },
  { type: 'emotional',  status: 'idle' },
  { type: 'premium',    status: 'idle' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(s: number): string {
  return s >= 80 ? 'text-green-500' : s >= 60 ? 'text-amber-500' : 'text-red-400'
}

function scoreBg(s: number): string {
  return s >= 80 ? 'bg-green-500' : s >= 60 ? 'bg-amber-500' : 'bg-red-400'
}

function ScoreMiniBar({ value }: { value: number }) {
  return (
    <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
      <div className={cn('h-full rounded-full', scoreBg(value))} style={{ width: `${value}%` }} />
    </div>
  )
}

// ── Campaign Picker Modal ─────────────────────────────────────────────────────

function CampaignPickerModal({
  open, campaigns, onClose, onPick, isLoading,
}: {
  open: boolean
  campaigns: CampaignBasic[]
  onClose: () => void
  onPick: (campaignId: string) => void
  isLoading: boolean
}) {
  const active = campaigns.filter((c) => ['draft', 'pending', 'active', 'paused'].includes(c.status))
  return (
    <Modal open={open} onClose={onClose} title="Usar en campaña" description="Selecciona la campaña donde quieres usar este creativo." size="md">
      {active.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No tienes campañas activas. Crea una primero.</p>
      ) : (
        <div className="space-y-1.5">
          {active.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onPick(c.id)}
              disabled={isLoading}
              className="w-full flex items-center justify-between rounded-lg border border-border bg-card hover:bg-muted/50 hover:border-brand/30 px-4 py-3 text-left transition-all disabled:opacity-50"
            >
              <span className="text-sm font-medium text-foreground">{c.name}</span>
              <span className={cn(
                'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                c.status === 'active' ? 'bg-success/10 text-success' :
                c.status === 'pending' ? 'bg-warning/10 text-warning' :
                'bg-muted text-muted-foreground',
              )}>
                {c.status}
              </span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  )
}

// ── Variant Card ──────────────────────────────────────────────────────────────

function VariantCard({
  variant,
  onAssign,
  onRegenerate,
  onImprove,
  isAnyGenerating,
}: {
  variant: StudioVariant
  onAssign: () => void
  onRegenerate: () => void
  onImprove: (hint: string) => void
  isAnyGenerating: boolean
}) {
  const cfg = VARIANT_CONFIG[variant.type]
  const [showImproveInput, setShowImproveInput] = useState(false)
  const [hint, setHint] = useState('')

  const iconMap: Record<VariantType, React.ReactNode> = {
    conversion: <Target className="size-3.5" />,
    emotional:  <Heart className="size-3.5" />,
    premium:    <Star className="size-3.5" />,
  }

  const colorMap: Record<VariantType, string> = {
    conversion: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    emotional:  'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    premium:    'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
      {/* Card header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-muted/20">
        <span className={cn('flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold', colorMap[variant.type])}>
          {iconMap[variant.type]}
          {cfg.label}
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground">{cfg.description}</span>
      </div>

      {/* Image area */}
      <div className="relative aspect-square bg-muted/30 overflow-hidden">
        {variant.status === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center p-4">
            <div className="size-10 rounded-xl bg-muted/60 flex items-center justify-center">
              <span className="text-xl">{cfg.emoji}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{cfg.focusSummary}</p>
          </div>
        )}

        {variant.status === 'queued' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Clock className="size-6 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">En cola...</p>
          </div>
        )}

        {variant.status === 'generating' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-brand/5 to-purple-500/5">
            <div className="relative">
              <div className="size-12 rounded-2xl bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center shadow">
                <Sparkles className="size-6 text-white animate-pulse" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-brand animate-ping" />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-foreground">✨ Generando...</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">20–60 segundos</p>
            </div>
          </div>
        )}

        {variant.status === 'cancelled' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            <Ban className="size-7 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground text-center font-medium">Generación cancelada</p>
            <button
              type="button"
              onClick={onRegenerate}
              disabled={isAnyGenerating}
              className="text-[11px] text-brand hover:underline disabled:opacity-50 flex items-center gap-1"
            >
              <RotateCcw className="size-3" />Generar nuevamente
            </button>
          </div>
        )}

        {variant.status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            <XCircle className="size-8 text-destructive/50" />
            <p className="text-xs text-destructive text-center line-clamp-3">{variant.error ?? 'Error al generar'}</p>
            <button
              type="button"
              onClick={onRegenerate}
              disabled={isAnyGenerating}
              className="text-[11px] text-brand hover:underline disabled:opacity-50 flex items-center gap-1"
            >
              <RotateCcw className="size-3" />Reintentar
            </button>
          </div>
        )}

        {variant.status === 'completed' && variant.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={variant.imageUrl}
            alt={`Variante ${cfg.label}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
      </div>

      {/* Score section */}
      {variant.status === 'completed' && variant.score && (
        <div className="px-3 pt-3 pb-2 space-y-2 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <BarChart2 className="size-3 text-muted-foreground" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">AI Score</span>
            </div>
            <span className={cn('text-base font-bold', scoreColor(variant.score.overallScore))}>
              {variant.score.overallScore}<span className="text-[10px] font-normal text-muted-foreground">/100</span>
            </span>
          </div>
          <div className="space-y-1">
            {[
              { label: 'Producto',   key: 'productVisibility' as const },
              { label: 'Audiencia',  key: 'audienceMatch' as const },
              { label: 'Conversión', key: 'conversionPotential' as const },
              { label: 'Marca',      key: 'brandingScore' as const },
            ].map(({ label, key }) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground w-14 shrink-0">{label}</span>
                <ScoreMiniBar value={variant.score![key]} />
                <span className="text-[9px] font-semibold text-foreground w-6 text-right">{variant.score![key]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Brief visual concept */}
      {variant.status === 'completed' && variant.brief?.visualConcept && (
        <div className="px-3 pb-2">
          <p className="text-[10px] text-muted-foreground italic leading-relaxed line-clamp-2">
            &ldquo;{variant.brief.visualConcept}&rdquo;
          </p>
        </div>
      )}

      {/* Improve input */}
      {showImproveInput && variant.status === 'completed' && (
        <div className="px-3 pb-2 space-y-1.5 border-t border-border/50 pt-2">
          <p className="text-[10px] text-muted-foreground font-medium">¿Qué mejorar? (opcional)</p>
          <input
            type="text"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="Ej: Más iluminación, fondo más limpio..."
            className="w-full text-xs rounded-lg border border-border bg-background px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground/50"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onImprove(hint || 'Make the composition more impactful and increase product prominence')
                setShowImproveInput(false)
                setHint('')
              }
            }}
          />
          <div className="flex gap-1.5">
            <Button
              size="sm"
              className="flex-1 h-7 text-xs gap-1"
              onClick={() => {
                onImprove(hint || 'Make the composition more impactful and increase product prominence')
                setShowImproveInput(false)
                setHint('')
              }}
              disabled={isAnyGenerating}
            >
              <Wand2 className="size-3" />Mejorar
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowImproveInput(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {variant.status === 'completed' && (
        <div className="px-3 pb-3 pt-2 space-y-2 mt-auto border-t border-border/50">
          <Button size="sm" className="w-full h-8 text-xs gap-1.5" onClick={onAssign}>
            <Megaphone className="size-3.5" />Usar en campaña
          </Button>
          <div className="grid grid-cols-2 gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={() => {
                setShowImproveInput(!showImproveInput)
                setHint('')
              }}
              disabled={isAnyGenerating}
            >
              <Wand2 className="size-3" />Mejorar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={onRegenerate}
              disabled={isAnyGenerating}
            >
              <RefreshCw className="size-3" />Regenerar
            </Button>
          </div>
          {variant.imageUrl && (
            <button
              type="button"
              onClick={() => {
                const a = document.createElement('a')
                a.href = variant.imageUrl!
                a.download = `creativo-${variant.type}-${Date.now()}.jpg`
                a.target = '_blank'
                a.click()
              }}
              className="w-full text-[10px] text-muted-foreground hover:text-foreground transition-colors text-center flex items-center justify-center gap-1 py-0.5"
            >
              <Download className="size-3" />Descargar
            </button>
          )}
        </div>
      )}

      {/* Cancelled — offer to regenerate */}
      {variant.status === 'cancelled' && (
        <div className="px-3 pb-3 pt-2 mt-auto border-t border-border/50">
          <Button
            size="sm"
            variant="outline"
            className="w-full h-8 text-xs gap-1.5"
            onClick={onRegenerate}
            disabled={isAnyGenerating}
          >
            <RotateCcw className="size-3.5" />Generar nuevamente
          </Button>
        </div>
      )}

      {/* Idle hint */}
      {variant.status === 'idle' && (
        <div className="px-3 pb-3 pt-2 mt-auto">
          <p className="text-[10px] text-muted-foreground text-center">Haz clic en &ldquo;Generar&rdquo; para ver esta variante</p>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function CreativeStudioTab({ products, campaigns }: CreativeStudioTabProps) {
  const activeProducts = products.filter((p) => p.is_active)

  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [objective, setObjective] = useState<string>('sales')
  const [preset, setPreset] = useState<CreativePreset>(CREATIVE_PRESETS[0])
  const [format, setFormat] = useState<CreativeFormat>('square')
  const [model, setModel] = useState<CreativeModel>(CREATIVE_PRESETS[0].defaultModel)
  const [variants, setVariants] = useState<StudioVariant[]>(INITIAL_VARIANTS)
  const [campaignModalOpen, setCampaignModalOpen] = useState(false)
  const [activeVariantForCampaign, setActiveVariantForCampaign] = useState<StudioVariant | null>(null)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  // Visual Product DNA
  const [visualDNA, setVisualDNA] = useState<VisualProductDNA | null>(null)
  const [dnaStatus, setDnaStatus] = useState<'idle' | 'analyzing' | 'ready' | 'error'>('idle')
  const [dnaError, setDnaError] = useState<string | null>(null)
  const [showEditDNA, setShowEditDNA] = useState(false)
  const [dnaEdits, setDnaEdits] = useState<VisualProductDNA['styleOverrides'] | null>(null)
  const dnaAbortRef = useRef<AbortController | null>(null)
  const [analyzeKey, setAnalyzeKey] = useState(0)

  const selectedProduct = activeProducts.find((p) => p.id === selectedProductId)
  const isAnyGenerating = variants.some((v) => v.status === 'generating' || v.status === 'queued')
  const hasAnyResult = variants.some((v) => ['completed', 'error', 'cancelled'].includes(v.status))
  const completedCount = variants.filter((v) => v.status === 'completed').length
  const { width, height } = FORMAT_DIMENSIONS[format]

  function selectProduct(productId: string) {
    setSelectedProductId(productId)
    // Reset DNA immediately — auto-analysis starts via useEffect
    dnaAbortRef.current?.abort()
    setVisualDNA(null)
    setDnaStatus('idle')
    setDnaError(null)
    setDnaEdits(null)
    setAnalyzeKey(0)
    const product = activeProducts.find((p) => p.id === productId)
    if (product?.category) {
      const presetId = CATEGORY_TO_PRESET[product.category]
      if (presetId) {
        const found = CREATIVE_PRESETS.find((p) => p.id === presetId)
        if (found) { setPreset(found); setModel(found.defaultModel) }
      }
    }
    setVariants(INITIAL_VARIANTS)
    setError(null)
  }

  // Load Visual Product DNA: from DB if already stored, otherwise analyze via AI
  useEffect(() => {
    const imageUrl = (selectedProduct?.images as string[] | null)?.[0]
    if (!imageUrl) {
      setVisualDNA(null)
      setDnaStatus('idle')
      return
    }

    // Use stored DNA if available and user hasn't requested a fresh analysis
    const storedDNA = selectedProduct?.visual_dna as VisualProductDNA | null
    if (storedDNA && analyzeKey === 0) {
      setVisualDNA(storedDNA)
      setDnaStatus('ready')
      setDnaError(null)
      return
    }

    setVisualDNA(null)
    setDnaStatus('analyzing')
    setDnaError(null)

    const controller = new AbortController()
    dnaAbortRef.current = controller

    void (async () => {
      try {
        const res = await fetch('/api/ai/analyze-product-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            imageUrl,
            productName: selectedProduct?.name,
            productCategory: selectedProduct?.category ?? undefined,
          }),
        })
        const data = await res.json() as { dna?: VisualProductDNA; error?: string }
        if (!res.ok) throw new Error(data.error ?? 'Error analizando imagen')
        if (data.dna) {
          setVisualDNA(data.dna)
          setDnaStatus('ready')
          // Persist to product record so future sessions skip the analysis cost
          if (selectedProduct?.id) {
            void saveProductVisualDNAAction(selectedProduct.id, data.dna)
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        setDnaError(err instanceof Error ? err.message : 'Error analizando imagen')
        setDnaStatus('error')
      }
    })()

    return () => { controller.abort() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct?.id, analyzeKey])

  function selectPreset(p: CreativePreset) {
    setPreset(p)
    setModel(p.defaultModel)
  }

  function triggerDNAAnalysis() {
    setVariants(INITIAL_VARIANTS)
    setDnaEdits(null)
    setAnalyzeKey((k) => k + 1)
  }

  const callGenerateAPI = useCallback(async (
    variantType: VariantType,
    improvementHint?: string,
    signal?: AbortSignal,
  ): Promise<GenerateResponse> => {
    if (!selectedProduct) throw new Error('Selecciona un producto primero')

    const res = await fetch('/api/ai/creative', {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product: selectedProduct.name,
        description: selectedProduct.description ?? selectedProduct.name,
        format,
        model,
        presetId: preset.id,
        productId: selectedProduct.id,
        category: selectedProduct.category ?? undefined,
        targetAudience: 'público general hispanohablante',
        objective,
        variantType,
        productPrice: selectedProduct.price ?? null,
        productCurrency: selectedProduct.currency ?? 'USD',
        country: null,
        improvementHint: improvementHint ?? null,
        visualDNA: visualDNA ?? undefined,
      }),
    })

    const json = (await res.json()) as GenerateResponse
    if (!res.ok) throw new Error(json.error ?? 'Error generando imagen')
    return json
  }, [selectedProduct, format, model, preset, objective, visualDNA])

  function setVariantState(type: VariantType, patch: Partial<StudioVariant>) {
    setVariants((prev) => prev.map((v) => v.type === type ? { ...v, ...patch } : v))
  }

  function cancelGeneration() {
    abortRef.current?.abort()
    setVariants((prev) => prev.map((v) =>
      v.status === 'generating' || v.status === 'queued' ? { ...v, status: 'cancelled' } : v,
    ))
  }

  async function generateSingleVariant(type: VariantType, hint?: string) {
    if (!selectedProduct) {
      setError('Selecciona un producto para generar el creativo.')
      return
    }
    setError(null)
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setVariantState(type, { status: 'generating', imageUrl: undefined, error: undefined })

    try {
      const data = await callGenerateAPI(type, hint, controller.signal)
      setVariantState(type, {
        status: 'completed',
        imageUrl: data.imageUrl,
        creativeId: data.creativeId ?? null,
        prompt: data.prompt,
        brief: data.brief,
        score: data.score,
      })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setVariantState(type, { status: 'cancelled' })
        return
      }
      const msg = err instanceof Error ? err.message : 'Error inesperado'
      setVariantState(type, { status: 'error', error: msg })
    }
  }

  async function handleGenerateAll() {
    if (!selectedProduct) {
      setError('Selecciona un producto para generar los creativos.')
      return
    }
    setError(null)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const types: VariantType[] = ['conversion', 'emotional', 'premium']

    // Mark all as queued first
    setVariants(types.map((type) => ({ type, status: 'queued' })))

    // Generate sequentially so user sees each card complete one by one
    for (const type of types) {
      if (controller.signal.aborted) {
        setVariantState(type, { status: 'cancelled' })
        continue
      }
      setVariantState(type, { status: 'generating' })
      try {
        const data = await callGenerateAPI(type, undefined, controller.signal)
        setVariantState(type, {
          status: 'completed',
          imageUrl: data.imageUrl,
          creativeId: data.creativeId ?? null,
          prompt: data.prompt,
          brief: data.brief,
          score: data.score,
        })
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Mark this and all remaining queued variants as cancelled
          setVariants((prev) => prev.map((v) =>
            v.status === 'generating' || v.status === 'queued' ? { ...v, status: 'cancelled' } : v,
          ))
          break
        }
        const msg = err instanceof Error ? err.message : 'Error inesperado'
        setVariantState(type, { status: 'error', error: msg })
        // Continue to next variant even if one fails (non-abort errors)
      }
    }
  }

  async function handleAssignToCampaign(campaignId: string) {
    if (!activeVariantForCampaign?.imageUrl) return
    setAssigning(true)
    try {
      // Try to use the stored creativeId from when it was generated
      const creativeId = activeVariantForCampaign.creativeId ?? ''
      let result
      if (creativeId) {
        result = await assignCreativeToCampaignAction(creativeId, campaignId, activeVariantForCampaign.imageUrl)
      } else {
        // Fallback: look up by imageUrl
        const res = await fetch('/api/ai/creative', { method: 'GET' })
        if (res.ok) {
          const json = await res.json() as { creatives: Array<{ id: string; image_url: string }> }
          const match = json.creatives.find((c) => c.image_url === activeVariantForCampaign.imageUrl)
          if (match) {
            result = await assignCreativeToCampaignAction(match.id, campaignId, activeVariantForCampaign.imageUrl)
          }
        }
      }
      if (result?.success) {
        toast.success('Creativo asignado a la campaña')
        setCampaignModalOpen(false)
        setActiveVariantForCampaign(null)
      } else {
        toast.error(result?.error ?? 'Error asignando creativo')
      }
    } finally {
      setAssigning(false)
    }
  }

  // Active style overrides: user edits override the DNA defaults
  const activeStyleOverrides = dnaEdits ?? visualDNA?.styleOverrides ?? null

  function applyDNAEdits(overrides: VisualProductDNA['styleOverrides']) {
    setDnaEdits(overrides)
    if (visualDNA) {
      setVisualDNA({ ...visualDNA, styleOverrides: overrides })
    }
    setShowEditDNA(false)
    // Reset variants so user regenerates with new style
    setVariants(INITIAL_VARIANTS)
  }

  return (
    <>
    {/* Edit Style Modal */}
    {showEditDNA && visualDNA && (
      <EditStyleModal
        current={activeStyleOverrides ?? visualDNA.styleOverrides}
        recommendedBackgrounds={visualDNA.recommendedBackgrounds}
        onClose={() => setShowEditDNA(false)}
        onApply={applyDNAEdits}
      />
    )}

    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
      {/* ── Left Panel ── */}
      <div className="space-y-4">

        {/* Product selector */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/20">
            <Package className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Producto</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="relative">
              <select
                value={selectedProductId}
                onChange={(e) => selectProduct(e.target.value)}
                className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2.5 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Seleccionar producto...</option>
                {activeProducts.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            </div>

            {selectedProduct && (
              <div className="rounded-lg bg-muted/50 border border-border/50 p-3 space-y-1.5">
                <p className="text-xs font-semibold text-foreground">{selectedProduct.name}</p>
                {selectedProduct.description && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{selectedProduct.description}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedProduct.category && (
                    <span className="inline-flex items-center rounded-full bg-brand/10 text-brand px-2 py-0.5 text-[10px] font-medium">
                      {selectedProduct.category}
                    </span>
                  )}
                  {selectedProduct.price != null && (
                    <span className="text-[10px] text-muted-foreground">
                      {selectedProduct.currency ?? 'USD'} {selectedProduct.price}
                    </span>
                  )}
                </div>
              </div>
            )}

            {activeProducts.length === 0 && (
              <p className="text-xs text-muted-foreground">No tienes productos activos. Crea uno en la pestaña Productos.</p>
            )}
          </div>
        </div>

        {/* ── Visual Product DNA panel ── */}
        {selectedProduct && (selectedProduct.images as string[] | null)?.[0] && (
          <div className={cn(
            'rounded-xl border bg-card overflow-hidden transition-all',
            dnaStatus === 'ready'
              ? 'border-brand/30 bg-brand/5'
              : dnaStatus === 'error'
              ? 'border-destructive/30'
              : 'border-border',
          )}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/10">
              <Fingerprint className={cn(
                'size-4',
                dnaStatus === 'ready' ? 'text-brand' : 'text-muted-foreground',
              )} />
              <h3 className="text-sm font-semibold text-foreground">ADN Visual del Producto</h3>
              {dnaStatus === 'ready' && (
                <span className={cn(
                  'ml-auto text-[10px] font-semibold rounded-full px-2 py-0.5',
                  (selectedProduct?.visual_dna as VisualProductDNA | null) && analyzeKey === 0
                    ? 'text-green-600 dark:text-green-400 bg-green-500/10'
                    : 'text-brand bg-brand/10',
                )}>
                  {(selectedProduct?.visual_dna as VisualProductDNA | null) && analyzeKey === 0
                    ? 'Guardado'
                    : '✓ Analizado'}
                </span>
              )}
              {dnaStatus === 'analyzing' && (
                <ScanSearch className="ml-auto size-3.5 text-brand animate-pulse" />
              )}
            </div>

            <div className="px-4 py-3 space-y-2.5">
              {dnaStatus === 'analyzing' && (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-3.5 text-brand animate-spin shrink-0" />
                  <p className="text-xs text-muted-foreground">Analizando identidad visual del producto...</p>
                </div>
              )}

              {dnaStatus === 'error' && (
                <div className="space-y-2">
                  <p className="text-xs text-destructive">{dnaError ?? 'Error analizando imagen'}</p>
                  <button
                    type="button"
                    onClick={triggerDNAAnalysis}
                    className="text-[11px] text-brand hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="size-3" />Reintentar análisis
                  </button>
                </div>
              )}

              {dnaStatus === 'ready' && visualDNA && (
                <>
                  {/* Product identity summary */}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-foreground capitalize">
                      {visualDNA.productType}
                      {visualDNA.brand ? ` · ${visualDNA.brand}` : ''}
                    </p>
                    {visualDNA.materials.length > 0 && (
                      <p className="text-[11px] text-muted-foreground">
                        Materiales: {visualDNA.materials.join(', ')}
                      </p>
                    )}
                    {visualDNA.mainColors.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-muted-foreground">Colores:</span>
                        {visualDNA.mainColors.map((c) => (
                          <span key={c} className="text-[11px] bg-muted/60 border border-border/50 rounded-full px-2 py-0.5 text-foreground">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Style overrides preview */}
                  <div className="rounded-lg bg-muted/40 border border-border/40 px-3 py-2 space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Estilo activo</p>
                    <p className="text-[11px] text-foreground">
                      {(dnaEdits ?? visualDNA.styleOverrides).photoStyle} · {(dnaEdits ?? visualDNA.styleOverrides).background}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {(dnaEdits ?? visualDNA.styleOverrides).lighting}
                    </p>
                  </div>

                  {/* DNA consistency note */}
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Las 3 variantes usarán el mismo producto con colores y materiales idénticos. Solo cambiará el entorno y enfoque.
                  </p>

                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowEditDNA(true)}
                      className="flex items-center gap-1.5 text-xs text-brand hover:text-brand/80 transition-colors font-medium"
                    >
                      <SlidersHorizontal className="size-3.5" />
                      Editar estilo visual
                    </button>
                    <button
                      type="button"
                      onClick={triggerDNAAnalysis}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <RefreshCw className="size-3.5" />
                      Actualizar identidad visual
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Campaign Objective */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/20">
            <Target className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Objetivo de campaña</h3>
          </div>
          <div className="p-3 grid grid-cols-2 gap-1.5">
            {OBJECTIVE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setObjective(opt.value)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-left transition-all',
                  objective === opt.value
                    ? 'border-brand bg-brand/5'
                    : 'border-border hover:border-brand/30',
                )}
              >
                <span className="text-sm">{opt.emoji}</span>
                <div>
                  <p className="text-xs font-semibold text-foreground leading-tight">{opt.label}</p>
                  <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                </div>
                {objective === opt.value && <Check className="size-3 text-brand ml-auto shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Visual style presets */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/20">
            <span className="text-sm">🎨</span>
            <h3 className="text-sm font-semibold text-foreground">Estilo visual</h3>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-0.5">
              {CREATIVE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectPreset(p)}
                  className={cn(
                    'flex flex-col gap-0.5 rounded-lg border-2 p-2.5 text-left transition-all',
                    preset.id === p.id ? 'border-brand bg-brand/5' : 'border-border hover:border-brand/30',
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-foreground leading-tight">{p.label}</span>
                    {preset.id === p.id && <Check className="size-3 text-brand shrink-0" />}
                  </div>
                  <span className="text-[10px] text-muted-foreground leading-snug">{p.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Format + Model */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/20">
            <span className="text-sm">⚙️</span>
            <h3 className="text-sm font-semibold text-foreground">Configuración</h3>
          </div>
          <div className="p-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-foreground mb-2">Formato</p>
              <div className="space-y-1">
                {FORMAT_OPTIONS.map((f) => {
                  const dims = FORMAT_DIMENSIONS[f.value]
                  return (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setFormat(f.value)}
                      className={cn(
                        'w-full flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-all',
                        format === f.value ? 'bg-brand/10 text-brand font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <span>{f.label}</span>
                      <span className="font-mono text-[10px] opacity-50">{dims.width}×{dims.height}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-foreground mb-2">Modelo IA</p>
              <div className="space-y-1">
                {CREATIVE_MODELS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setModel(m.value)}
                    className={cn(
                      'w-full flex items-center rounded-md px-2.5 py-1.5 text-xs transition-all text-left',
                      model === m.value ? 'bg-brand/10 text-brand font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground px-4 pb-3">
            Generará{' '}
            <span className="font-medium text-foreground">{width}×{height}px</span>{' '}
            con <span className="font-medium text-foreground">{model}</span>
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
            <AlertCircle className="size-3.5 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        {/* Generate button */}
        <Button
          className="w-full gap-2 shadow-sm"
          onClick={handleGenerateAll}
          loading={isAnyGenerating}
          disabled={isAnyGenerating || !selectedProductId}
        >
          {!isAnyGenerating && <Zap className="size-4" />}
          {isAnyGenerating
            ? `Generando variantes... (${completedCount}/3)`
            : '🚀 Generar 3 variantes IA'}
        </Button>

        {hasAnyResult && !isAnyGenerating && (
          <p className="text-[11px] text-muted-foreground text-center">
            ✅ Creativos guardados en tu Biblioteca de Creativos
          </p>
        )}
      </div>

      {/* ── Right Panel — 3 Variant Cards ── */}
      <div className="space-y-4">
        {/* Status bar when generating */}
        {isAnyGenerating && (
          <div className="flex items-center gap-3 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3">
            <Loader2 className="size-4 text-brand animate-spin shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Generando 3 variantes IA...</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Claude analiza el producto y genera cada variante. Puede tardar 1–3 minutos.
              </p>
            </div>
            <button
              type="button"
              onClick={cancelGeneration}
              className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/60 px-2 py-1"
            >
              <X className="size-3" />Cancelar
            </button>
            <div className="shrink-0 flex items-center gap-1">
              {variants.map((v) => (
                <div
                  key={v.type}
                  className={cn(
                    'size-2 rounded-full',
                    v.status === 'completed' ? 'bg-green-500' :
                    v.status === 'generating' ? 'bg-brand animate-pulse' :
                    v.status === 'error' ? 'bg-destructive' :
                    'bg-muted',
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {/* Summary when all done */}
        {!isAnyGenerating && completedCount > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-2.5">
            <CheckCircle2 className="size-4 text-green-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {completedCount === 3 ? '3 variantes generadas' : `${completedCount} de 3 variantes listas`}
              </p>
            </div>
            {completedCount > 0 && (() => {
              const best = variants.filter((v) => v.score).sort((a, b) => (b.score?.overallScore ?? 0) - (a.score?.overallScore ?? 0))[0]
              return best?.score ? (
                <span className="text-xs text-muted-foreground">
                  Mejor score: <span className={cn('font-bold', scoreColor(best.score.overallScore))}>{best.score.overallScore}/100</span>
                  {' '}({VARIANT_CONFIG[best.type].label})
                </span>
              ) : null
            })()}
          </div>
        )}

        {/* 3 variant cards */}
        {!selectedProductId && !hasAnyResult ? (
          /* Empty state */
          <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 flex flex-col items-center justify-center gap-4 min-h-[500px] text-center p-8">
            <div className="size-16 rounded-2xl bg-gradient-to-br from-brand/10 to-purple-500/10 border border-brand/20 flex items-center justify-center">
              <Sparkles className="size-8 text-brand/60" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Creative Engine Pro</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Genera 3 variantes creativas optimizadas para publicidad — Conversión, Emocional y Premium — cada una con su AI Score.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
              {(['conversion', 'emotional', 'premium'] as VariantType[]).map((type) => {
                const cfg = VARIANT_CONFIG[type]
                return (
                  <div key={type} className="rounded-xl border border-border bg-muted/30 p-3 text-center space-y-1">
                    <div className="text-xl">{cfg.emoji}</div>
                    <p className="text-[10px] font-semibold text-foreground">{cfg.label}</p>
                    <p className="text-[9px] text-muted-foreground leading-tight">{cfg.focusSummary}</p>
                  </div>
                )
              })}
            </div>
            <div className="text-left space-y-1.5 w-full max-w-xs">
              {[
                '1. Selecciona el producto',
                '2. Elige el objetivo de campaña',
                '3. Elige estilo visual y formato',
                '4. Haz clic en Generar 3 variantes IA',
              ].map((step) => (
                <p key={step} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-brand mt-0.5">›</span>{step}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {variants.map((variant) => (
              <VariantCard
                key={variant.type}
                variant={variant}
                isAnyGenerating={isAnyGenerating}
                onAssign={() => {
                  setActiveVariantForCampaign(variant)
                  setCampaignModalOpen(true)
                }}
                onRegenerate={() => generateSingleVariant(variant.type)}
                onImprove={(hint) => generateSingleVariant(variant.type, hint)}
              />
            ))}
          </div>
        )}

        {/* Recommendations from best scoring variant */}
        {!isAnyGenerating && completedCount > 0 && (() => {
          const allRecs = variants
            .filter((v) => v.score?.recommendations?.length)
            .flatMap((v) => v.score!.recommendations.map((r) => ({ rec: r, type: v.type })))
          if (!allRecs.length) return null
          return (
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Recomendaciones IA</h3>
              </div>
              <div className="space-y-1.5">
                {allRecs.slice(0, 4).map(({ rec, type }, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[9px] font-semibold text-muted-foreground mt-1 shrink-0">
                      {VARIANT_CONFIG[type].emoji}
                    </span>
                    <p className="text-xs text-foreground leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}
      </div>

      {/* Campaign picker modal */}
      <CampaignPickerModal
        open={campaignModalOpen}
        campaigns={campaigns}
        onClose={() => { setCampaignModalOpen(false); setActiveVariantForCampaign(null) }}
        onPick={handleAssignToCampaign}
        isLoading={assigning}
      />
    </div>
    </>
  )
}

// ── Edit Style Modal ───────────────────────────────────────────────────────────

type StyleOverrides = VisualProductDNA['styleOverrides']

const BACKGROUND_OPTIONS = [
  { value: 'clean white studio', label: 'Blanco estudio' },
  { value: 'dark gradient studio', label: 'Negro degradado' },
  { value: 'light grey seamless', label: 'Gris suave' },
  { value: 'warm beige lifestyle', label: 'Beige lifestyle' },
  { value: 'outdoor natural light', label: 'Exterior natural' },
]

const LIGHTING_OPTIONS = [
  { value: 'soft studio lighting', label: 'Estudio suave' },
  { value: 'dramatic side lighting', label: 'Dramática lateral' },
  { value: 'natural daylight', label: 'Luz natural' },
  { value: 'cinematic film lighting', label: 'Cinematográfica' },
  { value: 'high-key bright lighting', label: 'Alta clave' },
]

const STYLE_OPTIONS: { value: StyleOverrides['realismLevel']; label: string; desc: string }[] = [
  { value: 'photorealistic', label: 'Fotorrealista', desc: 'Foto real de producto' },
  { value: 'cinematic', label: 'Cinematográfica', desc: 'Calidad de película' },
  { value: 'stylized', label: 'Estilizada', desc: 'Arte publicitario' },
]

function EditStyleModal({
  current,
  recommendedBackgrounds,
  onClose,
  onApply,
}: {
  current: StyleOverrides
  recommendedBackgrounds: string[]
  onClose: () => void
  onApply: (overrides: StyleOverrides) => void
}) {
  const [draft, setDraft] = useState<StyleOverrides>({ ...current })

  const allBackgrounds = [
    ...BACKGROUND_OPTIONS,
    ...recommendedBackgrounds
      .filter((b) => !BACKGROUND_OPTIONS.some((o) => o.value === b))
      .map((b) => ({ value: b, label: b })),
  ].slice(0, 7)

  return (
    <Modal open onClose={onClose} title="Editar estilo visual" description="Ajusta el ambiente sin modificar el producto." size="md">
      <div className="space-y-5">
        {/* Background */}
        <div>
          <p className="text-xs font-semibold text-foreground mb-2">Fondo</p>
          <div className="grid grid-cols-2 gap-1.5">
            {allBackgrounds.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, background: opt.value }))}
                className={cn(
                  'text-left rounded-lg border-2 px-3 py-2 text-xs transition-all',
                  draft.background === opt.value
                    ? 'border-brand bg-brand/5 text-brand font-medium'
                    : 'border-border text-muted-foreground hover:border-brand/40',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lighting */}
        <div>
          <p className="text-xs font-semibold text-foreground mb-2">Iluminación</p>
          <div className="grid grid-cols-2 gap-1.5">
            {LIGHTING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, lighting: opt.value }))}
                className={cn(
                  'text-left rounded-lg border-2 px-3 py-2 text-xs transition-all',
                  draft.lighting === opt.value
                    ? 'border-brand bg-brand/5 text-brand font-medium'
                    : 'border-border text-muted-foreground hover:border-brand/40',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Realism level */}
        <div>
          <p className="text-xs font-semibold text-foreground mb-2">Estilo fotográfico</p>
          <div className="grid grid-cols-3 gap-1.5">
            {STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, realismLevel: opt.value, photoStyle: opt.value }))}
                className={cn(
                  'text-left rounded-lg border-2 p-2.5 text-xs transition-all',
                  draft.realismLevel === opt.value
                    ? 'border-brand bg-brand/5'
                    : 'border-border hover:border-brand/40',
                )}
              >
                <p className={cn('font-semibold', draft.realismLevel === opt.value ? 'text-brand' : 'text-foreground')}>
                  {opt.label}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-muted/40 border border-border/40 px-3 py-2.5">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            El producto permanecerá exactamente igual — solo cambiará el entorno, la iluminación y el estilo fotográfico.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg py-2 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="flex-1 text-xs font-semibold bg-brand text-white rounded-lg py-2 hover:bg-brand/90 transition-colors"
          >
            Aplicar estilo
          </button>
        </div>
      </div>
    </Modal>
  )
}

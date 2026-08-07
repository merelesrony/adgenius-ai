'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Camera, ImagePlus, Package, Sparkles, CheckCircle, ChevronRight,
  Loader2, AlertCircle, Tag, Users, ArrowLeft, Edit2, Check, X,
  Fingerprint, RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/currency'
import { Button } from '@/components/ui/button'
import { useCampaignBuilder } from '../context'
import { createProductFromBuilderAction } from '../actions'
import { createClient } from '@/lib/supabase/client'
import type { ProductMode, SelectedProduct, ProductImageMode } from '../types'
import type { Database } from '@/types/database'
import type { ProductFromDescriptionResult } from '@/lib/ai/AIManager'
import type { VisualProductDNA } from '@/types/visual-dna'
import type { ProductFromImageResult } from '@/app/api/ai/analyze-product-full/route'

type ProductRow = Database['public']['Tables']['products']['Row']

interface Step1ProductProps {
  products: ProductRow[]
  userId: string
}

// ── Image analysis progress steps ─────────────────────────────────────────────

const IMAGE_ANALYSIS_STEPS = [
  'Analizando producto...',
  'Detectando categoría',
  'Detectando marca',
  'Analizando colores y materiales',
  'Generando descripción comercial',
  'Creando ADN Visual del producto',
  'Preparando tu campaña',
] as const

type ImageIngestionPhase = 'upload' | 'analyzing' | 'confirm' | 'saving'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getFirstImage(images: ProductRow['images']): string | null {
  if (!images) return null
  if (Array.isArray(images) && images.length > 0) return images[0] as string
  return null
}

// ── Confidence badge ──────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const cfg = {
    high:   { label: 'Alta confianza',   cls: 'bg-success/10 text-success border-success/20' },
    medium: { label: 'Confianza media',  cls: 'bg-amber-500/10 text-amber-600 border-amber-300/40 dark:text-amber-400' },
    low:    { label: 'Confianza baja',   cls: 'bg-muted text-muted-foreground border-border' },
  }[confidence]
  return (
    <span className={cn('ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full border', cfg.cls)}>
      {cfg.label}
    </span>
  )
}

// ── Product Image Mode Selector ───────────────────────────────────────────────

function ImageUseSelector({
  value,
  onChange,
}: {
  value: ProductImageMode
  onChange: (v: ProductImageMode) => void
}) {
  const options: {
    value: ProductImageMode
    emoji: string
    label: string
    description: string
    result: string
    accent: string
    accentSelected: string
  }[] = [
    {
      value: 'image_ai_variants',
      emoji: '✨',
      label: 'Mejorar con IA',
      description: 'Crear versiones profesionales basadas en tu producto',
      result: '4 creativos: tu imagen + 3 variantes IA',
      accent: 'border-border bg-card hover:border-purple-400/40 hover:bg-purple-500/3',
      accentSelected: 'border-purple-500/60 bg-purple-500/5',
    },
    {
      value: 'original_only',
      emoji: '📸',
      label: 'Usar mi imagen',
      description: 'Tu imagen exacta. La IA genera copy, estrategia y segmentación',
      result: '1 creativo: tu imagen + copy IA',
      accent: 'border-border bg-card hover:border-brand/40 hover:bg-brand/3',
      accentSelected: 'border-brand/60 bg-brand/5',
    },
  ]

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-foreground">¿Cómo quieres crear tu anuncio?</p>
      <div className="space-y-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'w-full flex items-start gap-3 rounded-xl border-2 p-3.5 text-left transition-all duration-200',
              value === opt.value ? opt.accentSelected : opt.accent,
            )}
          >
            <div className="text-xl shrink-0 leading-none mt-0.5">{opt.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-foreground leading-snug">{opt.label}</span>
                {value === opt.value && (
                  <CheckCircle className="size-3.5 text-brand shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{opt.description}</p>
              <p className={cn(
                'text-[11px] font-medium mt-1.5 px-2 py-0.5 rounded-full inline-block',
                value === opt.value
                  ? 'bg-brand/10 text-brand'
                  : 'bg-muted text-muted-foreground',
              )}>
                → {opt.result}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Product Confirm Form ──────────────────────────────────────────────────────

function ProductConfirmForm({
  product: initial,
  imageUrl,
  productImageMode,
  onProductImageModeChange,
  onConfirm,
  onBack,
  saveError,
}: {
  product: ProductFromImageResult
  imageUrl: string
  productImageMode: ProductImageMode
  onProductImageModeChange: (mode: ProductImageMode) => void
  onConfirm: (edited: ProductFromImageResult) => void
  onBack: () => void
  saveError: string | null
}) {
  const [name, setName] = useState(initial.name)
  const [description, setDescription] = useState(initial.description)
  const [brand, setBrand] = useState(initial.brand ?? '')
  const [price, setPrice] = useState(initial.price !== null ? String(initial.price) : '')
  const [currency, setCurrency] = useState(initial.currency)

  function handleSubmit() {
    onConfirm({
      ...initial,
      name: name.trim() || initial.name,
      description: description.trim() || initial.description,
      brand: brand.trim() || null,
      price: price ? (parseFloat(price) || null) : null,
      currency: currency.trim() || initial.currency,
    })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <CheckCircle className="size-4 text-success shrink-0" />
        <p className="text-sm font-semibold text-foreground">Producto detectado</p>
        <ConfidenceBadge confidence={initial.confidence} />
      </div>

      {/* Image + form grid */}
      <div className="grid grid-cols-1 sm:grid-cols-[110px_1fr] gap-4">
        {/* Image preview */}
        <div className="mx-auto sm:mx-0 w-28 sm:w-full">
          <div className="aspect-square rounded-xl overflow-hidden border border-border bg-muted/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Producto" className="w-full h-full object-cover" />
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-brand">
            <Fingerprint className="size-3 shrink-0" />
            <span>ADN Visual creado</span>
          </div>
          {initial.keywords.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {initial.keywords.slice(0, 4).map((kw) => (
                <span key={kw} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60 truncate max-w-[60px]">{kw}</span>
              ))}
            </div>
          )}
        </div>

        {/* Form */}
        <div className="space-y-3">
          {/* Category chips (read-only) */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-brand/10 text-brand border border-brand/20">
              <Tag className="size-3" />
              {initial.categoryLabel}
            </span>
            {initial.brand && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                {initial.brand}
              </span>
            )}
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Nombre <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={150}
              className="mt-1 w-full rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Marca</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Opcional"
                className="mt-1 w-full rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Precio</label>
              <div className="mt-1 flex gap-1.5">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  min={0}
                  className="flex-1 min-w-0 rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  maxLength={3}
                  className="w-14 rounded-lg border border-border bg-background text-foreground text-sm px-2 py-2 focus:outline-none focus:ring-2 focus:ring-ring text-center font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested audience */}
      {initial.suggestedAudience && (
        <div className="flex items-start gap-2 rounded-lg bg-muted/40 border border-border/50 px-3 py-2.5">
          <Users className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">{initial.suggestedAudience}</p>
        </div>
      )}

      {/* Image use selector */}
      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <ImageUseSelector value={productImageMode} onChange={onProductImageModeChange} />
      </div>

      {/* Save error */}
      {saveError && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5">
          <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">{saveError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="size-3.5" />
          Volver
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="gap-1.5 flex-1"
        >
          <CheckCircle className="size-4" />
          Continuar al Paso 2
        </Button>
      </div>
    </div>
  )
}

// ── Image Ingestion Flow ──────────────────────────────────────────────────────

function ImageIngestionFlow({
  userId,
  onProductAccepted,
  productImageMode,
  onProductImageModeChange,
}: {
  userId: string
  onProductAccepted: (product: SelectedProduct) => void
  productImageMode: ProductImageMode
  onProductImageModeChange: (mode: ProductImageMode) => void
}) {
  const [phase, setPhase] = useState<ImageIngestionPhase>('upload')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [analysisStep, setAnalysisStep] = useState(0)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [productData, setProductData] = useState<ProductFromImageResult | null>(null)
  const [visualDNA, setVisualDNA] = useState<VisualProductDNA | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const analysisAbortRef = useRef<AbortController | null>(null)

  // Animate checklist while waiting for API response
  useEffect(() => {
    if (phase !== 'analyzing') {
      setAnalysisStep(0)
      return
    }
    const timers: ReturnType<typeof setTimeout>[] = []
    IMAGE_ANALYSIS_STEPS.forEach((_, i) => {
      if (i === 0) return
      timers.push(setTimeout(() => setAnalysisStep(i), i * 1200))
    })
    return () => timers.forEach(clearTimeout)
  }, [phase])

  // Paste from clipboard (Ctrl+V)
  useEffect(() => {
    if (phase !== 'upload') return
    function handlePaste(e: ClipboardEvent) {
      const imageItem = Array.from(e.clipboardData?.items ?? []).find(
        (item) => item.type.startsWith('image/'),
      )
      if (imageItem) {
        const file = imageItem.getAsFile()
        if (file) void handleFileSelected(file)
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  async function uploadToStorage(file: File): Promise<string> {
    if (file.size > 10 * 1024 * 1024) throw new Error('La imagen no puede superar 10 MB')
    const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
    const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(path, file, { upsert: false })
    if (error || !data) throw new Error(error?.message ?? 'Error subiendo imagen')
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(data.path)
    return publicUrl
  }

  async function handleFileSelected(file: File) {
    if (!file.type.startsWith('image/')) {
      setUploadError('Solo se permiten imágenes (JPG, PNG, WebP)')
      return
    }
    setUploadError(null)
    setAnalysisError(null)
    setIsUploading(true)
    try {
      const url = await uploadToStorage(file)
      setImageUrl(url)
      setIsUploading(false)
      void startAnalysis(url)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error subiendo imagen')
      setIsUploading(false)
    }
  }

  async function startAnalysis(url: string) {
    setPhase('analyzing')
    setAnalysisError(null)
    setAnalysisStep(0)

    const controller = new AbortController()
    analysisAbortRef.current = controller

    try {
      const res = await fetch('/api/ai/analyze-product-full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ imageUrl: url }),
      })
      const data = await res.json() as {
        product?: ProductFromImageResult
        dna?: VisualProductDNA
        error?: string
      }
      if (!res.ok) throw new Error(data.error ?? 'Error analizando imagen')
      setProductData(data.product ?? null)
      setVisualDNA(data.dna ?? null)
      // Let animation finish before showing the form
      setTimeout(() => setPhase('confirm'), 700)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      const msg = err instanceof Error ? err.message : 'Error analizando imagen'
      setAnalysisError(msg)
      setPhase('upload')
    }
  }

  async function handleConfirm(edited: ProductFromImageResult) {
    if (!imageUrl) return
    setSaveError(null)
    setPhase('saving')

    const result = await createProductFromBuilderAction({
      name: edited.name,
      description: edited.description,
      category: edited.category,
      price: edited.price,
      currency: edited.currency,
      images: [imageUrl],
      visualDNA: visualDNA ?? undefined,
    })

    if (!result.success || !result.product) {
      setSaveError(result.error ?? 'Error guardando producto')
      setPhase('confirm')
      return
    }

    onProductAccepted({ ...result.product, image: imageUrl })
  }

  // ── UPLOAD ───────────────────────────────────────────────────────────────────
  if (phase === 'upload') {
    return (
      <div className="space-y-4">
        <div
          onDrop={(e) => {
            e.preventDefault()
            setIsDragOver(false)
            const file = e.dataTransfer.files[0]
            if (file) void handleFileSelected(file)
          }}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={cn(
            'relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-10 sm:p-14 cursor-pointer transition-all duration-200 select-none',
            isDragOver
              ? 'border-brand bg-brand/5 scale-[1.01] shadow-lg shadow-brand/10'
              : 'border-border hover:border-brand/50 hover:bg-brand/3',
            isUploading && 'pointer-events-none opacity-70',
          )}
        >
          {isUploading ? (
            <>
              <div className="size-16 rounded-2xl bg-brand/10 flex items-center justify-center">
                <Loader2 className="size-8 text-brand animate-spin" />
              </div>
              <p className="text-sm font-medium text-foreground">Subiendo imagen...</p>
            </>
          ) : (
            <>
              <div className={cn(
                'size-16 rounded-2xl flex items-center justify-center transition-colors duration-200',
                isDragOver ? 'bg-brand/20' : 'bg-muted/60',
              )}>
                <ImagePlus className={cn(
                  'size-8 transition-colors',
                  isDragOver ? 'text-brand' : 'text-muted-foreground',
                )} />
              </div>
              <div className="text-center space-y-1">
                <p className="text-base font-semibold text-foreground">
                  {isDragOver ? 'Suelta la imagen aquí' : 'Sube la foto de tu producto'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Arrastra, haz clic o pega con Ctrl+V
                </p>
                <p className="text-xs text-muted-foreground/60">
                  JPG, PNG, WebP · máx 10 MB
                </p>
              </div>
              {/* Camera capture for mobile */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  cameraInputRef.current?.click()
                }}
                className="flex items-center gap-2 text-sm text-brand font-medium hover:underline mt-1"
              >
                <Camera className="size-4" />
                Tomar foto con la cámara
              </button>
            </>
          )}
        </div>

        {(uploadError || analysisError) && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5">
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">{uploadError ?? analysisError}</p>
            {analysisError && imageUrl && (
              <button
                type="button"
                onClick={() => void startAnalysis(imageUrl)}
                className="ml-auto text-xs text-brand hover:underline shrink-0 flex items-center gap-1"
              >
                <RefreshCw className="size-3" /> Reintentar
              </button>
            )}
          </div>
        )}

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleFileSelected(f)
            e.target.value = ''
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleFileSelected(f)
            e.target.value = ''
          }}
        />
      </div>
    )
  }

  // ── ANALYZING ────────────────────────────────────────────────────────────────
  if (phase === 'analyzing') {
    return (
      <div className="space-y-5 rounded-xl border border-border bg-card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-[100px_1fr] gap-5 items-start">
          {/* Thumbnail */}
          {imageUrl && (
            <div className="w-24 mx-auto sm:w-full aspect-square rounded-xl overflow-hidden border border-border bg-muted/30 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Producto" className="w-full h-full object-cover" />
            </div>
          )}
          {/* Checklist */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-brand animate-pulse shrink-0" />
              <p className="text-sm font-semibold text-foreground">La IA está analizando tu producto</p>
            </div>
            <div className="space-y-2.5">
              {IMAGE_ANALYSIS_STEPS.map((label, i) => {
                const isDone    = analysisStep > i
                const isCurrent = analysisStep === i
                const isPending = analysisStep < i
                return (
                  <div
                    key={label}
                    className={cn('flex items-center gap-2.5 transition-all duration-300', isPending && 'opacity-30')}
                  >
                    <div className="shrink-0 size-4">
                      {isDone ? (
                        <CheckCircle className="size-4 text-success" />
                      ) : isCurrent ? (
                        <Loader2 className="size-4 text-brand animate-spin" />
                      ) : (
                        <div className="size-4 rounded-full border-2 border-muted-foreground/20" />
                      )}
                    </div>
                    <span className={cn(
                      'text-sm transition-colors leading-snug',
                      isDone    && 'text-foreground font-medium',
                      isCurrent && 'text-brand font-medium',
                      isPending && 'text-muted-foreground',
                    )}>
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-gradient-to-r from-brand to-purple-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(((analysisStep + 1) / IMAGE_ANALYSIS_STEPS.length) * 95, 95)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── SAVING ───────────────────────────────────────────────────────────────────
  if (phase === 'saving') {
    return (
      <div className="rounded-xl border border-border bg-card p-10 flex flex-col items-center gap-4">
        <div className="size-14 rounded-2xl bg-brand/10 flex items-center justify-center">
          <Loader2 className="size-7 text-brand animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">Guardando producto...</p>
          <p className="text-xs text-muted-foreground mt-1">
            Guardando producto y ADN Visual en tu biblioteca
          </p>
        </div>
      </div>
    )
  }

  // ── CONFIRM ──────────────────────────────────────────────────────────────────
  if (!productData || !imageUrl) return null

  return (
    <ProductConfirmForm
      product={productData}
      imageUrl={imageUrl}
      productImageMode={productImageMode}
      onProductImageModeChange={onProductImageModeChange}
      onConfirm={handleConfirm}
      onBack={() => { setPhase('upload'); setProductData(null); setVisualDNA(null); setSaveError(null) }}
      saveError={saveError}
    />
  )
}

// ── AI Product Creator (text description → AI → review) ───────────────────────

type AIPhase = 'form' | 'analyzing' | 'review' | 'saving'

const AI_ANALYSIS_STEPS = [
  'Analizando producto...',
  'Detectando categoría...',
  'Creando ficha comercial...',
] as const

function AIProductCreator({
  onProductAccepted,
  onBack,
}: {
  onProductAccepted: (product: SelectedProduct) => void
  onBack: () => void
}) {
  const [phase, setPhase] = useState<AIPhase>('form')
  const [userDescription, setUserDescription] = useState('')
  const [analysisStep, setAnalysisStep] = useState(0)
  const [generated, setGenerated] = useState<ProductFromDescriptionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategoryLabel, setEditCategoryLabel] = useState('')
  const [editBrand, setEditBrand] = useState('')
  const [editPrice, setEditPrice] = useState('')

  useEffect(() => {
    if (phase !== 'analyzing') { setAnalysisStep(0); return }
    const t1 = setTimeout(() => setAnalysisStep(1), 1400)
    const t2 = setTimeout(() => setAnalysisStep(2), 2800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [phase])

  async function handleAnalyze() {
    const desc = userDescription.trim()
    if (desc.length < 5) return
    setError(null)
    setPhase('analyzing')
    try {
      const res = await fetch('/api/ai/generate-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al generar producto')
      setGenerated(data as ProductFromDescriptionResult)
      setEditName(data.name)
      setEditDescription(data.description)
      setEditCategoryLabel(data.categoryLabel)
      setEditBrand(data.brand ?? '')
      setEditPrice(data.price !== null ? String(data.price) : '')
      setIsEditing(false)
      setPhase('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error analizando producto')
      setPhase('form')
    }
  }

  function handleSaveEdit() {
    if (!generated) return
    setGenerated({
      ...generated,
      name: editName.trim() || generated.name,
      description: editDescription.trim() || generated.description,
      categoryLabel: editCategoryLabel.trim() || generated.categoryLabel,
      brand: editBrand.trim() || null,
      price: editPrice ? parseFloat(editPrice) || null : null,
    })
    setIsEditing(false)
  }

  async function handleAccept() {
    if (!generated) return
    const canAccept = generated.name && generated.description && generated.category
    if (!canAccept) return
    setSaveError(null)
    setPhase('saving')
    const result = await createProductFromBuilderAction({
      name: generated.name,
      description: generated.description,
      category: generated.category,
      price: generated.price,
      currency: generated.currency,
    })
    if (!result.success || !result.product) {
      setSaveError(result.error ?? 'Error guardando producto')
      setPhase('review')
      return
    }
    onProductAccepted(result.product)
  }

  if (phase === 'form') {
    return (
      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center size-8 rounded-lg bg-brand/10 shrink-0">
            <Sparkles className="size-4 text-brand" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Describe tu producto</p>
            <p className="text-xs text-muted-foreground">La IA extraerá automáticamente toda la información</p>
          </div>
        </div>
        <div>
          <textarea
            value={userDescription}
            onChange={(e) => setUserDescription(e.target.value)}
            placeholder={'Ejemplo: "Vendo perfumes Dior originales de 100ml, ideal para regalos. Precio ₲450.000."'}
            rows={4}
            maxLength={1000}
            className="w-full rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2.5 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <div className="flex items-center justify-between mt-1">
            <p className="text-[11px] text-muted-foreground">Incluye nombre, precio y moneda si los conoces</p>
            <span className="text-[10px] text-muted-foreground">{userDescription.length}/1000</span>
          </div>
        </div>
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5">
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5">
            <ArrowLeft className="size-3.5" />Volver
          </Button>
          <Button
            size="sm"
            onClick={handleAnalyze}
            disabled={userDescription.trim().length < 5}
            className="gap-2 flex-1"
          >
            <Sparkles className="size-4" />Analizar producto
          </Button>
        </div>
      </div>
    )
  }

  if (phase === 'analyzing') {
    return (
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-brand/10 mx-auto">
            <Sparkles className="size-7 text-brand animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">La IA está analizando</p>
            <p className="text-xs text-muted-foreground mt-0.5">Esto tarda unos segundos...</p>
          </div>
        </div>
        <div className="space-y-3">
          {AI_ANALYSIS_STEPS.map((label, i) => {
            const isDone = analysisStep > i
            const isCurrent = analysisStep === i
            const isPending = analysisStep < i
            return (
              <div key={label} className={cn('flex items-center gap-3 transition-all duration-300', isPending && 'opacity-30')}>
                <div className="shrink-0 size-5">
                  {isDone    ? <CheckCircle className="size-5 text-success" />
                  : isCurrent ? <Loader2 className="size-5 text-brand animate-spin" />
                  : <div className="size-5 rounded-full border-2 border-muted-foreground/20" />}
                </div>
                <span className={cn(
                  'text-sm transition-colors',
                  isDone    && 'text-foreground font-medium',
                  isCurrent && 'text-brand font-medium',
                  isPending && 'text-muted-foreground',
                )}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand to-purple-500 rounded-full transition-all duration-700"
            style={{ width: `${((analysisStep + 1) / AI_ANALYSIS_STEPS.length) * 90}%` }}
          />
        </div>
      </div>
    )
  }

  if (phase === 'saving') {
    return (
      <div className="rounded-xl border border-border bg-card p-8 flex flex-col items-center gap-4">
        <Loader2 className="size-10 text-brand animate-spin" />
        <p className="text-sm font-medium text-foreground">Guardando producto...</p>
      </div>
    )
  }

  if (!generated) return null

  const canAccept = generated.name.trim() && generated.description.trim() && generated.category

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <CheckCircle className="size-4 text-success" />
        <p className="text-sm font-semibold text-foreground">Producto generado</p>
        <ConfidenceBadge confidence={generated.confidence} />
      </div>

      <div className="rounded-xl border-2 border-brand/20 bg-brand/5 p-4 space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Nombre</p>
          {isEditing ? (
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={80}
              className="w-full rounded-lg border border-border bg-background text-foreground text-sm font-semibold px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring" />
          ) : (
            <p className="text-base font-bold text-foreground">{generated.name}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {isEditing ? (
            <input type="text" value={editCategoryLabel} onChange={(e) => setEditCategoryLabel(e.target.value)} placeholder="Categoría"
              className="flex-1 min-w-[120px] rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring" />
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-brand/10 text-brand border border-brand/20">
              <Tag className="size-3" />{generated.categoryLabel}
            </span>
          )}
          {(generated.brand || isEditing) && (
            isEditing ? (
              <input type="text" value={editBrand} onChange={(e) => setEditBrand(e.target.value)} placeholder="Marca (opcional)"
                className="flex-1 min-w-[120px] rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring" />
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                {generated.brand}
              </span>
            )
          )}
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Descripción</p>
          {isEditing ? (
            <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3}
              className="w-full rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          ) : (
            <p className="text-sm text-foreground leading-relaxed">{generated.description}</p>
          )}
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Precio detectado</p>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)}
                placeholder="Sin precio" min={0}
                className="flex-1 rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring" />
              <span className="text-xs text-muted-foreground font-mono">{generated.currency}</span>
            </div>
          ) : (
            <p className="text-sm font-semibold text-foreground">
              {generated.price !== null
                ? formatCurrency(generated.price, generated.currency)
                : <span className="text-muted-foreground font-normal text-xs">No detectado</span>}
            </p>
          )}
        </div>

        {generated.keywords.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Keywords</p>
            <div className="flex flex-wrap gap-1.5">
              {generated.keywords.map((kw) => (
                <span key={kw} className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60">{kw}</span>
              ))}
            </div>
          </div>
        )}

        {generated.suggestedAudience && (
          <div className="flex items-start gap-2 pt-1 border-t border-border/40">
            <Users className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">{generated.suggestedAudience}</p>
          </div>
        )}
      </div>

      {saveError && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5">
          <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">{saveError}</p>
        </div>
      )}

      {isEditing ? (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="gap-1.5 flex-1">
            <X className="size-3.5" />Cancelar
          </Button>
          <Button size="sm" onClick={handleSaveEdit} disabled={!editName.trim() || !editDescription.trim()} className="gap-1.5 flex-1">
            <Check className="size-3.5" />Guardar edición
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { setPhase('form'); setGenerated(null) }} className="gap-1.5">
            <ArrowLeft className="size-3.5" />Volver
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            setEditName(generated.name); setEditDescription(generated.description)
            setEditCategoryLabel(generated.categoryLabel); setEditBrand(generated.brand ?? '')
            setEditPrice(generated.price !== null ? String(generated.price) : ''); setIsEditing(true)
          }} className="gap-1.5">
            <Edit2 className="size-3.5" />Editar
          </Button>
          <Button size="sm" onClick={handleAccept} disabled={!canAccept} className="gap-1.5 flex-1">
            <CheckCircle className="size-4" />Aceptar producto
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Existing Product List ─────────────────────────────────────────────────────

function ExistingProductList({
  activeProducts,
  selectedProduct,
  onSelect,
}: {
  activeProducts: ProductRow[]
  selectedProduct: SelectedProduct | null
  onSelect: (p: ProductRow) => void
}) {
  if (activeProducts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
        <Package className="size-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No tienes productos activos.</p>
        <p className="text-xs text-muted-foreground mt-1">
          Sube una imagen o describe tu producto para crear uno.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
        Tus productos activos ({activeProducts.length})
      </p>
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {activeProducts.map((p) => {
          const isChosen = selectedProduct?.id === p.id
          const image = getFirstImage(p.images)
          const hasVisualDNA = !!(p.visual_dna)

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p)}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all duration-200',
                isChosen
                  ? 'border-brand bg-brand/5 shadow-sm'
                  : 'border-border bg-card hover:border-brand/40 hover:bg-muted/30',
              )}
            >
              <div className="size-14 rounded-lg bg-muted/60 overflow-hidden shrink-0 border border-border/40">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt={p.name} className="size-full object-cover" />
                ) : (
                  <div className="size-full flex items-center justify-center">
                    <Package className="size-6 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-semibold truncate', isChosen ? 'text-brand' : 'text-foreground')}>
                  {p.name}
                </p>
                {p.category && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.category}</p>
                )}
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {p.price != null && (
                    <p className="text-xs font-semibold text-foreground">
                      {formatCurrency(p.price, p.currency ?? 'USD')}
                    </p>
                  )}
                  {hasVisualDNA && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-brand bg-brand/10 rounded-full px-1.5 py-0.5">
                      <Fingerprint className="size-2.5" />ADN Visual
                    </span>
                  )}
                </div>
              </div>
              {isChosen ? (
                <CheckCircle className="size-5 text-brand shrink-0" />
              ) : (
                <ChevronRight className="size-4 text-muted-foreground/40 shrink-0" />
              )}
            </button>
          )
        })}
      </div>

      {selectedProduct && (
        <div className="rounded-lg border border-brand/20 bg-brand/5 px-3 py-2 flex items-center gap-2">
          <CheckCircle className="size-3.5 text-brand shrink-0" />
          <span className="text-xs font-medium text-brand truncate">
            Seleccionado: {selectedProduct.name}
          </span>
        </div>
      )}
    </div>
  )
}

// ── Product Accepted Summary (after product is confirmed) ─────────────────────

function ProductAcceptedSummary({
  product,
  onReset,
}: {
  product: SelectedProduct
  onReset: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border-2 border-success/30 bg-success/5 p-4 flex items-center gap-3">
        <CheckCircle className="size-5 text-success shrink-0" />
        <div className="flex-1 min-w-0">
          {product.image && (
            <div className="size-10 rounded-lg overflow-hidden border border-border bg-muted/30 float-right ml-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            </div>
          )}
          <p className="text-sm font-semibold text-foreground">{product.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Listo · Guardado en tu biblioteca</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
      >
        Elegir otra opción
      </button>
    </div>
  )
}

// ── Option Cards ──────────────────────────────────────────────────────────────

function OptionCards({
  onSelect,
  activeProductsCount,
}: {
  onSelect: (mode: ProductMode) => void
  activeProductsCount: number
}) {
  return (
    <div className="space-y-3">
      {/* TWO primary equal cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Card 1: Upload image */}
        <button
          type="button"
          onClick={() => onSelect('image')}
          className={cn(
            'group w-full text-left rounded-2xl border-2 border-brand/30 bg-gradient-to-br from-brand/5 to-purple-500/5',
            'hover:border-brand hover:from-brand/10 hover:to-purple-500/10 transition-all duration-200 p-5',
          )}
        >
          <div className="flex flex-col items-start gap-3">
            <div className="flex items-center justify-center size-12 rounded-xl bg-brand/15 group-hover:bg-brand/20 transition-colors">
              <ImagePlus className="size-6 text-brand" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-sm font-bold text-foreground">📸 Subir imagen</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand/15 text-brand border border-brand/20">
                  Recomendado
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Arrastra, pega o selecciona tu foto — la IA extrae nombre, descripción, categoría y ADN Visual.
              </p>
            </div>
          </div>
        </button>

        {/* Card 2: Describe product */}
        <button
          type="button"
          onClick={() => onSelect('ai')}
          className={cn(
            'group w-full text-left rounded-2xl border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-brand/5',
            'hover:border-purple-500/50 hover:from-purple-500/10 hover:to-brand/10 transition-all duration-200 p-5',
          )}
        >
          <div className="flex flex-col items-start gap-3">
            <div className="flex items-center justify-center size-12 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
              <Sparkles className="size-6 text-purple-500" />
            </div>
            <div>
              <span className="text-sm font-bold text-foreground block mb-1">✍️ Describir mi producto</span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Escribe en tus palabras y la IA completa automáticamente toda la información.
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Secondary: existing product */}
      {activeProductsCount > 0 && (
        <button
          type="button"
          onClick={() => onSelect('existing')}
          className="group w-full text-left rounded-xl border border-border bg-card hover:border-brand/30 hover:bg-muted/20 transition-all duration-200 p-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-8 rounded-lg bg-muted group-hover:bg-brand/10 transition-colors shrink-0">
              <Package className="size-4 text-muted-foreground group-hover:text-brand transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-foreground">Usar producto existente</span>
              <p className="text-[11px] text-muted-foreground">
                {activeProductsCount} producto{activeProductsCount !== 1 ? 's' : ''} en tu biblioteca
              </p>
            </div>
            <ChevronRight className="size-3.5 text-muted-foreground/50 group-hover:text-brand transition-colors shrink-0" />
          </div>
        </button>
      )}
      {activeProductsCount === 0 && (
        <button
          type="button"
          onClick={() => onSelect('existing')}
          className="group w-full text-left rounded-xl border border-dashed border-border bg-card/50 hover:border-brand/30 transition-all duration-200 p-3"
        >
          <div className="flex items-center gap-3">
            <Package className="size-4 text-muted-foreground/50 shrink-0" />
            <span className="text-xs text-muted-foreground">Elegir de mi biblioteca de productos</span>
          </div>
        </button>
      )}
    </div>
  )
}

// ── Main Step 1 Component ─────────────────────────────────────────────────────

export function Step1Product({ products, userId }: Step1ProductProps) {
  const { state, dispatch } = useCampaignBuilder()
  const { productMode, selectedProduct } = state
  const activeProducts = products.filter((p) => p.is_active)

  const productImageMode: ProductImageMode = state.productImageMode ?? 'image_ai_variants'

  function setProductMode(mode: ProductMode | null) {
    dispatch({ type: 'SET_PRODUCT_MODE', payload: mode })
  }

  function handleProductAccepted(product: SelectedProduct) {
    dispatch({ type: 'SET_SELECTED_PRODUCT', payload: product })
    // Auto-advance to step 2 — only for image mode which confirms inline
    dispatch({ type: 'NEXT_STEP' })
  }

  function handleExistingSelect(p: ProductRow) {
    dispatch({
      type: 'SET_SELECTED_PRODUCT',
      payload: {
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        price: p.price,
        currency: p.currency,
        image: getFirstImage(p.images),
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1.5">
        <h2 className="text-xl font-semibold text-foreground">¿Qué quieres vender?</h2>
        <p className="text-sm text-muted-foreground">
          Cuéntanos sobre tu producto para crear la campaña perfecta
        </p>
      </div>

      {/* ── No mode selected: show 3 option cards ── */}
      {!productMode && (
        <OptionCards
          onSelect={setProductMode}
          activeProductsCount={activeProducts.length}
        />
      )}

      {/* ── IMAGE mode ── */}
      {productMode === 'image' && (
        <>
          {selectedProduct ? (
            <ProductAcceptedSummary
              product={selectedProduct}
              onReset={() => setProductMode(null)}
            />
          ) : (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setProductMode(null)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-3.5" />
                Cambiar opción
              </button>
              <ImageIngestionFlow
                userId={userId}
                onProductAccepted={handleProductAccepted}
                productImageMode={productImageMode}
                onProductImageModeChange={(mode) => dispatch({ type: 'SET_PRODUCT_IMAGE_MODE', payload: mode })}
              />
            </div>
          )}
        </>
      )}

      {/* ── AI mode ── */}
      {productMode === 'ai' && (
        <>
          {selectedProduct ? (
            <ProductAcceptedSummary
              product={selectedProduct}
              onReset={() => setProductMode(null)}
            />
          ) : (
            <AIProductCreator
              onProductAccepted={(p) => dispatch({ type: 'SET_SELECTED_PRODUCT', payload: p })}
              onBack={() => setProductMode(null)}
            />
          )}
        </>
      )}

      {/* ── EXISTING mode ── */}
      {productMode === 'existing' && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setProductMode(null)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Cambiar opción
          </button>
          <ExistingProductList
            activeProducts={activeProducts}
            selectedProduct={selectedProduct}
            onSelect={handleExistingSelect}
          />
        </div>
      )}

      {/* ── MANUAL mode (legacy fallback, not shown in UI) ── */}
      {productMode === 'manual' && (
        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Datos del producto</p>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">
              Nombre del producto <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={state.productName}
              onChange={(e) => dispatch({ type: 'SET_PRODUCT_NAME', payload: e.target.value })}
              placeholder="Ej: Perfume Dior Sauvage 100ml"
              maxLength={150}
              className="w-full rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2.5 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">
              Descripción <span className="text-muted-foreground font-normal ml-1">(opcional)</span>
            </label>
            <textarea
              value={state.productDescription}
              onChange={(e) => dispatch({ type: 'SET_PRODUCT_DESCRIPTION', payload: e.target.value })}
              placeholder="Describe las características principales..."
              rows={3}
              className="w-full rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setProductMode(null)} className="gap-1.5">
            <ArrowLeft className="size-3.5" />Volver
          </Button>
        </div>
      )}
    </div>
  )
}

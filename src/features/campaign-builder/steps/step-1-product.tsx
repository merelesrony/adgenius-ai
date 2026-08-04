'use client'

import { useState, useEffect, useRef } from 'react'
import type { ComponentType } from 'react'
import {
  Package, Sparkles, PenLine, CheckCircle, ChevronRight,
  Loader2, AlertCircle, Tag, Users, ArrowLeft, Edit2, Check, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/currency'
import { Button } from '@/components/ui/button'
import { useCampaignBuilder } from '../context'
import { createProductFromBuilderAction } from '../actions'
import type { ProductMode, SelectedProduct } from '../types'
import type { Database } from '@/types/database'
import type { ProductFromDescriptionResult } from '@/lib/ai/AIManager'

type ProductRow = Database['public']['Tables']['products']['Row']

interface Step1ProductProps {
  products: ProductRow[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getFirstImage(images: ProductRow['images']): string | null {
  if (!images) return null
  if (Array.isArray(images) && images.length > 0) return images[0] as string
  return null
}

// ── Mode selector data ────────────────────────────────────────────────────────

const MODES: {
  id: ProductMode
  icon: ComponentType<{ className?: string }>
  label: string
  description: string
}[] = [
  {
    id: 'existing',
    icon: Package,
    label: 'Elegir producto existente',
    description: 'Selecciona un producto de tu biblioteca',
  },
  {
    id: 'ai',
    icon: Sparkles,
    label: 'Crear producto con IA',
    description: 'Describe lo que vendes y la IA crea el perfil automáticamente',
  },
  {
    id: 'manual',
    icon: PenLine,
    label: 'Crear producto manualmente',
    description: 'Ingresa los datos del producto tú mismo',
  },
]

const ANALYSIS_STEPS = [
  'Analizando producto...',
  'Detectando categoría...',
  'Creando ficha comercial...',
] as const

// ── AI Product Creator sub-component ─────────────────────────────────────────

type AIPhase = 'form' | 'analyzing' | 'review' | 'saving'

interface AIProductCreatorProps {
  onProductAccepted: (product: SelectedProduct) => void
  onBack: () => void
}

function AIProductCreator({ onProductAccepted, onBack }: AIProductCreatorProps) {
  const [phase, setPhase] = useState<AIPhase>('form')
  const [userDescription, setUserDescription] = useState('')
  const [analysisStep, setAnalysisStep] = useState(0)
  const [generated, setGenerated] = useState<ProductFromDescriptionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategoryLabel, setEditCategoryLabel] = useState('')
  const [editBrand, setEditBrand] = useState('')
  const [editPrice, setEditPrice] = useState('')

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Animate loading steps while API is working
  useEffect(() => {
    if (phase !== 'analyzing') {
      setAnalysisStep(0)
      return
    }
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
      // Seed edit fields
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

  function handleStartEdit() {
    if (!generated) return
    setEditName(generated.name)
    setEditDescription(generated.description)
    setEditCategoryLabel(generated.categoryLabel)
    setEditBrand(generated.brand ?? '')
    setEditPrice(generated.price !== null ? String(generated.price) : '')
    setIsEditing(true)
  }

  function handleCancelEdit() {
    setIsEditing(false)
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

  // ── FORM ──────────────────────────────────────────────────────────────────

  if (phase === 'form') {
    return (
      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center size-8 rounded-lg bg-brand/10 shrink-0">
            <Sparkles className="size-4 text-brand" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Describe tu producto</p>
            <p className="text-xs text-muted-foreground">
              La IA extraerá automáticamente toda la información
            </p>
          </div>
        </div>

        <div>
          <textarea
            ref={textareaRef}
            value={userDescription}
            onChange={(e) => setUserDescription(e.target.value)}
            placeholder={'Ejemplo: "Vendo perfumes Dior originales de 100ml, ideal para regalos y uso personal. Precio ₲450.000."'}
            rows={4}
            maxLength={1000}
            className="w-full rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2.5 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <div className="flex items-center justify-between mt-1">
            <p className="text-[11px] text-muted-foreground">
              Incluye nombre, precio y moneda si los conoces
            </p>
            <span className="text-[10px] text-muted-foreground">
              {userDescription.length}/1000
            </span>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5">
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="gap-1.5"
          >
            <ArrowLeft className="size-3.5" />
            Volver
          </Button>
          <Button
            size="sm"
            onClick={handleAnalyze}
            disabled={userDescription.trim().length < 5}
            className="gap-2 flex-1"
          >
            <Sparkles className="size-4" />
            Analizar producto
          </Button>
        </div>
      </div>
    )
  }

  // ── ANALYZING ──────────────────────────────────────────────────────────────

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
          {ANALYSIS_STEPS.map((label, i) => {
            const isDone = analysisStep > i
            const isCurrent = analysisStep === i
            const isPending = analysisStep < i
            return (
              <div
                key={label}
                className={cn(
                  'flex items-center gap-3 transition-all duration-300',
                  isPending && 'opacity-30',
                )}
              >
                <div className="shrink-0 size-5">
                  {isDone ? (
                    <CheckCircle className="size-5 text-success" />
                  ) : isCurrent ? (
                    <Loader2 className="size-5 text-brand animate-spin" />
                  ) : (
                    <div className="size-5 rounded-full border-2 border-muted-foreground/20" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-sm transition-colors',
                    isDone && 'text-foreground font-medium',
                    isCurrent && 'text-brand font-medium',
                    isPending && 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              </div>
            )
          })}
        </div>

        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand to-purple-500 rounded-full transition-all duration-700"
            style={{ width: `${((analysisStep + 1) / ANALYSIS_STEPS.length) * 90}%` }}
          />
        </div>
      </div>
    )
  }

  // ── SAVING ──────────────────────────────────────────────────────────────────

  if (phase === 'saving') {
    return (
      <div className="rounded-xl border border-border bg-card p-8 flex flex-col items-center gap-4">
        <Loader2 className="size-10 text-brand animate-spin" />
        <p className="text-sm font-medium text-foreground">Guardando producto...</p>
      </div>
    )
  }

  // ── REVIEW ──────────────────────────────────────────────────────────────────

  if (!generated) return null

  const canAccept = generated.name.trim() && generated.description.trim() && generated.category

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <CheckCircle className="size-4 text-success" />
        <p className="text-sm font-semibold text-foreground">Producto generado</p>
        <span className={cn(
          'ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full border',
          generated.confidence === 'high'
            ? 'bg-success/10 text-success border-success/20'
            : generated.confidence === 'medium'
            ? 'bg-amber-500/10 text-amber-600 border-amber-300/40'
            : 'bg-muted text-muted-foreground border-border',
        )}>
          {generated.confidence === 'high'
            ? 'Alta confianza'
            : generated.confidence === 'medium'
            ? 'Confianza media'
            : 'Confianza baja'}
        </span>
      </div>

      {/* Product card */}
      <div className="rounded-xl border-2 border-brand/20 bg-brand/5 p-4 space-y-4">

        {/* Name */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Nombre</p>
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={80}
              className="w-full rounded-lg border border-border bg-background text-foreground text-sm font-semibold px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          ) : (
            <p className="text-base font-bold text-foreground">{generated.name}</p>
          )}
        </div>

        {/* Category + Brand row */}
        <div className="flex flex-wrap gap-2">
          {isEditing ? (
            <input
              type="text"
              value={editCategoryLabel}
              onChange={(e) => setEditCategoryLabel(e.target.value)}
              placeholder="Categoría"
              className="flex-1 min-w-[120px] rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-brand/10 text-brand border border-brand/20">
              <Tag className="size-3" />
              {generated.categoryLabel}
            </span>
          )}
          {(generated.brand || isEditing) && (
            isEditing ? (
              <input
                type="text"
                value={editBrand}
                onChange={(e) => setEditBrand(e.target.value)}
                placeholder="Marca (opcional)"
                className="flex-1 min-w-[120px] rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                {generated.brand}
              </span>
            )
          )}
        </div>

        {/* Description */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Descripción</p>
          {isEditing ? (
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          ) : (
            <p className="text-sm text-foreground leading-relaxed">{generated.description}</p>
          )}
        </div>

        {/* Price (editable) */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Precio detectado</p>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                placeholder="Sin precio"
                min={0}
                className="flex-1 rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-xs text-muted-foreground font-mono">{generated.currency}</span>
            </div>
          ) : (
            <p className="text-sm font-semibold text-foreground">
              {generated.price !== null
                ? formatCurrency(generated.price, generated.currency)
                : <span className="text-muted-foreground font-normal text-xs">No detectado</span>
              }
            </p>
          )}
        </div>

        {/* Keywords */}
        {generated.keywords.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Keywords</p>
            <div className="flex flex-wrap gap-1.5">
              {generated.keywords.map((kw) => (
                <span
                  key={kw}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Suggested audience */}
        {generated.suggestedAudience && (
          <div className="flex items-start gap-2 pt-1 border-t border-border/40">
            <Users className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">{generated.suggestedAudience}</p>
          </div>
        )}
      </div>

      {/* Save error */}
      {saveError && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5">
          <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">{saveError}</p>
        </div>
      )}

      {/* Edit mode buttons */}
      {isEditing ? (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancelEdit}
            className="gap-1.5 flex-1"
          >
            <X className="size-3.5" />
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSaveEdit}
            disabled={!editName.trim() || !editDescription.trim()}
            className="gap-1.5 flex-1"
          >
            <Check className="size-3.5" />
            Guardar edición
          </Button>
        </div>
      ) : (
        /* Action buttons */
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setPhase('form'); setGenerated(null) }}
            className="gap-1.5"
          >
            <ArrowLeft className="size-3.5" />
            Volver
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleStartEdit}
            className="gap-1.5"
          >
            <Edit2 className="size-3.5" />
            Editar
          </Button>
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={!canAccept}
            className="gap-1.5 flex-1"
          >
            <CheckCircle className="size-4" />
            Aceptar producto
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Main Step 1 component ─────────────────────────────────────────────────────

export function Step1Product({ products }: Step1ProductProps) {
  const { state, dispatch } = useCampaignBuilder()
  const { productMode, selectedProduct, productName, productDescription } = state
  const activeProducts = products.filter((p) => p.is_active)

  function handleSelectProduct(p: ProductRow) {
    const payload: SelectedProduct = {
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      price: p.price,
      currency: p.currency,
      image: getFirstImage(p.images),
    }
    dispatch({ type: 'SET_SELECTED_PRODUCT', payload })
  }

  function handleProductAccepted(product: SelectedProduct) {
    dispatch({ type: 'SET_SELECTED_PRODUCT', payload: product })
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1.5">
        <h2 className="text-xl font-semibold text-foreground">¿Qué quieres vender?</h2>
        <p className="text-sm text-muted-foreground">
          Cuéntanos sobre tu producto o servicio para crear la campaña perfecta
        </p>
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-1 gap-3">
        {MODES.map(({ id, icon: Icon, label, description }) => {
          const isSelected = productMode === id

          return (
            <button
              key={id}
              type="button"
              onClick={() => dispatch({ type: 'SET_PRODUCT_MODE', payload: id })}
              className={cn(
                'relative w-full text-left rounded-xl border-2 p-4 transition-all duration-200',
                isSelected
                  ? 'border-brand bg-brand/5'
                  : 'border-border bg-card hover:border-brand/40 hover:bg-muted/30',
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'flex items-center justify-center size-10 rounded-xl shrink-0 transition-colors',
                    isSelected ? 'bg-brand text-white' : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{label}</span>
                    {id === 'ai' && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
                        Nuevo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
                {isSelected && <CheckCircle className="size-5 text-brand shrink-0 mt-0.5" />}
              </div>
            </button>
          )
        })}
      </div>

      {/* Existing product list */}
      {productMode === 'existing' && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
            Tus productos activos ({activeProducts.length})
          </p>

          {activeProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
              <Package className="size-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No tienes productos activos.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Crea uno con IA o ve a Productos.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {activeProducts.map((p) => {
                const isChosen = selectedProduct?.id === p.id
                const image = getFirstImage(p.images)
                const hasPrice = p.price !== null && p.price !== undefined

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProduct(p)}
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
                      <p className={cn(
                        'text-sm font-semibold truncate',
                        isChosen ? 'text-brand' : 'text-foreground',
                      )}>
                        {p.name}
                      </p>
                      {p.category && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.category}</p>
                      )}
                      {hasPrice && (
                        <p className="text-xs font-semibold text-foreground mt-1">
                          {formatCurrency(p.price!, p.currency ?? 'USD')}
                        </p>
                      )}
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
          )}

          {selectedProduct && (
            <div className="rounded-lg border border-brand/20 bg-brand/5 px-3 py-2 flex items-center gap-2">
              <CheckCircle className="size-3.5 text-brand shrink-0" />
              <span className="text-xs font-medium text-brand truncate">
                Seleccionado: {selectedProduct.name}
              </span>
            </div>
          )}
        </div>
      )}

      {/* AI product creator */}
      {productMode === 'ai' && (
        <>
          {selectedProduct ? (
            /* Already accepted a product — show summary + option to change */
            <div className="space-y-3">
              <div className="rounded-xl border-2 border-success/30 bg-success/5 p-4 flex items-center gap-3">
                <CheckCircle className="size-5 text-success shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {selectedProduct.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Producto creado con IA · Guardado en tu biblioteca
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_PRODUCT_MODE', payload: 'ai' })}
                className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
              >
                Crear otro producto
              </button>
            </div>
          ) : (
            <AIProductCreator
              onProductAccepted={handleProductAccepted}
              onBack={() => dispatch({ type: 'SET_PRODUCT_MODE', payload: null })}
            />
          )}
        </>
      )}

      {/* Manual product form */}
      {productMode === 'manual' && (
        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Datos del producto
          </p>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">
              Nombre del producto <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => dispatch({ type: 'SET_PRODUCT_NAME', payload: e.target.value })}
              placeholder="Ej: Perfume Dior Sauvage 100ml"
              maxLength={150}
              className="w-full rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2.5 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">
              Descripción
              <span className="text-muted-foreground font-normal ml-1">(opcional)</span>
            </label>
            <textarea
              value={productDescription}
              onChange={(e) => dispatch({ type: 'SET_PRODUCT_DESCRIPTION', payload: e.target.value })}
              placeholder="Describe las características principales del producto..."
              rows={3}
              className="w-full rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        </div>
      )}
    </div>
  )
}

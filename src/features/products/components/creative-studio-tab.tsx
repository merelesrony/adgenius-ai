'use client'

import { useState } from 'react'
import {
  Sparkles, Check, RefreshCw, AlertCircle, Download,
  Megaphone, ChevronDown, Package,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import {
  CREATIVE_PRESETS, CREATIVE_MODELS, FORMAT_DIMENSIONS, CATEGORY_TO_PRESET,
} from '@/constants/options'
import type { CreativePreset, CreativeModel, CreativeFormat } from '@/constants/options'
import { assignCreativeToCampaignAction } from '../actions'
import type { Database } from '@/types/database'

type ProductRow = Database['public']['Tables']['products']['Row']
type CampaignBasic = { id: string; name: string; status: string }

interface CreativeStudioTabProps {
  products: ProductRow[]
  campaigns: CampaignBasic[]
  userId: string
}

const FORMAT_OPTIONS: { value: CreativeFormat; label: string; icon: string }[] = [
  { value: 'square',    label: 'Cuadrado',    icon: '▪' },
  { value: 'landscape', label: 'Horizontal',  icon: '▬' },
  { value: 'portrait',  label: 'Vertical',    icon: '▮' },
  { value: 'story',     label: 'Historia',    icon: '▯' },
]

interface GeneratedCreative {
  id: string | null
  imageUrl: string
  prompt: string
  model: string
  format: string
}

interface GenerateResponse {
  imageUrl?: string
  prompt?: string
  error?: string
}

function CampaignPickerModal({
  open,
  campaigns,
  onClose,
  onPick,
  isLoading,
}: {
  open: boolean
  campaigns: CampaignBasic[]
  onClose: () => void
  onPick: (campaignId: string) => void
  isLoading: boolean
}) {
  const activeCampaigns = campaigns.filter((c) => ['draft', 'pending', 'active', 'paused'].includes(c.status))

  return (
    <Modal open={open} onClose={onClose} title="Usar en campaña" description="Selecciona la campaña donde quieres usar este creativo." size="md">
      {activeCampaigns.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No tienes campañas activas. Crea una campaña primero.
        </p>
      ) : (
        <div className="space-y-1.5">
          {activeCampaigns.map((c) => (
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

export function CreativeStudioTab({ products, campaigns }: CreativeStudioTabProps) {
  const activeProducts = products.filter((p) => p.is_active)

  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [preset, setPreset] = useState<CreativePreset>(CREATIVE_PRESETS[0])
  const [format, setFormat] = useState<CreativeFormat>('square')
  const [model, setModel] = useState<CreativeModel>(CREATIVE_PRESETS[0].defaultModel)
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState<GeneratedCreative | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [campaignModalOpen, setCampaignModalOpen] = useState(false)
  const [assigning, setAssigning] = useState(false)

  const selectedProduct = activeProducts.find((p) => p.id === selectedProductId)

  function selectProduct(productId: string) {
    setSelectedProductId(productId)
    const product = activeProducts.find((p) => p.id === productId)
    if (product?.category) {
      const presetId = CATEGORY_TO_PRESET[product.category]
      if (presetId) {
        const found = CREATIVE_PRESETS.find((p) => p.id === presetId)
        if (found) {
          setPreset(found)
          setModel(found.defaultModel)
        }
      }
    }
    setGenerated(null)
    setError(null)
  }

  function selectPreset(p: CreativePreset) {
    setPreset(p)
    setModel(p.defaultModel)
    setGenerated(null)
    setError(null)
  }

  async function handleGenerate() {
    if (!selectedProduct) {
      setError('Selecciona un producto para generar el creativo.')
      return
    }

    setGenerating(true)
    setError(null)
    setGenerated(null)

    try {
      const res = await fetch('/api/ai/creative', {
        method: 'POST',
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
          objective: 'sales',
        }),
      })

      const json = (await res.json()) as GenerateResponse
      if (!res.ok) throw new Error(json.error ?? 'Error generando imagen')

      setGenerated({
        id: null,
        imageUrl: json.imageUrl ?? '',
        prompt: json.prompt ?? '',
        model,
        format,
      })
      toast.success('Creativo generado')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generando imagen')
    } finally {
      setGenerating(false)
    }
  }

  async function handleDownload() {
    if (!generated) return
    const a = document.createElement('a')
    a.href = generated.imageUrl
    a.download = `creativo-${selectedProduct?.name ?? 'imagen'}-${Date.now()}.jpg`
    a.target = '_blank'
    a.click()
  }

  async function handleAssignToCampaign(campaignId: string) {
    if (!generated) return
    setAssigning(true)
    try {
      const result = await assignCreativeToCampaignAction(
        '', // id is null (freshly generated, already saved via API)
        campaignId,
        generated.imageUrl,
      )
      // Even if creative ID is empty, update campaign flyer_url directly
      const res = await fetch(`/api/ai/creative`, { method: 'GET' })
      if (res.ok) {
        const json = await res.json() as { creatives: Array<{ id: string; image_url: string }> }
        const match = json.creatives.find((c) => c.image_url === generated.imageUrl)
        if (match) {
          await assignCreativeToCampaignAction(match.id, campaignId, generated.imageUrl)
        }
      }
      if (result.success) {
        toast.success('Creativo asignado a la campaña')
        setCampaignModalOpen(false)
      } else {
        toast.error(result.error)
      }
    } finally {
      setAssigning(false)
    }
  }

  const { width, height } = FORMAT_DIMENSIONS[format]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
      {/* Left panel - Controls */}
      <div className="space-y-5">
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
                className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2.5 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
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
                {selectedProduct.category && (
                  <span className="inline-flex items-center rounded-full bg-brand/10 text-brand px-2 py-0.5 text-[10px] font-medium">
                    {selectedProduct.category}
                  </span>
                )}
              </div>
            )}

            {activeProducts.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No tienes productos activos. Crea uno en la pestaña Productos.
              </p>
            )}
          </div>
        </div>

        {/* Preset grid */}
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
                    preset.id === p.id
                      ? 'border-brand bg-brand/5'
                      : 'border-border hover:border-brand/30',
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
                        format === f.value
                          ? 'bg-brand/10 text-brand font-medium'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
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
                      model === m.value
                        ? 'bg-brand/10 text-brand font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
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
            con modelo <span className="font-medium text-foreground">{model}</span>
          </p>
        </div>

        {/* Generate button */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
            <AlertCircle className="size-3.5 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        <Button
          className="w-full gap-2 shadow-sm"
          onClick={handleGenerate}
          loading={generating}
          disabled={generating || !selectedProductId}
        >
          {!generating && <Sparkles className="size-4" />}
          {generating ? 'Generando creativo... (20–40 seg)' : '✨ Generar creativo'}
        </Button>
      </div>

      {/* Right panel - Preview */}
      <div className="space-y-4">
        {generating ? (
          <div className="rounded-2xl border border-border bg-card flex flex-col items-center justify-center gap-4 min-h-[400px] text-center p-8">
            <div className="relative">
              <div className="size-16 rounded-2xl bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center shadow-lg">
                <Sparkles className="size-8 text-white animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 size-4 rounded-full bg-brand animate-ping" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Generando creativo...</h3>
              <p className="text-sm text-muted-foreground mt-1">Claude analiza el producto y Pollinations renderiza la imagen</p>
            </div>
            <p className="text-xs text-muted-foreground">Esto puede tardar 20–40 segundos</p>
          </div>
        ) : generated ? (
          <div className="space-y-4">
            {/* Image preview */}
            <div className="relative rounded-2xl overflow-hidden border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={generated.imageUrl}
                alt="Creativo generado"
                className="w-full max-h-[500px] object-contain"
              />
              <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-brand text-white px-2.5 py-1 text-xs font-semibold shadow">
                <Sparkles className="size-3" />
                IA · {generated.format} · {generated.model}
              </div>
            </div>

            {/* Prompt info */}
            {generated.prompt && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 font-medium">Prompt generado</p>
                <p className="text-[11px] text-foreground leading-relaxed line-clamp-3">{generated.prompt}</p>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                className="gap-2"
                onClick={() => setCampaignModalOpen(true)}
              >
                <Megaphone className="size-4" />
                Usar en campaña
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleGenerate}
                loading={generating}
                disabled={generating}
              >
                {!generating && <RefreshCw className="size-4" />}
                Generar variante
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2 text-xs"
                onClick={handleDownload}
              >
                <Download className="size-3.5" />
                Descargar imagen
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground text-center">
              ✅ Imagen guardada automáticamente en tu Biblioteca de Creativos
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 flex flex-col items-center justify-center gap-4 min-h-[400px] text-center p-8">
            <div className="size-16 rounded-2xl bg-gradient-to-br from-brand/10 to-purple-500/10 border border-brand/20 flex items-center justify-center">
              <Sparkles className="size-8 text-brand/60" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Tu creativo aparecerá aquí</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Selecciona un producto, elige el estilo visual y haz click en &quot;Generar creativo&quot;.
              </p>
            </div>
            <div className="text-left space-y-2 w-full max-w-xs">
              {[
                '1. Selecciona el producto',
                '2. Elige el preset de estilo',
                '3. Configura formato y modelo',
                '4. Genera el creativo con IA',
              ].map((step) => (
                <p key={step} className="text-xs text-muted-foreground">{step}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Campaign picker modal */}
      <CampaignPickerModal
        open={campaignModalOpen}
        campaigns={campaigns}
        onClose={() => setCampaignModalOpen(false)}
        onPick={handleAssignToCampaign}
        isLoading={assigning}
      />
    </div>
  )
}

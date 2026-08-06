'use client'

import { useState } from 'react'
import { Sparkles, Loader2, AlertCircle, Image as ImageIcon, Info, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GenerateResult {
  imageUrl: string
  prompt: string
  provider: 'openai' | 'pollinations'
}

const STYLE_PRESETS = [
  { label: 'Luxury Premium', value: 'Luxury premium advertisement, high-end brand aesthetics, elegant minimalist photography' },
  { label: 'Lifestyle', value: 'Warm lifestyle photography, authentic human connection, natural light, aspirational everyday scene' },
  { label: 'E-commerce Clean', value: 'Clean white studio background, sharp product focus, professional e-commerce photography' },
  { label: 'Bold & Vibrant', value: 'Bold vibrant colors, energetic composition, Gen-Z aesthetic, eye-catching social media ad' },
  { label: 'Food & Beverage', value: 'Appetizing food photography, moody lighting, hero shot, chef\'s table styling' },
  { label: 'Tech & Minimal', value: 'Minimalist technology product shot, dark background, futuristic blue tones, sleek and precise' },
]

export default function TestImagePage() {
  const [productName, setProductName] = useState('')
  const [visualStyle, setVisualStyle] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<GenerateResult[]>([])

  async function handleGenerate() {
    if (!productName.trim() || !visualStyle.trim()) return
    setIsGenerating(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/ai/test-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: productName.trim(), visualStyle: visualStyle.trim() }),
      })
      const data = await res.json() as GenerateResult & { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Error desconocido')
      setResult(data)
      setHistory((h) => [data, ...h].slice(0, 6))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setIsGenerating(false)
    }
  }

  const providerLabel = (p: string) =>
    p === 'openai' ? '✨ OpenAI Images (gpt-image-1)' : '⚡ Pollinations (FLUX)'

  const providerColor = (p: string) =>
    p === 'openai'
      ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Zap className="size-5 text-brand" />
          <h1 className="text-2xl font-semibold text-foreground">Prueba de Generación de Imágenes</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Valida la calidad de OpenAI vs Pollinations antes de cambiar producción.
          Esta página es solo para pruebas internas — no afecta campañas existentes.
        </p>
      </div>

      {/* Active provider banner */}
      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
        <Info className="size-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Proveedor activo: </span>
          {process.env.NEXT_PUBLIC_IMAGE_PROVIDER_HINT === 'openai'
            ? 'OpenAI Images (OPENAI_API_KEY configurada)'
            : 'Según configuración — si OPENAI_API_KEY está en .env.local, se usará OpenAI; si no, Pollinations como fallback.'}
          <br />
          El proveedor real se mostrará en el resultado.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Parámetros de prueba</h2>

            {/* Product name */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Producto o servicio
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Ej: Perfume Dior Sauvage, Zapatillas Nike Air Max, Pizza artesanal..."
                className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground/50"
              />
            </div>

            {/* Visual style presets */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Estilo visual
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {STYLE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setVisualStyle(preset.value)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                      visualStyle === preset.value
                        ? 'bg-brand text-white border-brand'
                        : 'bg-muted/40 text-muted-foreground border-border hover:border-brand/50 hover:text-foreground'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <textarea
                value={visualStyle}
                onChange={(e) => setVisualStyle(e.target.value)}
                placeholder="Describe el estilo visual deseado..."
                rows={3}
                className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground/50 resize-none"
              />
            </div>

            <Button
              className="w-full gap-2"
              onClick={handleGenerate}
              disabled={!productName.trim() || !visualStyle.trim() || isGenerating}
            >
              {isGenerating ? (
                <><Loader2 className="size-4 animate-spin" />Generando imagen... (30–60s)</>
              ) : (
                <><Sparkles className="size-4" />Generar imagen</>
              )}
            </Button>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2">
                <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}
          </div>

          {/* Prompt used */}
          {result?.prompt && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prompt enviado</p>
              <p className="text-xs text-foreground leading-relaxed">{result.prompt}</p>
              <div className="pt-1 flex items-center gap-2">
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${providerColor(result.provider)}`}>
                  {providerLabel(result.provider)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Result */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center gap-2">
              <ImageIcon className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Resultado</h2>
              {result && (
                <span className={`ml-auto text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${providerColor(result.provider)}`}>
                  {providerLabel(result.provider)}
                </span>
              )}
            </div>

            {isGenerating ? (
              <div className="aspect-square flex flex-col items-center justify-center gap-3 bg-muted/20">
                <Loader2 className="size-8 animate-spin text-brand" />
                <p className="text-sm text-muted-foreground">Generando con IA...</p>
                <p className="text-xs text-muted-foreground/60">Puede tardar 30–60 segundos</p>
              </div>
            ) : result ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.imageUrl}
                alt={`Generated ad for ${productName}`}
                className="w-full aspect-square object-cover"
              />
            ) : (
              <div className="aspect-square flex flex-col items-center justify-center gap-2 bg-muted/10">
                <ImageIcon className="size-12 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">La imagen aparecerá aquí</p>
              </div>
            )}
          </div>

          {result?.imageUrl && (
            <div className="flex gap-2">
              <a
                href={result.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center text-xs font-medium py-2 px-3 rounded-lg border border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                Abrir imagen completa
              </a>
              <button
                type="button"
                onClick={() => {
                  setProductName('')
                  setVisualStyle('')
                  setResult(null)
                  setError(null)
                }}
                className="text-xs font-medium py-2 px-3 rounded-lg border border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                Nueva prueba
              </button>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      {history.length > 1 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Historial de esta sesión</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {history.slice(1).map((item, i) => (
              <div key={i} className="rounded-xl border border-border overflow-hidden group cursor-pointer" onClick={() => setResult(item)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageUrl} alt="" className="w-full aspect-square object-cover" />
                <div className="p-2">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${providerColor(item.provider)}`}>
                    {item.provider}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

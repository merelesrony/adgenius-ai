'use client'

import { useState, useEffect } from 'react'
import { Upload, Sparkles, Check, RefreshCw, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ImageUpload } from './image-upload'
import {
  CREATIVE_PRESETS,
  CREATIVE_MODELS,
  FORMAT_DIMENSIONS,
  CATEGORY_TO_PRESET,
} from '@/constants/options'
import type { CreativePreset, CreativeModel, CreativeFormat } from '@/constants/options'

type Tab = 'upload' | 'ai'

interface CreativeSelectorProps {
  images: string[]
  onChange: (urls: string[]) => void
  userId: string
  productName?: string
  productDescription?: string
  productCategory?: string
  targetAudience?: string
  objective?: string
  maxImages?: number
}

const FORMAT_OPTIONS: { value: CreativeFormat; label: string }[] = [
  { value: 'square',    label: 'Cuadrado' },
  { value: 'landscape', label: 'Horizontal' },
  { value: 'portrait',  label: 'Vertical' },
  { value: 'story',     label: 'Historia' },
]

interface GenerateResponse {
  imageUrl?: string
  prompt?: string
  error?: string
}

export function CreativeSelector({
  images,
  onChange,
  userId,
  productName = '',
  productDescription = '',
  productCategory = '',
  targetAudience = '',
  objective = 'sales',
  maxImages = 5,
}: CreativeSelectorProps) {
  const [tab, setTab] = useState<Tab>('upload')
  const [preset, setPreset] = useState<CreativePreset>(CREATIVE_PRESETS[0])
  const [format, setFormat] = useState<CreativeFormat>('square')
  const [model, setModel] = useState<CreativeModel>(CREATIVE_PRESETS[0].defaultModel)

  // Auto-select preset based on product category
  useEffect(() => {
    if (!productCategory) return
    const presetId = CATEGORY_TO_PRESET[productCategory]
    if (!presetId) return
    const found = CREATIVE_PRESETS.find((p) => p.id === presetId)
    if (found && found.id !== preset.id) {
      setPreset(found)
      setModel(found.defaultModel)
    }
  // Only run when category changes, not on every preset change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productCategory])
  const [generating, setGenerating] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [error, setError] = useState<string | null>(null)

  function selectPreset(p: CreativePreset) {
    setPreset(p)
    setModel(p.defaultModel)
    setGeneratedUrl(null)
    setError(null)
  }

  async function handleGenerate() {
    if (!productName.trim()) {
      setError('Completa el nombre del producto antes de generar')
      return
    }
    if (!productDescription.trim()) {
      setError('Completa la descripción del producto antes de generar')
      return
    }

    setGenerating(true)
    setError(null)
    setGeneratedUrl(null)

    try {
      const res = await fetch('/api/ai/creative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: productName,
          description: productDescription,
          visualStyle: preset.visualStyle,
          format,
          targetAudience: targetAudience || 'público general hispanohablante',
          objective,
          model,
          presetId: preset.id,
        }),
      })

      const json = (await res.json()) as GenerateResponse
      if (!res.ok) throw new Error(json.error ?? 'Error generando imagen')

      setGeneratedUrl(json.imageUrl ?? '')
      setGeneratedPrompt(json.prompt ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generando imagen')
    } finally {
      setGenerating(false)
    }
  }

  function handleUseImage() {
    if (!generatedUrl || images.includes(generatedUrl) || images.length >= maxImages) return
    onChange([...images, generatedUrl])
    setTab('upload')
    setGeneratedUrl(null)
  }

  const { width, height } = FORMAT_DIMENSIONS[format]

  return (
    <div className="space-y-3">
      {/* Tab switcher */}
      <div className="grid grid-cols-2 rounded-lg border border-border bg-muted/40 p-1 gap-1">
        <button
          type="button"
          onClick={() => setTab('upload')}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all',
            tab === 'upload'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Upload className="size-3.5" />
          Subir imagen
        </button>
        <button
          type="button"
          onClick={() => setTab('ai')}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all',
            tab === 'ai'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Sparkles className="size-3.5" />
          Generar con IA
        </button>
      </div>

      {/* Upload tab */}
      {tab === 'upload' && (
        <ImageUpload images={images} onChange={onChange} userId={userId} maxImages={maxImages} />
      )}

      {/* AI tab */}
      {tab === 'ai' && (
        <div className="space-y-4">
          {/* Preset grid */}
          <div>
            <p className="text-xs font-medium text-foreground mb-2">Estilo visual</p>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
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
                    <span className="text-xs font-semibold text-foreground leading-tight">
                      {p.label}
                    </span>
                    {preset.id === p.id && <Check className="size-3 text-brand shrink-0" />}
                  </div>
                  <span className="text-[11px] text-muted-foreground leading-snug">
                    {p.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Format + Model selectors */}
          <div className="grid grid-cols-2 gap-4">
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
                      <span className="font-mono text-[10px] opacity-50">
                        {dims.width}×{dims.height}
                      </span>
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

          {/* Current selection summary */}
          <p className="text-[11px] text-muted-foreground">
            Generará una imagen{' '}
            <span className="font-medium text-foreground">{width}×{height}px</span>{' '}
            con modelo <span className="font-medium text-foreground">{model}</span>
          </p>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-3">
              <AlertCircle className="size-3.5 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          {/* Generate button */}
          <div className="space-y-1.5">
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={handleGenerate}
              loading={generating}
              disabled={generating}
            >
              {!generating && <Sparkles className="size-4" />}
              {generating ? 'Generando imagen con IA...' : 'Generar imagen'}
            </Button>
            {generating && (
              <p className="text-center text-xs text-muted-foreground">
                Esto puede tardar 20–40 segundos
              </p>
            )}
          </div>

          {/* Generated preview */}
          {generatedUrl && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={generatedUrl}
                  alt="Imagen generada con IA"
                  className="w-full max-h-80 object-contain"
                />
                <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white">
                  <Sparkles className="size-2.5" />
                  IA
                </span>
              </div>

              {generatedPrompt && (
                <p className="text-[11px] text-muted-foreground italic line-clamp-2 px-0.5">
                  Prompt: {generatedPrompt}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={handleUseImage}
                  disabled={images.includes(generatedUrl) || images.length >= maxImages}
                >
                  <Check className="size-3.5" />
                  {images.includes(generatedUrl) ? 'Ya añadida' : 'Usar esta imagen'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={handleGenerate}
                  loading={generating}
                  disabled={generating}
                >
                  {!generating && <RefreshCw className="size-3.5" />}
                  Regenerar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

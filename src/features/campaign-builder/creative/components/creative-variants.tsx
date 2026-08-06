'use client'

import { useState } from 'react'
import { CheckCircle, Pencil, RefreshCw, Eye, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CreativeEditor } from './creative-editor'
import type { GeneratedCreative } from '../creative-types'

const VARIANT_COLORS: Record<string, string> = {
  premium:   'border-amber-400/40 bg-amber-50/30 dark:bg-amber-900/10',
  lifestyle: 'border-blue-400/40 bg-blue-50/30 dark:bg-blue-900/10',
  minimal:   'border-muted',
}

interface CreativeVariantsProps {
  creatives: GeneratedCreative[]
  selectedId: string | null
  onSelect: (id: string) => void
  onEdit: (id: string, patch: Partial<Pick<GeneratedCreative, 'headline' | 'primaryText' | 'description' | 'cta'>>) => void
  onRegenerate: (id: string) => Promise<void>
  onPreview: (creative: GeneratedCreative) => void
}

function CreativeImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden">
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted to-muted/60">
          <Sparkles className="size-6 text-muted-foreground/40 animate-pulse" />
          <p className="text-[10px] text-muted-foreground/60">Generando imagen...</p>
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={cn('w-full h-full object-cover transition-opacity duration-700', loaded ? 'opacity-100' : 'opacity-0')}
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
}

export function CreativeVariants({
  creatives, selectedId, onSelect, onEdit, onRegenerate, onPreview,
}: CreativeVariantsProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null)

  async function handleRegenerate(id: string) {
    setRegeneratingId(id)
    try {
      await onRegenerate(id)
    } finally {
      setRegeneratingId(null)
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {creatives.map((creative) => {
        const isSelected = selectedId === creative.id
        const isEditing = editingId === creative.id

        return (
          <div
            key={creative.id}
            className={cn(
              'rounded-xl border bg-card overflow-hidden transition-all duration-200',
              VARIANT_COLORS[creative.variant] ?? 'border-border',
              isSelected && 'ring-2 ring-brand ring-offset-1',
            )}
          >
            {/* Variant badge + selected indicator */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {creative.variantLabel}
              </span>
              {isSelected && (
                <CheckCircle className="size-3.5 text-brand" />
              )}
            </div>

            {/* Image */}
            <div className="p-2">
              <div className="relative">
                <CreativeImage key={creative.imageUrl} src={creative.imageUrl} alt={creative.headline} />
                {regeneratingId === creative.id && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center rounded-lg">
                    <RefreshCw className="size-5 text-brand animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Copy */}
            <div className="px-3 pb-2 space-y-1.5">
              <p className="text-sm font-bold text-foreground leading-tight">{creative.headline}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">{creative.primaryText}</p>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
                  {creative.cta}
                </span>
                <span className="text-[10px] text-muted-foreground truncate">{creative.style}</span>
              </div>
            </div>

            {/* Inline editor */}
            {isEditing && (
              <div className="px-3 pb-3">
                <CreativeEditor
                  creative={creative}
                  onSave={(patch) => {
                    onEdit(creative.id, patch)
                    setEditingId(null)
                  }}
                  onClose={() => setEditingId(null)}
                />
              </div>
            )}

            {/* Action buttons */}
            {!isEditing && (
              <div className="px-3 pb-3 space-y-1.5">
                <Button
                  size="sm"
                  className="w-full gap-1.5 text-[11px]"
                  onClick={() => onSelect(creative.id)}
                  variant={isSelected ? 'default' : 'outline'}
                >
                  <CheckCircle className="size-3.5" />
                  {isSelected ? 'Seleccionado' : 'Usar este creativo'}
                </Button>
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[10px] gap-1 h-7"
                    onClick={() => setEditingId(creative.id)}
                  >
                    <Pencil className="size-3" /> Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[10px] gap-1 h-7"
                    onClick={() => handleRegenerate(creative.id)}
                  >
                    <RefreshCw className="size-3" /> Reimagen
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-[10px] gap-1 h-7"
                  onClick={() => onPreview(creative)}
                >
                  <Eye className="size-3" /> Vista previa Meta
                </Button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

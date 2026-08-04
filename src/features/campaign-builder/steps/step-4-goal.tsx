'use client'

import { Check, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCampaignBuilder } from '../context'
import { META_PLATFORMS } from '../constants'
import type { MetaPlatform } from '../types'

export function Step4Goal() {
  const { state, dispatch } = useCampaignBuilder()
  const { platforms } = state

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1.5">
        <h2 className="text-xl font-semibold text-foreground">¿Dónde aparecerá tu anuncio?</h2>
        <p className="text-sm text-muted-foreground">
          Selecciona las plataformas donde quieres publicar
        </p>
      </div>

      {/* Platform grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {META_PLATFORMS.map((platform) => {
          const isSelected = platforms.includes(platform.id as MetaPlatform)
          return (
            <button
              key={platform.id}
              type="button"
              onClick={() =>
                dispatch({ type: 'TOGGLE_PLATFORM', payload: platform.id as MetaPlatform })
              }
              className={cn(
                'relative w-full text-left rounded-xl border-2 p-4 transition-all duration-200',
                isSelected
                  ? 'border-brand bg-brand/5'
                  : 'border-border bg-card hover:border-brand/40 hover:bg-muted/30',
              )}
            >
              <div className="flex items-start gap-3">
                {/* Platform icon */}
                <div
                  className={cn(
                    'flex items-center justify-center size-10 rounded-xl text-white text-sm font-bold shrink-0',
                    platform.colorClass,
                  )}
                >
                  {platform.initial}
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <p className="text-sm font-semibold text-foreground">{platform.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{platform.description}</p>
                </div>
                {isSelected && (
                  <div className="absolute top-3 right-3 flex items-center justify-center size-5 rounded-full bg-brand">
                    <Check className="size-3 text-white" />
                  </div>
                )}
              </div>
              {/* Coming soon badge */}
              <div className="mt-2.5">
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50 uppercase tracking-wide">
                  Próximamente
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Info notice */}
      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <div className="flex items-start gap-3">
          <Info className="size-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Integración con Meta Ads</p>
            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
              La conexión directa con Meta Ads Manager estará disponible próximamente.
              Selecciona las plataformas deseadas y la campaña quedará lista para
              publicación manual.
            </p>
          </div>
        </div>
      </div>

      {/* Selection summary */}
      {platforms.length > 0 && (
        <div className="rounded-xl border border-brand/20 bg-brand/5 px-4 py-3">
          <p className="text-sm font-medium text-foreground">
            {platforms.length === 1
              ? '1 plataforma seleccionada'
              : `${platforms.length} plataformas seleccionadas`}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {platforms.map((id) => {
              const p = META_PLATFORMS.find((m) => m.id === id)
              return p ? (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-brand/10 text-brand border border-brand/20"
                >
                  {p.label}
                </span>
              ) : null
            })}
          </div>
        </div>
      )}
    </div>
  )
}

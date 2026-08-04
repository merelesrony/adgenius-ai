'use client'

import { Palette } from 'lucide-react'
import type { BrandKit } from '../creative-types'

interface BrandKitCardProps {
  brandKit: BrandKit
}

export function BrandKitCard({ brandKit }: BrandKitCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-muted/30">
        <Palette className="size-4 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex-1">
          Identidad de marca recomendada
        </span>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
          IA
        </span>
      </div>
      <div className="p-4 space-y-4">
        {/* Color swatches */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {brandKit.colors.map((color) => (
              <div
                key={color}
                className="size-8 rounded-lg border border-border/40 shadow-sm"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <div className="text-xs text-muted-foreground">
            {brandKit.colors.join(' · ')}
          </div>
        </div>

        {/* Attributes grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Estilo visual</p>
            <p className="text-sm font-semibold text-foreground">{brandKit.visualStyle}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Tono de voz</p>
            <p className="text-sm font-semibold text-foreground">{brandKit.toneOfVoice}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Fotografía</p>
            <p className="text-sm font-semibold text-foreground">{brandKit.photographyStyle}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Tipografía</p>
            <p className="text-sm font-semibold text-foreground">{brandKit.recommendedTypography}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { X, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { GeneratedCreative } from '../creative-types'

interface CreativeEditorProps {
  creative: GeneratedCreative
  onSave: (patch: Partial<Pick<GeneratedCreative, 'headline' | 'primaryText' | 'description' | 'cta'>>) => void
  onClose: () => void
}

const inputCls = 'w-full rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'
const labelCls = 'text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block font-semibold'

export function CreativeEditor({ creative, onSave, onClose }: CreativeEditorProps) {
  const [headline, setHeadline] = useState(creative.headline)
  const [primaryText, setPrimaryText] = useState(creative.primaryText)
  const [description, setDescription] = useState(creative.description)
  const [cta, setCta] = useState(creative.cta)

  function handleSave() {
    onSave({ headline, primaryText, description, cta })
    onClose()
  }

  return (
    <div className="space-y-3 pt-3 border-t border-border mt-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">Editar copy</p>
        <button
          type="button"
          onClick={onClose}
          className="size-6 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
        >
          <X className="size-3.5 text-muted-foreground" />
        </button>
      </div>

      <div>
        <label className={labelCls}>Título <span className="text-muted-foreground/60">(máx. 40 chars)</span></label>
        <input
          type="text"
          value={headline}
          maxLength={40}
          onChange={(e) => setHeadline(e.target.value)}
          className={inputCls}
        />
        <p className={cn('text-[10px] text-right mt-0.5', headline.length > 35 ? 'text-amber-500' : 'text-muted-foreground')}>
          {headline.length}/40
        </p>
      </div>

      <div>
        <label className={labelCls}>Texto principal <span className="text-muted-foreground/60">(máx. 250 chars)</span></label>
        <textarea
          value={primaryText}
          maxLength={250}
          rows={3}
          onChange={(e) => setPrimaryText(e.target.value)}
          className={cn(inputCls, 'resize-none')}
        />
        <p className={cn('text-[10px] text-right mt-0.5', primaryText.length > 220 ? 'text-amber-500' : 'text-muted-foreground')}>
          {primaryText.length}/250
        </p>
      </div>

      <div>
        <label className={labelCls}>Descripción <span className="text-muted-foreground/60">(máx. 90 chars)</span></label>
        <input
          type="text"
          value={description}
          maxLength={90}
          onChange={(e) => setDescription(e.target.value)}
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>CTA</label>
        <input
          type="text"
          value={cta}
          maxLength={30}
          onChange={(e) => setCta(e.target.value)}
          className={inputCls}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onClose} className="flex-1 gap-1.5">
          <X className="size-3.5" /> Cancelar
        </Button>
        <Button size="sm" onClick={handleSave} className="flex-1 gap-1.5">
          <Save className="size-3.5" /> Guardar
        </Button>
      </div>
    </div>
  )
}

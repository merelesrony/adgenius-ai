'use client'

import { Cloud, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCampaignBuilder } from '../context'

function formatLastSaved(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'ahora mismo'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  return new Date(isoString).toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

interface BuilderDraftsWidgetProps {
  error?: string | null
}

export function BuilderDraftsWidget({ error }: BuilderDraftsWidgetProps) {
  const { state } = useCampaignBuilder()
  const { isSaving, lastSaved, sessionId } = state

  // Show error state regardless of sessionId
  if (error) {
    return (
      <div
        className="inline-flex items-center gap-1.5 text-[11px] font-medium rounded-full px-2.5 py-1 border border-destructive/30 bg-destructive/5 text-destructive"
        title={error}
      >
        <AlertTriangle className="size-3 shrink-0" />
        <span>Error guardando</span>
      </div>
    )
  }

  // Nothing to show until autosave has touched the DB
  if (!sessionId && !isSaving) return null

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] font-medium rounded-full px-2.5 py-1 border transition-all duration-300',
        isSaving
          ? 'text-muted-foreground border-border bg-muted/40'
          : lastSaved
          ? 'text-success border-success/20 bg-success/5'
          : 'text-muted-foreground border-border bg-muted/40',
      )}
    >
      {isSaving ? (
        <>
          <Loader2 className="size-3 animate-spin" />
          <span>Guardando...</span>
        </>
      ) : lastSaved ? (
        <>
          <CheckCircle className="size-3 text-success" />
          <span>Guardado {formatLastSaved(lastSaved)}</span>
        </>
      ) : (
        <>
          <Cloud className="size-3" />
          <span>Borrador</span>
        </>
      )}
    </div>
  )
}

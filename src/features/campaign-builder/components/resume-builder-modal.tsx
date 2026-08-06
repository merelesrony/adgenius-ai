'use client'

import { Package, Clock, ArrowRight, Plus, Wand2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/currency'
import type { BuilderSession } from '../types'

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'ahora mismo'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `hace ${days} día${days !== 1 ? 's' : ''}`
}

function stepLabel(step: number): string {
  const labels: Record<number, string> = {
    1: 'Producto',
    2: 'Presupuesto',
    3: 'Destino',
    4: 'Plataformas',
    5: 'Estrategia IA',
    6: 'Revisión',
  }
  return labels[step] ?? `Paso ${step}`
}

interface ResumeBuilderModalProps {
  session: BuilderSession
  onResume: () => void
  onNew: () => void
}

export function ResumeBuilderModal({ session, onResume, onNew }: ResumeBuilderModalProps) {
  const product = session.selected_product
  const budget = session.budget
  const isPaused = session.status === 'paused'

  return (
    /* Full-screen overlay */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
        {/* Header */}
        <div className={`px-5 pt-5 pb-4 border-b border-border bg-gradient-to-br ${isPaused ? 'from-amber-500/5 to-orange-500/5' : 'from-brand/5 to-purple-500/5'}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`flex items-center justify-center size-10 rounded-xl shrink-0 ${isPaused ? 'bg-amber-500/10' : 'bg-gradient-to-br from-brand to-purple-600'}`}>
              {isPaused
                ? <AlertCircle className="size-5 text-amber-600 dark:text-amber-400" />
                : <Wand2 className="size-5 text-white" />
              }
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${isPaused ? 'text-amber-600 dark:text-amber-400' : 'text-brand'}`}>
                {isPaused ? 'Sesión interrumpida' : 'Smart Builder'}
              </p>
              <h2 className="text-base font-bold text-foreground leading-tight">
                {isPaused ? 'Campaña en pausa' : 'Campaña pendiente'}
              </h2>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {isPaused
              ? 'Encontramos una sesión que quedó interrumpida. Tu progreso está guardado — continúa donde lo dejaste.'
              : 'Encontramos una campaña que dejaste sin terminar. ¿Quieres continuar donde lo dejaste?'
            }
          </p>
        </div>

        {/* Session summary */}
        <div className="px-5 py-4 space-y-3">
          {/* Product */}
          {product ? (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
              <div className="size-9 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/40">
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image} alt={product.name} className="size-full object-cover" />
                ) : (
                  <div className="size-full flex items-center justify-center">
                    <Package className="size-4 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                {product.category && (
                  <p className="text-xs text-muted-foreground truncate">{product.category}</p>
                )}
                {product.price !== null && product.price !== undefined && (
                  <p className="text-xs font-semibold text-brand">
                    {formatCurrency(product.price, product.currency ?? 'USD')}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
              <Package className="size-4 text-muted-foreground/50 shrink-0" />
              <span className="text-sm text-muted-foreground">Sin producto seleccionado</span>
            </div>
          )}

          {/* Step + budget row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Paso guardado</p>
              <p className="text-sm font-bold text-foreground">{stepLabel(session.current_step)}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Presupuesto</p>
              <p className="text-sm font-bold text-foreground">
                {budget?.dailyBudget
                  ? formatCurrency(parseFloat(budget.dailyBudget), budget.currency ?? 'USD')
                  : '—'}
              </p>
            </div>
          </div>

          {/* Last updated */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5 shrink-0" />
            <span>Última actualización {formatRelativeTime(session.updated_at)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 space-y-2">
          <Button className="w-full gap-2" onClick={onResume}>
            Continuar campaña
            <ArrowRight className="size-4" />
          </Button>
          <Button variant="outline" className="w-full gap-2" onClick={onNew}>
            <Plus className="size-4" />
            Nueva campaña
          </Button>
        </div>
      </div>
    </div>
  )
}

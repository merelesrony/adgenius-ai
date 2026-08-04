'use client'

import { DollarSign, TrendingUp, Info } from 'lucide-react'
import { useCampaignBuilder } from '../context'
import { CURRENCIES } from '@/constants/options'
import { formatCurrency } from '@/lib/currency'

export function Step2Budget() {
  const { state, dispatch } = useCampaignBuilder()
  const { dailyBudget, currency, totalBudget } = state

  const daily = parseFloat(dailyBudget) || 0
  const total = parseFloat(totalBudget) || 0
  const estimatedDays =
    daily > 0 && total > 0 ? Math.floor(total / daily) : null
  const estimatedReachMin = Math.round(daily * 100)
  const estimatedReachMax = Math.round(daily * 500)

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1.5">
        <h2 className="text-xl font-semibold text-foreground">Define tu presupuesto</h2>
        <p className="text-sm text-muted-foreground">
          Establece cuánto quieres invertir en esta campaña
        </p>
      </div>

      {/* Inputs */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        {/* Daily budget + currency */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-medium text-foreground mb-1.5 block">
              Presupuesto diario <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <input
                type="number"
                value={dailyBudget}
                onChange={(e) =>
                  dispatch({ type: 'SET_DAILY_BUDGET', payload: e.target.value })
                }
                placeholder="0.00"
                min={1}
                step="0.01"
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">
              Moneda
            </label>
            <select
              value={currency}
              onChange={(e) =>
                dispatch({ type: 'SET_CURRENCY', payload: e.target.value })
              }
              className="w-full py-2.5 px-3 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.value}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Total budget */}
        <div>
          <label className="text-xs font-medium text-foreground mb-1.5 block">
            Presupuesto total
            <span className="text-muted-foreground font-normal ml-1">(opcional)</span>
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="number"
              value={totalBudget}
              onChange={(e) =>
                dispatch({ type: 'SET_TOTAL_BUDGET', payload: e.target.value })
              }
              placeholder="Sin límite total"
              min={0}
              step="0.01"
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Estimate card */}
      {daily > 0 && (
        <div className="rounded-xl border border-brand/20 bg-brand/5 p-4 space-y-3">
          <div className="flex items-center gap-2 text-brand">
            <TrendingUp className="size-4" />
            <span className="text-sm font-semibold">Estimación de resultados</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-card border border-border/60 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Inversión diaria
              </p>
              <p className="text-base font-bold text-foreground mt-0.5">
                {formatCurrency(daily, currency)}
              </p>
            </div>
            <div className="rounded-lg bg-card border border-border/60 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Alcance estimado
              </p>
              <p className="text-sm font-bold text-foreground mt-0.5">
                {estimatedReachMin.toLocaleString()} – {estimatedReachMax.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">personas/día</p>
            </div>
            {estimatedDays !== null && (
              <div className="rounded-lg bg-card border border-border/60 p-3 col-span-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Duración estimada
                </p>
                <p className="text-base font-bold text-foreground mt-0.5">
                  {estimatedDays} días
                </p>
                <p className="text-[10px] text-muted-foreground">
                  con un total de {formatCurrency(total, currency)}
                </p>
              </div>
            )}
          </div>
          <div className="flex items-start gap-2 text-[11px] text-muted-foreground">
            <Info className="size-3 mt-0.5 shrink-0" />
            <span>
              El alcance es una estimación basada en promedios de Meta Ads.
              Los resultados reales pueden variar.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

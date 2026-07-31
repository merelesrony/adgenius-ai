'use client'

import { TrendingUp, AlertCircle, CheckCircle2, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ScoreResult } from '../types'

interface CampaignScoreProps {
  score: ScoreResult
  className?: string
}

const SCORE_LABELS = [
  { min: 0, max: 40, label: 'Necesita mejoras', color: 'text-destructive', bg: 'bg-destructive', icon: AlertCircle },
  { min: 40, max: 70, label: 'Buena', color: 'text-amber-500', bg: 'bg-amber-500', icon: TrendingUp },
  { min: 70, max: 90, label: 'Muy buena', color: 'text-brand', bg: 'bg-brand', icon: TrendingUp },
  { min: 90, max: 101, label: 'Excelente', color: 'text-emerald-500', bg: 'bg-emerald-500', icon: CheckCircle2 },
]

const BREAKDOWN_LABELS: Record<string, string> = {
  copy: 'Calidad del copy',
  audience: 'Audiencia',
  budget: 'Presupuesto',
  targeting: 'Targeting',
}

function getScoreConfig(total: number) {
  return SCORE_LABELS.find((s) => total >= s.min && total < s.max) ?? SCORE_LABELS[0]
}

function ScoreBar({ value, max = 25 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100)
  const color =
    pct >= 80 ? 'bg-emerald-500' :
    pct >= 60 ? 'bg-brand' :
    pct >= 40 ? 'bg-amber-500' :
    'bg-destructive'

  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all duration-500', color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function CampaignScore({ score, className }: CampaignScoreProps) {
  const config = getScoreConfig(score.total)
  const Icon = config.icon

  return (
    <div className={cn('rounded-xl border border-border bg-card overflow-hidden', className)}>
      {/* Score header */}
      <div className="flex items-center gap-4 p-5 border-b border-border">
        <div className={cn(
          'relative flex size-16 items-center justify-center rounded-full border-4',
          score.total >= 70 ? 'border-brand' :
          score.total >= 40 ? 'border-amber-500' :
          'border-destructive',
        )}>
          <span className={cn('text-xl font-bold', config.color)}>
            {score.total}
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Icon className={cn('size-4', config.color)} />
            <span className={cn('text-sm font-semibold', config.color)}>
              {config.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Puntuación de campaña
          </p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="p-4 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Desglose
        </p>
        {Object.entries(score.breakdown).map(([key, val]) => (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">
                {BREAKDOWN_LABELS[key] ?? key}
              </span>
              <span className="text-xs font-semibold text-foreground">
                {val}/25
              </span>
            </div>
            <ScoreBar value={val} max={25} />
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {score.recommendations.length > 0 && (
        <div className="border-t border-border p-4 space-y-2">
          <div className="flex items-center gap-1.5">
            <Lightbulb className="size-3.5 text-amber-500" />
            <p className="text-xs font-medium text-foreground">Recomendaciones</p>
          </div>
          <ul className="space-y-1.5">
            {score.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-0.5 shrink-0 size-1.5 rounded-full bg-brand/50" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

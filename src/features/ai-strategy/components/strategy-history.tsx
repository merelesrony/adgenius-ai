'use client'

import { Clock, ChevronRight } from 'lucide-react'
import { formatRelativeDate } from '@/lib/utils'
import type { StrategyHistoryItem } from '../types'

interface StrategyHistoryProps {
  strategies: StrategyHistoryItem[]
  onLoad: (id: string) => void
  loading: boolean
}

export function StrategyHistory({ strategies, onLoad, loading }: StrategyHistoryProps) {
  if (strategies.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Clock className="size-3.5 text-muted-foreground" />
        <p className="text-xs font-medium text-foreground">Estrategias recientes</p>
      </div>
      <div className="divide-y divide-border">
        {strategies.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onLoad(s.id)}
            disabled={loading}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors disabled:opacity-50"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{s.product_name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {s.product_category && <span className="mr-1.5">{s.product_category} ·</span>}
                {s.product_currency} · {formatRelativeDate(s.created_at)}
              </p>
            </div>
            <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>
    </div>
  )
}

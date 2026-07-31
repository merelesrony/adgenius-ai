'use client'

import * as React from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { cn } from '@/lib/utils'

const weeklyData = [
  { day: 'Lun', campañas: 2, ia: 8 },
  { day: 'Mar', campañas: 4, ia: 14 },
  { day: 'Mié', campañas: 3, ia: 10 },
  { day: 'Jue', campañas: 6, ia: 20 },
  { day: 'Vie', campañas: 5, ia: 17 },
  { day: 'Sáb', campañas: 8, ia: 25 },
  { day: 'Dom', campañas: 3, ia: 9 },
]

interface TooltipPayload {
  name: string
  value: number
  color: string
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card shadow-lg p-3 text-xs">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-muted-foreground mt-1">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span>
            {entry.name}:{' '}
            <span className="font-semibold text-foreground">{entry.value}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

const AXIS_PROPS = {
  tick: { fontSize: 11, fill: '#94A3B8' },
  axisLine: false as const,
  tickLine: false as const,
}

export function AnalyticsChart() {
  const [tab, setTab] = React.useState<'area' | 'bar'>('area')

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Actividad semanal</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Campañas y uso de IA esta semana
          </p>
        </div>
        <div className="flex items-center gap-0.5 p-1 rounded-lg bg-muted">
          {(['area', 'bar'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                tab === t
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t === 'area' ? 'Área' : 'Barras'}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={210}>
        {tab === 'area' ? (
          <AreaChart
            data={weeklyData}
            margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradCamp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradIA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818CF8" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#818CF8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E2E8F0"
              vertical={false}
            />
            <XAxis dataKey="day" {...AXIS_PROPS} />
            <YAxis {...AXIS_PROPS} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="campañas"
              stroke="#4F46E5"
              strokeWidth={2}
              fill="url(#gradCamp)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="ia"
              stroke="#818CF8"
              strokeWidth={2}
              fill="url(#gradIA)"
              dot={false}
            />
          </AreaChart>
        ) : (
          <BarChart
            data={weeklyData}
            margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E2E8F0"
              vertical={false}
            />
            <XAxis dataKey="day" {...AXIS_PROPS} />
            <YAxis {...AXIS_PROPS} />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="campañas"
              fill="#4F46E5"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="ia"
              fill="#818CF8"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        )}
      </ResponsiveContainer>

      <div className="flex items-center gap-5 mt-4 justify-center">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-full bg-brand inline-block" />
          Campañas
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: '#818CF8' }} />
          Uso IA
        </span>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Brain, Sparkles, Lightbulb } from 'lucide-react'
import { StrategyForm } from './components/strategy-form'
import type { StrategyFormInput } from './components/strategy-form'
import { StrategyResult } from './components/strategy-result'
import { StrategyHistory } from './components/strategy-history'
import type { MarketingStrategy, StrategyHistoryItem } from './types'

interface AIStrategyModuleProps {
  initialHistory: StrategyHistoryItem[]
}

interface StrategyState {
  strategy: MarketingStrategy
  productName: string
  productDescription: string
  productPrice: number | null
  productCurrency: string
  imageUrl?: string | null
}

export function AIStrategyModule({ initialHistory }: AIStrategyModuleProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [current, setCurrent] = useState<StrategyState | null>(null)
  const [history, setHistory] = useState<StrategyHistoryItem[]>(initialHistory)
  const [loadingHistory, setLoadingHistory] = useState(false)

  function handleStrategy(strategy: MarketingStrategy, input: StrategyFormInput) {
    setCurrent({
      strategy,
      productName: input.productName,
      productDescription: input.productDescription,
      productPrice: input.productPrice,
      productCurrency: input.productCurrency,
      imageUrl: null,
    })
    // Refresh history after generating
    refreshHistory()
  }

  async function refreshHistory() {
    try {
      const res = await fetch('/api/ai/marketing-strategy')
      if (!res.ok) return
      const json = await res.json() as { strategies: StrategyHistoryItem[] }
      if (json.strategies) setHistory(json.strategies)
    } catch { /* non-critical */ }
  }

  async function loadFromHistory(id: string) {
    setLoadingHistory(true)
    try {
      const res = await fetch(`/api/ai/marketing-strategy?id=${id}`)
      if (!res.ok) return
      const json = await res.json() as { strategy: MarketingStrategy; meta: { product_name: string; product_description: string | null; product_price: number | null; product_currency: string } }
      if (json.strategy && json.meta) {
        setCurrent({
          strategy: json.strategy,
          productName: json.meta.product_name,
          productDescription: json.meta.product_description ?? '',
          productPrice: json.meta.product_price ?? null,
          productCurrency: json.meta.product_currency,
          imageUrl: null,
        })
      }
    } catch { /* non-critical */ } finally {
      setLoadingHistory(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
      {/* Left panel — sticky form */}
      <div className="lg:sticky lg:top-6 space-y-4">
        <StrategyForm
          onStrategy={handleStrategy}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
        <StrategyHistory
          strategies={history}
          onLoad={loadFromHistory}
          loading={loadingHistory}
        />
      </div>

      {/* Right panel — result or empty state */}
      <div>
        {isLoading ? (
          <LoadingState />
        ) : current ? (
          <StrategyResult
            strategy={current.strategy}
            productName={current.productName}
            productDescription={current.productDescription}
            productPrice={current.productPrice}
            productCurrency={current.productCurrency}
            imageUrl={current.imageUrl ?? null}
            onReset={() => setCurrent(null)}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="rounded-2xl border border-border bg-card p-12 flex flex-col items-center justify-center gap-4 text-center min-h-[400px]">
      <div className="relative">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-purple-600 shadow-lg">
          <Brain className="size-8 text-white animate-pulse" />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand animate-ping" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground">Analizando tu producto...</h3>
        <p className="text-sm text-muted-foreground mt-1">
          El estratega IA está creando tu estrategia completa
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="size-3 text-brand animate-spin" />
        <span>Esto puede tardar 10–20 segundos</span>
      </div>
    </div>
  )
}

function EmptyState() {
  const steps = [
    { icon: '📝', text: 'Introduce el nombre y descripción de tu producto' },
    { icon: '✨', text: 'Haz click en "Crear estrategia IA"' },
    { icon: '🎯', text: 'Recibe un análisis completo con audiencia, presupuesto, copy y más' },
    { icon: '🚀', text: 'Crea tu campaña directamente desde la estrategia' },
  ]

  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 flex flex-col items-center justify-center gap-6 text-center min-h-[400px]">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand/10 to-purple-500/10 border border-brand/20">
        <Lightbulb className="size-8 text-brand" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground">Tu estrategia aparecerá aquí</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Actúa como un consultor de marketing digital senior que analiza tu producto
          y genera una estrategia completa para Meta Ads.
        </p>
      </div>
      <div className="text-left space-y-3 w-full max-w-sm">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="text-lg shrink-0 mt-0.5">{step.icon}</span>
            <p className="text-sm text-muted-foreground">{step.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

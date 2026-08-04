'use client'

import { useState } from 'react'
import { Sparkles, AlertCircle, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { BUSINESS_CATEGORIES, CURRENCIES } from '@/constants/options'
import { DEFAULT_CURRENCY } from '@/lib/currency'
import type { MarketingStrategy } from '../types'

export interface StrategyFormInput {
  productName: string
  productDescription: string
  productPrice: number | null
  productCurrency: string
}

interface StrategyFormProps {
  onStrategy: (strategy: MarketingStrategy, input: StrategyFormInput) => void
  isLoading: boolean
  setIsLoading: (v: boolean) => void
}

export function StrategyForm({ onStrategy, isLoading, setIsLoading }: StrategyFormProps) {
  const [productName, setProductName] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productCurrency, setProductCurrency] = useState(DEFAULT_CURRENCY)
  const [productCategory, setProductCategory] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!productName.trim() || !productDescription.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/marketing-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productName.trim(),
          productDescription: productDescription.trim(),
          productPrice: productPrice ? Number(productPrice) : null,
          productCurrency,
          productCategory: productCategory || undefined,
        }),
      })

      const json = await res.json() as { strategy?: MarketingStrategy; error?: string }
      if (!res.ok || !json.strategy) {
        throw new Error(typeof json.error === 'string' ? json.error : 'Error generando estrategia')
      }

      onStrategy(json.strategy, {
        productName: productName.trim(),
        productDescription: productDescription.trim(),
        productPrice: productPrice ? Number(productPrice) : null,
        productCurrency,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generando estrategia')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-brand/5 to-purple-500/5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-purple-600 shadow-sm">
            <Brain className="size-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Estratega IA</h2>
            <p className="text-[11px] text-muted-foreground">Análisis completo en segundos</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <Input
          label="Producto o servicio"
          placeholder="Ej: Perfume Dior Sauvage"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          required
        />

        <Textarea
          label="Descripción"
          placeholder="Describe tu producto: características principales, propuesta de valor, a quién va dirigido..."
          value={productDescription}
          onChange={(e) => setProductDescription(e.target.value)}
          rows={4}
          required
          hint="Cuanto más detallada, más precisa será la estrategia."
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Precio"
            type="number"
            placeholder="0.00"
            value={productPrice}
            onChange={(e) => setProductPrice(e.target.value)}
            hint="Opcional"
          />
          <Select
            label="Moneda"
            value={productCurrency}
            onChange={(e) => setProductCurrency(e.target.value)}
            options={CURRENCIES}
          />
        </div>

        <Select
          label="Categoría"
          value={productCategory}
          onChange={(e) => setProductCategory(e.target.value)}
          options={BUSINESS_CATEGORIES}
          placeholder="Detectar automáticamente"
          hint="Opcional — la IA la detectará si no la indicas."
        />

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
            <AlertCircle className="size-3.5 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full gap-2 shadow-sm"
          loading={isLoading}
          disabled={isLoading || !productName.trim() || !productDescription.trim()}
        >
          {!isLoading && <Sparkles className="size-4" />}
          {isLoading ? 'Analizando con IA...' : '✨ Crear estrategia IA'}
        </Button>

        {isLoading && (
          <p className="text-center text-[11px] text-muted-foreground">
            El estratega está analizando tu producto (10–20 segundos)...
          </p>
        )}

        <div className={cn(
          'flex items-center justify-center gap-1.5 pt-1',
          'text-[10px] text-muted-foreground',
        )}>
          <Sparkles className="size-2.5 text-brand" />
          <span>Potenciado por Claude AI · Anthropic</span>
        </div>
      </form>
    </div>
  )
}

import { convertFromUSD } from './exchange-rates'
import { formatCurrency } from './format'

export interface BudgetTier {
  emoji: string
  label: string
  range: string
}

// Base amounts in USD — edit here to change all currency recommendations app-wide
const TIERS_USD = [
  { emoji: '💡', label: 'Prueba y validación',  minUSD: 5,  maxUSD: 15  },
  { emoji: '🚀', label: 'Escala progresiva',    minUSD: 15, maxUSD: 50  },
  { emoji: '⚡', label: 'Máximo alcance',       minUSD: 50, maxUSD: null },
] as const

export function getBudgetTiers(currency: string): BudgetTier[] {
  return TIERS_USD.map(({ emoji, label, minUSD, maxUSD }) => {
    const min = Math.round(convertFromUSD(minUSD, currency))
    const max = maxUSD !== null ? Math.round(convertFromUSD(maxUSD, currency)) : null
    const range = max !== null
      ? `${formatCurrency(min, currency)} – ${formatCurrency(max, currency)}/día`
      : `${formatCurrency(min, currency)}+/día`
    return { emoji, label, range }
  })
}

export function getMinBudgetHint(currency: string): string {
  const min = Math.round(convertFromUSD(5, currency))
  return `Recomendado: mínimo ${formatCurrency(min, currency)}/día para resultados estables.`
}

// Returns a plain-text budget context line for AI prompts
export function getBudgetContextForAI(dailyBudget: number, currency: string): string {
  return `${formatCurrency(dailyBudget, currency)}/día (${currency})`
}

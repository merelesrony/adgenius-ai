import { getCurrencyConfig, DEFAULT_CURRENCY } from './config'

export function formatCurrency(amount: number, currency = DEFAULT_CURRENCY): string {
  const cfg = getCurrencyConfig(currency)
  return new Intl.NumberFormat(cfg.locale, {
    style: 'currency',
    currency: cfg.code,
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  }).format(amount)
}

export function getCurrencySymbol(currency = DEFAULT_CURRENCY): string {
  return getCurrencyConfig(currency).symbol
}

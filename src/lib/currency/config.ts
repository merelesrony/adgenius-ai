export interface CurrencyConfig {
  code: string
  symbol: string
  locale: string
  decimals: number
  name: string
}

export const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$',  locale: 'en-US', decimals: 2, name: 'Dólar estadounidense' },
  PYG: { code: 'PYG', symbol: '₲', locale: 'es-PY', decimals: 0, name: 'Guaraní paraguayo'    },
  BRL: { code: 'BRL', symbol: 'R$', locale: 'pt-BR', decimals: 2, name: 'Real brasileño'       },
  ARS: { code: 'ARS', symbol: '$',  locale: 'es-AR', decimals: 2, name: 'Peso argentino'       },
  EUR: { code: 'EUR', symbol: '€',  locale: 'es-ES', decimals: 2, name: 'Euro'                 },
  CLP: { code: 'CLP', symbol: '$',  locale: 'es-CL', decimals: 0, name: 'Peso chileno'         },
  COP: { code: 'COP', symbol: '$',  locale: 'es-CO', decimals: 0, name: 'Peso colombiano'      },
  MXN: { code: 'MXN', symbol: '$',  locale: 'es-MX', decimals: 2, name: 'Peso mexicano'        },
}

export const DEFAULT_CURRENCY = 'USD'

export function getCurrencyConfig(currency: string): CurrencyConfig {
  return CURRENCY_CONFIGS[currency] ?? CURRENCY_CONFIGS[DEFAULT_CURRENCY]
}

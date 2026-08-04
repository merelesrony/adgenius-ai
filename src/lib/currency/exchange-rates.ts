// Approximate rates relative to 1 USD. Update this file to change all app conversions.
export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  PYG: 8000,
  BRL: 5.4,
  ARS: 1200,
  EUR: 0.86,
  CLP: 900,
  COP: 4200,
  MXN: 17,
}

export function convertFromUSD(amountUSD: number, toCurrency: string): number {
  const rate = EXCHANGE_RATES[toCurrency] ?? 1
  return amountUSD * rate
}

export function convertToUSD(amount: number, fromCurrency: string): number {
  const rate = EXCHANGE_RATES[fromCurrency] ?? 1
  return amount / rate
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
): number {
  if (fromCurrency === toCurrency) return amount
  return convertFromUSD(convertToUSD(amount, fromCurrency), toCurrency)
}

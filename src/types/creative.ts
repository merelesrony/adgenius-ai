// Shared creative types — safe to import on both client and server.

export type VariantType = 'conversion' | 'emotional' | 'premium'

export interface CreativeBrief {
  productFocus: string
  targetAudience: string
  advertisingGoal: string
  visualConcept: string
  composition: string
  colorPalette: string
  lighting: string
  environment: string
  productPosition: string
  emotionalTrigger: string
  textSpace: string
  platformFormat: string
  style: string
}

export interface CreativeScore {
  overallScore: number
  productVisibility: number
  audienceMatch: number
  conversionPotential: number
  brandingScore: number
  recommendations: string[]
}

export const VARIANT_CONFIG: Record<VariantType, {
  label: string
  description: string
  emoji: string
  focusSummary: string
}> = {
  conversion: {
    label: 'Conversión Directa',
    description: 'Producto + beneficio + CTA claro',
    emoji: '🎯',
    focusSummary: 'Orientado a compra inmediata',
  },
  emotional: {
    label: 'Emocional',
    description: 'Emoción + aspiración + estilo de vida',
    emoji: '💫',
    focusSummary: 'Conexión emocional con el cliente',
  },
  premium: {
    label: 'Premium / Marca',
    description: 'Calidad + exclusividad + estatus',
    emoji: '⭐',
    focusSummary: 'Posicionamiento aspiracional',
  },
}

export const OBJECTIVE_OPTIONS: { value: string; label: string; emoji: string; desc: string }[] = [
  { value: 'sales',     label: 'Ventas',          emoji: '🛒', desc: 'Venta directa' },
  { value: 'messages',  label: 'Mensajes',         emoji: '💬', desc: 'WhatsApp / DM' },
  { value: 'awareness', label: 'Reconocimiento',   emoji: '👁️', desc: 'Brand awareness' },
  { value: 'traffic',   label: 'Tráfico',          emoji: '🔗', desc: 'Visitas al sitio' },
]

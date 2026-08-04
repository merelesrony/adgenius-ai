import { z } from 'zod'
import { DEFAULT_CURRENCY } from '@/lib/currency'

export const CAMPAIGN_OBJECTIVES = [
  { value: 'awareness', label: 'Reconocimiento de marca' },
  { value: 'traffic', label: 'Tráfico al sitio web' },
  { value: 'engagement', label: 'Interacción / Engagement' },
  { value: 'leads', label: 'Generación de leads' },
  { value: 'sales', label: 'Ventas / Conversiones' },
] as const

export type CampaignObjective = 'awareness' | 'traffic' | 'engagement' | 'leads' | 'sales'

export const stepInfoSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(100, 'Máximo 100 caracteres'),
  objective: z.enum(['awareness', 'traffic', 'engagement', 'leads', 'sales'], {
    errorMap: () => ({ message: 'Selecciona un objetivo' }),
  }),
  country: z.string().min(1, 'Selecciona un país'),
  city: z.string().optional().default(''),
  radiusKm: z.number().min(1).max(500).default(20),
})

export const stepProductSchema = z.object({
  existingProductId: z.string().uuid().nullable().optional(),
  productName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(120),
  productPrice: z.number().positive('El precio debe ser mayor a 0').nullable().optional(),
  productCurrency: z.string().default(DEFAULT_CURRENCY),
  productCategory: z.string().min(1, 'Selecciona una categoría'),
  productDescription: z.string().min(10, 'La descripción debe tener al menos 10 caracteres').max(1000),
  productImages: z.array(z.string().url()).max(5, 'Máximo 5 imágenes'),
})

export const stepBudgetSchema = z.object({
  dailyBudget: z.number().min(1, 'El presupuesto mínimo es 1 unidad de la moneda seleccionada/día'),
  startDate: z.string().min(1, 'Selecciona una fecha de inicio'),
  endDate: z.string().optional().nullable(),
  audienceMode: z.enum(['manual', 'ai']),
  targetAgeMin: z.number().min(18).max(64).default(18),
  targetAgeMax: z.number().min(19).max(65).default(65),
  targetGender: z.enum(['all', 'male', 'female']).default('all'),
  targetInterests: z.array(z.string()).default([]),
  targetLanguages: z.array(z.string()).default(['es']),
}).refine(
  (d) => d.targetAgeMax > d.targetAgeMin,
  { message: 'La edad máxima debe ser mayor que la mínima', path: ['targetAgeMax'] }
)

export const stepAISchema = z.object({
  aiBodyCopy: z.string().min(10, 'El copy no puede estar vacío'),
  aiHeadline: z.string().min(3, 'El título no puede estar vacío').max(40),
  aiDescription: z.string().min(5, 'La descripción no puede estar vacía').max(90),
  aiCTA: z.string().min(2, 'El CTA no puede estar vacío'),
})

export type StepInfoData = z.infer<typeof stepInfoSchema>
export type StepProductData = z.infer<typeof stepProductSchema>
export type StepBudgetData = z.infer<typeof stepBudgetSchema>
export type StepAIData = z.infer<typeof stepAISchema>

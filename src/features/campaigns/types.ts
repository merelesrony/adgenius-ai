import type { AudienceResult, ScoreResult, CopyResult, AIGenerateResult } from '@/lib/ai/AIManager'

export type { AudienceResult, ScoreResult, CopyResult, AIGenerateResult }

export type WizardStep = 1 | 2 | 3 | 4 | 5

export interface WizardData {
  // Step 1 — Campaign Info
  name: string
  objective: string
  country: string
  city: string
  radiusKm: number

  // Step 2 — Product
  existingProductId: string | null
  productName: string
  productPrice: number | null
  productCurrency: string
  productCategory: string
  productDescription: string
  productImages: string[]

  // Step 3 — Budget & Audience
  dailyBudget: number | null
  startDate: string
  endDate: string | null
  audienceMode: 'manual' | 'ai'
  targetAgeMin: number
  targetAgeMax: number
  targetGender: 'all' | 'male' | 'female'
  targetInterests: string[]
  targetLanguages: string[]

  // Step 4 — AI Generated (editable)
  aiHeadline: string
  aiBodyCopy: string
  aiDescription: string
  aiCTA: string
  aiAudienceResult: AudienceResult | null
  campaignScore: ScoreResult | null
  aiGenerated: boolean

  // Generation state (not saved to DB)
  isGenerating: boolean
  generationError: string | null
}

export const WIZARD_STEPS = [
  { number: 1, label: 'Campaña', description: 'Nombre y objetivo' },
  { number: 2, label: 'Producto', description: 'Qué vas a promocionar' },
  { number: 3, label: 'Presupuesto', description: 'Budget y audiencia' },
  { number: 4, label: 'IA Copy', description: 'Generar con IA' },
  { number: 5, label: 'Resumen', description: 'Revisar y guardar' },
] as const

export const INITIAL_WIZARD_DATA: WizardData = {
  name: '',
  objective: 'sales',
  country: '',
  city: '',
  radiusKm: 20,

  existingProductId: null,
  productName: '',
  productPrice: null,
  productCurrency: 'USD',
  productCategory: '',
  productDescription: '',
  productImages: [],

  dailyBudget: null,
  startDate: new Date().toISOString().split('T')[0],
  endDate: null,
  audienceMode: 'ai',
  targetAgeMin: 18,
  targetAgeMax: 65,
  targetGender: 'all',
  targetInterests: [],
  targetLanguages: ['es'],

  aiHeadline: '',
  aiBodyCopy: '',
  aiDescription: '',
  aiCTA: '',
  aiAudienceResult: null,
  campaignScore: null,
  aiGenerated: false,
  isGenerating: false,
  generationError: null,
}

export interface ExistingProduct {
  id: string
  name: string
  description: string | null
  price: number | null
  currency: string
  category: string | null
  images: unknown
}

export interface PlanLimitInfo {
  canCreate: boolean
  currentCount: number
  limit: number
  planName: string
}

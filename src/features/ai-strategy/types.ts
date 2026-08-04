export interface MarketingStrategyInput {
  productName: string
  productDescription: string
  productPrice?: number | null
  productCurrency: string
  productCategory?: string
}

export interface MarketingStrategy {
  productAnalysis: {
    detectedCategory: string
    industry: string
    clientType: string
    priceLevel: 'economy' | 'mid' | 'premium' | 'luxury'
    positioning: string
  }
  recommendedObjective: {
    value: 'sales' | 'awareness' | 'leads' | 'traffic' | 'engagement'
    label: string
    reason: string
  }
  targetAudience: {
    ageMin: number
    ageMax: number
    gender: 'all' | 'male' | 'female'
    interests: string[]
    behaviors: string[]
  }
  budgetRecommendation: {
    testingUSD: number
    scalingUSD: number
    maximumUSD: number
    explanation: string
  }
  schedule: {
    bestDays: string[]
    bestHours: string
    explanation: string
  }
  visualStrategy: {
    creativeType: string
    style: string
    description: string
  }
  adCopy: {
    headline: string
    primaryText: string
    cta: string
  }
  metaAdsConfig: {
    objective: string
    optimization: string
    placements: string[]
    notes: string
  }
}

export interface StrategyHistoryItem {
  id: string
  product_name: string
  product_category: string | null
  product_currency: string
  created_at: string
}

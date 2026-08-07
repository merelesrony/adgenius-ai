export type IntelligenceCategory = 'visual' | 'copy' | 'audience' | 'budget' | 'brand' | 'technical' | 'strategy'
export type IntelligencePriority = 'high' | 'medium' | 'low'
export type IntelligenceSeverity = 'error' | 'warning' | 'info'

export interface IntelligenceFinding {
  id: string
  category: IntelligenceCategory
  title: string
  description: string
  priority: IntelligencePriority
}

export interface IntelligenceOneClickFix {
  available: boolean
  field: 'cta' | 'headline' | 'primary_text' | 'description' | null
  value: string | null
}

export interface IntelligenceRecommendation {
  id: string
  priority: IntelligencePriority
  category: string
  title: string
  description: string
  oneClickFix: IntelligenceOneClickFix
}

export interface IntelligencePrediction {
  estimatedReach: { min: number; max: number; label: string }
  expectedCTR: { min: number; max: number }
  conversionProbability: 'low' | 'medium' | 'high' | 'very_high'
  competitionLevel: 'low' | 'medium' | 'high' | 'very_high'
  difficulty: 'easy' | 'medium' | 'hard' | 'very_hard'
  reasoning: string
}

export interface IntelligenceRisk {
  id: string
  severity: IntelligenceSeverity
  title: string
  description: string
}

export interface IntelligenceSubScores {
  visual: number
  copy: number
  audience: number
  budget: number
  brand: number
  conversion: number
  metaBestPractices: number
}

export interface CampaignIntelligenceResult {
  overallScore: number
  subScores: IntelligenceSubScores
  findings: IntelligenceFinding[]
  recommendations: IntelligenceRecommendation[]
  prediction: IntelligencePrediction
  risks: IntelligenceRisk[]
  coachAdvice: string
  quickWins: string[]
  summary: string
}

export interface CampaignAIReview {
  id: string
  campaign_id: string
  user_id: string
  score: number
  sub_scores: IntelligenceSubScores
  findings: IntelligenceFinding[]
  recommendations: IntelligenceRecommendation[]
  prediction: IntelligencePrediction | null
  risks: IntelligenceRisk[]
  coach_advice: string | null
  quick_wins: string[]
  summary: string | null
  created_at: string
}

export interface VisualProductDNA {
  // Product identity
  productType: string
  category: string
  brand: string | null
  model: string | null
  keyElements: string[]

  // Visual characteristics
  mainColors: string[]
  accentColors: string[]
  materials: string[]
  texture: string
  shape: string

  // Photography attributes
  photoStyle: string
  cameraAngle: string
  lighting: string
  background: string
  imageQuality: string

  // AI generation base
  masterPrompt: string          // Foundation for all creative prompts — never changes
  forbiddenChanges: string[]    // What must NEVER be modified across variants
  recommendedBackgrounds: string[]

  // User-editable style overrides (only these may vary)
  styleOverrides: {
    background: string
    lighting: string
    ambientColors: string
    photoStyle: string
    realismLevel: 'photorealistic' | 'cinematic' | 'stylized'
  }

  // Metadata
  sourceImageUrl: string
  analyzedAt: string
}

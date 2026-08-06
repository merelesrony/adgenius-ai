import Anthropic from '@anthropic-ai/sdk'
import { FORMAT_DIMENSIONS } from '@/constants/options'
import type { CreativeModel, CreativeFormat } from '@/constants/options'
import { generateImage } from '@/lib/ai/ImageManager'
import type { VariantType, CreativeBrief, CreativeScore } from '@/types/creative'
import type { VisualProductDNA } from '@/types/visual-dna'

export type { CreativeModel, CreativeFormat, VariantType, CreativeBrief, CreativeScore }

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Platform-specific format labels for the AI brief
const PLATFORM_FORMATS: Record<CreativeFormat, string> = {
  square:    'Facebook Feed / Instagram Feed (1080×1080)',
  landscape: 'Facebook Banner / LinkedIn Banner (1200×628)',
  portrait:  'Instagram Portrait / Facebook Portrait (1080×1350)',
  story:     'Instagram Story / Facebook Story / TikTok (1080×1920)',
}

// Campaign objective → visual strategy instruction
const OBJECTIVE_STRATEGY: Record<string, string> = {
  sales:     'Optimize for direct purchase: clear product hero, benefit-driven composition, urgent desire to own, space for price/offer.',
  messages:  'Optimize for WhatsApp/DM response: warm and approachable, human and trustworthy, conversation-starter aesthetic, friendly CTA.',
  awareness: 'Optimize for brand recall: premium aesthetics, memorable visual identity, emotional brand impression, logo/name space.',
  traffic:   'Optimize for click curiosity: visually intriguing composition, scroll-stopping contrast, partial reveal that demands a click.',
  leads:     'Optimize for form submission: credibility signals, clear value proposition, professional trust aesthetic, space for lead form CTA.',
}

// Variant type → creative direction
const VARIANT_DIRECTION: Record<VariantType, { name: string; focus: string; composition: string; emotion: string }> = {
  conversion: {
    name: 'DIRECT CONVERSION',
    focus: 'Product is the absolute hero — large, clear, fully visible. Price or offer space prominent. Benefit immediately obvious at a glance.',
    composition: 'Product dominant (55-70% frame). Neutral or minimal background. Clear bottom space (25%) for price/CTA overlay.',
    emotion: 'Desire to own NOW. Urgency. Clear value. "I want this immediately."',
  },
  emotional: {
    name: 'EMOTIONAL / LIFESTYLE',
    focus: 'Show the life or transformation the product enables. Customer aspiration and identity. Product integrated naturally in context.',
    composition: 'Lifestyle scene or aspirational context. Product present but not isolated. Human element or result of using the product.',
    emotion: 'Aspiration. Belonging. Identity. Transformation. "This is who I want to be."',
  },
  premium: {
    name: 'PREMIUM / BRANDING',
    focus: 'Brand prestige and material quality. Aspirational positioning. Timeless visual elegance. Craftsmanship and exclusivity.',
    composition: 'Minimalist. Dramatic single-source lighting. Large negative space. Gallery-quality, editorial aesthetic.',
    emotion: 'Exclusivity. Taste. Status. Sophistication. "Only for those who know quality."',
  },
}

// Base negative prompt common to all creatives
const BASE_NEGATIVE =
  'blurry, low quality, distorted product, wrong labels, incorrect logos, ' +
  'fake packaging, extra unwanted objects, unrealistic proportions, cartoon style, ' +
  'watermark, bad typography, text overlay on image, oversaturated, underexposed, ' +
  'pixelated, jpeg artifacts, deformed, ugly, amateur photography, stock photo clichés, ' +
  'multiple products, cluttered background, automotive, car, vehicle, engine, machinery, ' +
  'wheels, tires, grease, industrial equipment'

export interface CreativeInput {
  product: string
  description: string
  advertisingConcept: string
  environment: string
  lightingStyle: string
  colorStyle: string
  format: CreativeFormat
  targetAudience: string
  objective?: string
  model?: CreativeModel
  presetId?: string
  // Creative Engine Pro
  variantType?: VariantType
  productCategory?: string | null
  productPrice?: number | null
  productCurrency?: string | null
  country?: string | null
  platform?: string | null
  improvementHint?: string | null
  visualDNA?: VisualProductDNA | null
}

export interface CreativeResult {
  imageBytes: Uint8Array
  mimeType: string
  imageProvider: string
  prompt: string
  negativePrompt: string
  model: CreativeModel
  format: CreativeFormat
  presetId?: string
  creativeBrief: CreativeBrief
  creativeScore: CreativeScore
  variantType: VariantType
  platformFormat: string
  generationModel: string
}

// Full JSON schema Claude must return
interface CreativeBriefJSON {
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
  imagePrompt: string
  negativePrompt: string
  predictedScore: {
    overallScore: number
    productVisibility: number
    audienceMatch: number
    conversionPotential: number
    brandingScore: number
    recommendations: string[]
  }
}

async function buildCreativeBrief(input: CreativeInput): Promise<{
  imagePrompt: string
  negativePrompt: string
  brief: CreativeBrief
  score: CreativeScore
}> {
  const { width, height } = FORMAT_DIMENSIONS[input.format]
  const formatLabel = FORMAT_DIMENSIONS[input.format].label
  const variantType: VariantType = input.variantType ?? 'conversion'
  const variant = VARIANT_DIRECTION[variantType]
  const objectiveStrategy = OBJECTIVE_STRATEGY[input.objective ?? 'sales'] ?? OBJECTIVE_STRATEGY.sales
  const platformFormat = PLATFORM_FORMATS[input.format]

  const priceStr = input.productPrice != null
    ? `${input.productCurrency ?? 'USD'} ${input.productPrice}`
    : null

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1000,
    system: `You are a Senior AI Creative Director at a top advertising agency specialized in performance marketing for Facebook Ads, Instagram Ads, and WhatsApp Business Ads.

You create PHOTOREALISTIC advertising creative briefs that drive real conversions in the Latin American and global market.

CATEGORY AESTHETICS — apply these strictly by product type:
- Perfume/fragrance: dark studio, cinematic light, crystal/glass textures, luxury minimalism
- Food/beverage: warm studio, appetizing hero lighting, natural textures, plated presentation
- Fashion/clothing: clean white or lifestyle, natural model pose, fabric detail, editorial feel
- Technology/electronics: dark background, precision accent light, product angles, sleek modernity
- Beauty/cosmetics: soft pastels, clean white, feminine elegance, skin-tone warmth, gloss detail
- Fitness/sports: dynamic angles, motion energy, bright contrast, athletic energy
- Home/furniture: natural light, interior lifestyle, warm tones, lived-in elegance
- Healthcare/pharma: clean white, trustworthy blue tones, clinical precision, professional calm
- Jewelry/accessories: black velvet or marble, spotlight, reflections, extreme close detail
- Automotive: ONLY for actual vehicles — dramatic roads, motion blur, studio reflection

ABSOLUTE RULES:
1. Product category determines every aesthetic choice — NEVER apply automotive/industrial aesthetics to unrelated products
2. Product must occupy 40-70% of frame and be unmistakably identifiable
3. Always leave 20-30% of frame for text overlay (CTA, price, headline)
4. Image must look like a real professional advertisement, never a generic stock photo
5. Negative prompt MUST always include: automotive, car, vehicle, engine, machinery, wheels
6. Output ONLY valid JSON — zero markdown fences, zero explanation, zero preamble

VISUAL PRODUCT DNA — when provided below, APPLY THESE ABSOLUTE RULES:
• masterPrompt is the NON-NEGOTIABLE product foundation — always use it as the imagePrompt base
• Product identity (colors, materials, shape, brand, keyElements) must be IDENTICAL across all variants
• Each variant varies ONLY: background, lighting direction, composition angle, emotional tone
• styleOverrides are user-approved customizations — always apply them to background/lighting
• NEVER invent a different product — the masterPrompt describes the exact product that must appear`,
    messages: [{
      role: 'user',
      content:
        `Generate a complete advertising creative brief for this campaign:\n\n` +
        `PRODUCT: ${input.product}\n` +
        `CATEGORY: ${input.productCategory ?? 'general product'}\n` +
        `DESCRIPTION: ${input.description}\n` +
        (priceStr ? `PRICE: ${priceStr}\n` : '') +
        (input.country ? `TARGET MARKET: ${input.country}\n` : 'TARGET MARKET: Latin America\n') +
        (input.platform ? `PLATFORM: ${input.platform}\n` : '') +
        `\nCAMPAIGN OBJECTIVE: ${input.objective ?? 'sales'}\n` +
        `OBJECTIVE STRATEGY: ${objectiveStrategy}\n` +
        `\nTARGET AUDIENCE: ${input.targetAudience}\n` +
        `VISUAL STYLE BRIEF: ${input.advertisingConcept}\n` +
        `ENVIRONMENT DIRECTION: ${input.environment}\n` +
        `LIGHTING DIRECTION: ${input.lightingStyle}\n` +
        `COLOR DIRECTION: ${input.colorStyle}\n` +
        `\nFORMAT: ${formatLabel} (${width}×${height}px)\n` +
        `PLATFORM FORMAT: ${platformFormat}\n` +
        `\n══════════════════════════════════\n` +
        `VARIANT: ${variant.name}\n` +
        `FOCUS: ${variant.focus}\n` +
        `COMPOSITION RULE: ${variant.composition}\n` +
        `EMOTIONAL DRIVER: ${variant.emotion}\n` +
        `══════════════════════════════════\n` +
        (input.visualDNA
          ? `\n══════════════════════════════════\n` +
            `VISUAL PRODUCT DNA (MANDATORY CONSISTENCY)\n` +
            `Master Prompt: ${input.visualDNA.masterPrompt}\n` +
            `Product Colors (NEVER change): ${input.visualDNA.mainColors.join(', ')}\n` +
            `Materials (NEVER change): ${input.visualDNA.materials.join(', ')}\n` +
            `Key Elements (ALWAYS include): ${input.visualDNA.keyElements.join(', ')}\n` +
            `FORBIDDEN modifications: ${input.visualDNA.forbiddenChanges.join(', ')}\n` +
            `USER STYLE OVERRIDES (apply):\n` +
            `  Background: ${input.visualDNA.styleOverrides.background}\n` +
            `  Lighting: ${input.visualDNA.styleOverrides.lighting}\n` +
            `  Style: ${input.visualDNA.styleOverrides.photoStyle} / ${input.visualDNA.styleOverrides.realismLevel}\n` +
            `══════════════════════════════════\n`
          : '') +
        (input.improvementHint ? `\nIMPROVEMENT INSTRUCTION: ${input.improvementHint}\n` : '') +
        `\nReturn ONLY this exact JSON (no markdown, no text before/after):\n` +
        `{\n` +
        `  "productFocus": "What specific aspect of the product to highlight — 1 sentence",\n` +
        `  "targetAudience": "Precise audience for this ad — 1 sentence",\n` +
        `  "advertisingGoal": "Specific action this creative drives — 1 sentence",\n` +
        `  "visualConcept": "Core visual idea — what the viewer sees first — 10-15 words",\n` +
        `  "composition": "Exact frame structure: product %, background, text space location",\n` +
        `  "colorPalette": "3-4 specific colors with purpose (e.g. deep black: luxury, gold accent: prestige)",\n` +
        `  "lighting": "Lighting type, direction, intensity, mood — 15-20 words",\n` +
        `  "environment": "Scene and background description — 10-15 words",\n` +
        `  "productPosition": "Product placement: angle, size in frame, focal distance",\n` +
        `  "emotionalTrigger": "Primary emotion to evoke — 3-5 words",\n` +
        `  "textSpace": "Location and percentage of frame reserved for ad copy",\n` +
        `  "platformFormat": "${platformFormat}",\n` +
        `  "style": "Overall visual aesthetic — 6-8 words",\n` +
        (input.visualDNA
          ? `  "imagePrompt": "MUST start with this exact master product prompt: '${input.visualDNA.masterPrompt}' — then add ${variant.name} variant direction (${variant.composition.slice(0, 120)}) — then apply user style overrides: background is ${input.visualDNA.styleOverrides.background}, lighting is ${input.visualDNA.styleOverrides.lighting}, style is ${input.visualDNA.styleOverrides.photoStyle}. Total 80-130 words. English only. NEVER change the product identity.",\n`
          : `  "imagePrompt": "Complete Stable Diffusion/FLUX/OpenAI image prompt in English. MUST be 80-130 words. Begin with product name. Include: exact product description with materials/textures, specific lighting details, composition and camera angle, background/environment, atmosphere, color mood, quality markers (photorealistic, 8k, commercial photography). Never mention text, logos, or watermarks.",\n`
        ) +
        `  "negativePrompt": "Comma-separated exclusions specific to this product. MUST include: automotive, car, vehicle, engine, machinery, wheels, tires, blurry, watermark, text overlay, bad proportions, stock photo clichés",\n` +
        `  "predictedScore": {\n` +
        `    "overallScore": <integer 0-100 based on brief quality>,\n` +
        `    "productVisibility": <integer 0-100>,\n` +
        `    "audienceMatch": <integer 0-100>,\n` +
        `    "conversionPotential": <integer 0-100>,\n` +
        `    "brandingScore": <integer 0-100>,\n` +
        `    "recommendations": ["max 2 specific actionable tips for this creative"]\n` +
        `  }\n` +
        `}`,
    }],
  })

  const block = message.content[0]
  if (!block || block.type !== 'text' || !block.text.trim()) {
    throw new Error('Claude no devolvió respuesta para el creative brief')
  }

  let raw = block.text.trim()
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  const jsonStart = raw.indexOf('{')
  const jsonEnd = raw.lastIndexOf('}')
  if (jsonStart === -1 || jsonEnd <= jsonStart) {
    console.error('[buildCreativeBrief] No JSON found. Raw:', raw.slice(0, 300))
    throw new Error('Claude no devolvió JSON válido para el creative brief')
  }

  let parsed: CreativeBriefJSON
  try {
    parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as CreativeBriefJSON
  } catch {
    console.error('[buildCreativeBrief] JSON parse error. Raw:', raw.slice(0, 300))
    throw new Error('Error parseando creative brief de Claude')
  }

  if (!parsed.imagePrompt?.trim()) {
    throw new Error('Claude generó un imagePrompt vacío en el creative brief')
  }

  const wordCount = parsed.imagePrompt.trim().split(/\s+/).length
  if (wordCount < 40) {
    throw new Error(`Image prompt demasiado corto (${wordCount} palabras). Intenta de nuevo.`)
  }

  console.log(`[creative-brief:${variantType}] concept: ${(parsed.visualConcept ?? '').slice(0, 80)}`)
  console.log(`[creative-brief:${variantType}] prompt words: ${wordCount} | score: ${parsed.predictedScore?.overallScore ?? '?'}`)

  // Build final enriched prompt
  const imagePrompt = [
    parsed.imagePrompt.trim(),
    'professional advertising photography',
    'commercial quality print advertisement',
    'award-winning ad campaign image',
    '8k ultra high detail',
  ].join(', ')

  const negativePrompt = [
    parsed.negativePrompt?.trim() ?? '',
    BASE_NEGATIVE,
  ].filter(Boolean).join(', ')

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { predictedScore, imagePrompt: _ip, negativePrompt: _np, ...briefFields } = parsed

  const brief: CreativeBrief = {
    productFocus:    briefFields.productFocus    ?? '',
    targetAudience:  briefFields.targetAudience  ?? '',
    advertisingGoal: briefFields.advertisingGoal ?? '',
    visualConcept:   briefFields.visualConcept   ?? '',
    composition:     briefFields.composition     ?? '',
    colorPalette:    briefFields.colorPalette    ?? '',
    lighting:        briefFields.lighting        ?? '',
    environment:     briefFields.environment     ?? '',
    productPosition: briefFields.productPosition ?? '',
    emotionalTrigger: briefFields.emotionalTrigger ?? '',
    textSpace:       briefFields.textSpace       ?? '',
    platformFormat:  briefFields.platformFormat  ?? platformFormat,
    style:           briefFields.style           ?? '',
  }

  const score: CreativeScore = {
    overallScore:        clamp(predictedScore?.overallScore        ?? 80),
    productVisibility:   clamp(predictedScore?.productVisibility   ?? 80),
    audienceMatch:       clamp(predictedScore?.audienceMatch       ?? 80),
    conversionPotential: clamp(predictedScore?.conversionPotential ?? 80),
    brandingScore:       clamp(predictedScore?.brandingScore       ?? 80),
    recommendations:     Array.isArray(predictedScore?.recommendations) ? predictedScore.recommendations : [],
  }

  return { imagePrompt, negativePrompt, brief, score }
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

export async function generateCreative(input: CreativeInput): Promise<CreativeResult> {
  const model: CreativeModel = input.model ?? 'flux-realism'
  const variantType: VariantType = input.variantType ?? 'conversion'
  const { width, height } = FORMAT_DIMENSIONS[input.format]
  const platformFormat = PLATFORM_FORMATS[input.format]

  const { imagePrompt, negativePrompt, brief, score } = await buildCreativeBrief(input)

  console.log(`[generateCreative] variant: ${variantType} | prompt words: ${imagePrompt.split(/\s+/).length} | model: ${model} | ${width}×${height}`)

  const { imageBytes, mimeType, provider } = await generateImage({
    prompt: imagePrompt,
    negativePrompt,
    width,
    height,
    model,
    seed: Math.floor(Math.random() * 1_000_000),
  })

  return {
    imageBytes,
    mimeType,
    imageProvider: provider,
    prompt: imagePrompt,
    negativePrompt,
    model,
    format: input.format,
    presetId: input.presetId,
    creativeBrief: brief,
    creativeScore: score,
    variantType,
    platformFormat,
    generationModel: `${provider}:${model}`,
  }
}

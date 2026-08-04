import Anthropic from '@anthropic-ai/sdk'
import { FORMAT_DIMENSIONS } from '@/constants/options'
import type { CreativeModel, CreativeFormat } from '@/constants/options'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type { CreativeModel, CreativeFormat }

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
}

export interface CreativeResult {
  pollinationsUrl: string
  prompt: string
  negativePrompt: string
  model: CreativeModel
  format: CreativeFormat
  presetId?: string
}

interface CreativeJSON {
  image_prompt: string
  negative_prompt: string
  style: string
  composition: string
  lighting: string
  camera: string
}

const BASE_NEGATIVE_PROMPT =
  'blurry, low quality, distorted product, wrong labels, incorrect logos, ' +
  'fake packaging, extra unwanted objects, unrealistic proportions, cartoon style, ' +
  'watermark, bad typography, text overlay on image, oversaturated, underexposed, ' +
  'pixelated, jpeg artifacts, deformed, ugly, amateur photography, stock photo clichés, ' +
  'multiple products, cluttered background'

async function buildImagePrompt(
  input: CreativeInput,
): Promise<{ imagePrompt: string; negativePrompt: string }> {
  const { width, height } = FORMAT_DIMENSIONS[input.format]
  const formatLabel = FORMAT_DIMENSIONS[input.format].label

  // [DEBUG] brief that reaches the generator
  console.log('[generator:DEBUG] ─── BRIEF RECIBIDO ──────────────────────────────────')
  console.log('[generator:DEBUG] product:', input.product)
  console.log('[generator:DEBUG] presetId:', input.presetId ?? 'none')
  console.log('[generator:DEBUG] advertisingConcept:', input.advertisingConcept.slice(0, 80) + '...')
  console.log('[generator:DEBUG] format:', input.format, `${width}x${height}`)
  console.log('[generator:DEBUG] model:', input.model)
  console.log('[generator:DEBUG] ────────────────────────────────────────────────────')

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 700,
    system:
      'You are a Senior AI Advertising Creative Director with expertise across ALL product categories and industries: ' +
      'fashion, beauty, cosmetics, food and beverage, technology, electronics, furniture and home, healthcare, ' +
      'real estate, automotive, industrial, corporate, sports, travel, entertainment, and any other category.\n\n' +
      'You create professional advertising prompts for AI image generation models (FLUX, Stable Diffusion) ' +
      'that produce agency-quality advertising creatives for Facebook Ads and Instagram Ads.\n\n' +
      'CRITICAL: Your prompts must be SPECIFIC to the actual product category. A perfume must look like a luxury ' +
      'fragrance ad. A pizza must look like food photography. A laptop must look like a tech ad. ' +
      'Never default to automotive or industrial aesthetics for unrelated products.\n\n' +
      'Your output is ALWAYS valid JSON only. No text before or after the JSON. No markdown fences. No explanations.',
    messages: [
      {
        role: 'user',
        content:
          `Create a professional advertising creative prompt for this campaign:\n\n` +
          `PRODUCT: ${input.product}\n` +
          `DESCRIPTION: ${input.description}\n` +
          `CAMPAIGN OBJECTIVE: ${input.objective ?? 'increase sales'}\n` +
          `TARGET AUDIENCE: ${input.targetAudience}\n\n` +
          `CREATIVE BRIEF:\n` +
          `- Advertising Concept: ${input.advertisingConcept}\n` +
          `- Scene / Environment: ${input.environment}\n` +
          `- Lighting Style: ${input.lightingStyle}\n` +
          `- Color Style: ${input.colorStyle}\n\n` +
          `TECHNICAL REQUIREMENTS:\n` +
          `- Image format: ${width}x${height}px (${formatLabel})\n` +
          `- Product must be the clear main subject, fully visible and identifiable\n` +
          `- Leave negative space on one side for advertising copy and CTA text overlay\n` +
          `- Optimize product placement and composition for ${width}x${height}px\n\n` +
          `Return ONLY this JSON (no markdown, no explanation):\n` +
          `{\n` +
          `  "image_prompt": "Complete positive prompt in English, minimum 60 words, describing the full scene with product placement, atmosphere, visual details and quality",\n` +
          `  "negative_prompt": "Specific elements to avoid in this image based on the product and concept",\n` +
          `  "style": "Overall visual style in 5-8 words",\n` +
          `  "composition": "How the product is positioned and framed",\n` +
          `  "lighting": "Lighting setup in 10-15 words",\n` +
          `  "camera": "Camera body, lens mm, aperture, and depth of field"\n` +
          `}`,
      },
    ],
  })

  const block = message.content[0]
  if (!block || block.type !== 'text' || !block.text.trim()) {
    throw new Error('Claude no devolvió respuesta para el prompt creativo')
  }

  // Strip markdown fences if Claude added them despite instructions
  let raw = block.text.trim()
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  const jsonStart = raw.indexOf('{')
  const jsonEnd = raw.lastIndexOf('}')
  if (jsonStart === -1 || jsonEnd <= jsonStart) {
    console.error('[buildImagePrompt] No JSON in response:', raw.slice(0, 300))
    throw new Error('Claude no devolvió JSON válido para el prompt visual')
  }

  let parsed: CreativeJSON
  try {
    parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as CreativeJSON
  } catch {
    console.error('[buildImagePrompt] JSON parse error. Raw:', raw.slice(0, 300))
    throw new Error('Error parseando respuesta de Claude para el prompt visual')
  }

  // [DEBUG] Claude JSON response
  console.log('[generator:DEBUG] ─── RESPUESTA JSON DE CLAUDE ───────────────────────')
  console.log('[generator:DEBUG] image_prompt:', parsed.image_prompt?.slice(0, 200))
  console.log('[generator:DEBUG] negative_prompt:', parsed.negative_prompt?.slice(0, 120))
  console.log('[generator:DEBUG] style:', parsed.style)
  console.log('[generator:DEBUG] composition:', parsed.composition)
  console.log('[generator:DEBUG] lighting:', parsed.lighting)
  console.log('[generator:DEBUG] camera:', parsed.camera)
  console.log('[generator:DEBUG] ────────────────────────────────────────────────────')

  if (!parsed.image_prompt?.trim()) {
    throw new Error('Claude generó un image_prompt vacío')
  }

  const wordCount = parsed.image_prompt.trim().split(/\s+/).length
  if (wordCount < 30) {
    throw new Error(`Prompt demasiado corto (${wordCount} palabras). Intenta de nuevo.`)
  }

  // Assemble rich final prompt from all JSON components
  const imagePrompt = [
    parsed.image_prompt.trim(),
    parsed.camera ? `Camera: ${parsed.camera}` : 'DSLR camera, 50mm lens, f/2.8, shallow depth of field',
    parsed.lighting ? `Lighting: ${parsed.lighting}` : '',
    parsed.composition ? `Composition: ${parsed.composition}` : '',
    parsed.style ? `Style: ${parsed.style}` : '',
    'professional advertising photography, award-winning commercial photograph, 8k ultra detailed',
  ]
    .filter(Boolean)
    .join('. ')

  const negativePrompt = [parsed.negative_prompt?.trim() ?? '', BASE_NEGATIVE_PROMPT]
    .filter(Boolean)
    .join(', ')

  return { imagePrompt, negativePrompt }
}

export async function generateCreative(input: CreativeInput): Promise<CreativeResult> {
  const model: CreativeModel = input.model ?? 'flux'
  const { width, height } = FORMAT_DIMENSIONS[input.format]

  const { imagePrompt, negativePrompt } = await buildImagePrompt(input)
  console.log(
    `[generateCreative] prompt words: ${imagePrompt.split(/\s+/).length} | model: ${model} | ${width}x${height}`,
  )

  const seed = Math.floor(Math.random() * 1_000_000)
  const pollinationsUrl =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}` +
    `?model=${model}&width=${width}&height=${height}&seed=${seed}&nologo=true` +
    `&negative=${encodeURIComponent(negativePrompt)}`

  return {
    pollinationsUrl,
    prompt: imagePrompt,
    negativePrompt,
    model,
    format: input.format,
    presetId: input.presetId,
  }
}

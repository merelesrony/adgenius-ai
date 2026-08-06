import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { VisualProductDNA } from '@/types/visual-dna'

export interface ProductFromImageResult {
  name: string
  description: string
  category: string
  categoryLabel: string
  brand: string | null
  price: number | null
  currency: string
  keywords: string[]
  suggestedAudience: string
  confidence: 'high' | 'medium' | 'low'
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const VALID_CATEGORIES = [
  'electronics', 'clothing', 'beauty', 'food', 'sports',
  'home', 'toys', 'books', 'automotive', 'health', 'other',
]

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json() as { imageUrl?: string }
    if (!body.imageUrl) {
      return NextResponse.json({ error: 'imageUrl requerida' }, { status: 400 })
    }

    console.log('[analyze-product-full] Analyzing image for user:', user.id)

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2500,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'url', url: body.imageUrl },
          },
          {
            type: 'text',
            text: `You are an expert product analyst and advertising strategist. Analyze this product image and return a comprehensive JSON with both commercial product data and visual DNA for advertising campaigns.

VALID CATEGORIES (use exact key): electronics, clothing, beauty, food, sports, home, toys, books, automotive, health, other

Return ONLY this exact JSON (no markdown fences, no explanation, no text before or after):
{
  "product": {
    "name": "commercial product name (3-6 words, professional quality, in the product's original language if brand is visible)",
    "description": "2-3 sentence professional description in Spanish highlighting key benefits and selling points. Make it compelling for advertising.",
    "category": "one exact key from valid categories list",
    "categoryLabel": "Spanish display name for this category",
    "brand": "brand name if clearly visible on product or packaging, null otherwise",
    "price": null,
    "currency": "USD",
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
    "suggestedAudience": "1-2 sentences in Spanish describing the ideal target customer for this product",
    "confidence": "high if product is clearly identifiable, medium if partially, low if unclear"
  },
  "dna": {
    "productType": "specific product type (e.g. running shoes, glass bottle, smartphone)",
    "category": "product category",
    "brand": "brand name if visible, null otherwise",
    "model": "model or product line if identifiable, null otherwise",
    "keyElements": ["defining visual element 1", "defining visual element 2", "defining visual element 3"],
    "mainColors": ["primary color in English", "secondary color"],
    "accentColors": ["accent or detail color"],
    "materials": ["material 1 (e.g. leather)", "material 2 (e.g. rubber)"],
    "texture": "dominant texture: smooth|matte|glossy|rough|soft|metallic|fabric|wood|plastic",
    "shape": "geometric shape description (e.g. cylindrical, rectangular, organic curved)",
    "photoStyle": "photography style: product photography|lifestyle|editorial|studio|flat lay",
    "cameraAngle": "camera angle: front-facing|3/4 angle|overhead|side view|diagonal",
    "lighting": "lighting: soft studio lighting|natural daylight|dramatic side-lit|backlit|ring light",
    "background": "current background description (e.g. pure white, light gray gradient, lifestyle setting)",
    "imageQuality": "quality: high-end commercial|standard|low quality",
    "masterPrompt": "A 50-70 word English prompt for FLUX/Stable Diffusion that ALWAYS keeps the exact same product. Must describe: exact product identity, precise colors, materials, shape, any visible brand/text, key defining features. End with: photorealistic commercial product photography, professional studio lighting, 8k resolution, sharp focus.",
    "forbiddenChanges": ["product color palette", "product shape and proportions", "brand identity and text", "material composition"],
    "recommendedBackgrounds": ["clean white studio", "dark gradient studio", "lifestyle context relevant to product", "outdoor natural setting", "complementary color backdrop"]
  }
}`,
          },
        ],
      }],
    })

    const block = message.content.find((b) => b.type === 'text')
    if (!block || block.type !== 'text' || !block.text.trim()) {
      throw new Error('No se pudo analizar la imagen del producto')
    }

    let raw = block.text.trim()
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
    const jsonStart = raw.indexOf('{')
    const jsonEnd = raw.lastIndexOf('}')
    if (jsonStart === -1 || jsonEnd <= jsonStart) {
      throw new Error('Respuesta de análisis inválida')
    }

    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as {
      product?: Partial<ProductFromImageResult>
      dna?: Partial<VisualProductDNA>
    }

    const rawCategory = parsed.product?.category ?? 'other'
    const category = VALID_CATEGORIES.includes(rawCategory) ? rawCategory : 'other'

    const product: ProductFromImageResult = {
      name:             parsed.product?.name             ?? 'Producto detectado',
      description:      parsed.product?.description      ?? '',
      category,
      categoryLabel:    parsed.product?.categoryLabel    ?? 'General',
      brand:            parsed.product?.brand            ?? null,
      price:            parsed.product?.price            ?? null,
      currency:         parsed.product?.currency         ?? 'USD',
      keywords:         parsed.product?.keywords         ?? [],
      suggestedAudience: parsed.product?.suggestedAudience ?? '',
      confidence:       parsed.product?.confidence       ?? 'medium',
    }

    const dna: VisualProductDNA = {
      productType:           parsed.dna?.productType           ?? product.name,
      category:              parsed.dna?.category              ?? category,
      brand:                 parsed.dna?.brand                 ?? null,
      model:                 parsed.dna?.model                 ?? null,
      keyElements:           parsed.dna?.keyElements           ?? [],
      mainColors:            parsed.dna?.mainColors            ?? [],
      accentColors:          parsed.dna?.accentColors          ?? [],
      materials:             parsed.dna?.materials             ?? [],
      texture:               parsed.dna?.texture               ?? 'smooth',
      shape:                 parsed.dna?.shape                 ?? 'standard',
      photoStyle:            parsed.dna?.photoStyle            ?? 'product photography',
      cameraAngle:           parsed.dna?.cameraAngle           ?? 'front-facing',
      lighting:              parsed.dna?.lighting              ?? 'soft studio lighting',
      background:            parsed.dna?.background            ?? 'white',
      imageQuality:          parsed.dna?.imageQuality          ?? 'standard',
      masterPrompt:          parsed.dna?.masterPrompt          ?? `${product.name}, photorealistic commercial product photography, professional studio, 8k resolution, sharp focus`,
      forbiddenChanges:      parsed.dna?.forbiddenChanges      ?? ['product color palette', 'product shape and proportions'],
      recommendedBackgrounds: parsed.dna?.recommendedBackgrounds ?? ['clean white studio', 'dark gradient studio', 'lifestyle context', 'outdoor natural light'],
      styleOverrides: {
        background:    parsed.dna?.background    ?? 'clean white studio',
        lighting:      parsed.dna?.lighting      ?? 'soft studio lighting',
        ambientColors: (parsed.dna?.mainColors   ?? []).slice(0, 2).join(', ') || 'neutral',
        photoStyle:    parsed.dna?.photoStyle    ?? 'photorealistic',
        realismLevel:  'photorealistic',
      },
      sourceImageUrl: body.imageUrl,
      analyzedAt:     new Date().toISOString(),
    }

    console.log('[analyze-product-full] OK:', product.name, '|', product.category, '| confidence:', product.confidence)
    return NextResponse.json({ product, dna })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error analizando imagen'
    console.error('[analyze-product-full]', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { VisualProductDNA } from '@/types/visual-dna'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json() as {
      imageUrl?: string
      productName?: string
      productCategory?: string
    }

    if (!body.imageUrl) {
      return NextResponse.json({ error: 'imageUrl requerida' }, { status: 400 })
    }

    console.log('[analyze-product-image] Analyzing:', body.productName ?? 'unknown product')

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'url', url: body.imageUrl },
          },
          {
            type: 'text',
            text: `You are a professional visual analyst specialized in advertising and product photography.

Analyze this product image carefully and extract ALL visual characteristics needed to maintain perfect consistency across advertising campaigns.
${body.productName ? `\nProduct name: ${body.productName}` : ''}
${body.productCategory ? `Category hint: ${body.productCategory}` : ''}

Return ONLY this exact JSON (no markdown fences, no explanation, no text before or after the JSON):
{
  "productType": "specific product type (e.g. running shoes, glass bottle, smartphone case)",
  "category": "product category (e.g. footwear, beverage, electronics)",
  "brand": "brand name if clearly visible, null otherwise",
  "model": "model or product line if identifiable, null otherwise",
  "keyElements": ["visible element that defines the product", "another key element"],
  "mainColors": ["primary product color in plain English", "second color"],
  "accentColors": ["accent or detail color"],
  "materials": ["material 1 (e.g. leather)", "material 2 (e.g. rubber sole)"],
  "texture": "dominant texture (smooth/matte/glossy/rough/soft/metallic)",
  "shape": "geometric shape description (e.g. cylindrical, rectangular, organic)",
  "photoStyle": "photography style (e.g. product photography, lifestyle, editorial, studio)",
  "cameraAngle": "camera angle (e.g. front-facing, 3/4 angle, overhead, side view)",
  "lighting": "lighting description (e.g. soft studio lighting, natural daylight, dramatic side-lit)",
  "background": "current background (e.g. pure white, light gray, lifestyle setting)",
  "imageQuality": "quality level (high-end commercial / standard / low quality)",
  "masterPrompt": "A 50-70 word English FLUX/Stable Diffusion image generation prompt that ALWAYS keeps the exact same product. Must describe: exact product identity, precise colors, materials, shape, any visible brand identity, key defining features. End with: photorealistic commercial product photography, professional studio, 8k resolution, sharp focus.",
  "forbiddenChanges": ["product color palette", "product shape and proportions", "brand identity"],
  "recommendedBackgrounds": ["clean white studio", "dark gradient studio", "lifestyle context 1", "lifestyle context 2", "outdoor natural light"]
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

    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as Partial<VisualProductDNA>

    // Build complete DNA with defaults and user-editable style overrides
    const dna: VisualProductDNA = {
      productType:           parsed.productType           ?? 'product',
      category:              parsed.category              ?? body.productCategory ?? 'general',
      brand:                 parsed.brand                 ?? null,
      model:                 parsed.model                 ?? null,
      keyElements:           parsed.keyElements           ?? [],
      mainColors:            parsed.mainColors            ?? [],
      accentColors:          parsed.accentColors          ?? [],
      materials:             parsed.materials             ?? [],
      texture:               parsed.texture               ?? 'smooth',
      shape:                 parsed.shape                 ?? 'standard',
      photoStyle:            parsed.photoStyle            ?? 'product photography',
      cameraAngle:           parsed.cameraAngle           ?? 'front-facing',
      lighting:              parsed.lighting              ?? 'studio lighting',
      background:            parsed.background            ?? 'white',
      imageQuality:          parsed.imageQuality          ?? 'high-end commercial',
      masterPrompt:          parsed.masterPrompt          ?? `${body.productName ?? 'product'}, photorealistic commercial photography, 8k`,
      forbiddenChanges:      parsed.forbiddenChanges      ?? ['product colors', 'product shape'],
      recommendedBackgrounds: parsed.recommendedBackgrounds ?? ['clean white studio', 'dark studio', 'lifestyle setting'],
      styleOverrides: {
        background:    parsed.background    ?? 'clean white studio',
        lighting:      parsed.lighting      ?? 'soft studio lighting',
        ambientColors: (parsed.mainColors   ?? []).slice(0, 2).join(', ') || 'neutral',
        photoStyle:    parsed.photoStyle    ?? 'photorealistic',
        realismLevel:  'photorealistic',
      },
      sourceImageUrl: body.imageUrl,
      analyzedAt:     new Date().toISOString(),
    }

    console.log('[analyze-product-image] OK:', dna.productType, '|', dna.mainColors.join(', '))
    return NextResponse.json({ dna })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error analizando imagen'
    console.error('[analyze-product-image]', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

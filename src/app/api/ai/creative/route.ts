import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { generateCreative } from '@/lib/ai/creative-generator'
import { CREATIVE_PRESETS } from '@/constants/options'
import type { CreativeModel, CreativeFormat } from '@/lib/ai/creative-generator'
import type { Json } from '@/types/database'
import type { VisualProductDNA } from '@/types/visual-dna'

const schema = z.object({
  product: z.string().min(2),
  description: z.string().min(2),
  visualStyle: z.string().optional(),
  format: z.enum(['square', 'landscape', 'portrait', 'story']),
  targetAudience: z.string().min(2).optional().default('público general hispanohablante'),
  objective: z.string().optional().default('sales'),
  model: z.enum(['flux', 'flux-realism', 'flux-anime', 'flux-3d', 'turbo']).optional(),
  presetId: z.string().optional(),
  campaignId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  category: z.string().optional(),
  // Creative Engine Pro
  variantType: z.enum(['conversion', 'emotional', 'premium']).optional().default('conversion'),
  productPrice: z.number().nullable().optional(),
  productCurrency: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  platform: z.string().nullable().optional(),
  improvementHint: z.string().max(300).nullable().optional(),
  visualDNA: z.record(z.string(), z.unknown()).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 },
      )
    }
    const d = parsed.data

    // Resolve visual style preset
    const preset = d.presetId ? CREATIVE_PRESETS.find((p) => p.id === d.presetId) : null

    console.log('[creative] variant:', d.variantType, '| preset:', preset?.id ?? 'none', '| format:', d.format, '| objective:', d.objective)

    const creative = await generateCreative({
      product: d.product,
      description: d.description,
      advertisingConcept: preset?.advertisingConcept ?? `Professional advertising photograph for ${d.product}`,
      environment: preset?.environment ?? 'clean professional studio with neutral background',
      lightingStyle: preset?.lightingStyle ?? 'professional studio lighting with soft shadows',
      colorStyle: preset?.colorStyle ?? 'modern professional color palette with high contrast',
      format: d.format as CreativeFormat,
      targetAudience: d.targetAudience,
      objective: d.objective,
      model: (d.model as CreativeModel | undefined) ?? preset?.defaultModel,
      presetId: d.presetId,
      // Creative Engine Pro
      variantType: d.variantType,
      productCategory: d.category ?? null,
      productPrice: d.productPrice ?? null,
      productCurrency: d.productCurrency ?? null,
      country: d.country ?? null,
      platform: d.platform ?? null,
      improvementHint: d.improvementHint ?? null,
      visualDNA: (d.visualDNA as VisualProductDNA | undefined) ?? null,
    })

    console.log('[creative] provider:', creative.imageProvider, '| mimeType:', creative.mimeType, '| score:', creative.creativeScore.overallScore)

    // Upload to Supabase Storage
    const ext = creative.mimeType === 'image/png' ? 'png' : creative.mimeType === 'image/webp' ? 'webp' : 'jpg'
    const storagePath = `${user.id}/creatives/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

    const { data: storageData, error: storageError } = await supabase.storage
      .from('product-images')
      .upload(storagePath, creative.imageBytes, { contentType: creative.mimeType, upsert: false })

    if (storageError || !storageData) {
      console.error('[creative] Storage error:', storageError)
      throw new Error('Error guardando la imagen generada')
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(storageData.path)

    // Persist to campaign_creatives — return the inserted row ID
    const { data: insertedRow, error: dbError } = await supabase
      .from('campaign_creatives')
      .insert({
        user_id: user.id,
        campaign_id: d.campaignId ?? null,
        image_url: publicUrl,
        prompt: creative.prompt,
        model: creative.model,
        format: creative.format,
        preset_id: d.presetId ?? null,
        product_id: d.productId ?? null,
        category: d.category ?? null,
        creative_brief: creative.creativeBrief as unknown as Json,
        creative_score: creative.creativeScore as unknown as Json,
        variant_type: creative.variantType,
        platform_format: creative.platformFormat,
        generation_model: creative.generationModel,
      })
      .select('id')
      .single()

    if (dbError) {
      console.warn('[creative] campaign_creatives insert skipped:', dbError.message)
    }

    await supabase.from('ai_usage').insert({
      user_id: user.id,
      type: 'creative_image',
      campaign_id: d.campaignId ?? null,
      tokens_used: null,
    })

    return NextResponse.json({
      imageUrl: publicUrl,
      creativeId: insertedRow?.id ?? null,
      prompt: creative.prompt,
      negativePrompt: creative.negativePrompt,
      model: creative.model,
      format: creative.format,
      provider: creative.imageProvider,
      brief: creative.creativeBrief,
      score: creative.creativeScore,
      variantType: creative.variantType,
      platformFormat: creative.platformFormat,
    })
  } catch (err) {
    console.error('[creative]', err)
    const message = err instanceof Error ? err.message : 'Error inesperado'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data } = await supabase
      .from('campaign_creatives')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(40)

    return NextResponse.json({ creatives: data ?? [] })
  } catch (err) {
    console.error('[creative GET]', err)
    return NextResponse.json({ creatives: [] })
  }
}

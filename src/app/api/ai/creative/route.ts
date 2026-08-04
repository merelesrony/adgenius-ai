import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { generateCreative } from '@/lib/ai/creative-generator'
import { CREATIVE_PRESETS } from '@/constants/options'
import type { CreativeModel, CreativeFormat } from '@/lib/ai/creative-generator'

const schema = z.object({
  product: z.string().min(2),
  description: z.string().min(5),
  visualStyle: z.string().optional(), // kept for backward compat; preset fields take precedence
  format: z.enum(['square', 'landscape', 'portrait', 'story']),
  targetAudience: z.string().min(2).optional().default('público general hispanohablante'),
  objective: z.string().optional(),
  model: z.enum(['flux', 'flux-realism', 'flux-anime', 'flux-3d', 'turbo']).optional(),
  presetId: z.string().optional(),
  campaignId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  category: z.string().optional(),
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

    // 1. Look up preset for rich advertising brief; fall back to generic brief if no preset
    const preset = d.presetId ? CREATIVE_PRESETS.find((p) => p.id === d.presetId) : null

    // [DEBUG] preset resolution
    console.log('[creative:DEBUG] presetId received:', d.presetId ?? 'none')
    console.log('[creative:DEBUG] preset found:', preset ? `${preset.id} — "${preset.label}"` : 'NONE (using generic fallback)')
    if (preset) {
      console.log('[creative:DEBUG] advertisingConcept:', preset.advertisingConcept.slice(0, 80) + '...')
      console.log('[creative:DEBUG] defaultModel:', preset.defaultModel)
    }

    // 2. Claude acts as Senior Creative Director and generates optimised prompts,
    //    then builds the Pollinations URL with positive + negative prompts
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
    })

    console.log('[creative] model:', creative.model, '| format:', creative.format)
    // [DEBUG] full prompt audit
    console.log('[creative:DEBUG] ─── PROMPT COMPLETO ───────────────────────────────')
    console.log('[creative:DEBUG] Longitud:', creative.prompt.length, 'chars |', creative.prompt.split(/\s+/).length, 'palabras')
    console.log('[creative:DEBUG] PROMPT:', creative.prompt)
    console.log('[creative:DEBUG] NEGATIVE:', creative.negativePrompt.slice(0, 200))
    console.log('[creative:DEBUG] URL completa:', creative.pollinationsUrl)
    console.log('[creative:DEBUG] ───────────────────────────────────────────────────')

    // 2. Download the rendered image from Pollinations (can take 20–40 s)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 90_000)
    let imageRes: Response
    try {
      imageRes = await fetch(creative.pollinationsUrl, { signal: controller.signal })
    } finally {
      clearTimeout(timer)
    }

    if (!imageRes.ok) {
      throw new Error(`Pollinations devolvió ${imageRes.status}. Intenta de nuevo.`)
    }

    const contentType = imageRes.headers.get('content-type') ?? ''
    if (!contentType.startsWith('image/')) {
      throw new Error('La respuesta no es una imagen válida. Intenta de nuevo.')
    }

    const imageBuffer = await imageRes.arrayBuffer()
    const imageBytes = new Uint8Array(imageBuffer)

    // 3. Upload to Supabase Storage (reuses the existing product-images bucket).
    //    Path starts with userId so the bucket RLS policy (first segment = auth.uid()) passes.
    const storagePath =
      `${user.id}/creatives/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`

    const { data: storageData, error: storageError } = await supabase.storage
      .from('product-images')
      .upload(storagePath, imageBytes, { contentType: 'image/jpeg', upsert: false })

    if (storageError || !storageData) {
      console.error('[creative] Storage error:', storageError)
      throw new Error('Error guardando la imagen generada')
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(storageData.path)

    // 4. Persist to campaign_creatives for history (best-effort — runs migration first)
    const { error: dbError } = await supabase.from('campaign_creatives').insert({
      user_id: user.id,
      campaign_id: d.campaignId ?? null,
      image_url: publicUrl,
      prompt: creative.prompt,
      model: creative.model,
      format: creative.format,
      preset_id: d.presetId ?? null,
      product_id: d.productId ?? null,
      category: d.category ?? null,
    })
    if (dbError) {
      console.warn('[creative] campaign_creatives insert skipped:', dbError.message)
    }

    // 5. Log AI usage (type = creative_image)
    await supabase.from('ai_usage').insert({
      user_id: user.id,
      type: 'creative_image',
      campaign_id: d.campaignId ?? null,
      tokens_used: null,
    })

    return NextResponse.json({
      imageUrl: publicUrl,
      prompt: creative.prompt,
      negativePrompt: creative.negativePrompt,
      model: creative.model,
      format: creative.format,
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

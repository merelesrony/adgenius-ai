import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateImage } from '@/lib/ai/ImageManager'

const BASE_NEGATIVE =
  'blurry, low quality, distorted product, wrong labels, incorrect logos, ' +
  'fake packaging, cartoon style, watermark, text overlay on image, ' +
  'oversaturated, pixelated, jpeg artifacts, deformed, amateur photography'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json() as { prompt?: string }
    if (!body.prompt?.trim()) {
      return NextResponse.json({ error: 'prompt requerido' }, { status: 400 })
    }

    console.log('[generate-image] provider chain:', process.env.OPENAI_API_KEY ? 'openai → pollinations' : 'pollinations')

    const result = await generateImage({
      prompt: body.prompt.trim(),
      negativePrompt: BASE_NEGATIVE,
      width: 1024,
      height: 1024,
    })

    const ext = result.mimeType === 'image/png' ? 'png' : result.mimeType === 'image/webp' ? 'webp' : 'jpg'
    const path = `${user.id}/creatives/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

    const { data: stored, error: storageError } = await supabase.storage
      .from('product-images')
      .upload(path, result.imageBytes, { contentType: result.mimeType, upsert: false })

    if (storageError || !stored) {
      throw new Error(`Error guardando imagen: ${storageError?.message ?? 'unknown'}`)
    }

    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(stored.path)

    console.log('[generate-image] ✓ via', result.provider, '→', publicUrl.slice(-30))

    return NextResponse.json({ imageUrl: publicUrl, provider: result.provider })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error generando imagen'
    console.error('[generate-image]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { generateImage, getPrimaryProviderName } from '@/lib/ai/ImageManager'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const schema = z.object({
  productName: z.string().min(1).max(200),
  visualStyle: z.string().min(1).max(300),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    const { productName, visualStyle } = parsed.data

    // 1. Ask Claude to craft a detailed image prompt
    const claudeRes = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system:
        'You are a Senior AI Advertising Creative Director. ' +
        'Given a product name and visual style, write a single detailed English image prompt ' +
        'for an AI image generation model to produce a professional advertising photo. ' +
        'The prompt must be 60–100 words, photorealistic, product-centered, with agency-quality aesthetics. ' +
        'Return only the prompt text — no JSON, no explanation, no preamble.',
      messages: [
        {
          role: 'user',
          content: `Product: ${productName}\nVisual style: ${visualStyle}\n\nWrite the image generation prompt:`,
        },
      ],
    })

    const block = claudeRes.content[0]
    if (!block || block.type !== 'text' || !block.text.trim()) {
      throw new Error('Claude no generó un prompt válido')
    }
    const prompt = block.text.trim()

    console.log('[test-image] provider:', getPrimaryProviderName(), '| prompt words:', prompt.split(/\s+/).length)

    // 2. Generate image via ImageManager (OpenAI → Pollinations fallback)
    const { imageBytes, mimeType, provider } = await generateImage({
      prompt,
      width: 1024,
      height: 1024,
    })

    // 3. Upload to Supabase Storage for stable serving
    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'
    const storagePath = `${user.id}/test-images/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

    const { data: storageData, error: storageError } = await supabase.storage
      .from('product-images')
      .upload(storagePath, imageBytes, { contentType: mimeType, upsert: false })

    if (storageError || !storageData) {
      console.error('[test-image] Storage error:', storageError)
      throw new Error('Error guardando la imagen')
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(storageData.path)

    return NextResponse.json({ imageUrl: publicUrl, prompt, provider })
  } catch (err) {
    console.error('[test-image]', err)
    const message = err instanceof Error ? err.message : 'Error inesperado'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

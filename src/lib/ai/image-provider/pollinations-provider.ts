import type { ImageProvider, ImageGenerationRequest, ImageGenerationOutput } from './types'

const BASE_NEGATIVE =
  'blurry, low quality, distorted product, wrong labels, incorrect logos, ' +
  'fake packaging, extra unwanted objects, unrealistic proportions, cartoon style, ' +
  'watermark, bad typography, text overlay on image, oversaturated, underexposed, ' +
  'pixelated, jpeg artifacts, deformed, ugly, amateur photography, stock photo clichés, ' +
  'multiple products, cluttered background'

export class PollinationsProvider implements ImageProvider {
  readonly name = 'pollinations'

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationOutput> {
    const { prompt, negativePrompt, width, height, model = 'flux-realism', seed } = request
    const resolvedSeed = seed ?? Math.floor(Math.random() * 1_000_000)
    const negPrompt = [negativePrompt?.trim(), BASE_NEGATIVE].filter(Boolean).join(', ')

    const url =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
      `?model=${model}&width=${width}&height=${height}&seed=${resolvedSeed}&nologo=true` +
      `&negative=${encodeURIComponent(negPrompt)}&enhance=true`

    console.log('[PollinationsProvider] generating', width, 'x', height, '|', model)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 90_000)
    let res: Response
    try {
      res = await fetch(url, { signal: controller.signal })
    } finally {
      clearTimeout(timer)
    }

    if (!res.ok) throw new Error(`Pollinations returned ${res.status}`)

    const contentType = res.headers.get('content-type') ?? 'image/jpeg'
    if (!contentType.startsWith('image/')) {
      throw new Error(`Pollinations returned non-image content-type: ${contentType}`)
    }

    const buffer = await res.arrayBuffer()
    const mime = (contentType.split(';')[0]?.trim() ?? 'image/jpeg') as ImageGenerationOutput['mimeType']

    return { imageBytes: new Uint8Array(buffer), mimeType: mime, provider: 'pollinations' }
  }
}

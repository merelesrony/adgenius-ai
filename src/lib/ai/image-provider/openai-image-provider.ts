// OpenAI Images API provider — uses the REST API directly (no SDK dependency needed).
// Supports gpt-image-1 (default, highest quality) and dall-e-3 (fallback).
// Set OPENAI_IMAGE_MODEL=dall-e-3 to override.

import type { ImageProvider, ImageGenerationRequest, ImageGenerationOutput } from './types'

// gpt-image-1 valid sizes
type GptImage1Size = '1024x1024' | '1024x1536' | '1536x1024' | 'auto'
// dall-e-3 valid sizes
type DallE3Size = '1024x1024' | '1024x1792' | '1792x1024'

function toGptImage1Size(width: number, height: number): GptImage1Size {
  if (width === height) return '1024x1024'
  return width > height ? '1536x1024' : '1024x1536'
}

function toDallE3Size(width: number, height: number): DallE3Size {
  if (width === height) return '1024x1024'
  return width > height ? '1792x1024' : '1024x1792'
}

interface OpenAIImageItem {
  b64_json?: string
  url?: string
}

interface OpenAIImagesResponse {
  data: OpenAIImageItem[]
  error?: { message: string }
}

export class OpenAIImageProvider implements ImageProvider {
  readonly name = 'openai'
  private readonly apiKey: string
  readonly model: string

  constructor(apiKey: string, model = 'gpt-image-1') {
    this.apiKey = apiKey
    this.model = model
  }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationOutput> {
    const { prompt, width = 1024, height = 1024 } = request
    const isGptImage1 = this.model === 'gpt-image-1'

    const body: Record<string, unknown> = {
      model: this.model,
      prompt,
      n: 1,
    }

    if (isGptImage1) {
      body.size = toGptImage1Size(width, height)
      body.quality = 'high'
      body.output_format = 'jpeg'
    } else {
      body.size = toDallE3Size(width, height)
      body.quality = 'hd'
      body.response_format = 'url'
    }

    console.log('[OpenAIImageProvider] generating | model:', this.model, '| size:', body.size)

    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const json = await res.json() as OpenAIImagesResponse

    if (!res.ok) {
      const msg = json.error?.message ?? `OpenAI API error ${res.status}`
      throw new Error(msg)
    }

    const item = json.data[0]
    if (!item) throw new Error('OpenAI returned empty data array')

    // gpt-image-1 always returns b64_json
    if (item.b64_json) {
      const bytes = Buffer.from(item.b64_json, 'base64')
      return {
        imageBytes: new Uint8Array(bytes),
        mimeType: isGptImage1 ? 'image/jpeg' : 'image/png',
        provider: 'openai',
      }
    }

    // dall-e-3 with response_format=url returns a temporary URL
    if (item.url) {
      const imgRes = await fetch(item.url)
      if (!imgRes.ok) throw new Error(`Failed to download OpenAI image: ${imgRes.status}`)
      const buffer = await imgRes.arrayBuffer()
      return {
        imageBytes: new Uint8Array(buffer),
        mimeType: 'image/png',
        provider: 'openai',
      }
    }

    throw new Error('OpenAI response had neither b64_json nor url')
  }
}

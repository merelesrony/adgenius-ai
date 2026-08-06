import { OpenAIImageProvider } from './image-provider/openai-image-provider'
import { PollinationsProvider } from './image-provider/pollinations-provider'
import type { ImageProvider, ImageGenerationRequest, ImageGenerationOutput } from './image-provider/types'

export type { ImageGenerationRequest, ImageGenerationOutput }

function buildProviderChain(): ImageProvider[] {
  const chain: ImageProvider[] = []

  const openaiKey = process.env.OPENAI_API_KEY
  if (openaiKey) {
    const model = process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-1'
    chain.push(new OpenAIImageProvider(openaiKey, model))
  }

  chain.push(new PollinationsProvider())
  return chain
}

/**
 * Generates an image using the best available provider.
 * Falls back to the next provider in the chain on failure.
 * Provider priority: OpenAI (if OPENAI_API_KEY set) → Pollinations.
 */
export async function generateImage(request: ImageGenerationRequest): Promise<ImageGenerationOutput> {
  const providers = buildProviderChain()
  let lastError: Error | null = null

  for (const provider of providers) {
    try {
      const result = await provider.generate(request)
      console.log(`[ImageManager] ✓ generated via ${result.provider}`)
      return result
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      console.warn(`[ImageManager] ${provider.name} failed:`, lastError.message, '— trying fallback')
    }
  }

  throw lastError ?? new Error('All image providers failed')
}

/** Returns the active primary provider name — useful for logging and UI hints. */
export function getPrimaryProviderName(): string {
  return process.env.OPENAI_API_KEY ? 'openai' : 'pollinations'
}

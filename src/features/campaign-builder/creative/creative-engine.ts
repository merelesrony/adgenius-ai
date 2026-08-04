// Client-side Pollinations URL builder for ad creatives.
// Reuses the same Pollinations pattern as src/lib/ai/creative-generator.ts.

const BASE_NEGATIVE_PROMPT =
  'blurry, low quality, distorted product, wrong labels, incorrect logos, ' +
  'fake packaging, extra unwanted objects, unrealistic proportions, cartoon style, ' +
  'watermark, bad typography, text overlay on image, oversaturated, underexposed, ' +
  'pixelated, jpeg artifacts, deformed, ugly, amateur photography, stock photo clichés, ' +
  'multiple products, cluttered background, automotive, car, vehicle'

export function buildAdImageUrl(imagePrompt: string, seed: number): string {
  return (
    `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}` +
    `?model=flux-realism&width=1024&height=1024&seed=${seed}&nologo=true` +
    `&negative=${encodeURIComponent(BASE_NEGATIVE_PROMPT)}&enhance=true`
  )
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000)
}

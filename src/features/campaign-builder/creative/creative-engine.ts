// Creative engine utilities.
// Image generation is handled server-side via /api/ai/generate-image (OpenAI → Pollinations fallback).

export function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000)
}

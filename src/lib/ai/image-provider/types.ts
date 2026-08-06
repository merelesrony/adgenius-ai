export interface ImageGenerationRequest {
  prompt: string
  negativePrompt?: string
  width: number
  height: number
  model?: string
  seed?: number
}

export interface ImageGenerationOutput {
  imageBytes: Uint8Array
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
  provider: string
}

export interface ImageProvider {
  readonly name: string
  generate(request: ImageGenerationRequest): Promise<ImageGenerationOutput>
}

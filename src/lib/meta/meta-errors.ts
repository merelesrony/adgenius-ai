export class MetaApiError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly subcode?: number,
  ) {
    super(message)
    this.name = 'MetaApiError'
  }
}

export function parseMetaError(body: Record<string, unknown>): MetaApiError {
  const err = body.error as Record<string, unknown> | undefined
  return new MetaApiError(
    (err?.message as string) ?? 'Unknown Meta API error',
    err?.code as number | undefined,
    err?.error_subcode as number | undefined,
  )
}

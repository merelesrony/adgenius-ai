import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from 'crypto'
import { META_OAUTH_SCOPES, META_CONFIG_ID, META_API_VERSION } from './meta-constants'

const ALGORITHM = 'aes-256-gcm'

function getEncryptionKey(): Buffer {
  const secret = process.env.META_TOKEN_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('META_TOKEN_SECRET must be set and at least 32 characters')
  }
  return Buffer.from(secret.slice(0, 32))
}

export function encryptMetaToken(token: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decryptMetaToken(enc: string): string {
  const key = getEncryptionKey()
  const parts = enc.split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted token format')
  const [ivHex, tagHex, dataHex] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const data = Buffer.from(dataHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  return decipher.update(data) + decipher.final('utf8')
}

// Returns which OAuth mode is active so connect/route.ts can log it.
export function getOAuthMode(): 'config_id' | 'scope' {
  return META_CONFIG_ID ? 'config_id' : 'scope'
}

export function buildMetaOAuthUrl(state: string): string {
  const appId = process.env.META_APP_ID
  const redirectUri = process.env.META_REDIRECT_URI
  if (!appId || !redirectUri) {
    throw new Error('META_APP_ID and META_REDIRECT_URI must be configured')
  }

  // Facebook Login for Business (config_id) — recommended for SaaS/Tech Providers.
  // Requires: Business type app + Facebook Login for Business product + configuration created in App Dashboard.
  // Set META_CONFIG_ID in .env.local once you have a configuration ID from Meta Developers.
  if (META_CONFIG_ID) {
    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      config_id: META_CONFIG_ID,
      response_type: 'code',
      override_default_response_type: 'true',
      state,
    })
    return `https://www.facebook.com/${META_API_VERSION}/dialog/oauth?${params.toString()}`
  }

  // Scope-based flow — fallback for when config_id is not yet configured.
  // Requires: Business type app + Marketing API product + permissions added in Permissions & Features.
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: META_OAUTH_SCOPES,
    response_type: 'code',
    state,
  })
  return `https://www.facebook.com/${META_API_VERSION}/dialog/oauth?${params.toString()}`
}

export function generateOAuthState(): string {
  return randomBytes(24).toString('hex')
}

// CSRF-safe state: userId + timestamp signed with META_TOKEN_SECRET.
// Avoids cookies entirely — works reliably in serverless/edge environments.
export function generateSignedState(userId: string): string {
  const secret = process.env.META_TOKEN_SECRET
  if (!secret) throw new Error('META_TOKEN_SECRET must be set')
  const timestamp = Date.now().toString()
  const payload = `${userId}.${timestamp}`
  const hmac = createHmac('sha256', secret).update(payload).digest('hex')
  return Buffer.from(`${payload}.${hmac}`).toString('base64url')
}

export function verifySignedState(state: string, userId: string): boolean {
  const secret = process.env.META_TOKEN_SECRET
  if (!secret) return false
  try {
    const decoded = Buffer.from(state, 'base64url').toString('utf8')
    // Format: userId.timestamp.hmac (UUIDs have no dots, timestamps are numbers)
    const parts = decoded.split('.')
    if (parts.length !== 3) return false
    const [stateUserId, rawTimestamp, receivedHmac] = parts
    if (stateUserId !== userId) return false
    const timestamp = parseInt(rawTimestamp, 10)
    if (isNaN(timestamp)) return false
    const age = Date.now() - timestamp
    if (age < 0 || age > 600_000) return false
    const payload = `${stateUserId}.${rawTimestamp}`
    const expectedHmac = createHmac('sha256', secret).update(payload).digest('hex')
    const bufA = Buffer.from(receivedHmac, 'hex')
    const bufB = Buffer.from(expectedHmac, 'hex')
    if (bufA.length !== bufB.length) return false
    return timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

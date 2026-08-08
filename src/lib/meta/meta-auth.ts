import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { META_OAUTH_SCOPES, META_API_VERSION } from './meta-constants'

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

export function buildMetaOAuthUrl(state: string): string {
  const appId = process.env.META_APP_ID
  const redirectUri = process.env.META_REDIRECT_URI
  if (!appId || !redirectUri) {
    throw new Error('META_APP_ID and META_REDIRECT_URI must be configured')
  }
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: META_OAUTH_SCOPES,
    response_type: 'code',
    state,
    auth_type: 'rerequest',
  })
  return `https://www.facebook.com/${META_API_VERSION}/dialog/oauth?${params.toString()}`
}

export function generateOAuthState(): string {
  return randomBytes(24).toString('hex')
}

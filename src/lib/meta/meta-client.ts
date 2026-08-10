import { META_GRAPH_BASE } from './meta-constants'
import { parseMetaError, MetaApiError } from './meta-errors'
import type {
  MetaAdAccount,
  MetaPage,
  MetaInstagramAccount,
  MetaBusinessPortfolio,
  MetaUserInfo,
  MetaTokenResponse,
  MetaLongLivedTokenResponse,
  MetaTokenInspection,
} from './meta-types'

async function graphGet<T>(
  path: string,
  token: string,
  params?: Record<string, string>,
): Promise<T> {
  const url = new URL(`${META_GRAPH_BASE}${path}`)
  url.searchParams.set('access_token', token)
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  }
  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  const body = (await res.json()) as Record<string, unknown>
  if (!res.ok || body.error) throw parseMetaError(body)
  return body as T
}

export async function graphPost<T>(
  path: string,
  token: string,
  body: Record<string, unknown>,
): Promise<T> {
  const url = new URL(`${META_GRAPH_BASE}${path}`)
  url.searchParams.set('access_token', token)
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    next: { revalidate: 0 },
  })
  const data = (await res.json()) as Record<string, unknown>
  if (!res.ok || data.error) {
    const errBody = data.error as Record<string, unknown> | undefined
    console.error('[Meta API] error response', {
      httpStatus: res.status,
      code: errBody?.code,
      type: errBody?.type,
      message: errBody?.message,
      error_subcode: errBody?.error_subcode,
      fbtrace_id: errBody?.fbtrace_id,
      error_data: errBody?.error_data ?? null,
      error_user_title: errBody?.error_user_title ?? null,
      error_user_msg: errBody?.error_user_msg ?? null,
      is_transient: errBody?.is_transient ?? null,
    })
    if (errBody?.error_data) {
      console.error('[Meta API] error_data (blame_field)', errBody.error_data)
    }
    throw parseMetaError(data)
  }
  return data as T
}

export async function exchangeCodeForToken(code: string): Promise<MetaTokenResponse> {
  const appId = process.env.META_APP_ID!
  const appSecret = process.env.META_APP_SECRET!
  const redirectUri = process.env.META_REDIRECT_URI!

  const url = new URL(`${META_GRAPH_BASE}/oauth/access_token`)
  url.searchParams.set('client_id', appId)
  url.searchParams.set('client_secret', appSecret)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('code', code)

  const res = await fetch(url.toString())
  const body = (await res.json()) as Record<string, unknown>
  if (!res.ok || body.error) throw parseMetaError(body)
  return body as unknown as MetaTokenResponse
}

/**
 * Exchanges a short-lived user access token (~1-2 h) for a long-lived one (~60 days).
 * Must be called server-side — requires META_APP_SECRET.
 * Endpoint: GET /oauth/access_token?grant_type=fb_exchange_token
 * Ref: https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string,
): Promise<MetaLongLivedTokenResponse> {
  const appId = process.env.META_APP_ID!
  const appSecret = process.env.META_APP_SECRET!

  const url = new URL(`${META_GRAPH_BASE}/oauth/access_token`)
  url.searchParams.set('grant_type', 'fb_exchange_token')
  url.searchParams.set('client_id', appId)
  url.searchParams.set('client_secret', appSecret)
  url.searchParams.set('fb_exchange_token', shortLivedToken)

  const res = await fetch(url.toString())
  const body = (await res.json()) as Record<string, unknown>
  if (!res.ok || body.error) throw parseMetaError(body)
  return body as unknown as MetaLongLivedTokenResponse
}

/**
 * Inspects a user access token via the /debug_token endpoint.
 * Uses the app access token ({app-id}|{app-secret}) as the caller credential.
 * Must be called server-side — requires META_APP_SECRET.
 * Useful for verifying token validity, scopes, and expiry before sensitive operations.
 */
export async function inspectMetaToken(token: string): Promise<MetaTokenInspection> {
  const appId = process.env.META_APP_ID!
  const appSecret = process.env.META_APP_SECRET!
  const appToken = `${appId}|${appSecret}`

  const url = new URL(`${META_GRAPH_BASE}/debug_token`)
  url.searchParams.set('input_token', token)
  url.searchParams.set('access_token', appToken)

  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  const body = (await res.json()) as Record<string, unknown>

  // /debug_token always returns 200; check body.data for the actual result
  if (!res.ok) throw parseMetaError(body)

  const data = (body.data ?? {}) as Record<string, unknown>
  const errField = data.error as Record<string, unknown> | undefined

  return {
    isValid: Boolean(data.is_valid),
    appId: data.app_id as string | undefined,
    userId: data.user_id as string | undefined,
    expiresAt: data.expires_at as number | undefined,
    dataAccessExpiresAt: data.data_access_expires_at as number | undefined,
    scopes: Array.isArray(data.scopes) ? (data.scopes as string[]) : [],
    error: errField
      ? {
          code: errField.code as number,
          message: errField.message as string,
          subcode: errField.subcode as number | undefined,
        }
      : undefined,
  }
}

export async function getMetaUser(token: string): Promise<MetaUserInfo> {
  return graphGet<MetaUserInfo>('/me', token, { fields: 'id,name' })
}

export async function getAdAccounts(token: string): Promise<MetaAdAccount[]> {
  const res = await graphGet<{ data: MetaAdAccount[] }>('/me/adaccounts', token, {
    fields: 'id,name,currency,account_status,timezone_name',
    limit: '50',
  })
  return res.data ?? []
}

export async function getPages(token: string): Promise<MetaPage[]> {
  const res = await graphGet<{ data: MetaPage[] }>('/me/accounts', token, {
    fields: 'id,name,category,picture',
    limit: '50',
  })
  return res.data ?? []
}

export async function getInstagramForPage(
  token: string,
  pageId: string,
): Promise<MetaInstagramAccount | null> {
  try {
    const res = await graphGet<{
      instagram_business_account?: MetaInstagramAccount
    }>(`/${pageId}`, token, {
      fields: 'instagram_business_account{id,username,name,profile_picture_url}',
    })
    return res.instagram_business_account ?? null
  } catch {
    return null
  }
}

export async function getBusinessPortfolios(token: string): Promise<MetaBusinessPortfolio[]> {
  try {
    const res = await graphGet<{ data: MetaBusinessPortfolio[] }>('/me/businesses', token, {
      fields: 'id,name',
      limit: '10',
    })
    return res.data ?? []
  } catch {
    return []
  }
}

export interface MetaAdAccountDetails {
  id: string
  name: string
  currency: string
  account_status: number
  timezone_name?: string
}

export async function getAdAccountDetails(
  token: string,
  adAccountId: string,
): Promise<MetaAdAccountDetails> {
  return graphGet<MetaAdAccountDetails>(`/${adAccountId}`, token, {
    fields: 'id,name,currency,account_status,timezone_name',
  })
}

export async function getPageDetails(
  token: string,
  pageId: string,
): Promise<{ id: string; name: string; category?: string } | null> {
  try {
    return await graphGet<{ id: string; name: string; category?: string }>(
      `/${pageId}`,
      token,
      { fields: 'id,name,category' },
    )
  } catch {
    return null
  }
}

export { MetaApiError }

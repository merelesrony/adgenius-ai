import { META_GRAPH_BASE } from './meta-constants'
import { parseMetaError, MetaApiError } from './meta-errors'
import type {
  MetaAdAccount,
  MetaPage,
  MetaInstagramAccount,
  MetaBusinessPortfolio,
  MetaUserInfo,
  MetaTokenResponse,
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

export { MetaApiError }

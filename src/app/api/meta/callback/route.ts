import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { encryptMetaToken } from '@/lib/meta/meta-auth'
import { META_OAUTH_STATE_COOKIE } from '@/lib/meta/meta-constants'
import {
  exchangeCodeForToken,
  getMetaUser,
  getAdAccounts,
  getPages,
  getInstagramForPage,
  getBusinessPortfolios,
} from '@/lib/meta/meta-client'
import type { MetaInstagramAccount } from '@/lib/meta/meta-types'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ''

const GRANTED_SCOPES = [
  'ads_management',
  'ads_read',
  'pages_read_engagement',
  'pages_show_list',
  'business_management',
]

function classifyMetaError(error: string, description: string): string {
  const d = description.toLowerCase()
  const e = error.toLowerCase()

  if (e === 'access_denied' || d.includes('denied')) {
    return 'El usuario canceló la autorización de Meta.'
  }
  if (d.includes('invalid scope') || d.includes('scope')) {
    return 'Meta rechazó los permisos solicitados. Verifica que el producto Marketing API esté habilitado en tu app de Meta Developers.'
  }
  if (d.includes('redirect_uri') || d.includes('redirect uri')) {
    return 'La Redirect URI configurada en Meta no coincide exactamente con META_REDIRECT_URI. Valor actual: ' + (process.env.META_REDIRECT_URI ?? '(no configurado)')
  }
  if (d.includes('domain') || d.includes('dominio')) {
    return 'El dominio de la aplicación no está configurado correctamente en Meta Developers. Agrega "localhost" en App Domains.'
  }
  return description || error
}

function redirectError(reason: string) {
  return NextResponse.redirect(
    `${APP_URL}/settings?meta=error&reason=${encodeURIComponent(reason)}`,
  )
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const errorParam = searchParams.get('error')
  const errorDesc = searchParams.get('error_description') ?? ''

  // Safe log — no code/state values logged
  console.log('[Meta OAuth] callback_received', {
    has_code: !!code,
    has_state: !!state,
    has_error: !!errorParam,
    error_type: errorParam ?? null,
  })

  if (errorParam) {
    const friendly = classifyMetaError(errorParam, errorDesc)
    console.error('[Meta OAuth] authorization error', { error: errorParam, description: errorDesc })
    return redirectError(friendly)
  }

  if (!code || !state) {
    return redirectError('Parámetros OAuth inválidos')
  }

  // CSRF check
  const cookieStore = await cookies()
  const storedState = cookieStore.get(META_OAUTH_STATE_COOKIE)?.value
  cookieStore.delete(META_OAUTH_STATE_COOKIE)

  if (!storedState || storedState !== state) {
    console.error('[Meta OAuth] CSRF state mismatch')
    return redirectError('Estado OAuth inválido — posible ataque CSRF')
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirectError('Sesión expirada')

    // Exchange code for token — META_APP_SECRET stays server-side only
    const tokenData = await exchangeCodeForToken(code)
    const accessToken = tokenData.access_token

    console.log('[Meta OAuth] token_exchange_success', {
      token_type: tokenData.token_type,
      has_expires_in: !!tokenData.expires_in,
    })

    // Fetch Meta account data in parallel
    const [metaUser, adAccounts, pages, businesses] = await Promise.all([
      getMetaUser(accessToken),
      getAdAccounts(accessToken),
      getPages(accessToken),
      getBusinessPortfolios(accessToken),
    ])

    // Collect Instagram accounts from pages (no instagram_basic scope needed)
    const instagramAccounts: MetaInstagramAccount[] = []
    for (const page of pages) {
      const ig = await getInstagramForPage(accessToken, page.id)
      if (ig) instagramAccounts.push(ig)
    }

    console.log('[Meta OAuth] assets_fetch_success', {
      meta_user: metaUser.name,
      ad_accounts_count: adAccounts.length,
      pages_count: pages.length,
      instagram_accounts_count: instagramAccounts.length,
      businesses_count: businesses.length,
    })

    const encryptedToken = encryptMetaToken(accessToken)
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null

    const { error: upsertError } = await supabase
      .from('meta_connections')
      .upsert(
        {
          user_id: user.id,
          meta_user_id: metaUser.id,
          meta_user_name: metaUser.name,
          access_token_enc: encryptedToken,
          token_type: tokenData.token_type,
          expires_at: expiresAt,
          scopes: GRANTED_SCOPES,
          business_portfolio: (businesses[0] ?? null) as unknown as import('@/types/database').Json,
          ad_accounts: adAccounts as unknown as import('@/types/database').Json,
          pages: pages as unknown as import('@/types/database').Json,
          instagram_accounts: instagramAccounts as unknown as import('@/types/database').Json,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )

    if (upsertError) {
      console.error('[Meta OAuth] upsert error', upsertError.message)
      return redirectError('Error guardando conexión')
    }

    return NextResponse.redirect(`${APP_URL}/settings?meta=connected`)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[Meta OAuth] callback error', message)

    // Surface specific Meta API errors
    if (message.includes('redirect_uri') || message.includes('redirect uri')) {
      return redirectError('La Redirect URI no coincide. Verifica META_REDIRECT_URI en .env.local.')
    }
    if (message.includes('scope') || message.includes('permission')) {
      return redirectError('Meta rechazó los permisos solicitados. Verifica que Marketing API esté habilitado en la app.')
    }
    return redirectError('Error al conectar con Meta')
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encryptMetaToken, verifySignedState } from '@/lib/meta/meta-auth'
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  inspectMetaToken,
  getMetaUser,
  getAdAccounts,
  getPages,
  getInstagramForPage,
  getBusinessPortfolios,
  MetaApiError,
} from '@/lib/meta/meta-client'
import type { MetaInstagramAccount } from '@/lib/meta/meta-types'

const DRY_RUN = process.env.META_DRY_RUN === 'true'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ''

const GRANTED_SCOPES = [
  'ads_management',
  'ads_read',
  'pages_read_engagement',
  'pages_show_list',
  'business_management',
]

/** Classifies OAuth URL-level errors (the ?error= param from Meta's redirect). */
function classifyMetaOAuthError(error: string, description: string): string {
  const d = description.toLowerCase()
  const e = error.toLowerCase()

  if (e === 'access_denied' || d.includes('denied')) {
    return 'El usuario canceló la autorización de Meta.'
  }
  if (e === 'invalid_code' || d.includes('invalid code') || d.includes('código inválido')) {
    return 'El código de autorización expiró o ya fue usado. Intenta conectar nuevamente.'
  }
  if (d.includes('invalid scope') || d.includes('scope')) {
    return 'Meta rechazó los permisos solicitados. Verifica que el producto Marketing API esté habilitado en tu app de Meta Developers.'
  }
  if (d.includes('redirect_uri') || d.includes('redirect uri')) {
    return 'La Redirect URI configurada en Meta no coincide exactamente con META_REDIRECT_URI. Valor actual: ' + (process.env.META_REDIRECT_URI ?? '(no configurado)')
  }
  if (d.includes('domain') || d.includes('dominio')) {
    return 'El dominio de la aplicación no está configurado correctamente en Meta Developers.'
  }
  if (d.includes('insufficient') || d.includes('permission')) {
    return 'Permisos insuficientes. Asegúrate de aceptar todos los permisos durante la autorización.'
  }
  return description || error
}

/**
 * Classifies Meta Graph API errors (from token exchange or asset fetch calls).
 * Logs technical details; returns a user-friendly message.
 * Never logs access_token, app_secret, or token_secret.
 */
function classifyMetaApiError(err: MetaApiError): string {
  const code = err.code
  const msg = err.message.toLowerCase()

  // Code 190 = OAuthException — invalid/expired/revoked token
  if (code === 190) {
    if (msg.includes('expired')) return 'El token de acceso expiró. Reconecta tu cuenta de Meta.'
    if (msg.includes('revoked') || msg.includes('invalidated')) return 'Tu acceso fue revocado. Reconecta tu cuenta de Meta.'
    return 'Token de acceso inválido. Reconecta tu cuenta de Meta.'
  }

  // Code 100 = Invalid parameter (often invalid authorization code)
  if (code === 100) {
    if (msg.includes('code') || msg.includes('authorization')) {
      return 'El código de autorización es inválido o ya fue utilizado. Intenta conectar nuevamente.'
    }
    return 'Parámetro inválido en la solicitud a Meta. Verifica la configuración de la app.'
  }

  // Code 200-299 = Permission errors
  if (code !== undefined && code >= 200 && code < 300) {
    return 'Permisos insuficientes en la cuenta de Meta. Asegúrate de aceptar todos los permisos.'
  }

  // Code 4 / 17 = Rate limiting
  if (code === 4 || code === 17) {
    return 'Meta está limitando las solicitudes temporalmente. Intenta nuevamente en unos minutos.'
  }

  // Generic fallback
  return 'Error al comunicarse con Meta. Intenta conectar nuevamente.'
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

  console.log('[Meta OAuth] callback_received', {
    has_code: !!code,
    has_state: !!state,
    has_error: !!errorParam,
    error_type: errorParam ?? null,
  })

  if (errorParam) {
    const friendly = classifyMetaOAuthError(errorParam, errorDesc)
    console.error('[Meta OAuth] authorization error', { error: errorParam, description: errorDesc })
    return redirectError(friendly)
  }

  if (!code && !state) {
    console.error('[Meta OAuth] empty callback — Meta rejected the dialog before showing permissions')
    return redirectError(
      'Meta rechazó la solicitud antes de mostrar la pantalla de permisos. ' +
      'Verifica en Meta Developers: (1) tipo de app debe ser "Business", ' +
      '(2) Marketing API añadido, ' +
      '(3) permisos ads_management/ads_read habilitados.'
    )
  }

  if (!code || !state) {
    return redirectError('Parámetros OAuth inválidos')
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirectError('Sesión expirada')

    // CSRF: verify the state is a valid HMAC-signed token for this user
    if (!verifySignedState(state, user.id)) {
      console.error('[Meta OAuth] signed state verification failed')
      return redirectError('Estado OAuth inválido — posible ataque CSRF')
    }

    // Read existing selections BEFORE the upsert so we can validate them afterwards
    const { data: existingConn } = await supabase
      .from('meta_connections')
      .select('selected_ad_account_id, selected_page_id, selected_instagram_id')
      .eq('user_id', user.id)
      .maybeSingle()

    const isReconnection = !!existingConn

    // Step 1: Exchange authorization code for short-lived token (~1-2 h)
    // META_APP_SECRET stays server-side — never sent to client or logged
    const shortLivedData = await exchangeCodeForToken(code)

    console.log('[Meta OAuth] short_lived_token_received', {
      token_type: shortLivedData.token_type,
      has_expires_in: !!shortLivedData.expires_in,
    })

    // Step 2: Exchange for long-lived token (~60 days)
    // This extends the token life from ~1-2 h to ~60 days
    let accessToken: string
    let expiresAt: string | null

    try {
      const longLivedData = await exchangeForLongLivedToken(shortLivedData.access_token)
      accessToken = longLivedData.access_token
      expiresAt = longLivedData.expires_in
        ? new Date(Date.now() + longLivedData.expires_in * 1000).toISOString()
        : null

      console.log('[Meta OAuth] long_lived_token_exchanged', {
        token_type: longLivedData.token_type,
        expires_in_seconds: longLivedData.expires_in ?? null,
        expires_at: expiresAt,
      })

      // Token inspection — only in DRY_RUN mode to avoid extra latency in production.
      // Logs: is_valid, app_id, scopes, expiry — never logs the token itself.
      if (DRY_RUN) {
        try {
          const inspection = await inspectMetaToken(accessToken)
          console.log('[Meta OAuth] token_inspection', {
            is_valid: inspection.isValid,
            app_id: inspection.appId,
            scopes: inspection.scopes,
            expires_at_unix: inspection.expiresAt ?? null,
            data_access_expires_at_unix: inspection.dataAccessExpiresAt ?? null,
            has_error: !!inspection.error,
            error_code: inspection.error?.code ?? null,
            error_message: inspection.error?.message ?? null,
          })
        } catch (inspectErr) {
          console.warn('[Meta OAuth] token_inspection_failed', {
            error: inspectErr instanceof Error ? inspectErr.message : String(inspectErr),
          })
        }
      }
    } catch (exchangeErr) {
      // Falls back to short-lived token so the user is not blocked during development.
      // The preflight will warn via token_not_expired check when this token expires.
      const isMetaErr = exchangeErr instanceof MetaApiError
      console.warn('[Meta OAuth] LONG_LIVED_TOKEN_EXCHANGE_FAILED — using short-lived token fallback', {
        meta_error_code: isMetaErr ? (exchangeErr as MetaApiError).code : null,
        meta_error_subcode: isMetaErr ? (exchangeErr as MetaApiError).subcode : null,
        meta_error_message: isMetaErr ? (exchangeErr as MetaApiError).message : null,
        generic_error: !isMetaErr ? (exchangeErr instanceof Error ? exchangeErr.message : String(exchangeErr)) : null,
        probable_cause: isMetaErr
          ? 'App not approved for token exchange or META_APP_SECRET misconfigured'
          : 'Network error or unexpected response from Meta',
      })
      accessToken = shortLivedData.access_token
      expiresAt = shortLivedData.expires_in
        ? new Date(Date.now() + shortLivedData.expires_in * 1000).toISOString()
        : null
    }

    // Step 3: Fetch Meta account data in parallel using the final token
    const [metaUser, adAccounts, pages, businesses] = await Promise.all([
      getMetaUser(accessToken),
      getAdAccounts(accessToken),
      getPages(accessToken),
      getBusinessPortfolios(accessToken),
    ])

    // Collect Instagram accounts linked to pages
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
      is_reconnection: isReconnection,
    })

    // Step 4: Persist — upsert does NOT touch selected_* fields (preserved automatically)
    const encryptedToken = encryptMetaToken(accessToken)

    const { error: upsertError } = await supabase
      .from('meta_connections')
      .upsert(
        {
          user_id: user.id,
          meta_user_id: metaUser.id,
          meta_user_name: metaUser.name,
          access_token_enc: encryptedToken,
          token_type: shortLivedData.token_type,
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

    // Step 5: Validate preserved selections against the freshly fetched asset lists.
    // If a previously selected account/page/Instagram is no longer accessible,
    // clear it so the user is prompted to pick a valid one.
    if (isReconnection && existingConn?.selected_ad_account_id) {
      const accountStillAvailable = adAccounts.some(
        a => a.id === existingConn.selected_ad_account_id,
      )

      if (!accountStillAvailable) {
        await supabase.from('meta_connections').update({
          selected_ad_account_id: null,
          selected_ad_account_name: null,
          selected_page_id: null,
          selected_page_name: null,
          selected_instagram_id: null,
          updated_at: new Date().toISOString(),
        }).eq('user_id', user.id)

        console.log('[Meta OAuth] selections_cleared — ad account no longer available', {
          userId: user.id,
        })
      } else {
        // Ad account still valid — check page selection
        if (existingConn.selected_page_id) {
          const pageStillAvailable = pages.some(p => p.id === existingConn.selected_page_id)

          if (!pageStillAvailable) {
            await supabase.from('meta_connections').update({
              selected_page_id: null,
              selected_page_name: null,
              selected_instagram_id: null,
              updated_at: new Date().toISOString(),
            }).eq('user_id', user.id)

            console.log('[Meta OAuth] page_selection_cleared — page no longer available', {
              userId: user.id,
            })
          } else if (existingConn.selected_instagram_id) {
            // Page still valid — check Instagram selection
            const igStillAvailable = instagramAccounts.some(
              ig => ig.id === existingConn.selected_instagram_id,
            )

            if (!igStillAvailable) {
              await supabase.from('meta_connections').update({
                selected_instagram_id: null,
                updated_at: new Date().toISOString(),
              }).eq('user_id', user.id)

              console.log('[Meta OAuth] instagram_selection_cleared — account no longer available', {
                userId: user.id,
              })
            }
          }
        }
      }
    }

    const redirectStatus = isReconnection ? 'reconnected' : 'connected'
    return NextResponse.redirect(`${APP_URL}/settings?meta=${redirectStatus}`)
  } catch (err) {
    // Meta Graph API errors — classified by error code (never log tokens/secrets)
    if (err instanceof MetaApiError) {
      console.error('[Meta OAuth] api_error', {
        operation: 'callback',
        code: err.code,
        subcode: err.subcode,
        message: err.message,
      })
      return redirectError(classifyMetaApiError(err))
    }

    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[Meta OAuth] callback_error', { message })

    if (message.includes('redirect_uri') || message.includes('redirect uri')) {
      return redirectError('La Redirect URI no coincide. Verifica META_REDIRECT_URI.')
    }
    if (message.includes('scope') || message.includes('permission')) {
      return redirectError('Meta rechazó los permisos solicitados. Verifica que Marketing API esté habilitado en la app.')
    }
    return redirectError('Error al conectar con Meta')
  }
}

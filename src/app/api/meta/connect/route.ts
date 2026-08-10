import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildMetaOAuthUrl, generateSignedState, getOAuthMode } from '@/lib/meta/meta-auth'
import { META_OAUTH_SCOPES, META_CONFIG_ID } from '@/lib/meta/meta-constants'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // State is HMAC-signed with userId + timestamp — no cookie needed for CSRF protection.
    const state = generateSignedState(user.id)
    const oauthUrl = buildMetaOAuthUrl(state)
    const mode = getOAuthMode()

    console.log('[Meta OAuth] connect initiated', {
      mode,
      redirect_uri: process.env.META_REDIRECT_URI,
      app_id_set: !!process.env.META_APP_ID,
      ...(mode === 'config_id'
        ? { config_id: META_CONFIG_ID }
        : { requested_scopes: META_OAUTH_SCOPES }),
    })

    return NextResponse.redirect(oauthUrl)
  } catch (err) {
    console.error('[Meta OAuth] connect error', err instanceof Error ? err.message : err)
    const message = err instanceof Error ? err.message : 'Error iniciando conexión'
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/settings?meta=error&reason=${encodeURIComponent(message)}`,
    )
  }
}

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { buildMetaOAuthUrl, generateOAuthState } from '@/lib/meta/meta-auth'
import { META_OAUTH_STATE_COOKIE, META_OAUTH_STATE_TTL_SECONDS, META_OAUTH_SCOPES } from '@/lib/meta/meta-constants'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const state = generateOAuthState()
    const oauthUrl = buildMetaOAuthUrl(state)

    // Safe debug log — no secrets, no state value
    console.log('[Meta OAuth] connect initiated', {
      redirect_uri: process.env.META_REDIRECT_URI,
      requested_scopes: META_OAUTH_SCOPES,
      app_id_set: !!process.env.META_APP_ID,
    })

    const cookieStore = await cookies()
    cookieStore.set(META_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: META_OAUTH_STATE_TTL_SECONDS,
      path: '/',
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

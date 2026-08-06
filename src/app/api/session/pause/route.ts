import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Called with keepalive:true from the unload guard — marks an active draft session as paused.
// Must handle both application/json (regular fetch) and text/plain (sendBeacon fallback).
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') ?? ''
    let sessionId: string | undefined

    if (contentType.includes('application/json')) {
      const body = await req.json() as { sessionId?: string }
      sessionId = body.sessionId
    } else {
      const text = await req.text()
      try { sessionId = (JSON.parse(text) as { sessionId?: string }).sessionId } catch { /* ignore */ }
    }

    if (!sessionId) return NextResponse.json({ ok: false }, { status: 400 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createClient() as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false }, { status: 401 })

    await supabase
      .from('campaign_builder_sessions')
      .update({ status: 'paused' })
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .eq('status', 'draft') // only pause active drafts, never overwrite completed/abandoned

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

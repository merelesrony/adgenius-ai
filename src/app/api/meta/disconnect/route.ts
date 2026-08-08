import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { error } = await supabase
      .from('meta_connections')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('[meta/disconnect]', error.message)
      return NextResponse.json({ error: 'Error desconectando cuenta' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[meta/disconnect]', err)
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 })
  }
}

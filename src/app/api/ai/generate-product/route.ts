import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { generateProductFromDescription } from '@/lib/ai/AIManager'

const schema = z.object({
  description: z.string().min(5).max(1000),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Descripción inválida' }, { status: 400 })
    }

    const result = await generateProductFromDescription(parsed.data.description)

    await supabase.from('ai_usage').insert({ user_id: user.id, type: 'copy', tokens_used: null })

    return NextResponse.json(result)
  } catch (err) {
    console.error('[generate-product]', err)
    const message = err instanceof Error ? err.message : 'Error inesperado'
    return NextResponse.json(
      { error: 'Error analizando producto. Intenta nuevamente.', detail: message },
      { status: 500 },
    )
  }
}

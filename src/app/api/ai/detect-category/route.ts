import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { detectProductCategory } from '@/lib/ai/AIManager'

const schema = z.object({
  productName: z.string().min(2),
  productDescription: z.string().min(5),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const result = await detectProductCategory(
      parsed.data.productName,
      parsed.data.productDescription,
    )

    return NextResponse.json(result)
  } catch (err) {
    console.error('[detect-category]', err)
    return NextResponse.json({ error: 'Error detectando categoría' }, { status: 500 })
  }
}

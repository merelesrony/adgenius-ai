import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { generateCampaignStrategy } from '@/lib/ai/AIManager'

const schema = z.object({
  productName: z.string().min(1).max(200),
  productDescription: z.string().nullable().optional(),
  productCategory: z.string().nullable().optional(),
  productPrice: z.number().nullable().optional(),
  productCurrency: z.string().nullable().optional(),
  dailyBudget: z.number().positive(),
  budgetCurrency: z.string().default('USD'),
  country: z.string().min(1),
  city: z.string().default(''),
  radius: z.number().default(20),
  platforms: z.array(z.string()).default([]),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const d = parsed.data
    const result = await generateCampaignStrategy({
      productName: d.productName,
      productDescription: d.productDescription ?? null,
      productCategory: d.productCategory ?? null,
      productPrice: d.productPrice ?? null,
      productCurrency: d.productCurrency ?? null,
      dailyBudget: d.dailyBudget,
      budgetCurrency: d.budgetCurrency,
      country: d.country,
      city: d.city,
      radius: d.radius,
      platforms: d.platforms,
    })

    await supabase.from('ai_usage').insert({ user_id: user.id, type: 'copy', tokens_used: null })

    return NextResponse.json(result)
  } catch (err) {
    console.error('[generate-campaign-strategy]', err)
    const message = err instanceof Error ? err.message : 'Error inesperado'
    return NextResponse.json(
      { error: 'Error generando estrategia. Intenta nuevamente.', detail: message },
      { status: 500 },
    )
  }
}

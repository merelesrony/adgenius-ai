import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { generateAdCreative } from '@/lib/ai/AIManager'

const schema = z.object({
  productName: z.string().min(1).max(200),
  productDescription: z.string().nullable().optional(),
  productCategory: z.string().nullable().optional(),
  productPrice: z.number().nullable().optional(),
  productCurrency: z.string().nullable().optional(),
  ageMin: z.number().default(18),
  ageMax: z.number().default(65),
  gender: z.string().default('all'),
  interests: z.array(z.string()).default([]),
  objective: z.string().default('sales'),
  objectiveLabel: z.string().default('Ventas'),
  recommendedCTA: z.string().default('Comprar ahora'),
  dailyBudget: z.number().positive(),
  budgetCurrency: z.string().default('USD'),
  creativeStyle: z.string().default('Profesional'),
  creativeConcept: z.string().default('Producto como protagonista'),
  platforms: z.array(z.string()).default([]),
  userProductDescription: z.string().nullable().optional(),
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
    const result = await generateAdCreative({
      productName: d.productName,
      productDescription: d.productDescription ?? null,
      productCategory: d.productCategory ?? null,
      productPrice: d.productPrice ?? null,
      productCurrency: d.productCurrency ?? null,
      ageMin: d.ageMin,
      ageMax: d.ageMax,
      gender: d.gender,
      interests: d.interests,
      objective: d.objective,
      objectiveLabel: d.objectiveLabel,
      recommendedCTA: d.recommendedCTA,
      dailyBudget: d.dailyBudget,
      budgetCurrency: d.budgetCurrency,
      creativeStyle: d.creativeStyle,
      creativeConcept: d.creativeConcept,
      platforms: d.platforms,
      userProductDescription: d.userProductDescription ?? null,
    })

    await supabase.from('ai_usage').insert({ user_id: user.id, type: 'copy', tokens_used: null })

    return NextResponse.json(result)
  } catch (err) {
    console.error('[generate-ad-creative]', err)
    const message = err instanceof Error ? err.message : 'Error inesperado'
    return NextResponse.json(
      { error: 'Error generando creativos. Intenta nuevamente.', detail: message },
      { status: 500 },
    )
  }
}

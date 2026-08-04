import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { generateAll } from '@/lib/ai/AIManager'
import { DEFAULT_CURRENCY } from '@/lib/currency'

const schema = z.object({
  productName: z.string().min(2),
  productDescription: z.string().min(5),
  productCategory: z.string(),
  productPrice: z.number().nullable().optional(),
  productCurrency: z.string().default(DEFAULT_CURRENCY),
  country: z.string().optional(),
  city: z.string().optional(),
  objective: z.string().default('sales'),
  audienceMode: z.enum(['manual', 'ai']),
  dailyBudget: z.number().nullable().optional(),
  targetAgeMin: z.number().optional(),
  targetAgeMax: z.number().optional(),
  targetGender: z.string().optional(),
  targetInterests: z.array(z.string()).optional(),
  targetLanguages: z.array(z.string()).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Check AI usage limit
    type SubWithPlan = { plan: { ai_generations_limit: number } | null }
    const { data: subRaw } = await supabase
      .from('subscriptions')
      .select('*, plan:plans(ai_generations_limit)')
      .eq('user_id', user.id)
      .in('status', ['active', 'trial'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const subscription = subRaw as SubWithPlan | null
    const aiLimit = subscription?.plan?.ai_generations_limit ?? 20

    if (aiLimit !== -1) {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count: aiUsedCount } = await supabase
        .from('ai_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString())

      if ((aiUsedCount ?? 0) >= aiLimit) {
        return NextResponse.json(
          { error: `Límite de generaciones IA alcanzado (${aiLimit}/mes). Actualiza tu plan para continuar.` },
          { status: 429 },
        )
      }
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const d = parsed.data

    console.log('[AI generate] Iniciando generación para producto:', d.productName, '| audienceMode:', d.audienceMode)

    const result = await generateAll({
      name: d.productName,
      description: d.productDescription,
      category: d.productCategory,
      price: d.productPrice,
      currency: d.productCurrency,
      country: d.country,
      city: d.city,
      objective: d.objective,
      audienceMode: d.audienceMode,
      dailyBudget: d.dailyBudget,
      targetAgeMin: d.targetAgeMin,
      targetAgeMax: d.targetAgeMax,
      targetGender: d.targetGender,
      targetInterests: d.targetInterests,
      targetLanguages: d.targetLanguages,
    })

    // Final validation before persisting usage
    if (!result.headline || !result.body || !result.cta || !result.score) {
      console.error('[AI generate] Resultado incompleto:', result)
      return NextResponse.json(
        { error: 'Error generando campaña IA. Intenta nuevamente.' },
        { status: 500 },
      )
    }

    console.log('[AI generate] Generación exitosa | score:', result.score.total)

    // Log AI usage only on success
    await supabase.from('ai_usage').insert({
      user_id: user.id,
      type: 'copy',
      tokens_used: null,
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error('[AI generate]', err)
    const message = err instanceof Error ? err.message : 'Error inesperado'

    // Return a user-friendly message while logging the technical detail
    return NextResponse.json(
      { error: 'Error generando campaña IA. Intenta nuevamente.', detail: message },
      { status: 500 },
    )
  }
}

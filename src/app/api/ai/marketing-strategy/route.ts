import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { generateMarketingStrategy } from '@/lib/ai/AIManager'
import { DEFAULT_CURRENCY } from '@/lib/currency'

const schema = z.object({
  productName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(120),
  productDescription: z.string().min(10, 'La descripción debe tener al menos 10 caracteres').max(1000),
  productPrice: z.number().positive().nullable().optional(),
  productCurrency: z.string().default(DEFAULT_CURRENCY),
  productCategory: z.string().optional(),
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
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { productName, productDescription, productPrice, productCurrency, productCategory } = parsed.data

    const strategy = await generateMarketingStrategy({
      productName,
      productDescription,
      productPrice,
      productCurrency,
      productCategory,
    })

    // Persist to DB (best-effort — table may not exist if migration hasn't run)
    try {
      await supabase.from('marketing_strategies').insert({
        user_id: user.id,
        product_name: productName,
        product_description: productDescription,
        product_price: productPrice ?? null,
        product_currency: productCurrency,
        product_category: strategy.productAnalysis.detectedCategory || productCategory || null,
        strategy_json: JSON.parse(JSON.stringify(strategy)) as import('@/types/database').Json,
      })
    } catch (dbErr) {
      console.warn('[marketing-strategy] Could not save to DB (run migration 005):', dbErr)
    }

    // Track AI usage
    try {
      await supabase.from('ai_usage').insert({
        user_id: user.id,
        type: 'marketing_strategy',
      })
    } catch {
      // non-critical
    }

    return NextResponse.json({ strategy })
  } catch (err) {
    console.error('[marketing-strategy] Error:', err)
    const message = err instanceof Error ? err.message : 'Error generando estrategia'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (id) {
      const { data, error } = await supabase
        .from('marketing_strategies')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()
      if (error) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
      return NextResponse.json({ strategy: data.strategy_json, meta: data })
    }

    const { data, error } = await supabase
      .from('marketing_strategies')
      .select('id, product_name, product_category, product_currency, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) return NextResponse.json({ strategies: [] })
    return NextResponse.json({ strategies: data })
  } catch (err) {
    console.error('[marketing-strategy GET] Error:', err)
    return NextResponse.json({ strategies: [] })
  }
}

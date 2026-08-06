import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductsModule } from '@/features/products/products-module'
import type { Database } from '@/types/database'

type ProductRow = Database['public']['Tables']['products']['Row']
type CreativeRow = Database['public']['Tables']['campaign_creatives']['Row']

interface CreativeWithJoins extends CreativeRow {
  campaign_name?: string | null
  product_name?: string | null
}

export const metadata: Metadata = { title: 'Product & Creative Studio — AdGenius AI' }

export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Load products
  const { data: productsRaw } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  const products = (productsRaw ?? []) as ProductRow[]

  // Load campaigns (for "use in campaign" feature + count per product)
  const { data: campaignsRaw } = await supabase
    .from('campaigns')
    .select('id, name, status, product_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  const campaigns = (campaignsRaw ?? []) as { id: string; name: string; status: string; product_id?: string | null }[]

  // Load creatives with product and campaign joins
  let creatives: CreativeWithJoins[] = []
  try {
    const { data: creativesRaw } = await supabase
      .from('campaign_creatives')
      .select('*, campaign:campaigns(id, name), product:products(id, name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (creativesRaw) {
      creatives = creativesRaw.map((c) => {
        const campaignData = c.campaign as { id: string; name: string } | null
        const productData = c.product as { id: string; name: string } | null
        return {
          ...c,
          campaign: undefined,
          product: undefined,
          campaign_name: campaignData?.name ?? null,
          product_name: productData?.name ?? null,
        }
      })
    }
  } catch {
    // Graceful fallback if migration 006 hasn't run yet
    try {
      const { data: creativesBasic } = await supabase
        .from('campaign_creatives')
        .select('id, user_id, campaign_id, image_url, prompt, model, format, preset_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      creatives = (creativesBasic ?? []).map((c) => ({
        ...c,
        product_id: null,
        is_favorite: false,
        category: null,
        is_primary: false,
        headline: null,
        primary_text: null,
        description: null,
        cta: null,
        variant: null,
        variant_label: null,
        campaign_name: null,
        product_name: null,
        creative_brief: null,
        creative_score: null,
        platform_format: null,
        variant_type: null,
        generation_model: null,
      }))
    } catch {
      creatives = []
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-2">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Productos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tus productos son el centro — cada uno puede tener campañas y creativos propios
          </p>
        </div>
      </div>

      <ProductsModule
        products={products}
        creatives={creatives}
        campaigns={campaigns}
        userId={user.id}
      />
    </div>
  )
}

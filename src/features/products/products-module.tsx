'use client'

import { useState, useEffect, useMemo } from 'react'
import { Package, Palette, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductsTab } from './components/products-tab'
import { CreativeStudioTab } from './components/creative-studio-tab'
import { CreativeLibraryTab } from './components/creative-library-tab'
import type { Database } from '@/types/database'

type ProductRow = Database['public']['Tables']['products']['Row']
type CreativeRow = Database['public']['Tables']['campaign_creatives']['Row']
type CampaignBasic = { id: string; name: string; status: string; product_id?: string | null }

interface CreativeWithJoins extends CreativeRow {
  campaign_name?: string | null
  product_name?: string | null
}

export interface ProductsModuleProps {
  products: ProductRow[]
  creatives: CreativeWithJoins[]
  campaigns: CampaignBasic[]
  userId: string
}

type Tab = 'products' | 'studio' | 'library'

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'products', label: 'Productos',              icon: Package },
  { id: 'studio',   label: 'Creative Studio',        icon: Palette },
  { id: 'library',  label: 'Biblioteca de creativos', icon: ImageIcon },
]

export function ProductsModule({ products, creatives, campaigns, userId }: ProductsModuleProps) {
  const [tab, setTab] = useState<Tab>('products')

  const creativesCountByProduct = useMemo(() => {
    const map: Record<string, number> = {}
    for (const c of creatives) {
      if (c.product_id) map[c.product_id] = (map[c.product_id] ?? 0) + 1
    }
    return map
  }, [creatives])

  const campaignsCountByProduct = useMemo(() => {
    const map: Record<string, number> = {}
    for (const c of campaigns) {
      if (c.product_id) map[c.product_id] = (map[c.product_id] ?? 0) + 1
    }
    return map
  }, [campaigns])

  // Sync with URL search param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('tab') as Tab | null
    if (t && (['products', 'studio', 'library'] as Tab[]).includes(t)) {
      setTab(t)
    }
  }, [])

  function switchTab(t: Tab) {
    setTab(t)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', t)
    window.history.pushState({}, '', url.toString())
  }

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-border">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => switchTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px',
              tab === id
                ? 'border-brand text-brand'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'products' && (
        <ProductsTab
          products={products}
          userId={userId}
          creativesCountByProduct={creativesCountByProduct}
          campaignsCountByProduct={campaignsCountByProduct}
        />
      )}
      {tab === 'studio' && (
        <CreativeStudioTab products={products} campaigns={campaigns} userId={userId} />
      )}
      {tab === 'library' && (
        <CreativeLibraryTab creatives={creatives} campaigns={campaigns} />
      )}
    </div>
  )
}

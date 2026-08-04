'use client'

import { useState, useTransition, useMemo, useEffect } from 'react'
import {
  Heart, Megaphone, Trash2, Download, Search, Filter,
  ImageIcon, Sparkles, Star, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import {
  toggleCreativeFavoriteAction,
  deleteCreativeAction,
  assignCreativeToCampaignAction,
} from '../actions'
import type { Database } from '@/types/database'

const CREATIVES_PER_PAGE = 24

type CreativeRow = Database['public']['Tables']['campaign_creatives']['Row']
type CampaignBasic = { id: string; name: string; status: string }

interface CreativeWithJoins extends CreativeRow {
  campaign_name?: string | null
  product_name?: string | null
}

interface CreativeLibraryTabProps {
  creatives: CreativeWithJoins[]
  campaigns: CampaignBasic[]
}

function CreativeCard({
  creative,
  onFavoriteToggle,
  onDelete,
  onAssign,
}: {
  creative: CreativeWithJoins
  onFavoriteToggle: (id: string, current: boolean) => void
  onDelete: (id: string) => void
  onAssign: (creative: CreativeWithJoins) => void
}) {
  const [enlarged, setEnlarged] = useState(false)
  const [pendingFav, startFav] = useTransition()
  const [pendingDelete, startDelete] = useTransition()

  return (
    <>
      <div className="group relative rounded-xl border border-border bg-card overflow-hidden hover:border-brand/30 transition-colors">
        {/* Image */}
        <div
          className="relative aspect-square bg-muted/40 overflow-hidden cursor-pointer"
          onClick={() => setEnlarged(true)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={creative.image_url}
            alt="Creativo IA"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />

          {/* IA badge */}
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-brand text-white px-2 py-0.5 text-[10px] font-semibold">
            <Sparkles className="size-2.5" />
            {creative.format ?? 'square'}
          </div>

          {/* Favorite */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              startFav(async () => {
                const result = await toggleCreativeFavoriteAction(creative.id, !creative.is_favorite)
                if (!result.success) toast.error(result.error)
                else onFavoriteToggle(creative.id, creative.is_favorite)
              })
            }}
            disabled={pendingFav}
            className={cn(
              'absolute top-2 right-2 p-1.5 rounded-full transition-all shadow',
              creative.is_favorite
                ? 'bg-red-500 text-white'
                : 'bg-black/40 text-white/70 hover:bg-red-500/80 hover:text-white opacity-0 group-hover:opacity-100',
            )}
          >
            <Heart className={cn('size-3', creative.is_favorite && 'fill-current')} />
          </button>
        </div>

        {/* Info */}
        <div className="p-3 space-y-2">
          <div>
            {creative.product_name && (
              <p className="text-xs font-semibold text-foreground truncate">{creative.product_name}</p>
            )}
            {creative.category && (
              <p className="text-[10px] text-muted-foreground truncate">{creative.category}</p>
            )}
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {formatDate(creative.created_at)}
            </p>
            {creative.campaign_name && (
              <p className="text-[10px] text-brand font-medium mt-0.5 flex items-center gap-1">
                <Megaphone className="size-2.5" />
                {creative.campaign_name}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 pt-1 border-t border-border/50">
            <Button
              size="sm"
              className="flex-1 gap-1 h-7 text-[11px]"
              onClick={() => onAssign(creative)}
            >
              <Megaphone className="size-3" />
              Usar
            </Button>
            <button
              type="button"
              onClick={() => {
                const a = document.createElement('a')
                a.href = creative.image_url
                a.download = `creativo-${creative.id.slice(0, 8)}.jpg`
                a.target = '_blank'
                a.click()
              }}
              className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Descargar"
            >
              <Download className="size-3" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (!confirm('¿Eliminar este creativo?')) return
                startDelete(async () => {
                  const storagePath = creative.image_url.includes('/product-images/')
                    ? creative.image_url.split('/product-images/')[1]?.split('?')[0]
                    : undefined
                  const result = await deleteCreativeAction(creative.id, storagePath)
                  if (!result.success) toast.error(result.error)
                  else onDelete(creative.id)
                })
              }}
              disabled={pendingDelete}
              className="p-1.5 rounded-md border border-destructive/20 text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-50"
              title="Eliminar"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Enlarged preview modal */}
      <Modal open={enlarged} onClose={() => setEnlarged(false)} size="xl" title={creative.product_name ?? 'Creativo'}>
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={creative.image_url}
            alt="Creativo IA"
            className="w-full max-h-[500px] object-contain rounded-lg border border-border bg-muted/30"
          />
          {creative.prompt && (
            <div className="rounded-lg bg-muted/30 border border-border/50 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 font-medium">Prompt</p>
              <p className="text-xs text-foreground leading-relaxed">{creative.prompt}</p>
            </div>
          )}
          <div className="flex gap-2">
            <Button className="flex-1 gap-2" onClick={() => { setEnlarged(false); onAssign(creative) }}>
              <Megaphone className="size-4" />
              Usar en campaña
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => {
              const a = document.createElement('a')
              a.href = creative.image_url
              a.download = `creativo-${creative.id.slice(0, 8)}.jpg`
              a.target = '_blank'
              a.click()
            }}>
              <Download className="size-4" />
              Descargar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

function CampaignPickerModal({
  open,
  campaigns,
  onClose,
  onPick,
  isLoading,
}: {
  open: boolean
  campaigns: CampaignBasic[]
  onClose: () => void
  onPick: (id: string) => void
  isLoading: boolean
}) {
  const activeCampaigns = campaigns.filter((c) => ['draft', 'pending', 'active', 'paused'].includes(c.status))
  return (
    <Modal open={open} onClose={onClose} title="Seleccionar campaña" size="md">
      {activeCampaigns.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No tienes campañas activas.</p>
      ) : (
        <div className="space-y-1.5">
          {activeCampaigns.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={isLoading}
              onClick={() => onPick(c.id)}
              className="w-full flex items-center justify-between rounded-lg border border-border bg-card hover:bg-muted/50 hover:border-brand/30 px-4 py-3 text-left transition-all disabled:opacity-50"
            >
              <span className="text-sm font-medium text-foreground">{c.name}</span>
              <span className={cn(
                'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                c.status === 'active' ? 'bg-success/10 text-success' :
                c.status === 'pending' ? 'bg-warning/10 text-warning' :
                'bg-muted text-muted-foreground',
              )}>
                {c.status}
              </span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  )
}

export function CreativeLibraryTab({ creatives: initialCreatives, campaigns }: CreativeLibraryTabProps) {
  const [creatives, setCreatives] = useState<CreativeWithJoins[]>(initialCreatives)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterProduct, setFilterProduct] = useState('')
  const [filterFavorites, setFilterFavorites] = useState(false)
  const [assignTarget, setAssignTarget] = useState<CreativeWithJoins | null>(null)
  const [assigning, startAssign] = useTransition()
  const [visibleCount, setVisibleCount] = useState(CREATIVES_PER_PAGE)

  // Derive unique categories and products from creatives
  const uniqueCategories = useMemo(() => {
    const cats = new Set(creatives.map((c) => c.category).filter(Boolean) as string[])
    return Array.from(cats).sort()
  }, [creatives])

  const uniqueProducts = useMemo(() => {
    const seen = new Set<string>()
    return creatives
      .filter((c) => c.product_name && !seen.has(c.product_name) && seen.add(c.product_name))
      .map((c) => ({ name: c.product_name! }))
  }, [creatives])

  const filtered = useMemo(() => {
    return creatives.filter((c) => {
      if (filterFavorites && !c.is_favorite) return false
      if (filterCategory && c.category !== filterCategory) return false
      if (filterProduct && c.product_name !== filterProduct) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          (c.product_name ?? '').toLowerCase().includes(q) ||
          (c.category ?? '').toLowerCase().includes(q) ||
          (c.campaign_name ?? '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [creatives, search, filterCategory, filterProduct, filterFavorites])

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(CREATIVES_PER_PAGE)
  }, [search, filterCategory, filterProduct, filterFavorites])

  function handleFavoriteToggle(id: string, wasFavorite: boolean) {
    setCreatives((prev) => prev.map((c) => c.id === id ? { ...c, is_favorite: !wasFavorite } : c))
  }

  function handleDelete(id: string) {
    setCreatives((prev) => prev.filter((c) => c.id !== id))
    toast.success('Creativo eliminado')
  }

  function handleAssign(creative: CreativeWithJoins) {
    setAssignTarget(creative)
  }

  function handlePickCampaign(campaignId: string) {
    if (!assignTarget) return
    startAssign(async () => {
      const result = await assignCreativeToCampaignAction(
        assignTarget.id,
        campaignId,
        assignTarget.image_url,
      )
      if (result.success) {
        const campaignName = campaigns.find((c) => c.id === campaignId)?.name ?? ''
        setCreatives((prev) =>
          prev.map((c) =>
            c.id === assignTarget.id
              ? { ...c, campaign_id: campaignId, campaign_name: campaignName }
              : c,
          ),
        )
        toast.success('Creativo asignado correctamente')
        setAssignTarget(null)
      } else {
        toast.error(result.error)
      }
    })
  }

  const hasFilters = search || filterCategory || filterProduct || filterFavorites
  const visibleCreatives = filtered.slice(0, visibleCount)
  const hasMore = filtered.length > visibleCount

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar creativos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {uniqueCategories.length > 0 && (
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-sm rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todas las categorías</option>
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        )}

        {uniqueProducts.length > 0 && (
          <select
            value={filterProduct}
            onChange={(e) => setFilterProduct(e.target.value)}
            className="text-sm rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos los productos</option>
            {uniqueProducts.map((p) => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
        )}

        <button
          type="button"
          onClick={() => setFilterFavorites((v) => !v)}
          className={cn(
            'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-all',
            filterFavorites
              ? 'border-red-300 bg-red-500/10 text-red-500 dark:text-red-400'
              : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted',
          )}
        >
          <Star className={cn('size-3.5', filterFavorites && 'fill-current')} />
          Favoritos
        </button>

        {hasFilters && (
          <button
            type="button"
            onClick={() => { setSearch(''); setFilterCategory(''); setFilterProduct(''); setFilterFavorites(false) }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Filter className="size-3" />
            Limpiar filtros
          </button>
        )}

        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} de {creatives.length}
        </span>
      </div>

      {/* Grid */}
      {creatives.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-12 flex flex-col items-center gap-4 text-center">
          <div className="size-14 rounded-2xl bg-muted flex items-center justify-center">
            <ImageIcon className="size-7 text-muted-foreground/50" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Sin creativos todavía</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Genera creativos en el Creative Studio y aparecerán aquí automáticamente.
            </p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No hay creativos que coincidan con los filtros.</p>
          <button type="button" onClick={() => { setSearch(''); setFilterCategory(''); setFilterProduct(''); setFilterFavorites(false) }}
            className="text-xs text-brand hover:underline mt-2 block mx-auto">
            Limpiar filtros
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {visibleCreatives.map((creative) => (
              <CreativeCard
                key={creative.id}
                creative={creative}
                onFavoriteToggle={handleFavoriteToggle}
                onDelete={handleDelete}
                onAssign={handleAssign}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex flex-col items-center gap-1 pt-2">
              <button
                type="button"
                onClick={() => setVisibleCount((v) => v + CREATIVES_PER_PAGE)}
                className="px-4 py-2 text-sm rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors"
              >
                Cargar más ({filtered.length - visibleCount} restantes)
              </button>
              <p className="text-xs text-muted-foreground">
                Mostrando {visibleCreatives.length} de {filtered.length}
              </p>
            </div>
          )}
        </>
      )}

      {/* Campaign picker modal */}
      <CampaignPickerModal
        open={!!assignTarget}
        campaigns={campaigns}
        onClose={() => setAssignTarget(null)}
        onPick={handlePickCampaign}
        isLoading={assigning}
      />
    </div>
  )
}

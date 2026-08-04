'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  PlusCircle, Package, Edit2, Trash2, Box, Image as ImageIcon, Tag, Search, X, Sparkles, Wand2, Megaphone,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/currency'
import { createProductAction, updateProductAction, deleteProductAction } from '../actions'
import { ProductFormModal } from './product-form-modal'
import type { ProductFormData } from './product-form-modal'
import type { Database } from '@/types/database'

type ProductRow = Database['public']['Tables']['products']['Row']

const PRODUCTS_PER_PAGE = 16

interface ProductsTabProps {
  products: ProductRow[]
  userId: string
  creativesCountByProduct?: Record<string, number>
  campaignsCountByProduct?: Record<string, number>
}

function ProductCard({
  product,
  creativesCount,
  campaignsCount,
  onEdit,
  onDeleted,
}: {
  product: ProductRow
  creativesCount?: number
  campaignsCount?: number
  onEdit: () => void
  onDeleted: () => void
}) {
  const [isPendingDelete, startDelete] = useTransition()
  const images = (product.images as string[] | null) ?? []
  const primaryImage = images[0]

  return (
    <div className="group rounded-xl border border-border bg-card overflow-hidden hover:border-brand/30 transition-colors">
      {/* Image */}
      <div className="relative aspect-square bg-muted/40 overflow-hidden">
        {primaryImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="size-10 text-muted-foreground/30" />
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-2 left-2">
          <Badge variant={product.is_active ? 'success' : 'secondary'} dot>
            {product.is_active ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>

        {/* Image count */}
        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 text-white px-2 py-0.5 text-[10px] font-medium">
            <ImageIcon className="size-2.5" />
            {images.length}
          </div>
        )}

        {/* Creative count badge */}
        {(creativesCount ?? 0) > 0 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-brand/90 text-white px-2 py-0.5 text-[10px] font-medium">
            <Sparkles className="size-2.5" />
            {creativesCount}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-2">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
              {product.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          {product.price != null ? (
            <span className="text-sm font-semibold text-brand">
              {formatCurrency(product.price, product.currency ?? 'USD')}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Sin precio</span>
          )}
          {product.category && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[10px]">
              <Tag className="size-2.5" />
              {product.category}
            </span>
          )}
        </div>

        {/* Stats row */}
        {((campaignsCount ?? 0) > 0 || (creativesCount ?? 0) > 0) && (
          <div className="flex items-center gap-2 pt-1">
            {(campaignsCount ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <Megaphone className="size-2.5" />
                {campaignsCount} campaña{campaignsCount !== 1 ? 's' : ''}
              </span>
            )}
            {(creativesCount ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <Sparkles className="size-2.5" />
                {creativesCount} creativo{creativesCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-1.5 pt-1 border-t border-border/50">
          {/* Primary: Crear campaña IA */}
          <Link href="/campaign-builder" className="block">
            <Button size="sm" className="w-full gap-1.5 h-7 text-xs">
              <Wand2 className="size-3" />
              Crear campaña IA
            </Button>
          </Link>
          {/* Secondary row */}
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1.5 h-7 text-xs"
              onClick={() => {
                window.location.href = '/products?tab=studio'
              }}
            >
              <Sparkles className="size-3" />
              Creativo
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1.5 h-7 text-xs"
              onClick={onEdit}
            >
              <Edit2 className="size-3" />
              Editar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20"
              onClick={() => {
                if (!confirm(`¿Eliminar "${product.name}"?`)) return
                startDelete(async () => {
                  const result = await deleteProductAction(product.id)
                  if (!result.success) toast.error(result.error)
                  else onDeleted()
                })
              }}
              loading={isPendingDelete}
              disabled={isPendingDelete}
            >
              {!isPendingDelete && <Trash2 className="size-3" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProductsTab({ products, userId, creativesCountByProduct, campaignsCountByProduct }: ProductsTabProps) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<ProductRow | null>(null)
  const [isCreating, startCreate] = useTransition()
  const [isUpdating, startUpdate] = useTransition()
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE)

  const uniqueCategories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category).filter(Boolean) as string[])
    return Array.from(cats).sort()
  }, [products])

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (filterCategory && p.category !== filterCategory) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          p.name.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q) ||
          (p.category ?? '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [products, search, filterCategory])

  const visible = filtered.slice(0, visibleCount)
  const hasMore = filtered.length > visibleCount

  function resetPagination() {
    setVisibleCount(PRODUCTS_PER_PAGE)
  }

  function handleCreate(data: ProductFormData) {
    startCreate(async () => {
      const result = await createProductAction({
        ...data,
        description: data.description ?? undefined,
        category: data.category ?? undefined,
        price: data.price ?? undefined,
      })
      if (result.success) {
        toast.success('Producto creado')
        setCreateOpen(false)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleUpdate(data: ProductFormData) {
    if (!editProduct) return
    startUpdate(async () => {
      const result = await updateProductAction(editProduct.id, {
        ...data,
        description: data.description ?? undefined,
        category: data.category ?? undefined,
        price: data.price ?? undefined,
      })
      if (result.success) {
        toast.success('Producto actualizado')
        setEditProduct(null)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-5">
      {/* Toolbar: search + filter + new button */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPagination() }}
            className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); resetPagination() }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Category filter */}
        {uniqueCategories.length > 0 && (
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); resetPagination() }}
            className="text-sm rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todas las categorías</option>
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        )}

        {/* Count + new */}
        <div className="flex items-center gap-2 sm:ml-auto shrink-0">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
          </span>
          <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
            <PlusCircle className="size-4" />
            Nuevo producto
          </Button>
        </div>
      </div>

      {/* Content */}
      {products.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-12 flex flex-col items-center gap-4 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-muted">
            <Box className="size-7 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Sin productos todavía</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Agrega tus productos o servicios para reutilizarlos en campañas y generar creativos IA.
            </p>
          </div>
          <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
            <PlusCircle className="size-4" />
            Agregar primer producto
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No hay productos que coincidan con la búsqueda.
          </p>
          <button
            type="button"
            onClick={() => { setSearch(''); setFilterCategory('') }}
            className="text-xs text-brand hover:underline mt-2 block mx-auto"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visible.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                creativesCount={creativesCountByProduct?.[p.id]}
                campaignsCount={campaignsCountByProduct?.[p.id]}
                onEdit={() => setEditProduct(p)}
                onDeleted={router.refresh}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex flex-col items-center gap-1 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount((v) => v + PRODUCTS_PER_PAGE)}
              >
                Cargar más ({filtered.length - visibleCount} restantes)
              </Button>
              <p className="text-xs text-muted-foreground">
                Mostrando {visible.length} de {filtered.length}
              </p>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <ProductFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={handleCreate}
        userId={userId}
        isLoading={isCreating}
      />
      <ProductFormModal
        open={!!editProduct}
        onClose={() => setEditProduct(null)}
        onSave={handleUpdate}
        product={editProduct}
        userId={userId}
        isLoading={isUpdating}
      />
    </div>
  )
}

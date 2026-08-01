'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Megaphone, Search, Sparkles, SortAsc, SortDesc, Pencil, Copy, Trash2,
} from 'lucide-react'
import type { Database } from '@/types/database'
import { cn, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/badge'
import { Pagination } from '@/components/ui/pagination'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { deleteCampaignAction, duplicateCampaignAction } from '../actions'

type CampaignRow = Database['public']['Tables']['campaigns']['Row']
type CampaignStatus = Database['public']['Enums']['campaign_status']
type SortDir = 'desc' | 'asc'
type StatusFilter = 'all' | CampaignStatus

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'draft', label: 'Borrador' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'active', label: 'Activo' },
  { value: 'paused', label: 'Pausado' },
  { value: 'completed', label: 'Completado' },
  { value: 'failed', label: 'Fallido' },
]

const PAGE_SIZE = 10

interface CampaignListProps {
  campaigns: CampaignRow[]
}

export function CampaignList({ campaigns }: CampaignListProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = campaigns
    .filter((c) => {
      const matchesQuery = c.name.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter
      return matchesQuery && matchesStatus
    })
    .sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return sortDir === 'desc' ? -diff : diff
    })

  const total = filtered.length
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const hasFilters = query !== '' || statusFilter !== 'all'

  const handleDuplicate = (id: string) => {
    setPendingAction(`dup-${id}`)
    startTransition(async () => {
      const result = await duplicateCampaignAction(id)
      setPendingAction(null)
      if (result.success) {
        toast.success('Campaña duplicada')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Error al duplicar la campaña')
      }
    })
  }

  const handleDelete = () => {
    if (!deleteId) return
    startTransition(async () => {
      const result = await deleteCampaignAction(deleteId)
      if (result.success) {
        setDeleteId(null)
        toast.success('Campaña eliminada')
        router.refresh()
      } else {
        setDeleteId(null)
        toast.error(result.error ?? 'Error al eliminar la campaña')
      }
    })
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            placeholder="Buscar campaña..."
            className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1) }}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
          className="gap-2 shrink-0"
        >
          {sortDir === 'desc'
            ? <SortDesc className="size-4" />
            : <SortAsc className="size-4" />
          }
          {sortDir === 'desc' ? 'Más recientes' : 'Más antiguas'}
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {paginated.length === 0 ? (
          <EmptyState
            icon={<Megaphone className="size-7 text-muted-foreground" />}
            title={hasFilters ? 'Sin resultados' : 'Sin campañas'}
            description={
              hasFilters
                ? 'Prueba con otros filtros de búsqueda.'
                : 'Crea tu primera campaña y usa IA para generar el copy y la audiencia ideal para tu negocio.'
            }
            action={hasFilters ? undefined : { label: 'Crear primera campaña', href: '/campaigns/new' }}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden md:table-cell">Score IA</TableHead>
                <TableHead className="hidden lg:table-cell">Presupuesto/día</TableHead>
                <TableHead className="hidden sm:table-cell">Creada</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((c) => {
                const isDuplicating = pendingAction === `dup-${c.id}`
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/campaigns/${c.id}`}
                          className="font-medium text-foreground hover:text-brand transition-colors"
                        >
                          {c.name}
                        </Link>
                        {c.ai_generated && (
                          <Sparkles className="size-3 text-brand shrink-0" aria-label="IA" />
                        )}
                      </div>
                      {c.product_name && (
                        <p className="text-xs text-muted-foreground mt-0.5">{c.product_name}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {c.campaign_score != null ? (
                        <span className={cn(
                          'font-medium',
                          c.campaign_score >= 70
                            ? 'text-success'
                            : c.campaign_score >= 40
                              ? 'text-amber-500'
                              : 'text-muted-foreground',
                        )}>
                          {c.campaign_score}/100
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {c.daily_budget
                        ? `$${c.daily_budget}${c.currency ? ` ${c.currency}` : ''}`
                        : '—'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {formatDate(c.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/campaigns/${c.id}/edit`}>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Editar"
                            disabled={isPending}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Duplicar"
                          disabled={isPending}
                          loading={isDuplicating}
                          onClick={() => handleDuplicate(c.id)}
                        >
                          {!isDuplicating && <Copy className="size-3.5" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Eliminar"
                          disabled={isPending}
                          onClick={() => setDeleteId(c.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="px-1 mt-2"
        />
      )}

      {/* Confirm delete */}
      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => { if (!isPending) setDeleteId(null) }}
        onConfirm={handleDelete}
        title="Eliminar campaña"
        description="¿Estás seguro de que deseas eliminar esta campaña? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="destructive"
        loading={isPending && deleteId !== null}
      />
    </>
  )
}

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PlusCircle, Box } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Productos' }

export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  type ProductRow = {
    id: string; user_id: string; name: string; description: string | null
    price: number | null; currency: string; category: string | null
    images: unknown; is_active: boolean; created_at: string; updated_at: string
  }
  const { data: productsRaw } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  const products = productsRaw as ProductRow[] | null

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Productos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Administra los productos que usarás en tus campañas
          </p>
        </div>
        <Button size="sm">
          <PlusCircle className="size-4" />
          Agregar producto
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        {!products || products.length === 0 ? (
          <EmptyState
            icon={Box}
            title="Sin productos"
            description="Agrega tus productos o servicios para usarlos en las campañas publicitarias."
            action={{ label: 'Agregar primer producto', href: '/products' }}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">Categoría</TableHead>
                <TableHead className="hidden sm:table-cell">Precio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden lg:table-cell">Agregado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">{p.name}</div>
                    {p.description && (
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {p.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {p.category ?? '—'}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {p.price ? formatCurrency(p.price, p.currency) : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.is_active ? 'success' : 'secondary'}>
                      {p.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {formatDate(p.created_at)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">Editar</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Clientes — Admin' }

type ProfileRow = {
  id: string
  role: string
  is_active: boolean
  created_at: string
  businesses: { name?: string }[] | null
  subscriptions: { status: string; plan?: { display_name: string } }[] | null
}

export default async function AdminUsersPage() {
  const admin = createAdminClient()

  const { data: rawProfiles } = await admin
    .from('profiles')
    .select('*, businesses(*), subscriptions(*, plan:plans(display_name))')
    .eq('role', 'client')
    .order('created_at', { ascending: false })
    .limit(50)

  const profiles = rawProfiles as ProfileRow[] | null

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Clientes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {profiles?.length ?? 0} clientes registrados
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Negocio</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead className="hidden sm:table-cell">Estado</TableHead>
              <TableHead className="hidden lg:table-cell">Registrado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles?.map((p) => {
              const business = p.businesses?.[0]
              const sub = p.subscriptions?.[0]
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">{business?.name ?? 'Sin negocio'}</div>
                    <div className="text-xs text-muted-foreground">{p.id.slice(0, 8)}…</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {sub?.plan?.display_name ?? 'Sin plan'}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={p.is_active ? 'success' : 'destructive'}>
                      {p.is_active ? 'Activo' : 'Bloqueado'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {formatDate(p.created_at)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      {p.is_active ? 'Bloquear' : 'Activar'}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

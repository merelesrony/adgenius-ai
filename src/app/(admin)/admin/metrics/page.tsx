import type { Metadata } from 'next'
import { Users, Megaphone, Box, Sparkles } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { StatCard } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Métricas — Admin' }

export default async function AdminMetricsPage() {
  const admin = createAdminClient()

  const [
    { count: totalUsers },
    { count: totalCampaigns },
    { count: totalProducts },
    { count: totalAiUsage },
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
    admin.from('campaigns').select('*', { count: 'exact', head: true }),
    admin.from('products').select('*', { count: 'exact', head: true }),
    admin.from('ai_usage').select('*', { count: 'exact', head: true }),
  ])

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Métricas globales</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Resumen de toda la plataforma</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Clientes" value={totalUsers ?? 0} icon={<Users />} description="Total registrados" />
        <StatCard title="Campañas" value={totalCampaigns ?? 0} icon={<Megaphone />} description="Total creadas" />
        <StatCard title="Productos" value={totalProducts ?? 0} icon={<Box />} description="Total registrados" />
        <StatCard title="Generaciones IA" value={totalAiUsage ?? 0} icon={<Sparkles />} description="Total histórico" />
      </div>
    </div>
  )
}

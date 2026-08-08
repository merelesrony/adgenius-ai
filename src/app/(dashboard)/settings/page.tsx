import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MetaConnectionCard } from '@/features/integrations/components/meta-connection-card'
import { getMetaConnectionAction } from '@/features/integrations/actions'
import { MetaConnectedToast } from './meta-connected-toast'

export const metadata: Metadata = { title: 'Configuración' }

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ meta?: string; reason?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const metaStatus = params.meta
  const metaErrorReason = params.reason

  const [metaConnection, profileResult] = await Promise.all([
    getMetaConnectionAction(),
    supabase.from('profiles').select('currency').eq('id', user.id).maybeSingle(),
  ])

  const userCurrency = (profileResult.data as { currency?: string } | null)?.currency ?? 'USD'

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {metaStatus && (
        <MetaConnectedToast status={metaStatus} reason={metaErrorReason} />
      )}

      <div>
        <h1 className="text-xl font-semibold text-foreground">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gestiona tu cuenta y preferencias</p>
      </div>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Cuenta</CardTitle>
          <CardDescription>Email y seguridad</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-1">Email</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Contraseña</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cambia tu contraseña de acceso
              </p>
            </div>
            <Button variant="outline" size="sm">Cambiar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Integraciones</CardTitle>
          <CardDescription>Conecta tus cuentas de publicidad</CardDescription>
        </CardHeader>
        <CardContent>
          <MetaConnectionCard connection={metaConnection} userCurrency={userCurrency} />
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de peligro</CardTitle>
          <CardDescription>Acciones irreversibles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Eliminar cuenta</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Elimina tu cuenta y todos tus datos permanentemente
              </p>
            </div>
            <Button variant="destructive" size="sm">Eliminar cuenta</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

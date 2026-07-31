import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { CheckCircle2, CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type PlanRow = Database['public']['Tables']['plans']['Row']
type SubRow = Database['public']['Tables']['subscriptions']['Row']
type SubscriptionWithPlan = SubRow & { plan: PlanRow | null }
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { PLAN_CONFIGS } from '@/constants/options'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Suscripción' }

export default async function SubscriptionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: subRaw } = await supabase
    .from('subscriptions')
    .select('*, plan:plans(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const subscription = subRaw as SubscriptionWithPlan | null
  const currentPlan = subscription?.plan?.name ?? 'starter'

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Suscripción</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gestiona tu plan y facturación
        </p>
      </div>

      {/* Current plan summary */}
      {subscription && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="size-4 text-brand" />
                  Plan actual
                </CardTitle>
                <CardDescription className="mt-1">
                  {(subscription.plan as { display_name: string } | null)?.display_name}
                </CardDescription>
              </div>
              <StatusBadge status={subscription.status} />
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {subscription.current_period_end && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Vence</p>
                <p className="text-sm font-medium">{formatDate(subscription.current_period_end)}</p>
              </div>
            )}
            {subscription.trial_ends_at && subscription.status === 'trial' && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Prueba hasta</p>
                <p className="text-sm font-medium">{formatDate(subscription.trial_ends_at)}</p>
              </div>
            )}
            {subscription.price_paid && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Precio</p>
                <p className="text-sm font-medium">${subscription.price_paid} {subscription.currency}/mes</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Plans grid */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">Planes disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLAN_CONFIGS.map((plan) => {
            const isCurrent = plan.name === currentPlan
            return (
              <Card
                key={plan.name}
                className={cn(
                  'relative transition-shadow',
                  plan.popular && 'border-brand shadow-sm shadow-brand/20',
                  isCurrent && 'opacity-75'
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="default" className="px-3">Más popular</Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{plan.displayName}</CardTitle>
                  <div className="mt-1">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground text-sm">/mes</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="size-4 text-brand flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    fullWidth
                    variant={plan.popular ? 'default' : 'outline'}
                    disabled={isCurrent}
                  >
                    {isCurrent ? 'Plan actual' : 'Seleccionar plan'}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect } from 'react'
import { useActionState } from 'react'
import { toast } from 'sonner'
import { Building2, Globe, Phone, MapPin } from 'lucide-react'
import { updateProfileAction } from '@/features/auth/actions'
import { useUser } from '@/hooks/use-user'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/loading'
import { COUNTRIES, BUSINESS_CATEGORIES } from '@/constants/options'

const initialState = { success: false as const, error: '' }

export default function ProfilePage() {
  const { business, isLoading } = useUser()
  const [state, formAction, isPending] = useActionState(updateProfileAction, initialState)

  useEffect(() => {
    if (!state) return
    if (state.success) toast.success('Perfil actualizado correctamente')
    else if (state.error) toast.error(state.error)
  }, [state])

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Perfil del negocio</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Esta información se usará para personalizar tus campañas
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del negocio</CardTitle>
          <CardDescription>Completa los datos de tu empresa</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <Input
              name="businessName"
              label="Nombre del negocio"
              defaultValue={business?.name ?? ''}
              leftIcon={<Building2 />}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                name="country"
                label="País"
                required
                placeholder="Seleccionar país"
                options={COUNTRIES}
                defaultValue={business?.country ?? ''}
              />
              <Input
                name="city"
                label="Ciudad"
                defaultValue={business?.city ?? ''}
                leftIcon={<MapPin />}
                placeholder="Buenos Aires"
              />
            </div>

            <Input
              name="phone"
              type="tel"
              label="Teléfono"
              defaultValue={business?.phone ?? ''}
              leftIcon={<Phone />}
              placeholder="+54 11 1234-5678"
            />

            <Input
              name="website"
              type="url"
              label="Sitio web"
              defaultValue={business?.website ?? ''}
              leftIcon={<Globe />}
              placeholder="https://mi-empresa.com"
            />

            <Select
              name="category"
              label="Categoría del negocio"
              required
              placeholder="Seleccionar categoría"
              options={BUSINESS_CATEGORIES}
              defaultValue={business?.category ?? ''}
            />

            <div className="flex justify-end pt-2">
              <Button type="submit" loading={isPending}>
                Guardar cambios
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

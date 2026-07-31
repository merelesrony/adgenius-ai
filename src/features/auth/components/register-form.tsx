'use client'

import { useActionState, useEffect } from 'react'
import Link from 'next/link'
import { Mail, Lock, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { registerAction } from '../actions'
import { Input, Select } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { BUSINESS_CATEGORIES, COUNTRIES } from '@/constants/options'

const initialState = { success: false as const, error: '' }

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, initialState)

  useEffect(() => {
    if (!state) return
    if (state.success) {
      toast.success('¡Cuenta creada! Revisa tu email para confirmar tu cuenta.')
    } else if (state.error) {
      toast.error(state.error)
    }
  }, [state])

  if (state?.success) {
    return (
      <div className="text-center space-y-3 py-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-success/10 mx-auto">
          <span className="text-2xl">📧</span>
        </div>
        <h3 className="font-semibold text-foreground">Revisa tu email</h3>
        <p className="text-sm text-muted-foreground">
          Te enviamos un enlace de confirmación. Una vez confirmado podrás iniciar sesión.
        </p>
        <Link href="/login" className="text-sm text-brand hover:underline">
          Ir al login
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <Input
        name="email"
        type="email"
        label="Email"
        placeholder="tu@empresa.com"
        leftIcon={<Mail />}
        required
        autoComplete="email"
      />

      <Input
        name="businessName"
        type="text"
        label="Nombre del negocio"
        placeholder="Mi Empresa S.A."
        leftIcon={<Building2 />}
        required
      />

      <div className="grid grid-cols-2 gap-3">
        <Select
          name="country"
          label="País"
          required
          placeholder="Seleccionar"
          options={COUNTRIES}
        />
        <Select
          name="category"
          label="Categoría"
          required
          placeholder="Seleccionar"
          options={BUSINESS_CATEGORIES}
        />
      </div>

      <Input
        name="password"
        type="password"
        label="Contraseña"
        placeholder="Mín. 8 caracteres"
        leftIcon={<Lock />}
        required
        autoComplete="new-password"
        hint="Al menos 8 caracteres, una mayúscula y un número"
      />

      <Input
        name="confirmPassword"
        type="password"
        label="Confirmar contraseña"
        placeholder="••••••••"
        leftIcon={<Lock />}
        required
        autoComplete="new-password"
      />

      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          name="acceptTerms"
          id="acceptTerms"
          required
          className="mt-0.5 h-4 w-4 rounded border-input accent-brand"
        />
        <label htmlFor="acceptTerms" className="text-xs text-muted-foreground leading-relaxed">
          Acepto los{' '}
          <Link href="/terms" className="text-brand hover:underline">
            Términos de Servicio
          </Link>{' '}
          y la{' '}
          <Link href="/privacy" className="text-brand hover:underline">
            Política de Privacidad
          </Link>
        </label>
      </div>

      <Button type="submit" fullWidth loading={isPending}>
        Crear cuenta gratis
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-brand hover:underline font-medium">
          Inicia sesión
        </Link>
      </p>
    </form>
  )
}

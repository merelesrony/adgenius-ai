'use client'

import { useActionState, useEffect } from 'react'
import Link from 'next/link'
import { Mail, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { loginAction } from '../actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const initialState = { success: false as const, error: '' }

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState)

  useEffect(() => {
    if (state && !state.success && state.error) {
      toast.error(state.error)
    }
  }, [state])

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
        autoFocus
      />

      <div className="space-y-1.5">
        <Input
          name="password"
          type="password"
          label="Contraseña"
          placeholder="••••••••"
          leftIcon={<Lock />}
          required
          autoComplete="current-password"
        />
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground hover:text-brand transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>

      <Button type="submit" fullWidth loading={isPending} className="mt-2">
        Iniciar sesión
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{' '}
        <Link href="/register" className="text-brand hover:underline font-medium">
          Regístrate gratis
        </Link>
      </p>
    </form>
  )
}

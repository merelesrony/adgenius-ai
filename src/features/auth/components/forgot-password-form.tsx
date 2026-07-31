'use client'

import { useActionState, useEffect } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { forgotPasswordAction } from '../actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const initialState = { success: false as const, error: '' }

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, initialState)

  useEffect(() => {
    if (!state) return
    if (!state.success && state.error) {
      toast.error(state.error)
    }
  }, [state])

  if (state?.success) {
    return (
      <div className="text-center space-y-3 py-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-brand/10 mx-auto">
          <Mail className="size-6 text-brand" />
        </div>
        <h3 className="font-semibold text-foreground">Email enviado</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Si existe una cuenta con ese email, recibirás las instrucciones para restablecer tu
          contraseña.
        </p>
        <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-brand hover:underline">
          <ArrowLeft className="size-3.5" />
          Volver al login
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <Input
        name="email"
        type="email"
        label="Email de tu cuenta"
        placeholder="tu@empresa.com"
        leftIcon={<Mail />}
        required
        autoComplete="email"
        autoFocus
        hint="Te enviaremos un enlace para restablecer tu contraseña"
      />

      <Button type="submit" fullWidth loading={isPending}>
        Enviar instrucciones
      </Button>

      <Link
        href="/login"
        className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-brand transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Volver al login
      </Link>
    </form>
  )
}

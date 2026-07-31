import type { Metadata } from 'next'
import { RegisterForm } from '@/features/auth/components/register-form'

export const metadata: Metadata = { title: 'Crear cuenta' }

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Crea tu cuenta</h1>
        <p className="text-sm text-muted-foreground">
          Prueba gratis por 14 días, sin tarjeta de crédito
        </p>
      </div>
      <RegisterForm />
    </div>
  )
}

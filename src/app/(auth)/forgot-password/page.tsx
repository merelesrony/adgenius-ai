import type { Metadata } from 'next'
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form'

export const metadata: Metadata = { title: 'Recuperar contraseña' }

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Recupera tu contraseña</h1>
        <p className="text-sm text-muted-foreground">
          Ingresa tu email y te enviaremos las instrucciones
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  )
}

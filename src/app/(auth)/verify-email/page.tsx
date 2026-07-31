import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail } from 'lucide-react'

export const metadata: Metadata = { title: 'Verifica tu email' }

export default function VerifyEmailPage() {
  return (
    <div className="text-center space-y-4">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-brand/10 mx-auto">
        <Mail className="size-7 text-brand" />
      </div>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Verifica tu email</h1>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Te enviamos un enlace de confirmación. Revisa tu bandeja de entrada y carpeta de spam.
        </p>
      </div>
      <div className="pt-2 space-y-2">
        <p className="text-xs text-muted-foreground">¿No recibiste el email?</p>
        <Link
          href="/register"
          className="text-sm text-brand hover:underline font-medium"
        >
          Intentar con otro email
        </Link>
      </div>
      <Link
        href="/login"
        className="block text-sm text-muted-foreground hover:text-foreground transition-colors pt-2"
      >
        Volver al login
      </Link>
    </div>
  )
}

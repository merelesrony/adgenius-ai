'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

interface MetaConnectedToastProps {
  status: string
  reason?: string
}

export function MetaConnectedToast({ status, reason }: MetaConnectedToastProps) {
  useEffect(() => {
    if (status === 'connected') {
      toast.success('¡Meta Ads conectado!', {
        description: 'Tu cuenta de Meta se conectó correctamente.',
      })
    } else if (status === 'reconnected') {
      toast.success('¡Meta Ads reconectado!', {
        description: 'Tu token se renovó. La selección de cuenta y página fue conservada.',
      })
    } else if (status === 'error') {
      toast.error('Error al conectar Meta Ads', {
        description: reason ?? 'Intenta nuevamente.',
      })
    }
  }, [status, reason])

  return null
}

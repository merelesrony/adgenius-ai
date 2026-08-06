'use client'

import { WifiOff, CheckCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useOnlineStatus } from '../hooks/use-online-status'
import { cn } from '@/lib/utils'

export function OfflineBanner() {
  const { isOnline, wasOffline } = useOnlineStatus()
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    if (wasOffline && isOnline) {
      setShowReconnected(true)
      const t = setTimeout(() => setShowReconnected(false), 3000)
      return () => clearTimeout(t)
    }
  }, [wasOffline, isOnline])

  if (isOnline && !showReconnected) return null

  return (
    <div className="fixed top-16 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
      <div
        className={cn(
          'flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium shadow-lg border transition-all duration-300',
          !isOnline
            ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400'
            : 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400',
        )}
      >
        {!isOnline ? (
          <>
            <WifiOff className="size-3.5 shrink-0" />
            Sin conexión — tus cambios se guardarán al reconectar
          </>
        ) : (
          <>
            <CheckCircle className="size-3.5 shrink-0" />
            Conexión restaurada
          </>
        )}
      </div>
    </div>
  )
}

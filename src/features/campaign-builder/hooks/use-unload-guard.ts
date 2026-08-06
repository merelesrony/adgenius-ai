'use client'

import { useEffect, useRef } from 'react'
import { aiAbortRegistry } from '../ai-abort-registry'

interface UnloadGuardOptions {
  sessionId: string | null
}

export function useUnloadGuard({ sessionId }: UnloadGuardOptions) {
  const sessionIdRef = useRef(sessionId)
  useEffect(() => { sessionIdRef.current = sessionId }, [sessionId])

  useEffect(() => {
    function saveBeforeLeave() {
      const sid = sessionIdRef.current
      if (!sid) return
      try {
        // keepalive keeps the request alive after the page unloads
        void fetch('/api/session/pause', {
          method: 'POST',
          keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sid }),
        })
      } catch { /* ignore — best-effort */ }
    }

    function handleBeforeUnload() {
      aiAbortRegistry.abortAll()
      saveBeforeLeave()
    }

    function handlePageHide(e: PageTransitionEvent) {
      if (e.persisted) return // page going into bfcache — will be restored, don't pause
      aiAbortRegistry.abortAll()
      saveBeforeLeave()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handlePageHide as EventListener)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handlePageHide as EventListener)
    }
  }, [])
}

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useCampaignBuilder } from '../context'
import { upsertBuilderSessionAction } from '../actions'

const DEBOUNCE_MS = 1000

export function useBuilderAutosave() {
  const { state, dispatch } = useCampaignBuilder()
  const [saveError, setSaveError] = useState<string | null>(null)
  // Incremented when the user comes back online to trigger a retry save
  const [retrySignal, setRetrySignal] = useState(0)

  // Ref so the save closure always has the latest sessionId without putting
  // it in the effect deps (which would trigger an extra save on SET_SESSION_ID).
  const sessionIdRef = useRef<string | null>(state.sessionId)
  const isSavingRef = useRef(false)

  useEffect(() => {
    sessionIdRef.current = state.sessionId
  }, [state.sessionId])

  // Retry autosave when connectivity is restored
  useEffect(() => {
    const fn = () => setRetrySignal((n) => n + 1)
    window.addEventListener('online', fn)
    return () => window.removeEventListener('online', fn)
  }, [])

  const {
    step,
    selectedProduct,
    dailyBudget, currency, totalBudget,
    country, city, radius,
    platforms,
    aiStrategy,
    generatedCreatives, brandKit, selectedCreativeId,
  } = state

  // Stable save function used by both the debounced effect and the retry trigger
  const performSave = useCallback(async () => {
    if (isSavingRef.current) return
    isSavingRef.current = true
    setSaveError(null)
    dispatch({ type: 'SET_SAVING', payload: true })

    let result: { success: boolean; id?: string; error?: string }

    try {
      result = await upsertBuilderSessionAction({
        sessionId: sessionIdRef.current,
        currentStep: step,
        selectedProduct,
        budget: { dailyBudget, currency, totalBudget },
        destination: { country, city, radius },
        platforms,
        aiStrategy,
        creatives: generatedCreatives.length > 0 ? generatedCreatives : null,
        brandKit: brandKit ?? null,
        selectedCreativeId: selectedCreativeId ?? null,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al guardar'
      console.error('[useBuilderAutosave] Server action threw:', msg)
      result = { success: false, error: msg }
    }

    isSavingRef.current = false

    if (result.success) {
      if (result.id && !sessionIdRef.current) {
        dispatch({ type: 'SET_SESSION_ID', payload: result.id })
      }
      dispatch({ type: 'MARK_SAVED', payload: new Date().toISOString() })
      setSaveError(null)
    } else {
      const errMsg = result.error ?? 'Error guardando borrador'
      console.error('[useBuilderAutosave] Save failed:', errMsg)
      dispatch({ type: 'SET_SAVING', payload: false })
      setSaveError(errMsg)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, selectedProduct, dailyBudget, currency, totalBudget, country, city, radius, platforms, aiStrategy, generatedCreatives, brandKit, selectedCreativeId])

  useEffect(() => {
    // Nothing meaningful to save until the user picks a product on step 1
    if (step === 1 && !selectedProduct) return

    const timer = setTimeout(async () => {
      await performSave()
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, selectedProduct, dailyBudget, currency, totalBudget, country, city, radius, platforms, aiStrategy, generatedCreatives, brandKit, selectedCreativeId, retrySignal])

  return { saveError }
}

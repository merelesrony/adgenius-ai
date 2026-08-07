'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useCampaignBuilder } from '../context'
import { upsertBuilderSessionAction } from '../actions'

const DEBOUNCE_MS = 1000

export function useBuilderAutosave() {
  const { state, dispatch } = useCampaignBuilder()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [retrySignal, setRetrySignal] = useState(0)

  const sessionIdRef = useRef<string | null>(state.sessionId)
  const isSavingRef = useRef(false)
  // Used to skip the immediate-save effect on first mount
  const hasMountedRef = useRef(false)

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
    maxUnlockedStep,
    lastCompletedStep,
    hasPendingRegeneration,
    builderMode,
    productMode,
    productImageMode,
    selectedProduct,
    dailyBudget, currency, totalBudget,
    country, city, radius,
    platforms,
    aiStrategy,
    generatedCreatives, brandKit, selectedCreativeId,
  } = state

  // Central save function — always sends the full current state snapshot
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
        // Navigation state
        maxUnlockedStep,
        lastCompletedStep,
        hasPendingRegeneration,
        builderMode,
        productMode: productMode ?? null,
        productImageMode: productImageMode ?? null,
        // Campaign data
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
  }, [
    step, maxUnlockedStep, lastCompletedStep, hasPendingRegeneration,
    builderMode, productMode, productImageMode,
    selectedProduct, dailyBudget, currency, totalBudget,
    country, city, radius, platforms, aiStrategy,
    generatedCreatives, brandKit, selectedCreativeId,
  ])

  // ── Debounced save: fires when campaign data changes (1 s debounce) ──────────
  useEffect(() => {
    // Nothing meaningful to save until the user picks a product
    if (step === 1 && !selectedProduct) return

    const timer = setTimeout(async () => {
      await performSave()
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    step, selectedProduct, dailyBudget, currency, totalBudget,
    country, city, radius, platforms, aiStrategy,
    generatedCreatives, brandKit, selectedCreativeId,
    retrySignal,
  ])

  // ── Immediate save: fires when navigation state changes (no debounce) ────────
  // Critical changes (step advance, pending regen flag, unlocked steps) must
  // survive a tab close, so we skip the 1-second debounce for these.
  useEffect(() => {
    // Skip on first mount — state hasn't been modified by the user yet
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }
    if (step === 1 && !selectedProduct) return

    void performSave()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxUnlockedStep, lastCompletedStep, hasPendingRegeneration])

  return { saveError }
}

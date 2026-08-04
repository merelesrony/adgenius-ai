'use client'

import { useState, useEffect, useRef } from 'react'
import { CheckCircle, Loader2, Circle, Sparkles, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useCampaignBuilder } from '../context'
import type { CampaignStrategy, BuilderStep } from '../types'

const STEPS = [
  'Analizando producto...',
  'Definiendo objetivo...',
  'Creando audiencia...',
  'Generando copy...',
  'Calculando presupuesto...',
] as const

type Phase = 'running' | 'done' | 'error'

export function Step5Working() {
  const { state, dispatch } = useCampaignBuilder()
  const [phase, setPhase] = useState<Phase>('running')
  const [currentStep, setCurrentStep] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const hasStarted = useRef(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  function clearTimers() {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  async function runStrategy() {
    setPhase('running')
    setCurrentStep(0)
    setErrorMsg(null)

    // Advance animation steps every 1.4 s while API is working
    timersRef.current = STEPS.slice(1).map((_, i) =>
      setTimeout(() => setCurrentStep(i + 1), (i + 1) * 1400),
    )

    try {
      // Build request from context state
      const {
        selectedProduct, productMode, productName, productDescription,
        dailyBudget, currency, country, city, radius, platforms,
      } = state

      const productNameFinal =
        productMode === 'existing' || productMode === 'ai'
          ? selectedProduct?.name ?? productName
          : productName

      const res = await fetch('/api/ai/generate-campaign-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productNameFinal,
          productDescription:
            productMode === 'existing' || productMode === 'ai'
              ? selectedProduct?.description ?? productDescription
              : productDescription,
          productCategory:
            productMode === 'existing' || productMode === 'ai'
              ? selectedProduct?.category ?? null
              : null,
          productPrice:
            productMode === 'existing' || productMode === 'ai'
              ? selectedProduct?.price ?? null
              : null,
          productCurrency:
            productMode === 'existing' || productMode === 'ai'
              ? selectedProduct?.currency ?? currency
              : currency,
          dailyBudget: parseFloat(dailyBudget) || 10,
          budgetCurrency: currency,
          country,
          city,
          radius: parseInt(radius, 10) || 20,
          platforms,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error generando estrategia')

      // Clear pending step-advance timers and jump to finished
      clearTimers()
      setCurrentStep(STEPS.length - 1)
      dispatch({ type: 'SET_AI_STRATEGY', payload: data as CampaignStrategy })

      // Brief pause so user sees all steps checked, then mark done
      timersRef.current = [setTimeout(() => setPhase('done'), 900)]
    } catch (err) {
      clearTimers()
      setErrorMsg(err instanceof Error ? err.message : 'Error generando estrategia')
      setPhase('error')
    }
  }

  // Run once on mount (guard against React strict-mode double-invoke)
  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true
    runStrategy()
    return () => clearTimers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-advance: auto mode skips step 6 review and goes straight to Creative Engine
  useEffect(() => {
    if (phase !== 'done') return
    const nextStep: BuilderStep = state.builderMode === 'auto' ? 7 : 6
    const t = setTimeout(() => dispatch({ type: 'GO_TO_STEP', payload: nextStep }), 1200)
    return () => clearTimeout(t)
  }, [phase, dispatch, state.builderMode])

  function handleRetry() {
    hasStarted.current = false
    clearTimers()
    hasStarted.current = true
    runStrategy()
  }

  const doneCount = phase === 'done' ? STEPS.length : currentStep
  const percentage = Math.round((doneCount / STEPS.length) * 100)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div
          className={cn(
            'inline-flex items-center justify-center size-16 rounded-2xl mx-auto transition-all duration-500',
            phase === 'done'
              ? 'bg-success/10'
              : phase === 'error'
              ? 'bg-destructive/10'
              : 'bg-brand/10',
          )}
        >
          {phase === 'done' ? (
            <CheckCircle className="size-8 text-success" />
          ) : phase === 'error' ? (
            <AlertCircle className="size-8 text-destructive" />
          ) : (
            <Sparkles className="size-8 text-brand animate-pulse" />
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            {phase === 'done'
              ? '¡Estrategia generada!'
              : phase === 'error'
              ? 'Error al generar estrategia'
              : 'La IA está trabajando...'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {phase === 'done'
              ? state.builderMode === 'auto' ? 'Pasando al Creative Engine...' : 'Avanzando a la revisión...'
              : phase === 'error'
              ? 'Algo salió mal. Puedes intentarlo de nuevo.'
              : 'Creando una estrategia personalizada para tu producto'}
          </p>
        </div>
      </div>

      {/* Error state */}
      {phase === 'error' && errorMsg && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-3">
          <p className="text-sm text-destructive">{errorMsg}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="gap-2"
          >
            <RefreshCw className="size-4" />
            Intentar de nuevo
          </Button>
        </div>
      )}

      {/* Steps list */}
      {phase !== 'error' && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3.5">
          {STEPS.map((label, index) => {
            const isDoneStep = phase === 'done' || doneCount > index
            const isCurrent = phase === 'running' && doneCount === index
            const isPending = phase === 'running' && doneCount < index

            return (
              <div
                key={label}
                className={cn(
                  'flex items-center gap-3 transition-all duration-300',
                  isPending && 'opacity-30',
                )}
              >
                <div className="shrink-0 size-5">
                  {isDoneStep ? (
                    <CheckCircle className="size-5 text-success" />
                  ) : isCurrent ? (
                    <Loader2 className="size-5 text-brand animate-spin" />
                  ) : (
                    <Circle className="size-5 text-muted-foreground/20" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-sm transition-colors duration-300 flex-1',
                    isDoneStep && 'text-foreground font-medium',
                    isCurrent && 'text-brand font-medium',
                    isPending && 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
                {isDoneStep && (
                  <span className="text-[10px] text-success font-semibold">Listo</span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Progress bar */}
      {phase !== 'error' && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progreso</span>
            <span className="font-semibold text-foreground">{percentage}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-brand to-purple-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Manual continue button (shown when done, before auto-advance fires) */}
      {phase === 'done' && (
        <div className="flex flex-col items-center gap-2">
          <Button
            className="gap-2 px-8"
            onClick={() => {
              if (state.builderMode === 'auto') {
                dispatch({ type: 'GO_TO_STEP', payload: 7 as BuilderStep })
              } else {
                dispatch({ type: 'NEXT_STEP' })
              }
            }}
          >
            {state.builderMode === 'auto' ? 'Ir a Creative Engine' : 'Ver revisión'}
            <ArrowRight className="size-4" />
          </Button>
          <p className="text-xs text-muted-foreground">Avanzando automáticamente...</p>
        </div>
      )}
    </div>
  )
}

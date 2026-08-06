'use client'

import { ArrowLeft, ArrowRight, Save, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useCampaignBuilder } from '../context'
import type { BuilderState } from '../types'

function canGoNext(state: BuilderState): boolean {
  switch (state.step) {
    case 1: {
      if (!state.productMode) return false
      if (
        state.productMode === 'existing' ||
        state.productMode === 'ai' ||
        state.productMode === 'image'
      ) return !!state.selectedProduct
      if (state.productMode === 'manual') return !!state.productName.trim()
      return false
    }
    case 2:
      return !!state.dailyBudget && Number(state.dailyBudget) > 0
    case 3:
      return !!state.country
    case 4:
      return state.platforms.length > 0
    case 6:
      return !!state.aiStrategy
    case 7:
      return !!state.selectedCreativeId
    default:
      return false
  }
}

export function BuilderNav() {
  const { state, dispatch } = useCampaignBuilder()
  const { step } = state

  // Steps 5 and 7 manage their own continuation
  if (step === 5 || step === 7) return null

  const isFirst = step === 1
  const isLast = step === 8
  const ok = canGoNext(state)

  return (
    <div className="flex items-center gap-3 pt-4 border-t border-border">
      {/* Left — Previous */}
      <div className="flex-1">
        {!isFirst && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch({ type: 'PREV_STEP' })}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            Anterior
          </Button>
        )}
      </div>

      {/* Right — Save draft + Next/Reset */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toast.info('Guardar borrador estará disponible próximamente.')}
          className="gap-2 text-muted-foreground"
        >
          <Save className="size-4" />
          <span className="hidden sm:inline">Guardar borrador</span>
        </Button>

        {!isLast ? (
          <Button
            size="sm"
            disabled={!ok}
            onClick={() => dispatch({ type: 'NEXT_STEP' })}
            className="gap-2"
          >
            Siguiente
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch({ type: 'RESET' })}
            className="gap-2"
          >
            <RotateCcw className="size-4" />
            Empezar de nuevo
          </Button>
        )}
      </div>
    </div>
  )
}

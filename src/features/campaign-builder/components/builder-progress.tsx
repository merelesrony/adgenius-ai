'use client'

import { Check, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCampaignBuilder } from '../context'
import { BUILDER_STEPS, TOTAL_STEPS } from '../constants'
import type { BuilderStep } from '../types'

function canNavigateToStep(step: number, maxUnlockedStep: number): boolean {
  return step <= maxUnlockedStep
}

export function BuilderProgress() {
  const { state, dispatch } = useCampaignBuilder()
  const { step: currentStep, maxUnlockedStep } = state

  function handleStepClick(stepId: number) {
    if (!canNavigateToStep(stepId, maxUnlockedStep)) return
    if (stepId === currentStep) return
    dispatch({ type: 'GO_TO_STEP', payload: stepId as BuilderStep })
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      {/* Mobile: compact progress bar + clickable step chips */}
      <div className="sm:hidden space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">
            Paso {currentStep} de {TOTAL_STEPS}
          </span>
          <span className="text-sm text-muted-foreground">
            {BUILDER_STEPS[currentStep - 1].label}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
          />
        </div>
        {/* Scrollable mini-chips for direct navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none pt-1">
          {BUILDER_STEPS.map((step) => {
            const isCompleted = step.id < maxUnlockedStep
            const isActive = currentStep === step.id
            const isLocked = !canNavigateToStep(step.id, maxUnlockedStep)
            const canNav = canNavigateToStep(step.id, maxUnlockedStep) && !isActive

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleStepClick(step.id)}
                disabled={isActive || isLocked}
                title={isLocked ? `Completa los pasos anteriores para desbloquear ${step.label}` : step.label}
                className={cn(
                  'flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold shrink-0 transition-all whitespace-nowrap',
                  isCompleted && !isActive && 'border-brand bg-brand text-white',
                  isActive && 'border-brand bg-card text-brand ring-2 ring-brand/20',
                  isLocked && 'border-border bg-muted/20 text-muted-foreground/30 cursor-not-allowed',
                  canNav && 'cursor-pointer hover:opacity-75 active:scale-95',
                )}
              >
                {isCompleted && !isActive ? (
                  <Check className="size-2.5" strokeWidth={3} />
                ) : isLocked ? (
                  <Lock className="size-2.5" />
                ) : (
                  <span className="size-3.5 flex items-center justify-center text-[9px] font-bold">{step.id}</span>
                )}
                <span className="max-w-[52px] truncate">{step.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Desktop: horizontal stepper with clickable steps */}
      <div className="hidden sm:flex items-start">
        {BUILDER_STEPS.map((step, index) => {
          const isCompleted = step.id < maxUnlockedStep
          const isActive = currentStep === step.id
          const isLocked = !canNavigateToStep(step.id, maxUnlockedStep)
          const isLast = index === BUILDER_STEPS.length - 1
          const Icon = step.icon

          return (
            <div key={step.id} className="flex items-start flex-1 last:flex-initial">
              {/* Circle + label column */}
              <div className="flex flex-col items-center gap-1.5 min-w-0">
                <button
                  type="button"
                  onClick={() => handleStepClick(step.id)}
                  disabled={isActive || isLocked}
                  title={
                    isLocked
                      ? `Completa los pasos anteriores para desbloquear ${step.label}`
                      : isActive
                      ? step.label
                      : `Ir a ${step.label}`
                  }
                  className={cn(
                    'flex items-center justify-center size-9 rounded-full border-2 shrink-0 transition-all duration-300',
                    isCompleted && !isActive && 'border-brand bg-brand text-white hover:opacity-80 cursor-pointer active:scale-95',
                    isActive && 'border-brand bg-card text-brand ring-4 ring-brand/15 cursor-default',
                    isLocked && 'border-border bg-muted/30 text-muted-foreground/40 cursor-not-allowed',
                    // Previously unlocked but not yet past (can navigate back even if not "completed")
                    !isCompleted && !isActive && !isLocked && 'border-brand/50 bg-card text-brand/70 hover:opacity-80 cursor-pointer active:scale-95',
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-4" strokeWidth={2.5} />
                  ) : isLocked ? (
                    <Lock className="size-3.5" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </button>
                <div className="text-center px-1">
                  <p className={cn(
                    'text-[11px] font-medium leading-tight truncate transition-colors',
                    isActive ? 'text-foreground' : isLocked ? 'text-muted-foreground/40' : 'text-muted-foreground',
                  )}>
                    {step.label}
                  </p>
                </div>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-1 mt-[18px] rounded-full transition-all duration-500',
                    step.id < maxUnlockedStep ? 'bg-brand' : 'bg-border',
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

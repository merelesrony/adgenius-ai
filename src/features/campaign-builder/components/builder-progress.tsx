'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCampaignBuilder } from '../context'
import { BUILDER_STEPS, TOTAL_STEPS } from '../constants'

export function BuilderProgress() {
  const { state } = useCampaignBuilder()
  const currentStep = state.step

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      {/* Mobile: compact progress bar */}
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
      </div>

      {/* Desktop: horizontal stepper */}
      <div className="hidden sm:flex items-start">
        {BUILDER_STEPS.map((step, index) => {
          const isCompleted = currentStep > step.id
          const isActive = currentStep === step.id
          const isFuture = currentStep < step.id
          const isLast = index === BUILDER_STEPS.length - 1
          const Icon = step.icon

          return (
            <div key={step.id} className="flex items-start flex-1 last:flex-initial">
              {/* Circle + label column */}
              <div className="flex flex-col items-center gap-1.5 min-w-0">
                <div
                  className={cn(
                    'flex items-center justify-center size-9 rounded-full border-2 shrink-0 transition-all duration-300',
                    isCompleted && 'border-brand bg-brand text-white',
                    isActive && 'border-brand bg-card text-brand ring-4 ring-brand/15',
                    isFuture && 'border-border bg-muted/30 text-muted-foreground',
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-4" strokeWidth={2.5} />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </div>
                <div className="text-center px-1">
                  <p className={cn(
                    'text-[11px] font-medium leading-tight truncate',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                  )}>
                    {step.label}
                  </p>
                </div>
              </div>

              {/* Connector line (not after last step) */}
              {!isLast && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-1 mt-[18px] rounded-full transition-all duration-500',
                    isCompleted ? 'bg-brand' : 'bg-border',
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

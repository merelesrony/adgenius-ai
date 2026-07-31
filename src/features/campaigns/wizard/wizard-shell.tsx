'use client'

import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WizardProvider, useWizard } from '../context'
import { WIZARD_STEPS } from '../types'
import type { ExistingProduct, PlanLimitInfo } from '../types'

import { StepInfo } from './step-info'
import { StepProduct } from './step-product'
import { StepBudget } from './step-budget'
import { StepAI } from './step-ai'
import { StepPreview } from './step-preview'

interface WizardShellProps {
  existingProducts: ExistingProduct[]
  planLimit: PlanLimitInfo
  userId: string
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 w-full max-w-lg mx-auto">
      {WIZARD_STEPS.map((s, i) => {
        const done = current > s.number
        const active = current === s.number
        const isLast = i === WIZARD_STEPS.length - 1

        return (
          <div key={s.number} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div
                className={cn(
                  'flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all',
                  done ? 'bg-brand border-brand text-white' :
                  active ? 'bg-brand/10 border-brand text-brand' :
                  'bg-muted border-border text-muted-foreground',
                )}
              >
                {done ? '✓' : s.number}
              </div>
              <span className={cn(
                'text-[10px] font-medium hidden sm:block whitespace-nowrap',
                active ? 'text-brand' : done ? 'text-foreground' : 'text-muted-foreground',
              )}>
                {s.label}
              </span>
            </div>
            {!isLast && (
              <div className={cn(
                'h-0.5 flex-1 mx-1 mb-4 rounded-full transition-all',
                done ? 'bg-brand' : 'bg-border',
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function WizardContent({ existingProducts, userId }: Pick<WizardShellProps, 'existingProducts' | 'userId'>) {
  const { step } = useWizard()
  const router = useRouter()

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-semibold text-foreground">Nueva campaña</h1>
            <button
              type="button"
              onClick={() => router.push('/campaigns')}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
              aria-label="Cancelar"
            >
              <X className="size-5" />
            </button>
          </div>
          <StepIndicator current={step} />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            {WIZARD_STEPS[step - 1].label}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {WIZARD_STEPS[step - 1].description}
          </p>
        </div>

        {step === 1 && <StepInfo />}
        {step === 2 && <StepProduct existingProducts={existingProducts} userId={userId} />}
        {step === 3 && <StepBudget />}
        {step === 4 && <StepAI />}
        {step === 5 && <StepPreview />}
      </div>
    </div>
  )
}

export function CampaignWizard({ existingProducts, userId }: WizardShellProps) {
  return (
    <WizardProvider>
      <WizardContent existingProducts={existingProducts} userId={userId} />
    </WizardProvider>
  )
}

'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { WizardData, WizardStep } from './types'
import { INITIAL_WIZARD_DATA } from './types'

interface WizardContextValue {
  data: WizardData
  step: WizardStep
  update: (partial: Partial<WizardData>) => void
  goTo: (step: WizardStep) => void
  next: () => void
  back: () => void
  reset: () => void
}

const WizardContext = createContext<WizardContextValue | null>(null)

export function WizardProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<WizardData>(INITIAL_WIZARD_DATA)
  const [step, setStep] = useState<WizardStep>(1)

  const update = useCallback((partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }))
  }, [])

  const goTo = useCallback((s: WizardStep) => setStep(s), [])

  const next = useCallback(() => {
    setStep((s) => (s < 5 ? ((s + 1) as WizardStep) : s))
  }, [])

  const back = useCallback(() => {
    setStep((s) => (s > 1 ? ((s - 1) as WizardStep) : s))
  }, [])

  const reset = useCallback(() => {
    setData(INITIAL_WIZARD_DATA)
    setStep(1)
  }, [])

  return (
    <WizardContext.Provider value={{ data, step, update, goTo, next, back, reset }}>
      {children}
    </WizardContext.Provider>
  )
}

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardContext)
  if (!ctx) throw new Error('useWizard must be used inside WizardProvider')
  return ctx
}

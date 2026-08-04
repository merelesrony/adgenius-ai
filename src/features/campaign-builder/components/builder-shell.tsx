'use client'

import { useState } from 'react'
import { Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CampaignBuilderProvider, useCampaignBuilder } from '../context'
import { BuilderProgress } from './builder-progress'
import { BuilderNav } from './builder-nav'
import { BuilderDraftsWidget } from './builder-drafts-widget'
import { ResumeBuilderModal } from './resume-builder-modal'
import { Step1Product } from '../steps/step-1-product'
import { Step2Budget } from '../steps/step-2-budget'
import { Step3Destination } from '../steps/step-3-destination'
import { Step4Goal } from '../steps/step-4-goal'
import { Step5Working } from '../steps/step-5-working'
import { Step6Review } from '../steps/step-6-review'
import { Step7Creative } from '../steps/step-7-creative'
import { Step8Final } from '../steps/step-8-final'
import { useBuilderAutosave } from '../hooks/use-builder-autosave'
import { closeBuilderSessionAction } from '../actions'
import { formatCurrency } from '@/lib/currency'
import type { Database } from '@/types/database'
import type { BuilderSession } from '../types'

type ProductRow = Database['public']['Tables']['products']['Row']

interface BuilderShellProps {
  products: ProductRow[]
  initialSession?: BuilderSession | null
}

function ModeToggle() {
  const { state, dispatch } = useCampaignBuilder()
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-xs text-muted-foreground">Modo:</span>
      <div className="flex items-center rounded-full border border-border bg-muted/40 p-0.5 gap-0.5">
        {(['auto', 'advanced'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => dispatch({ type: 'SET_BUILDER_MODE', payload: m })}
            className={cn(
              'text-[11px] font-medium px-3 py-1 rounded-full transition-all',
              state.builderMode === m
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {m === 'auto' ? '✨ Automático' : 'Avanzado'}
          </button>
        ))}
      </div>
      {state.builderMode === 'auto' && (
        <span className="text-[10px] text-muted-foreground hidden sm:inline">
          La IA decide audiencia, copy y creativos
        </span>
      )}
    </div>
  )
}

function ProductContextBar() {
  const { state } = useCampaignBuilder()
  const { step, selectedProduct, productMode, productName } = state

  if (step < 2) return null

  const name =
    (productMode === 'existing' || productMode === 'ai') && selectedProduct
      ? selectedProduct.name
      : productMode === 'manual' && productName
      ? productName
      : null

  if (!name) return null

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/40 px-3 py-2.5 mb-2">
      <div className="size-8 rounded-md bg-muted/80 overflow-hidden shrink-0 border border-border/40">
        {selectedProduct?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={selectedProduct.image} alt={name} className="size-full object-cover" />
        ) : (
          <div className="size-full flex items-center justify-center">
            <Package className="size-3.5 text-muted-foreground/40" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-foreground truncate">{name}</span>
        {selectedProduct?.category && (
          <span className="text-[10px] text-muted-foreground hidden sm:inline">
            · {selectedProduct.category}
          </span>
        )}
        {selectedProduct?.price !== null && selectedProduct?.price !== undefined && (
          <span className="text-[11px] font-semibold text-brand">
            {formatCurrency(selectedProduct.price, selectedProduct.currency ?? 'USD')}
          </span>
        )}
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0">Producto seleccionado</span>
    </div>
  )
}

function BuilderContent({ products, initialSession }: BuilderShellProps) {
  const { state, dispatch } = useCampaignBuilder()
  const [showModal, setShowModal] = useState(!!initialSession)

  // Wire autosave — returns live error state
  const { saveError } = useBuilderAutosave()

  function handleResume() {
    if (initialSession) {
      dispatch({ type: 'LOAD_SESSION', payload: initialSession })
    }
    setShowModal(false)
  }

  async function handleNew() {
    if (initialSession?.id) {
      await closeBuilderSessionAction(initialSession.id, 'abandoned')
    }
    dispatch({ type: 'RESET' })
    setShowModal(false)
  }

  return (
    <>
      {showModal && initialSession && (
        <ResumeBuilderModal
          session={initialSession}
          onResume={handleResume}
          onNew={handleNew}
        />
      )}

      <div className="space-y-6">
        <BuilderProgress />
        <ProductContextBar />

        <div className="max-w-2xl mx-auto w-full px-4 sm:px-0">
          {state.step === 1 && <ModeToggle />}
          {state.step === 1 && <Step1Product products={products} />}
          {state.step === 2 && <Step2Budget />}
          {state.step === 3 && <Step3Destination />}
          {state.step === 4 && <Step4Goal />}
          {state.step === 5 && <Step5Working />}
          {state.step === 6 && <Step6Review />}
          {state.step === 7 && <Step7Creative />}
          {state.step === 8 && <Step8Final />}
        </div>

        <BuilderNav />

        {/* Autosave status */}
        <div className="flex justify-center pb-2">
          <BuilderDraftsWidget error={saveError} />
        </div>
      </div>
    </>
  )
}

export function BuilderShell({ products, initialSession }: BuilderShellProps) {
  return (
    <CampaignBuilderProvider>
      <BuilderContent products={products} initialSession={initialSession} />
    </CampaignBuilderProvider>
  )
}

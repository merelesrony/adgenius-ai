'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Package, X, AlertTriangle, RefreshCw, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CampaignBuilderProvider, useCampaignBuilder } from '../context'
import { BuilderProgress } from './builder-progress'
import { BuilderNav } from './builder-nav'
import { BuilderDraftsWidget } from './builder-drafts-widget'
import { ResumeBuilderModal } from './resume-builder-modal'
import { CancelCreationModal } from './cancel-creation-modal'
import { Step1Product } from '../steps/step-1-product'
import { Step2Budget } from '../steps/step-2-budget'
import { Step3Destination } from '../steps/step-3-destination'
import { Step4Goal } from '../steps/step-4-goal'
import { Step5Working } from '../steps/step-5-working'
import { Step6Review } from '../steps/step-6-review'
import { Step7Creative } from '../steps/step-7-creative'
import { Step8Final } from '../steps/step-8-final'
import { useBuilderAutosave } from '../hooks/use-builder-autosave'
import { useUnloadGuard } from '../hooks/use-unload-guard'
import { closeBuilderSessionAction, resumeSessionAction } from '../actions'
import { OfflineBanner } from './offline-banner'
import { formatCurrency } from '@/lib/currency'
import type { Database } from '@/types/database'
import type { BuilderSession } from '../types'
import type { LastCampaignPrefs } from '@/features/campaigns/actions'

type ProductRow = Database['public']['Tables']['products']['Row']

interface BuilderShellProps {
  products: ProductRow[]
  initialSession?: BuilderSession | null
  userId: string
  defaultPrefs?: LastCampaignPrefs
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

function PendingRegenerationBanner() {
  const { state, dispatch } = useCampaignBuilder()
  const { hasPendingRegeneration, aiStrategy } = state

  if (!hasPendingRegeneration || !aiStrategy) return null

  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-400/40 bg-amber-50/60 dark:bg-amber-900/15 px-4 py-3 mb-2">
      <AlertTriangle className="size-4 text-amber-500 shrink-0" />
      <p className="text-xs text-amber-800 dark:text-amber-300 flex-1 min-w-0">
        Algunos datos cambiaron. Recomendamos actualizar la estrategia con IA.
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => dispatch({ type: 'GO_TO_STEP', payload: 5 })}
          className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
        >
          <RefreshCw className="size-3" />
          Actualizar estrategia
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: 'SET_PENDING_REGENERATION', payload: false })}
          className="text-[11px] text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 transition-colors px-1"
        >
          Ignorar
        </button>
      </div>
    </div>
  )
}

function ProductContextBar() {
  const { state } = useCampaignBuilder()
  const { step, selectedProduct, productMode, productName } = state

  if (step < 2) return null

  const name =
    (productMode === 'existing' || productMode === 'ai' || productMode === 'image') && selectedProduct
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

function BuilderContent({ products, initialSession, userId, defaultPrefs }: BuilderShellProps) {
  const { state, dispatch } = useCampaignBuilder()
  const router = useRouter()
  const [showModal, setShowModal] = useState(!!initialSession)
  const [showCancelModal, setShowCancelModal] = useState(false)

  // Auto-scroll to top on every step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [state.step])

  // Apply last-campaign preferences when starting a fresh session (no draft loaded)
  useEffect(() => {
    if (!defaultPrefs || initialSession) return
    if (defaultPrefs.country) dispatch({ type: 'SET_COUNTRY', payload: defaultPrefs.country })
    if (defaultPrefs.city) dispatch({ type: 'SET_CITY', payload: defaultPrefs.city })
    if (defaultPrefs.platforms?.length) dispatch({ type: 'SET_PLATFORMS', payload: defaultPrefs.platforms as import('../types').MetaPlatform[] })
    if (defaultPrefs.dailyBudget) dispatch({ type: 'SET_DAILY_BUDGET', payload: defaultPrefs.dailyBudget })
    if (defaultPrefs.currency) dispatch({ type: 'SET_CURRENCY', payload: defaultPrefs.currency })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [isDeleting, setIsDeleting] = useState(false)

  // Wire autosave — returns live error state
  const { saveError } = useBuilderAutosave()

  // Abort AI + mark session as paused when user closes/navigates away
  useUnloadGuard({ sessionId: state.sessionId })

  function handleResume() {
    if (initialSession) {
      dispatch({ type: 'LOAD_SESSION', payload: initialSession })
      // Flip paused → draft so subsequent autosave doesn't re-show the modal
      if (initialSession.status === 'paused') {
        void resumeSessionAction(initialSession.id)
      }
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

  // Cancel modal handlers
  function handleSaveAndExit() {
    // Autosave already persisted the session as 'draft' — just navigate away
    setShowCancelModal(false)
    router.push('/dashboard')
  }

  async function handleResetCampaign() {
    // Mark current session abandoned, then reset state for a fresh start
    if (state.sessionId) {
      await closeBuilderSessionAction(state.sessionId, 'abandoned')
    }
    dispatch({ type: 'RESET' })
    setShowCancelModal(false)
  }

  async function handleDeleteDraft() {
    setIsDeleting(true)
    try {
      if (state.sessionId) {
        await closeBuilderSessionAction(state.sessionId, 'abandoned')
      }
      dispatch({ type: 'RESET' })
      setShowCancelModal(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <OfflineBanner />

      {showModal && initialSession && (
        <ResumeBuilderModal
          session={initialSession}
          onResume={handleResume}
          onNew={handleNew}
        />
      )}

      <CancelCreationModal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onSaveAndExit={handleSaveAndExit}
        onReset={() => { void handleResetCampaign() }}
        onDelete={handleDeleteDraft}
        isLoading={isDeleting}
      />

      <div className="space-y-6">
        <BuilderProgress />
        <PendingRegenerationBanner />
        <ProductContextBar />

        <div className="max-w-2xl mx-auto w-full px-4 sm:px-0">
          {state.step === 1 && <ModeToggle />}
          {state.step === 1 && <Step1Product products={products} userId={userId} />}
          {state.step === 2 && <Step2Budget />}
          {state.step === 3 && <Step3Destination />}
          {state.step === 4 && <Step4Goal />}
          {state.step === 5 && <Step5Working />}
          {state.step === 6 && <Step6Review />}
          {state.step === 7 && <Step7Creative />}
          {state.step === 8 && <Step8Final />}
        </div>

        <BuilderNav />

        {/* Bottom action bar — visible on steps 1–7 */}
        {state.step < 8 && (
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleSaveAndExit}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 px-3 rounded-full hover:bg-muted/60 border border-border/50"
            >
              <Save className="size-3" />
              Guardar y salir
            </button>
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors py-1 px-2 rounded-full"
            >
              <X className="size-3" />
              Cancelar
            </button>
          </div>
        )}

        {/* Autosave status */}
        <div className="flex justify-center pb-2">
          <BuilderDraftsWidget error={saveError} />
        </div>
      </div>
    </>
  )
}

export function BuilderShell({ products, initialSession, userId, defaultPrefs }: BuilderShellProps) {
  return (
    <CampaignBuilderProvider>
      <BuilderContent products={products} initialSession={initialSession} userId={userId} defaultPrefs={defaultPrefs} />
    </CampaignBuilderProvider>
  )
}

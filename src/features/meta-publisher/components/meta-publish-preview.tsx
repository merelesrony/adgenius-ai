'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import {
  CheckCircle2, XCircle, AlertTriangle, Clock,
  FlaskConical, Loader2, ShieldCheck,
  Building2, FileText, DollarSign, Users, Palette, Globe, Rocket,
  ExternalLink, Link2, CheckCheck, AlertOctagon, Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getMetaConnectionAction } from '@/features/integrations/actions'
import { validateMetaCampaignAction } from '@/features/meta-publisher/actions'
import { MetaPublishConfirmModal } from './meta-publish-confirm-modal'
import { activateMetaCampaignAction } from '../activate-campaign-action'
import type { MetaConnectionRow } from '@/features/integrations/types'
import type { PreflightCheck, PreflightInput, PreflightResult } from '@/features/meta-publisher/preflight-types'
import type { CampaignStrategy, GeneratedCreative } from '@/features/campaign-builder/types'
import type { PublishFromBuilderResult } from '@/features/meta-publisher/publish-from-builder-action'
import { formatCurrency } from '@/lib/currency'

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

type PublishPhase =
  | 'idle'
  | 'confirming'
  | 'publishing'
  | 'disabled'       // META_PUBLISH_ENABLED=false
  | 'success'
  | 'failed'
  | 'partial'

type ActivationPhase = 'idle' | 'confirming' | 'activating' | 'activated' | 'activation_failed'

const PROGRESS_STEPS = [
  'Verificando configuración...',
  'Creando campaña en Meta...',
  'Configurando conjunto de anuncios...',
  'Preparando creativo...',
  'Publicando anuncio...',
]

export interface MetaPublishPreviewProps {
  productName: string
  aiStrategy: CampaignStrategy | null
  dailyBudget: string
  totalBudget: string
  currency: string
  country: string
  city: string | null
  platforms: string[]
  selectedCreative: GeneratedCreative | null
  preflightInput: PreflightInput
  canPublish: boolean
  onPublishConfirmed: () => Promise<PublishFromBuilderResult>
}

// ──────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────

export function MetaPublishPreview(props: MetaPublishPreviewProps) {
  const {
    productName, aiStrategy, dailyBudget, totalBudget, currency,
    country, city, platforms, selectedCreative, preflightInput,
    canPublish, onPublishConfirmed,
  } = props

  const [isPending, startTransition] = useTransition()
  const [conn, setConn] = useState<MetaConnectionRow | null | 'loading'>('loading')
  const [preflightResult, setPreflightResult] = useState<PreflightResult | null>(null)
  const [hasValidated, setHasValidated] = useState(false)
  const [phase, setPhase] = useState<PublishPhase>('idle')
  const [progressStep, setProgressStep] = useState(0)
  const [publishResult, setPublishResult] = useState<PublishFromBuilderResult | null>(null)
  const [activationPhase, setActivationPhase] = useState<ActivationPhase>('idle')
  const [activationError, setActivationError] = useState<string | null>(null)

  // Fetch connection on mount
  useEffect(() => {
    getMetaConnectionAction().then(c => setConn(c))
  }, [])

  // Auto-run validation on mount
  useEffect(() => {
    runValidation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Animate progress steps while publishing
  useEffect(() => {
    if (phase !== 'publishing') {
      setProgressStep(0)
      return
    }
    const id = setInterval(
      () => setProgressStep(s => Math.min(s + 1, PROGRESS_STEPS.length - 1)),
      1800,
    )
    return () => clearInterval(id)
  }, [phase])

  function runValidation() {
    startTransition(async () => {
      const res = await validateMetaCampaignAction(preflightInput)
      setPreflightResult(res)
      setHasValidated(true)
    })
  }

  async function handleConfirmPublish() {
    setPhase('publishing')
    try {
      const result = await onPublishConfirmed()
      setPublishResult(result)

      if (!result.success && result.reason === 'META_PUBLISH_DISABLED') {
        setPhase('disabled')
      } else if (result.success) {
        setPhase('success')
      } else if (result.publishStatus === 'partial_failure') {
        setPhase('partial')
      } else {
        setPhase('failed')
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Error inesperado'
      setPublishResult({ success: false, publishStatus: 'failed', reason: 'ERROR', error })
      setPhase('failed')
    }
  }

  async function handleActivate() {
    if (!publishResult?.campaignId) return
    setActivationPhase('activating')
    const res = await activateMetaCampaignAction(publishResult.campaignId)
    if (res.success) {
      setActivationPhase('activated')
    } else {
      setActivationError(res.error ?? 'Error al activar')
      setActivationPhase('activation_failed')
    }
  }

  const isConfirming = phase === 'confirming'
  const isPublishing = phase === 'publishing'
  const showPostPublish = phase === 'success' || phase === 'failed' || phase === 'partial' || phase === 'disabled'

  return (
    <>
      <MetaPublishConfirmModal
        open={isConfirming || (isPublishing && false /* keep open while publishing? No — close immediately */)}
        onClose={() => !isPublishing && setPhase('idle')}
        onConfirm={handleConfirmPublish}
        isConfirming={isPublishing}
        productName={productName}
        aiStrategy={aiStrategy}
        dailyBudget={dailyBudget}
        currency={currency}
        metaCurrency={preflightResult?.metaCurrency}
        country={country}
        city={city}
        selectedCreative={selectedCreative}
        adAccountName={conn !== 'loading' && conn ? conn.selected_ad_account_name : null}
        pageName={conn !== 'loading' && conn ? conn.selected_page_name : null}
      />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-muted/30">
          <div className="size-5 rounded bg-[#1877F2] flex items-center justify-center shrink-0">
            <span className="text-white text-[10px] font-bold leading-none">f</span>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex-1">
            Publicar en Meta Ads
          </span>
          {preflightResult?.dryRun && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
              <FlaskConical className="size-2.5" />
              Modo prueba
            </span>
          )}
        </div>

        <div className="divide-y divide-border/40">
          {/* CUENTA */}
          <Section icon={<Building2 className="size-4 text-muted-foreground" />} title="Cuenta">
            {conn === 'loading' ? (
              <SkeletonLine />
            ) : conn === null ? (
              <DisconnectedRow />
            ) : (
              <div className="space-y-1.5">
                <PreviewRow label="Usuario Meta" value={conn.meta_user_name ?? conn.meta_user_id} />
                <PreviewRow
                  label="Cuenta publicitaria"
                  value={conn.selected_ad_account_name ?? conn.selected_ad_account_id ?? '—'}
                  missing={!conn.selected_ad_account_id}
                  actionPath="/settings"
                  actionLabel="Seleccionar"
                />
              </div>
            )}
          </Section>

          {/* PÁGINA */}
          <Section icon={<FileText className="size-4 text-muted-foreground" />} title="Página">
            {conn === 'loading' ? (
              <SkeletonLine />
            ) : conn === null ? (
              <span className="text-xs text-muted-foreground">—</span>
            ) : (
              <div className="space-y-1.5">
                <PreviewRow
                  label="Página de Facebook"
                  value={conn.selected_page_name ?? conn.selected_page_id ?? '—'}
                  missing={!conn.selected_page_id}
                  actionPath="/settings"
                  actionLabel="Seleccionar"
                />
                {conn.selected_instagram_id && (
                  <PreviewRow label="Instagram" value={conn.selected_instagram_id} />
                )}
              </div>
            )}
          </Section>

          {/* CAMPAÑA */}
          <Section icon={<Globe className="size-4 text-muted-foreground" />} title="Campaña">
            <div className="space-y-1.5">
              <PreviewRow label="Nombre" value={`${productName} — IA`} />
              <PreviewRow
                label="Objetivo"
                value={aiStrategy?.objectiveLabel ?? '—'}
                missing={!aiStrategy}
              />
              <PreviewRow
                label="Plataformas"
                value={platforms.length > 0 ? platforms.join(', ') : '—'}
                missing={platforms.length === 0}
              />
            </div>
          </Section>

          {/* PRESUPUESTO */}
          <Section icon={<DollarSign className="size-4 text-muted-foreground" />} title="Presupuesto">
            <div className="space-y-1.5">
              <PreviewRow
                label="Diario"
                value={parseFloat(dailyBudget) > 0 ? formatCurrency(parseFloat(dailyBudget), currency) : '—'}
                missing={!parseFloat(dailyBudget)}
              />
              {parseFloat(totalBudget) > 0 && (
                <PreviewRow label="Total" value={formatCurrency(parseFloat(totalBudget), currency)} />
              )}
              {preflightResult?.metaCurrency && preflightResult.metaCurrency !== currency && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 px-2.5 py-1.5 mt-1">
                  <p className="text-[11px] text-blue-700 dark:text-blue-400">
                    Moneda Meta: <strong>{preflightResult.metaCurrency}</strong> — sin conversión
                  </p>
                </div>
              )}
            </div>
          </Section>

          {/* AUDIENCIA */}
          <Section icon={<Users className="size-4 text-muted-foreground" />} title="Audiencia">
            {aiStrategy ? (
              <div className="space-y-1.5">
                <PreviewRow label="Ubicación" value={`${country}${city ? `, ${city}` : ''}`} />
                <PreviewRow
                  label="Edad"
                  value={`${aiStrategy.audience.ageMin}–${aiStrategy.audience.ageMax} años`}
                />
                <PreviewRow
                  label="Género"
                  value={
                    aiStrategy.audience.gender === 'all' ? 'Todos' :
                    aiStrategy.audience.gender === 'male' ? 'Hombres' : 'Mujeres'
                  }
                />
                {aiStrategy.audience.interests.length > 0 && (
                  <PreviewRow
                    label="Intereses"
                    value={aiStrategy.audience.interests.slice(0, 4).join(', ')}
                  />
                )}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground italic">Genera la estrategia IA para ver la audiencia</span>
            )}
          </Section>

          {/* CREATIVO */}
          <Section icon={<Palette className="size-4 text-muted-foreground" />} title="Creativo">
            {selectedCreative ? (
              <div className="space-y-1.5">
                <PreviewRow label="Titular" value={selectedCreative.headline} />
                <PreviewRow label="Texto principal" value={selectedCreative.primaryText} truncate />
                <PreviewRow label="CTA" value={selectedCreative.cta} />
                {selectedCreative.imageUrl ? (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="size-10 rounded-md overflow-hidden border border-border/40 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={selectedCreative.imageUrl} alt="creativo" className="size-full object-cover" />
                    </div>
                    <span className="text-[11px] text-muted-foreground">Imagen seleccionada</span>
                  </div>
                ) : (
                  <PreviewRow label="Imagen" value="Sin imagen cargada" missing />
                )}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground italic">Selecciona un creativo en el paso anterior</span>
            )}
          </Section>

          {/* Validation result */}
          {hasValidated && preflightResult && phase === 'idle' && (
            <div className="px-4 py-3 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Resultado de validación
              </p>
              {preflightResult.checks.map(check => (
                <CheckRow key={check.key} check={check} />
              ))}
              <div className={cn(
                'rounded-lg px-3 py-2 flex items-center gap-2 mt-1',
                preflightResult.valid
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/40'
                  : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40',
              )}>
                {preflightResult.valid
                  ? <CheckCircle2 className="size-3.5 text-green-600 dark:text-green-400 shrink-0" />
                  : <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
                }
                <p className={cn(
                  'text-[11px] font-medium',
                  preflightResult.valid
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-amber-700 dark:text-amber-400',
                )}>
                  {preflightResult.valid
                    ? '¡Todo listo para publicar!'
                    : `${preflightResult.checks.filter(c => c.status === 'failed').length} problema(s) por resolver`
                  }
                </p>
              </div>
            </div>
          )}

          {/* Publishing progress */}
          {phase === 'publishing' && (
            <div className="px-4 py-4 space-y-3">
              {PROGRESS_STEPS.map((label, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  {i < progressStep ? (
                    <CheckCircle2 className="size-3.5 text-green-500 shrink-0" />
                  ) : i === progressStep ? (
                    <Loader2 className="size-3.5 text-brand animate-spin shrink-0" />
                  ) : (
                    <Clock className="size-3.5 text-muted-foreground/30 shrink-0" />
                  )}
                  <span className={cn(
                    'text-[11px]',
                    i < progressStep ? 'text-muted-foreground line-through' :
                    i === progressStep ? 'text-foreground font-medium' :
                    'text-muted-foreground/40',
                  )}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Post-publish result */}
          {showPostPublish && publishResult && (
            <PublishResult
              phase={phase}
              result={publishResult}
              activationPhase={activationPhase}
              activationError={activationError}
              dailyBudget={dailyBudget}
              currency={currency}
              country={country}
              aiStrategy={aiStrategy}
              onActivateRequest={() => setActivationPhase('confirming')}
              onActivateConfirm={handleActivate}
              onActivateCancel={() => setActivationPhase('idle')}
            />
          )}

          {/* Actions */}
          <div className="px-4 py-3 space-y-2">
            {phase === 'idle' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-xs"
                  onClick={runValidation}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <ShieldCheck className="size-3.5" />
                  )}
                  {isPending ? 'Validando...' : hasValidated ? 'Reverificar con Meta' : '🧪 Validar con Meta'}
                </Button>

                <Button
                  size="sm"
                  className="w-full gap-2 text-xs"
                  onClick={() => setPhase('confirming')}
                  disabled={!canPublish}
                >
                  <Rocket className="size-3.5" />
                  🚀 Publicar en Meta
                </Button>
              </>
            )}

            {phase === 'publishing' && (
              <Button size="sm" className="w-full gap-2 text-xs" disabled>
                <Loader2 className="size-3.5 animate-spin" />
                Publicando...
              </Button>
            )}

            {showPostPublish && phase !== 'success' && (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-xs"
                onClick={() => { setPhase('idle'); setPublishResult(null) }}
              >
                Volver
              </Button>
            )}

            <div className="flex items-center gap-3 pt-1 justify-center">
              <a
                href="https://www.facebook.com/adsmanager"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-brand hover:underline"
              >
                Abrir Ads Manager
                <ExternalLink className="size-2.5" />
              </a>
              <span className="text-muted-foreground/30">·</span>
              <Link
                href="/settings"
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Link2 className="size-2.5" />
                Configurar Meta
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ──────────────────────────────────────────────────────────────
// Post-publish result panel
// ──────────────────────────────────────────────────────────────

function PublishResult({
  phase,
  result,
  activationPhase,
  activationError,
  dailyBudget,
  currency,
  country,
  aiStrategy,
  onActivateRequest,
  onActivateConfirm,
  onActivateCancel,
}: {
  phase: PublishPhase
  result: PublishFromBuilderResult
  activationPhase: ActivationPhase
  activationError: string | null
  dailyBudget: string
  currency: string
  country: string
  aiStrategy: import('@/features/campaign-builder/types').CampaignStrategy | null
  onActivateRequest: () => void
  onActivateConfirm: () => void
  onActivateCancel: () => void
}) {
  if (phase === 'disabled') {
    return (
      <div className="px-4 py-3">
        <div className="rounded-lg bg-muted/60 border border-border px-3 py-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <FlaskConical className="size-3.5 text-purple-500 shrink-0" />
            <p className="text-[11px] font-semibold text-foreground">Publicación desactivada en modo prueba</p>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            La campaña NO fue creada. Activa{' '}
            <code className="font-mono bg-muted px-1 rounded text-[9px]">META_PUBLISH_ENABLED=true</code>
            {' '}en variables de entorno para habilitar la publicación real.
          </p>
        </div>
      </div>
    )
  }

  if (phase === 'success') {
    const isActivated = activationPhase === 'activated'
    return (
      <div className="px-4 py-3 space-y-3">
        {/* Status header */}
        <div className={cn(
          'rounded-lg border px-3 py-3',
          isActivated
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/40'
            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40',
        )}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCheck className={cn('size-4 shrink-0', isActivated ? 'text-green-600 dark:text-green-400' : 'text-amber-500')} />
            <p className={cn('text-[11px] font-semibold', isActivated ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400')}>
              {isActivated ? '🟢 Campaña ACTIVA en Meta' : '🟡 Campaña creada en Meta — PAUSADA'}
            </p>
          </div>
          <div className="space-y-1">
            {result.metaCampaignId && <IdRow label="Campaign ID" value={result.metaCampaignId} />}
            {result.metaAdSetId && <IdRow label="Ad Set ID" value={result.metaAdSetId} />}
            {result.metaCreativeId && <IdRow label="Creative ID" value={result.metaCreativeId} />}
            {result.metaAdId && <IdRow label="Ad ID" value={result.metaAdId} />}
          </div>
        </div>

        {/* Ver en Meta */}
        {result.adsManagerUrl && (
          <a
            href={result.adsManagerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-xs font-medium text-brand hover:underline"
          >
            Ver en Meta Ads Manager
            <ExternalLink className="size-3" />
          </a>
        )}

        {/* Activation state machine */}
        {!isActivated && (
          <>
            {activationPhase === 'idle' && (
              <Button
                size="sm"
                className="w-full gap-2 text-xs"
                onClick={onActivateRequest}
              >
                <Zap className="size-3.5" />
                Activar campaña
              </Button>
            )}

            {activationPhase === 'confirming' && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 px-3 py-3 space-y-2">
                <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                  ¿Activar campaña? Comenzará a gastar presupuesto.
                </p>
                <div className="space-y-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                  <p>Presupuesto diario: <strong>{formatCurrency(parseFloat(dailyBudget) || 0, currency)}</strong></p>
                  <p>País: <strong>{country}</strong></p>
                  {aiStrategy && (
                    <p>Audiencia: <strong>{aiStrategy.audience.ageMin}–{aiStrategy.audience.ageMax} años</strong>
                      {aiStrategy.audience.gender !== 'all' && ` · ${aiStrategy.audience.gender === 'male' ? 'Hombres' : 'Mujeres'}`}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    className="flex-1 text-xs gap-1.5"
                    onClick={onActivateConfirm}
                  >
                    <Zap className="size-3" />
                    Sí, activar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={onActivateCancel}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {activationPhase === 'activating' && (
              <Button size="sm" className="w-full gap-2 text-xs" disabled>
                <Loader2 className="size-3.5 animate-spin" />
                Activando en Meta...
              </Button>
            )}

            {activationPhase === 'activation_failed' && (
              <div className="rounded-lg bg-destructive/5 border border-destructive/30 px-3 py-2.5 space-y-1.5">
                <p className="text-[11px] font-semibold text-destructive">Error al activar</p>
                <p className="text-[10px] text-destructive/80 leading-relaxed">{activationError}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs mt-1"
                  onClick={onActivateRequest}
                >
                  Reintentar
                </Button>
              </div>
            )}
          </>
        )}

        {/* Ir a la campaña */}
        {result.campaignId && (
          <Link
            href={`/campaigns/${result.campaignId}/review`}
            className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Ir a la campaña →
          </Link>
        )}
      </div>
    )
  }

  if (phase === 'partial') {
    return (
      <div className="px-4 py-3">
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 px-3 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
            <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">Publicación parcial</p>
          </div>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-relaxed">
            Algunos recursos se crearon pero la publicación no se completó.
          </p>
          <div className="space-y-0.5 mt-1">
            {result.metaCampaignId && <IdRow label="Campaign ID" value={result.metaCampaignId} />}
            {result.metaAdSetId && <IdRow label="Ad Set ID" value={result.metaAdSetId} />}
            {result.metaCreativeId && <IdRow label="Creative ID" value={result.metaCreativeId} />}
            {!result.metaAdId && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                ✗ Ad: {result.error ?? 'Error al crear el anuncio'}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // failed
  return (
    <div className="px-4 py-3">
      <div className="rounded-lg bg-destructive/5 border border-destructive/30 px-3 py-3 space-y-1.5">
        <div className="flex items-center gap-2">
          <AlertOctagon className="size-3.5 text-destructive shrink-0" />
          <p className="text-[11px] font-semibold text-destructive">Error al publicar</p>
        </div>
        <p className="text-[10px] text-destructive/80 leading-relaxed">
          {result.error ?? 'Error desconocido. Intenta nuevamente.'}
        </p>
      </div>
    </div>
  )
}

function IdRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Zap className="size-2.5 text-green-500 shrink-0" />
      <span className="text-[10px] text-muted-foreground w-20 shrink-0">{label}</span>
      <code className="text-[10px] font-mono text-foreground break-all">{value}</code>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
      </div>
      {children}
    </div>
  )
}

function PreviewRow({
  label,
  value,
  missing = false,
  truncate = false,
  actionPath,
  actionLabel = 'Configurar',
}: {
  label: string
  value: string
  missing?: boolean
  truncate?: boolean
  actionPath?: string
  actionLabel?: string
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[11px] text-muted-foreground w-28 shrink-0 pt-px">{label}</span>
      <div className="flex-1 min-w-0">
        <span className={cn(
          'text-[11px] font-medium leading-snug',
          missing ? 'text-amber-600 dark:text-amber-400 italic' : 'text-foreground',
          truncate && 'line-clamp-2',
        )}>
          {value}
        </span>
        {missing && actionPath && (
          <Link href={actionPath} className="block text-[10px] font-medium text-brand hover:underline mt-0.5">
            {actionLabel} →
          </Link>
        )}
      </div>
    </div>
  )
}

function SkeletonLine() {
  return <div className="h-3 bg-muted/60 rounded animate-pulse w-40" />
}

function DisconnectedRow() {
  return (
    <div className="flex items-center gap-2">
      <XCircle className="size-3.5 text-destructive shrink-0" />
      <span className="text-[11px] text-destructive">Meta no conectado.</span>
      <Link href="/settings" className="text-[11px] font-medium text-brand hover:underline">
        Conectar →
      </Link>
    </div>
  )
}

function CheckRow({ check }: { check: PreflightCheck }) {
  return (
    <div className="flex items-start gap-2">
      <StatusIcon status={check.status} />
      <div className="flex-1 min-w-0">
        <span className="text-[11px] font-medium text-foreground leading-snug">{check.label}</span>
        {check.message && check.status !== 'passed' && check.status !== 'skipped' && (
          <p className={cn(
            'text-[10px] mt-0.5 leading-relaxed',
            check.status === 'failed' ? 'text-destructive/80' : 'text-amber-600 dark:text-amber-400',
          )}>
            {check.message}
          </p>
        )}
        {check.actionPath && check.status === 'failed' && (
          <Link href={check.actionPath} className="text-[10px] font-medium text-brand hover:underline">
            Ir a configuración →
          </Link>
        )}
      </div>
    </div>
  )
}

function StatusIcon({ status }: { status: PreflightCheck['status'] }) {
  switch (status) {
    case 'passed':  return <CheckCircle2 className="size-3 text-green-500 shrink-0 mt-0.5" />
    case 'failed':  return <XCircle className="size-3 text-destructive shrink-0 mt-0.5" />
    case 'warning': return <AlertTriangle className="size-3 text-amber-500 shrink-0 mt-0.5" />
    case 'skipped': return <Clock className="size-3 text-muted-foreground/40 shrink-0 mt-0.5" />
  }
}

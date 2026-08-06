'use client'

import { useState, useTransition, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, CheckCircle2, XCircle, Package, PenTool, Image as ImageIcon,
  Target, Users, Globe, DollarSign, MapPin, Eye, Edit2, Copy, Trash2,
  Megaphone, ExternalLink, Sparkles, AlertCircle, Clock, Save, X,
  BarChart2, Zap, ChevronDown, ChevronUp, Check, Loader2, RefreshCw,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/currency'
import {
  updateCampaignStatusAction,
  duplicateCampaignAction,
  deleteCampaignAction,
  updateCampaignCopyAction,
  applyCampaignOptimizationAction,
  rejectCampaignOptimizationAction,
  saveOptimizedCreativeAction,
} from '@/features/campaigns/actions'
import { CAMPAIGN_OBJECTIVES, COUNTRIES } from '@/constants/options'
// Image generation is handled server-side via /api/ai/generate-image
import type { Database } from '@/types/database'
import type { AdCreativeAIResult, CampaignOptimizationResult } from '@/lib/ai/AIManager'

type CampaignRow = Database['public']['Tables']['campaigns']['Row']
type CreativeRow = Database['public']['Tables']['campaign_creatives']['Row']
type OptimizationRow = Database['public']['Tables']['campaign_optimizations']['Row']

interface CampaignReviewProps {
  campaign: CampaignRow
  creativeUrl: string | null
  creatives?: CreativeRow[]
  optimizations?: OptimizationRow[]
}

type AiCopy = { headline: string; body: string; description: string; cta: string }
type ScoreBreakdown = { copy: number; audience: number; creative: number; budget: number }

interface CheckItem { id: string; label: string; pass: boolean }

function buildChecklist(campaign: CampaignRow, aiCopy: AiCopy | null): CheckItem[] {
  const interests = campaign.target_interests as string[] | null
  return [
    { id: 'name',       label: 'Campaña con nombre',               pass: !!campaign.name?.trim() },
    { id: 'objective',  label: 'Objetivo configurado',              pass: !!campaign.objective },
    { id: 'headline',   label: 'Headline generado',                 pass: !!aiCopy?.headline?.trim() },
    { id: 'body',       label: 'Texto principal listo',             pass: !!aiCopy?.body?.trim() },
    { id: 'cta',        label: 'CTA configurado',                   pass: !!aiCopy?.cta?.trim() },
    { id: 'budget',     label: 'Presupuesto diario asignado',       pass: (campaign.daily_budget ?? 0) > 0 },
    { id: 'start_date', label: 'Fecha de inicio establecida',       pass: !!campaign.start_date },
    { id: 'country',    label: 'País de segmentación seleccionado', pass: !!campaign.target_country?.trim() },
    { id: 'age',        label: 'Rango de edad configurado',         pass: !!campaign.target_age_min && !!campaign.target_age_max },
    { id: 'interests',  label: 'Al menos 1 interés definido',       pass: Array.isArray(interests) && interests.length > 0 },
  ]
}

function SectionCard({
  icon: Icon, title, children, accent, action,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
  accent?: string
  action?: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className={cn('flex items-center gap-2.5 px-4 py-3 border-b border-border', accent ?? 'bg-muted/20')}>
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground flex-1">{title}</h3>
        {action}
      </div>
      <div className="p-4 space-y-2">{children}</div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className={cn('text-xs font-medium text-foreground text-right max-w-[60%]', mono && 'font-mono')}>
        {value || '—'}
      </span>
    </div>
  )
}

function CopyBlock({ label, value, onCopy }: { label: string; value?: string | null; onCopy?: () => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{label}</p>
        {onCopy && value && (
          <button type="button" onClick={onCopy} className="text-muted-foreground hover:text-foreground transition-colors">
            <Copy className="size-3" />
          </button>
        )}
      </div>
      <p className="text-xs text-foreground leading-relaxed rounded-lg bg-muted/50 px-3 py-2 whitespace-pre-wrap">
        {value || '—'}
      </p>
    </div>
  )
}

function ScoreBar({ value, max }: { value: number; max: number }) {
  return (
    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full bg-brand/60 transition-all duration-500"
        style={{ width: `${Math.round((value / max) * 100)}%` }}
      />
    </div>
  )
}

function copyText(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => toast.success(`${label} copiado`))
}

const PRIORITY_CONFIG = {
  high:   { label: 'Alta',  class: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
  medium: { label: 'Media', class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  low:    { label: 'Baja',  class: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' },
}

const TYPE_LABELS: Record<string, string> = {
  copy: 'Copy',
  cta: 'CTA',
  audience: 'Audiencia',
  budget: 'Presupuesto',
  creative: 'Creativo',
}

// Formats the `after_value` field into a readable string for display
function formatAfterValue(type: string, raw: string): string {
  if (!raw) return '—'
  if (type === 'copy') {
    try {
      const p = JSON.parse(raw) as { headline?: string; body?: string; description?: string }
      return [p.headline, p.body, p.description].filter(Boolean).join('\n')
    } catch { return raw }
  }
  if (type === 'audience') {
    try {
      const p = JSON.parse(raw) as { ageMin?: number; ageMax?: number; gender?: string; interests?: string[] }
      const parts = []
      if (p.ageMin && p.ageMax) parts.push(`${p.ageMin}–${p.ageMax} años`)
      if (p.gender) parts.push(p.gender === 'all' ? 'Todos' : p.gender === 'male' ? 'Hombres' : 'Mujeres')
      if (p.interests?.length) parts.push(p.interests.join(', '))
      return parts.join(' · ') || raw
    } catch { return raw }
  }
  return raw
}

// ── Optimizer Section ─────────────────────────────────────────────────────────

interface OptimizerSectionProps {
  campaignId: string
  initialOptimizations: OptimizationRow[]
  initialScore: number | null
  initialSummary: string | null
  initialStrengths: string[] | null
}

function OptimizerSection({
  campaignId,
  initialOptimizations,
  initialScore,
  initialSummary,
  initialStrengths,
}: OptimizerSectionProps) {
  const router = useRouter()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [liveResult, setLiveResult] = useState<CampaignOptimizationResult | null>(null)
  const [localStatuses, setLocalStatuses] = useState<Map<string, 'accepted' | 'rejected'>>(new Map())
  const [pendingActionId, setPendingActionId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Determine which data to show: API response trumps server-loaded data
  const score = liveResult?.score ?? initialScore
  const summary = liveResult?.summary ?? initialSummary
  const strengths = liveResult?.strengths ?? initialStrengths ?? []

  type DisplayOpt = {
    id: string; campaign_id: string; user_id: string; type: string; priority: string
    problem: string; recommendation: string; before_value: string | null
    after_value: string | null; status: string; created_at: string
  }

  // Merge live improvements (from API) with DB rows (server-loaded)
  const displayOptimizations: DisplayOpt[] =
    liveResult
      ? liveResult.improvements.map((imp): DisplayOpt => {
          const dbRow = initialOptimizations.find((r) => r.type === imp.type && r.before_value === imp.before)
          if (dbRow) return dbRow as DisplayOpt
          return {
            id: imp.id,
            campaign_id: campaignId,
            user_id: '',
            type: imp.type,
            priority: imp.priority,
            problem: imp.problem,
            recommendation: imp.recommendation,
            before_value: imp.before,
            after_value: imp.after,
            status: 'pending',
            created_at: new Date().toISOString(),
          }
        })
      : (initialOptimizations as DisplayOpt[])

  const hasAnalysis = score !== null
  const hasOptimizations = displayOptimizations.length > 0

  async function runAnalysis() {
    setIsAnalyzing(true)
    setAnalyzeError(null)
    try {
      const res = await fetch('/api/ai/optimize-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al analizar')
      setLiveResult(data as CampaignOptimizationResult)
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado'
      setAnalyzeError(msg)
      toast.error(msg)
    } finally {
      setIsAnalyzing(false)
    }
  }

  async function handleApply(optId: string) {
    setPendingActionId(optId)
    try {
      const result = await applyCampaignOptimizationAction(optId)
      if (result.success) {
        setLocalStatuses((m) => new Map(m).set(optId, 'accepted'))
        toast.success('Mejora aplicada')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } finally {
      setPendingActionId(null)
    }
  }

  async function handleReject(optId: string) {
    setPendingActionId(optId)
    try {
      const result = await rejectCampaignOptimizationAction(optId)
      if (result.success) {
        setLocalStatuses((m) => new Map(m).set(optId, 'rejected'))
        toast.success('Mejora ignorada')
      } else {
        toast.error(result.error)
      }
    } finally {
      setPendingActionId(null)
    }
  }

  const scoreColor = (s: number) =>
    s >= 75 ? 'text-green-500' : s >= 50 ? 'text-amber-500' : 'text-red-400'

  const scoreBg = (s: number) =>
    s >= 75 ? 'bg-green-500' : s >= 50 ? 'bg-amber-500' : 'bg-red-400'

  return (
    <div className="rounded-xl border border-brand/20 bg-gradient-to-br from-brand/5 to-purple-500/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-brand/15 bg-brand/5">
        <Zap className="size-4 text-brand shrink-0" />
        <h3 className="text-sm font-semibold text-foreground flex-1">✨ Optimización IA</h3>
        <Button
          size="sm"
          variant={hasAnalysis ? 'outline' : 'default'}
          className="h-7 gap-1.5 text-xs"
          onClick={runAnalysis}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <><Loader2 className="size-3 animate-spin" />Analizando...</>
          ) : hasAnalysis ? (
            <><RefreshCw className="size-3" />Re-analizar</>
          ) : (
            <><Sparkles className="size-3" />Analizar campaña</>
          )}
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Initial empty state */}
        {!hasAnalysis && !isAnalyzing && (
          <div className="text-center py-6 space-y-2">
            <TrendingUp className="size-8 text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground">
              Obtén recomendaciones personalizadas de la IA para mejorar tu campaña.
            </p>
            <p className="text-xs text-muted-foreground/70">
              El análisis revisa copy, audiencia, presupuesto, creativo y CTA.
            </p>
          </div>
        )}

        {/* Loading */}
        {isAnalyzing && (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 className="size-6 animate-spin text-brand" />
            <p className="text-sm text-muted-foreground">Analizando tu campaña con IA...</p>
          </div>
        )}

        {/* Error */}
        {analyzeError && !isAnalyzing && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2">
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">{analyzeError}</p>
          </div>
        )}

        {/* Score + summary */}
        {hasAnalysis && !isAnalyzing && score !== null && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Puntuación general</span>
                <span className={cn('text-xl font-bold', scoreColor(score))}>
                  {score}<span className="text-xs font-normal text-muted-foreground">/100</span>
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-700', scoreBg(score))}
                  style={{ width: `${score}%` }}
                />
              </div>
              {summary && <p className="text-xs text-muted-foreground leading-relaxed">{summary}</p>}
            </div>

            {/* Strengths */}
            {strengths.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Fortalezas</p>
                {strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="size-3.5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-xs text-foreground leading-relaxed">{s}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Improvements */}
            {hasOptimizations && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Mejoras recomendadas ({displayOptimizations.filter((o) => {
                    const status = localStatuses.get(o.id) ?? ('status' in o ? (o as OptimizationRow).status : 'pending')
                    return status === 'pending'
                  }).length} pendientes)
                </p>
                {displayOptimizations.map((opt) => {
                  const resolvedStatus = localStatuses.get(opt.id) ?? ('status' in opt ? (opt as OptimizationRow).status : 'pending')
                  const isPending = resolvedStatus === 'pending'
                  const isExpanded = expandedId === opt.id
                  const isBusy = pendingActionId === opt.id
                  const priority = opt.priority as 'high' | 'medium' | 'low'
                  const pc = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.low

                  return (
                    <div
                      key={opt.id}
                      className={cn(
                        'rounded-xl border bg-card overflow-hidden transition-all',
                        isPending ? 'border-border' : 'border-border/40 opacity-60',
                      )}
                    >
                      {/* Row header */}
                      <button
                        type="button"
                        className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-muted/30 transition-colors"
                        onClick={() => setExpandedId(isExpanded ? null : opt.id)}
                      >
                        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                          <span className={cn('text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full border', pc.class)}>
                            {pc.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {TYPE_LABELS[opt.type] ?? opt.type}
                          </span>
                        </div>
                        <p className="flex-1 text-xs text-foreground leading-relaxed line-clamp-2">
                          {opt.problem}
                        </p>
                        <div className="ml-auto flex items-center gap-1 shrink-0 ml-2">
                          {!isPending && (
                            <span className={cn(
                              'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                              resolvedStatus === 'accepted'
                                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                : 'bg-muted text-muted-foreground',
                            )}>
                              {resolvedStatus === 'accepted' ? 'Aplicado' : 'Ignorado'}
                            </span>
                          )}
                          {isExpanded ? <ChevronUp className="size-3.5 text-muted-foreground" /> : <ChevronDown className="size-3.5 text-muted-foreground" />}
                        </div>
                      </button>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-2.5 border-t border-border/50 pt-2.5">
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            <span className="font-semibold text-foreground">Recomendación:</span> {opt.recommendation}
                          </p>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-lg bg-red-500/5 border border-red-500/15 p-2 space-y-0.5">
                              <p className="text-[9px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">Actual</p>
                              <p className="text-[11px] text-foreground leading-relaxed line-clamp-3">
                                {opt.before_value || '—'}
                              </p>
                            </div>
                            <div className="rounded-lg bg-green-500/5 border border-green-500/15 p-2 space-y-0.5">
                              <p className="text-[9px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">Sugerido</p>
                              <p className="text-[11px] text-foreground leading-relaxed line-clamp-3">
                                {formatAfterValue(opt.type, opt.after_value ?? '')}
                              </p>
                            </div>
                          </div>

                          {isPending && opt.type !== 'creative' && (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                className="h-7 gap-1.5 text-xs flex-1"
                                onClick={() => handleApply(opt.id)}
                                disabled={isBusy}
                              >
                                {isBusy ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                                Aplicar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1.5 text-xs"
                                onClick={() => handleReject(opt.id)}
                                disabled={isBusy}
                              >
                                <X className="size-3" />
                                Ignorar
                              </Button>
                            </div>
                          )}

                          {isPending && opt.type === 'creative' && (
                            <p className="text-[11px] text-muted-foreground italic">
                              Usa el botón &quot;Crear creativo optimizado&quot; en la sección de imagen para aplicar esta mejora.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {hasAnalysis && !hasOptimizations && !isAnalyzing && (
              <div className="flex items-center gap-2 rounded-lg bg-green-500/5 border border-green-500/20 p-3">
                <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                <p className="text-xs text-green-700 dark:text-green-400">
                  ¡Tu campaña está bien optimizada! No se encontraron mejoras críticas.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Creative Optimizer Panel ──────────────────────────────────────────────────

interface CreativeOptimizerProps {
  campaign: CampaignRow
}

function CreativeOptimizerPanel({ campaign }: CreativeOptimizerProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedVariants, setGeneratedVariants] = useState<Array<{
    headline: string; primaryText: string; description: string; cta: string
    imagePrompt: string; variant: string; variantLabel: string; style: string; concept: string
    imageUrl: string
  }> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savingVariant, setSavingVariant] = useState<string | null>(null)

  const aiStrategy = campaign.ai_strategy as {
    creativeDirection?: { style?: string; concept?: string }
  } | null
  const interests = campaign.target_interests as string[] | null

  async function generateCreatives() {
    setIsGenerating(true)
    setError(null)
    setGeneratedVariants(null)
    try {
      const res = await fetch('/api/ai/generate-ad-creative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: campaign.product_name ?? 'Producto',
          productDescription: campaign.product_description ?? null,
          productCategory: campaign.product_category ?? null,
          productPrice: campaign.product_price ?? null,
          productCurrency: campaign.product_currency ?? null,
          ageMin: campaign.target_age_min ?? 18,
          ageMax: campaign.target_age_max ?? 65,
          gender: campaign.target_gender ?? 'all',
          interests: Array.isArray(interests) ? interests : [],
          objective: campaign.objective ?? 'sales',
          objectiveLabel: CAMPAIGN_OBJECTIVES.find((o) => o.value === campaign.objective)?.label ?? 'Ventas',
          recommendedCTA: (campaign.ai_copy as AiCopy | null)?.cta ?? 'Comprar Ahora',
          dailyBudget: campaign.daily_budget ?? 10,
          budgetCurrency: campaign.currency ?? 'USD',
          creativeStyle: aiStrategy?.creativeDirection?.style ?? 'Profesional y moderno',
          creativeConcept: aiStrategy?.creativeDirection?.concept ?? 'Producto como protagonista',
          platforms: (campaign.platforms as string[] | null) ?? [],
        }),
      })
      const data = await res.json() as AdCreativeAIResult
      if (!res.ok) throw new Error((data as unknown as { error?: string }).error ?? 'Error')

      // Set variants immediately with empty imageUrl (images load async)
      const variants = data.creatives.map((c) => ({ ...c, imageUrl: '' }))
      setGeneratedVariants(variants)

      // Generate images server-side in parallel (OpenAI → Pollinations fallback)
      void Promise.all(
        data.creatives.map(async (c, i) => {
          try {
            const imgRes = await fetch('/api/ai/generate-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: c.imagePrompt }),
            })
            const imgData = await imgRes.json() as { imageUrl?: string }
            if (imgData.imageUrl) {
              setGeneratedVariants(prev =>
                prev ? prev.map((v, j) => j === i ? { ...v, imageUrl: imgData.imageUrl! } : v) : prev,
              )
            }
          } catch { /* fail silently — image stays empty */ }
        }),
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error generando creativos'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleUseVariant(v: NonNullable<typeof generatedVariants>[number]) {
    setSavingVariant(v.variant)
    try {
      const result = await saveOptimizedCreativeAction(campaign.id, {
        imageUrl: v.imageUrl,
        imagePrompt: v.imagePrompt,
        headline: v.headline,
        primaryText: v.primaryText,
        description: v.description,
        cta: v.cta,
        variant: v.variant,
        variantLabel: v.variantLabel,
        format: 'square',
      })
      if (result.success) {
        toast.success('Creativo guardado como principal')
        setIsOpen(false)
        setGeneratedVariants(null)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } finally {
      setSavingVariant(null)
    }
  }

  return (
    <div className="pt-3 border-t border-border/50">
      <Button
        size="sm"
        variant="outline"
        className="w-full gap-2 h-8 text-xs"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen && !generatedVariants) generateCreatives()
        }}
      >
        <Sparkles className="size-3.5 text-brand" />
        {isOpen ? 'Cerrar generador' : 'Crear creativo optimizado'}
        {isOpen ? <ChevronUp className="size-3.5 ml-auto" /> : <ChevronDown className="size-3.5 ml-auto" />}
      </Button>

      {isOpen && (
        <div className="mt-3 space-y-3">
          {isGenerating && (
            <div className="flex flex-col items-center gap-2 py-4">
              <Loader2 className="size-5 animate-spin text-brand" />
              <p className="text-xs text-muted-foreground">Generando creativos con IA...</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2">
              <AlertCircle className="size-3.5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="text-xs text-destructive">{error}</p>
                <button type="button" className="text-[11px] text-brand hover:underline" onClick={generateCreatives}>
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {generatedVariants && (
            <>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                Elige una variante
              </p>
              <div className="grid grid-cols-1 gap-3">
                {generatedVariants.map((v) => (
                  <div key={v.variant} className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="aspect-video overflow-hidden bg-muted/30">
                      {v.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={v.imageUrl}
                          alt={v.variantLabel}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-muted to-muted/60 animate-pulse" />
                      )}
                    </div>
                    <div className="p-3 space-y-1.5">
                      <div className="flex items-center gap-2 justify-between">
                        <span className="text-[10px] font-semibold text-muted-foreground">{v.variantLabel}</span>
                        <span className="text-[10px] rounded-full bg-brand/10 text-brand px-2 py-0.5">{v.cta}</span>
                      </div>
                      <p className="text-xs font-semibold text-foreground">{v.headline}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{v.primaryText}</p>
                      <Button
                        size="sm"
                        className="w-full h-7 text-xs gap-1.5 mt-1"
                        onClick={() => handleUseVariant(v)}
                        disabled={!!savingVariant}
                      >
                        {savingVariant === v.variant ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Check className="size-3" />
                        )}
                        Usar este creativo
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                size="sm"
                variant="outline"
                className="w-full h-7 text-xs gap-1.5"
                onClick={generateCreatives}
                disabled={isGenerating}
              >
                <RefreshCw className="size-3" />
                Generar nuevas variantes
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function CampaignReview({ campaign, creativeUrl, creatives = [], optimizations = [] }: CampaignReviewProps) {
  const router = useRouter()
  const [isPendingStatus, startStatusTransition] = useTransition()
  const [isPendingDuplicate, startDuplicateTransition] = useTransition()
  const [isPendingDelete, startDeleteTransition] = useTransition()
  const [isSavingCopy, startSaveCopyTransition] = useTransition()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isEditingCopy, setIsEditingCopy] = useState(false)
  const [editCopy, setEditCopy] = useState<AiCopy>({ headline: '', body: '', description: '', cta: '' })

  const aiCopy = campaign.ai_copy as AiCopy | null
  const scoreBreakdown = campaign.ai_score_breakdown as ScoreBreakdown | null
  const interests = campaign.target_interests as string[] | null
  const checklist = buildChecklist(campaign, aiCopy)
  const allPassed = checklist.every((c) => c.pass)
  const passCount = checklist.filter((c) => c.pass).length

  const objectiveLabel = CAMPAIGN_OBJECTIVES.find((o) => o.value === campaign.objective)?.label ?? campaign.objective ?? '—'
  const countryLabel = COUNTRIES.find((c) => c.value === campaign.target_country)?.label ?? campaign.target_country ?? '—'
  const genderLabel = campaign.target_gender === 'all' ? 'Todos' :
    campaign.target_gender === 'male' ? 'Masculino' : 'Femenino'
  const currency = campaign.product_currency ?? campaign.currency ?? 'USD'

  const primaryCreative = creatives.find((c) => c.is_primary) ?? (creatives.length > 0 ? creatives[0] : null)
  const otherCreatives = creatives.filter((c) => c !== primaryCreative)
  const displayCreativeUrl = primaryCreative?.image_url ?? creativeUrl

  const optimizerStrengths = campaign.optimizer_strengths as string[] | null

  const scoreColor = useCallback((s: number) =>
    s >= 75 ? 'text-green-500' : s >= 50 ? 'text-amber-500' : 'text-red-400', [])

  function startCopyEdit() {
    setEditCopy({
      headline: aiCopy?.headline ?? '',
      body: aiCopy?.body ?? '',
      description: aiCopy?.description ?? '',
      cta: aiCopy?.cta ?? '',
    })
    setIsEditingCopy(true)
  }

  function saveCopyEdit() {
    startSaveCopyTransition(async () => {
      const result = await updateCampaignCopyAction(campaign.id, editCopy)
      if (result.success) {
        toast.success('Copy actualizado')
        setIsEditingCopy(false)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleMarkReady() {
    startStatusTransition(async () => {
      const result = await updateCampaignStatusAction(campaign.id, 'pending')
      if (result.success) {
        toast.success('Campaña marcada como lista para publicar', {
          description: 'Ahora ve al Administrador de Anuncios de Meta y crea el anuncio con estos datos.',
          duration: 6000,
        })
      } else { toast.error(result.error) }
    })
  }

  function handleDuplicate() {
    startDuplicateTransition(async () => {
      const result = await duplicateCampaignAction(campaign.id)
      if (result.success) {
        toast.success('Campaña duplicada')
        if (result.data) router.push(`/campaigns/${result.data}/review`)
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      const result = await deleteCampaignAction(campaign.id)
      if (result.success) {
        toast.success('Campaña eliminada')
        router.push('/campaigns')
      } else { toast.error(result.error) }
    })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/campaigns" className="mt-0.5 flex size-8 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors">
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-semibold text-foreground">{campaign.name}</h1>
              <StatusBadge status={campaign.status} />
            </div>
            {campaign.ai_generated && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 text-brand px-2.5 py-0.5 text-xs font-medium">
                <Sparkles className="size-3" />
                Creada con Smart Builder IA
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Link href={`/campaigns/${campaign.id}/edit`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Edit2 className="size-3.5" />Editar
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDuplicate} loading={isPendingDuplicate} disabled={isPendingDuplicate}>
            <Copy className="size-3.5" />Duplicar
          </Button>
          {!showDeleteConfirm ? (
            <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="size-3.5" />Eliminar
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-2 py-1">
              <span className="text-xs text-destructive font-medium">¿Confirmar?</span>
              <button type="button" onClick={handleDelete} disabled={isPendingDelete} className="text-[11px] font-semibold text-destructive underline">
                {isPendingDelete ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="text-[11px] text-muted-foreground underline">Cancelar</button>
            </div>
          )}
        </div>
      </div>

      {/* AI origin banner */}
      {campaign.ai_generated && (
        <div className="flex items-start gap-3 rounded-xl border border-brand/20 bg-gradient-to-r from-brand/5 to-purple-500/5 px-4 py-3">
          <Sparkles className="size-4 text-brand shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Campaña generada con Smart Builder IA</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Todos los datos fueron generados automáticamente. Revisa cada sección y publica cuando estés listo.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        {/* Left */}
        <div className="space-y-4">

          {/* ✨ Optimizer Section */}
          <OptimizerSection
            campaignId={campaign.id}
            initialOptimizations={optimizations}
            initialScore={campaign.optimizer_score ?? null}
            initialSummary={campaign.optimizer_summary ?? null}
            initialStrengths={optimizerStrengths}
          />

          {/* 1. Producto */}
          <SectionCard icon={Package} title="1. Producto / Servicio" accent="bg-blue-500/5">
            <Row label="Nombre" value={campaign.product_name} />
            <Row label="Precio" value={campaign.product_price != null ? formatCurrency(campaign.product_price, campaign.product_currency ?? 'USD') : null} />
            <Row label="Categoría" value={campaign.product_category} />
            {campaign.product_description && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Descripción</p>
                <p className="text-xs text-foreground leading-relaxed">{campaign.product_description}</p>
              </div>
            )}
          </SectionCard>

          {/* 2. Copy */}
          <SectionCard
            icon={PenTool}
            title="2. Copy Publicitario"
            accent="bg-orange-500/5"
            action={
              !isEditingCopy ? (
                <button type="button" onClick={startCopyEdit} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                  <Edit2 className="size-3" />Editar
                </button>
              ) : (
                <button type="button" onClick={() => setIsEditingCopy(false)} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                  <X className="size-3" />Cancelar
                </button>
              )
            }
          >
            {isEditingCopy ? (
              <div className="space-y-3">
                {(['headline', 'body', 'description', 'cta'] as const).map((field) => {
                  const labels: Record<string, string> = { headline: 'Headline', body: 'Texto principal', description: 'Descripción', cta: 'CTA' }
                  const isMultiline = field === 'body'
                  return (
                    <div key={field}>
                      <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium block mb-1">{labels[field]}</label>
                      {isMultiline ? (
                        <textarea value={editCopy[field]} onChange={(e) => setEditCopy((p) => ({ ...p, [field]: e.target.value }))} rows={3} className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring resize-none text-foreground" />
                      ) : (
                        <input type="text" value={editCopy[field]} onChange={(e) => setEditCopy((p) => ({ ...p, [field]: e.target.value }))} className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring text-foreground" />
                      )}
                    </div>
                  )
                })}
                <Button size="sm" className="gap-1.5" onClick={saveCopyEdit} loading={isSavingCopy} disabled={isSavingCopy}>
                  <Save className="size-3" />Guardar cambios
                </Button>
              </div>
            ) : aiCopy ? (
              <div className="space-y-3">
                <CopyBlock label="Headline" value={aiCopy.headline} onCopy={() => copyText(aiCopy.headline, 'Headline')} />
                <CopyBlock label="Texto principal" value={aiCopy.body} onCopy={() => copyText(aiCopy.body, 'Texto principal')} />
                <CopyBlock label="Descripción" value={aiCopy.description} onCopy={() => copyText(aiCopy.description, 'Descripción')} />
                <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">CTA:</span>
                  <span className="rounded-full bg-brand text-white px-3 py-1 text-xs font-semibold">{aiCopy.cta}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No hay copy generado.</p>
            )}
          </SectionCard>

          {/* 3. Creativo */}
          <SectionCard icon={ImageIcon} title="3. Creativo / Imagen" accent="bg-pink-500/5">
            {displayCreativeUrl ? (
              <div className="space-y-3">
                <div className="relative rounded-lg overflow-hidden border border-border bg-muted/30 aspect-video max-h-52">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={displayCreativeUrl} alt="Creativo principal" className="w-full h-full object-contain" />
                  {primaryCreative?.variant_label && (
                    <div className="absolute top-2 left-2 rounded-full bg-brand/90 text-white px-2 py-0.5 text-[10px] font-semibold">
                      {primaryCreative.variant_label}
                    </div>
                  )}
                </div>
                {primaryCreative?.headline && (
                  <div className="rounded-lg bg-muted/40 px-3 py-2 space-y-1">
                    <p className="text-xs font-semibold text-foreground">{primaryCreative.headline}</p>
                    {primaryCreative.cta && (
                      <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand/10 text-brand">{primaryCreative.cta}</span>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Imagen generada por IA lista para usar en Meta Ads</p>
              </div>
            ) : (
              <div className="rounded-lg border-2 border-dashed border-border bg-muted/20 p-6 text-center">
                <ImageIcon className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Sin imagen asignada</p>
              </div>
            )}

            {/* Other variants */}
            {otherCreatives.length > 0 && (
              <div className="pt-3 border-t border-border/50 space-y-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                  Otras variantes ({otherCreatives.length})
                </p>
                <div className={cn('grid gap-2', otherCreatives.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
                  {otherCreatives.map((c) => (
                    <div key={c.id} className="rounded-lg overflow-hidden border border-border bg-muted/20">
                      <div className="aspect-video overflow-hidden bg-muted/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {c.image_url && <img src={c.image_url} alt={c.variant_label ?? 'Variante'} className="w-full h-full object-cover" />}
                      </div>
                      {c.variant_label && <p className="text-[10px] text-muted-foreground px-2 pb-1.5 pt-1">{c.variant_label}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Creative optimizer */}
            <CreativeOptimizerPanel campaign={campaign} />
          </SectionCard>

          {/* 4. Objetivo */}
          <SectionCard icon={Target} title="4. Objetivo de Campaña" accent="bg-green-500/5">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1.5 text-sm font-semibold">
                ✓ {objectiveLabel}
              </span>
            </div>
          </SectionCard>

          {/* 5. Audiencia */}
          <SectionCard icon={Users} title="5. Audiencia" accent="bg-purple-500/5">
            <Row label="Modo" value={campaign.audience_mode === 'ai' ? 'Generada por IA ✨' : 'Manual'} />
            <Row label="Edad" value={`${campaign.target_age_min ?? '—'} – ${campaign.target_age_max ?? '—'} años`} />
            <Row label="Género" value={genderLabel} />
            {interests && interests.length > 0 && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Intereses</p>
                <div className="flex flex-wrap gap-1.5">
                  {interests.map((i) => (
                    <span key={i} className="inline-flex items-center rounded-full bg-brand/10 text-brand px-2.5 py-0.5 text-xs font-medium">{i}</span>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          {/* 6. Segmentación */}
          <SectionCard icon={Globe} title="6. Segmentación Adicional" accent="bg-cyan-500/5">
            {(() => {
              const recs = campaign.ai_recommendations as string[] | null
              const langs = campaign.target_languages as string[] | null
              return (
                <>
                  <Row label="Idiomas" value={langs?.join(', ') ?? 'Español'} />
                  {recs && recs.length > 0 ? (
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Comportamientos detectados</p>
                      <div className="flex flex-wrap gap-1.5">
                        {recs.map((r) => (
                          <span key={r} className="inline-flex items-center rounded-full bg-muted text-muted-foreground px-2.5 py-0.5 text-xs">{r}</span>
                        ))}
                      </div>
                    </div>
                  ) : <p className="text-xs text-muted-foreground pt-1">Sin comportamientos adicionales</p>}
                </>
              )
            })()}
          </SectionCard>

          {/* 7. Presupuesto */}
          <SectionCard icon={DollarSign} title="7. Presupuesto" accent="bg-amber-500/5">
            <Row label="Presupuesto diario" value={campaign.daily_budget ? `${formatCurrency(campaign.daily_budget, currency)}/día` : null} />
            <Row label="Moneda" value={currency} />
            <Row label="Fecha de inicio" value={campaign.start_date ?? null} />
            <Row label="Fecha de fin" value={campaign.end_date ?? 'Sin fecha fin'} />
          </SectionCard>

          {/* 8. Ubicación */}
          <SectionCard icon={MapPin} title="8. Ubicación" accent="bg-slate-500/5">
            <Row label="País" value={countryLabel} />
            <Row label="Ciudad" value={campaign.target_city ?? 'Todo el país'} />
            <Row label="Radio" value={campaign.target_radius_km ? `${campaign.target_radius_km} km` : null} />
          </SectionCard>

          {/* 9. Vista previa */}
          <SectionCard icon={Eye} title="9. Vista Previa del Anuncio" accent="bg-indigo-500/5">
            <div className="rounded-xl border border-border bg-white dark:bg-zinc-900 overflow-hidden max-w-sm mx-auto">
              <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
                <div className="size-9 rounded-full bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center shrink-0">
                  <Megaphone className="size-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">Tu Negocio</p>
                  <p className="text-[10px] text-muted-foreground">Publicidad · <ExternalLink className="size-2.5 inline" /></p>
                </div>
              </div>
              <div className="px-3 pb-2">
                <p className="text-xs text-foreground leading-relaxed line-clamp-3">{aiCopy?.body ?? 'Texto del anuncio'}</p>
              </div>
              {displayCreativeUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={displayCreativeUrl} alt="preview" className="w-full aspect-video object-cover" />
              ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-brand/20 to-purple-500/20 flex items-center justify-center">
                  <ImageIcon className="size-10 text-brand/30" />
                </div>
              )}
              <div className="px-3 py-2.5 border-t border-border">
                <p className="text-xs font-semibold text-foreground">{aiCopy?.headline ?? 'Título del anuncio'}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{aiCopy?.description ?? ''}</p>
              </div>
              <div className="px-3 pb-3">
                <div className="rounded-md bg-muted text-center py-2">
                  <span className="text-xs font-semibold text-foreground">{aiCopy?.cta ?? 'Ver más'}</span>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Right sidebar */}
        <div className="lg:sticky lg:top-6 space-y-4">
          {/* Assembly AI Score (from campaign assembly) */}
          {campaign.campaign_score != null && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">Puntuación</h3>
                </div>
                <span className={cn('text-xl font-bold', scoreColor(campaign.campaign_score))}>
                  {campaign.campaign_score}<span className="text-xs font-normal text-muted-foreground">/100</span>
                </span>
              </div>
              <div className="p-4 space-y-3">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700',
                      campaign.campaign_score >= 75 ? 'bg-green-500' : campaign.campaign_score >= 50 ? 'bg-amber-500' : 'bg-red-400')}
                    style={{ width: `${campaign.campaign_score}%` }}
                  />
                </div>
                {scoreBreakdown && (
                  <div className="space-y-2 pt-1 border-t border-border/50">
                    {([
                      { label: 'Copy', key: 'copy', max: 25 },
                      { label: 'Audiencia', key: 'audience', max: 25 },
                      { label: 'Creativo', key: 'creative', max: 25 },
                      { label: 'Presupuesto', key: 'budget', max: 25 },
                    ] as const).map(({ label, key, max }) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-20 shrink-0">{label}</span>
                        <ScoreBar value={scoreBreakdown[key]} max={max} />
                        <span className="text-[10px] font-semibold text-foreground w-8 text-right shrink-0">
                          {scoreBreakdown[key]}/{max}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Checklist */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Lista de verificación</h3>
              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
                allPassed ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-muted text-muted-foreground'
              )}>
                {passCount}/{checklist.length}
              </span>
            </div>
            <div className="p-3 space-y-1.5">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-2.5 py-1">
                  {item.pass ? <CheckCircle2 className="size-4 text-green-500 shrink-0" /> : <XCircle className="size-4 text-muted-foreground/40 shrink-0" />}
                  <span className={cn('text-xs', item.pass ? 'text-foreground' : 'text-muted-foreground')}>{item.label}</span>
                </div>
              ))}
            </div>
            {!allPassed && (
              <div className="px-3 pb-3">
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 flex items-start gap-2">
                  <AlertCircle className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                    Completa todos los puntos para habilitar la publicación
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Publish */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Publicar en Meta Ads</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {allPassed ? 'Tu campaña está lista. Marca como pendiente y sigue las instrucciones.' : 'Completa los puntos de la lista antes de publicar.'}
              </p>
            </div>
            <Button className="w-full gap-2" onClick={handleMarkReady} loading={isPendingStatus} disabled={!allPassed || isPendingStatus}>
              <Megaphone className="size-4" />Publicar en Meta
            </Button>
            {allPassed && (
              <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-2.5 space-y-1.5">
                <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">Próximos pasos:</p>
                <ol className="space-y-1">
                  {[
                    'Hacer click en "Publicar en Meta"',
                    'Ir al Administrador de Anuncios de Meta',
                    'Crear nueva campaña con el objetivo seleccionado',
                    'Copiar el headline, texto y CTA desde esta página',
                    'Subir la imagen del creativo',
                    'Configurar la audiencia con los datos de segmentación',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-0.5 shrink-0">{i + 1}.</span>
                      <span className="text-[10px] text-blue-700 dark:text-blue-300 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Acciones rápidas</p>
            <Link href={`/campaigns/${campaign.id}/edit`} className="flex items-center gap-2.5 text-xs text-foreground hover:text-brand transition-colors py-1.5 border-b border-border/50">
              <Edit2 className="size-3.5 text-muted-foreground" />Editar campaña
            </Link>
            <Link href={`/campaigns/${campaign.id}`} className="flex items-center gap-2.5 text-xs text-foreground hover:text-brand transition-colors py-1.5 border-b border-border/50">
              <Eye className="size-3.5 text-muted-foreground" />Ver detalle completo
            </Link>
            <Link href="/campaigns" className="flex items-center gap-2.5 text-xs text-foreground hover:text-brand transition-colors py-1.5">
              <ArrowLeft className="size-3.5 text-muted-foreground" />Volver a campañas
            </Link>
          </div>

          {/* Status */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estado actual</p>
            <div className="flex items-center gap-2">
              <Clock className="size-3.5 text-muted-foreground" />
              <StatusBadge status={campaign.status} />
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {campaign.status === 'draft' && 'Borrador — guardado pero sin publicar en Meta.'}
              {campaign.status === 'pending' && 'Pendiente — lista para ser publicada en Meta manualmente.'}
              {campaign.status === 'active' && 'Activa — actualmente corriendo en Meta Ads.'}
              {campaign.status === 'paused' && 'Pausada — fue publicada pero está detenida.'}
              {campaign.status === 'completed' && 'Completada — campaña finalizada.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

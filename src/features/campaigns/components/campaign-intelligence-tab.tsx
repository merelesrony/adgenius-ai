'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Brain, Sparkles, Loader2, AlertTriangle, CheckCircle2, ChevronDown,
  ChevronUp, Zap, TrendingUp, Target, Users, Shield, Eye, Lightbulb,
  Clock, BarChart2, RefreshCw, Check, X, Info, AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { applyIntelligenceFixAction, getIntelligenceHistoryAction } from '@/features/campaigns/actions'
import type { CampaignIntelligenceResult, CampaignIntelligenceRecommendation } from '@/lib/ai/AIManager'
import type { CampaignAIReview } from '@/features/campaigns/intelligence/types'
import type { Database } from '@/types/database'

type CampaignRow = Database['public']['Tables']['campaigns']['Row']
type CreativeRow = Database['public']['Tables']['campaign_creatives']['Row']

interface Props {
  campaign: CampaignRow
  creatives?: CreativeRow[]
}

// ── Score helpers ─────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  if (s >= 80) return 'text-green-500'
  if (s >= 65) return 'text-amber-500'
  return 'text-red-400'
}

function scoreBg(s: number) {
  if (s >= 80) return 'bg-green-500'
  if (s >= 65) return 'bg-amber-500'
  return 'bg-red-400'
}

function scoreLabel(s: number) {
  if (s >= 85) return 'Excelente'
  if (s >= 70) return 'Bueno'
  if (s >= 50) return 'Regular'
  return 'Necesita mejoras'
}

function priorityBadge(p: string) {
  if (p === 'high') return 'bg-red-500/10 text-red-500 border-red-500/20'
  if (p === 'medium') return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
  return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
}

function priorityLabel(p: string) {
  if (p === 'high') return 'Alta'
  if (p === 'medium') return 'Media'
  return 'Baja'
}

function severityIcon(s: string) {
  if (s === 'error') return <AlertCircle className="size-4 text-red-400 shrink-0" />
  if (s === 'warning') return <AlertTriangle className="size-4 text-amber-400 shrink-0" />
  return <Info className="size-4 text-blue-400 shrink-0" />
}

function conversionLabel(p: string) {
  if (p === 'very_high') return 'Muy alta'
  if (p === 'high') return 'Alta'
  if (p === 'medium') return 'Media'
  return 'Baja'
}

function competitionLabel(c: string) {
  if (c === 'very_high') return 'Muy alta'
  if (c === 'high') return 'Alta'
  if (c === 'medium') return 'Media'
  return 'Baja'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreCircle({ score }: { score: number }) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative flex items-center justify-center size-36">
      <svg className="absolute inset-0 -rotate-90" width="144" height="144" viewBox="0 0 144 144">
        <circle cx="72" cy="72" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
        <circle
          cx="72" cy="72" r={radius} fill="none"
          stroke="currentColor" strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={scoreColor(score)}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="relative text-center">
        <p className={cn('text-4xl font-bold leading-none', scoreColor(score))}>{score}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">/ 100</p>
      </div>
    </div>
  )
}

function SubScoreBar({ label, score, icon: Icon }: { label: string; score: number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="size-3.5 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', scoreBg(score))}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={cn('text-xs font-semibold w-7 text-right', scoreColor(score))}>{score}</span>
    </div>
  )
}

function RecommendationCard({
  rec,
  campaignId,
  onApplied,
  onIgnored,
}: {
  rec: CampaignIntelligenceRecommendation
  campaignId: string
  onApplied: (id: string) => void
  onIgnored: (id: string) => void
}) {
  const router = useRouter()
  const [isApplying, startApplyTransition] = useTransition()

  function handleApply() {
    if (!rec.oneClickFix.available || !rec.oneClickFix.field || !rec.oneClickFix.value) return
    startApplyTransition(async () => {
      const result = await applyIntelligenceFixAction(
        campaignId,
        rec.oneClickFix.field!,
        rec.oneClickFix.value!,
      )
      if (result.success) {
        toast.success('Cambio aplicado correctamente')
        onApplied(rec.id)
        router.refresh()
      } else {
        toast.error(result.error ?? 'Error al aplicar el cambio')
      }
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full border', priorityBadge(rec.priority))}>
              {priorityLabel(rec.priority)}
            </span>
            <span className="text-[10px] text-muted-foreground capitalize">{rec.category}</span>
          </div>
          <p className="text-sm font-medium text-foreground">{rec.title}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{rec.description}</p>
        </div>
      </div>

      {rec.oneClickFix.available && rec.oneClickFix.value && (
        <div className="rounded-lg bg-brand/5 border border-brand/15 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-brand/70 font-medium mb-1">Fix automático disponible</p>
          <p className="text-xs text-foreground font-medium">&ldquo;{rec.oneClickFix.value}&rdquo;</p>
        </div>
      )}

      <div className="flex gap-2 pt-0.5">
        {rec.oneClickFix.available && (
          <Button
            size="sm"
            className="h-7 text-[11px] gap-1.5 bg-brand hover:bg-brand/90 text-white"
            onClick={handleApply}
            disabled={isApplying}
          >
            {isApplying ? <Loader2 className="size-3 animate-spin" /> : <Zap className="size-3" />}
            Aplicar automáticamente
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-[11px] text-muted-foreground gap-1"
          onClick={() => onIgnored(rec.id)}
        >
          <X className="size-3" />
          Ignorar
        </Button>
      </div>
    </div>
  )
}

function SkeletonPulse() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-6">
          <div className="size-36 rounded-full bg-muted/30" />
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-muted/30 rounded w-1/2" />
            <div className="h-3 bg-muted/20 rounded w-3/4" />
            <div className="h-3 bg-muted/20 rounded w-2/3" />
          </div>
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="h-3 bg-muted/30 rounded w-1/3" />
          <div className="h-3 bg-muted/20 rounded w-2/3" />
          <div className="h-3 bg-muted/20 rounded w-1/2" />
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function CampaignIntelligenceTab({ campaign }: Props) {
  const [result, setResult] = useState<CampaignIntelligenceResult | null>(null)
  const [isAnalyzing, startAnalysis] = useTransition()
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set())
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<CampaignAIReview[] | null>(null)
  const [isLoadingHistory, startHistoryTransition] = useTransition()

  const handleAnalyze = useCallback(() => {
    startAnalysis(async () => {
      try {
        const res = await fetch('/api/ai/campaign-intelligence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaignId: campaign.id }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Error desconocido' }))
          toast.error(err.error ?? 'Error al analizar la campaña')
          return
        }
        const data = await res.json() as CampaignIntelligenceResult
        setResult(data)
        setAppliedIds(new Set())
        setIgnoredIds(new Set())
        toast.success('Análisis completado')
      } catch {
        toast.error('Error de conexión. Intenta de nuevo.')
      }
    })
  }, [campaign.id])

  function loadHistory() {
    startHistoryTransition(async () => {
      const res = await getIntelligenceHistoryAction(campaign.id)
      if (res.success) setHistory(res.data ?? [])
      else toast.error(res.error ?? 'Error cargando historial')
    })
  }

  function toggleHistory() {
    if (!showHistory && !history) loadHistory()
    setShowHistory((v) => !v)
  }

  const visibleRecommendations = result?.recommendations.filter(
    (r) => !appliedIds.has(r.id) && !ignoredIds.has(r.id),
  ) ?? []

  // ── Empty state ────────────────────────────────────────────────────────────

  if (!result && !isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-6">
        <div className="size-20 rounded-2xl bg-gradient-to-br from-brand/10 to-purple-500/10 border border-brand/20 flex items-center justify-center">
          <Brain className="size-10 text-brand" />
        </div>
        <div className="space-y-2 max-w-md">
          <h3 className="text-lg font-semibold text-foreground">Campaign Intelligence</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            La IA analiza tu campaña como lo haría un especialista senior en Meta Ads: copy, audiencia, presupuesto, riesgos, y predicciones de rendimiento.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-left max-w-sm w-full">
          {[
            { icon: BarChart2, label: 'Score en 7 dimensiones' },
            { icon: Lightbulb, label: 'Recomendaciones con fix automático' },
            { icon: TrendingUp, label: 'Predicciones de alcance y CTR' },
            { icon: Shield, label: 'Detección de riesgos' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon className="size-3.5 text-brand/60 shrink-0" />
              {label}
            </div>
          ))}
        </div>
        <Button
          onClick={handleAnalyze}
          className="gap-2 bg-gradient-to-r from-brand to-purple-600 hover:from-brand/90 hover:to-purple-500 text-white px-6"
        >
          <Brain className="size-4" />
          Analizar campaña con IA
        </Button>
      </div>
    )
  }

  if (isAnalyzing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3">
          <Loader2 className="size-4 text-brand animate-spin shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Analizando tu campaña...</p>
            <p className="text-xs text-muted-foreground">El especialista IA está revisando cada elemento. Esto tarda unos segundos.</p>
          </div>
        </div>
        <SkeletonPulse />
      </div>
    )
  }

  if (!result) return null

  const { overallScore, subScores, findings, prediction, risks, coachAdvice, quickWins, summary } = result

  // ── Full results ──────────────────────────────────────────────────────────

  const subScoreItems = [
    { label: 'Visual / Creativo', score: subScores.visual, icon: Eye },
    { label: 'Copy y Texto', score: subScores.copy, icon: Target },
    { label: 'Audiencia', score: subScores.audience, icon: Users },
    { label: 'Presupuesto', score: subScores.budget, icon: BarChart2 },
    { label: 'Marca y Brand', score: subScores.brand, icon: Sparkles },
    { label: 'Conversión', score: subScores.conversion, icon: TrendingUp },
    { label: 'Best Practices Meta', score: subScores.metaBestPractices, icon: Shield },
  ]

  const highRisks = risks.filter((r) => r.severity === 'error')
  const warnings = risks.filter((r) => r.severity === 'warning')
  const infoRisks = risks.filter((r) => r.severity === 'info')

  return (
    <div className="space-y-4">

      {/* Re-analyze button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
        >
          <RefreshCw className="size-3" />
          Re-analizar
        </Button>
      </div>

      {/* ── Hero: Score + summary ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-gradient-to-r from-brand/5 to-purple-500/5">
          <Brain className="size-4 text-brand" />
          <h3 className="text-sm font-semibold text-foreground flex-1">Diagnóstico General</h3>
          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', scoreColor(overallScore), 'bg-current/10')}>
            {scoreLabel(overallScore)}
          </span>
        </div>
        <div className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ScoreCircle score={overallScore} />
            <div className="flex-1 space-y-3 w-full">
              {summary && (
                <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p>
              )}
              <div className="space-y-2 pt-1">
                {subScoreItems.map((item) => (
                  <SubScoreBar key={item.label} {...item} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Risks (shown early if any errors) ── */}
      {risks.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-red-500/5">
            <AlertTriangle className="size-4 text-red-400" />
            <h3 className="text-sm font-semibold text-foreground flex-1">Riesgos detectados</h3>
            <span className="text-xs text-muted-foreground">{risks.length} {risks.length === 1 ? 'riesgo' : 'riesgos'}</span>
          </div>
          <div className="p-4 space-y-2">
            {[...highRisks, ...warnings, ...infoRisks].map((risk) => (
              <div key={risk.id} className="flex items-start gap-3 py-1.5 border-b border-border/50 last:border-0">
                {severityIcon(risk.severity)}
                <div>
                  <p className="text-xs font-medium text-foreground">{risk.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{risk.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recommendations ── */}
      {visibleRecommendations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-brand" />
            <h3 className="text-sm font-semibold text-foreground">Recomendaciones</h3>
            <span className="text-xs text-muted-foreground ml-auto">
              {visibleRecommendations.length} activas
            </span>
          </div>
          {visibleRecommendations
            .sort((a, b) => {
              const order = { high: 0, medium: 1, low: 2 }
              return order[a.priority] - order[b.priority]
            })
            .map((rec) => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                campaignId={campaign.id}
                onApplied={(id) => setAppliedIds((s) => new Set([...s, id]))}
                onIgnored={(id) => setIgnoredIds((s) => new Set([...s, id]))}
              />
            ))}
          {appliedIds.size + ignoredIds.size > 0 && (
            <p className="text-[11px] text-muted-foreground text-center py-1">
              {appliedIds.size} aplicada{appliedIds.size !== 1 ? 's' : ''} · {ignoredIds.size} ignorada{ignoredIds.size !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* ── Findings ── */}
      {findings.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-muted/20">
            <Target className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground flex-1">Hallazgos del diagnóstico</h3>
          </div>
          <div className="divide-y divide-border/50">
            {findings.map((f) => (
              <div key={f.id} className="flex items-start gap-3 px-4 py-3">
                <span className={cn('shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border mt-0.5', priorityBadge(f.priority))}>
                  {priorityLabel(f.priority)}
                </span>
                <div>
                  <p className="text-xs font-medium text-foreground">{f.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Predictions ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-muted/20">
          <TrendingUp className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Predicciones estimadas</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div className="rounded-lg bg-muted/20 border border-border/50 p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Alcance diario</p>
              <p className="text-sm font-bold text-foreground">
                {prediction.estimatedReach.min.toLocaleString('es')}–{prediction.estimatedReach.max.toLocaleString('es')}
              </p>
              <p className="text-[10px] text-muted-foreground">{prediction.estimatedReach.label}</p>
            </div>
            <div className="rounded-lg bg-muted/20 border border-border/50 p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">CTR esperado</p>
              <p className="text-sm font-bold text-foreground">
                {prediction.expectedCTR.min}%–{prediction.expectedCTR.max}%
              </p>
            </div>
            <div className="rounded-lg bg-muted/20 border border-border/50 p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Prob. conversión</p>
              <p className="text-sm font-bold text-foreground">{conversionLabel(prediction.conversionProbability)}</p>
            </div>
            <div className="rounded-lg bg-muted/20 border border-border/50 p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Competencia</p>
              <p className="text-sm font-bold text-foreground">{competitionLabel(prediction.competitionLevel)}</p>
            </div>
          </div>
          {prediction.reasoning && (
            <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border/50 pt-3">{prediction.reasoning}</p>
          )}
        </div>
      </div>

      {/* ── Marketing Coach ── */}
      {coachAdvice && (
        <div className="rounded-xl border border-brand/20 bg-gradient-to-br from-brand/5 to-purple-500/5 overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-brand/15">
            <Lightbulb className="size-4 text-brand" />
            <h3 className="text-sm font-semibold text-foreground">¿Qué haría un experto?</h3>
            <span className="text-[10px] text-brand/70 bg-brand/10 px-2 py-0.5 rounded-full ml-auto font-medium">Marketing Coach IA</span>
          </div>
          <div className="px-4 py-4">
            <p className="text-sm text-foreground leading-relaxed italic">&ldquo;{coachAdvice}&rdquo;</p>
          </div>
        </div>
      )}

      {/* ── Quick Wins ── */}
      {quickWins.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-muted/20">
            <CheckCircle2 className="size-4 text-green-500" />
            <h3 className="text-sm font-semibold text-foreground">Quick Wins — Cambios rápidos</h3>
          </div>
          <ul className="divide-y divide-border/50">
            {quickWins.map((win, i) => (
              <li key={i} className="flex items-start gap-3 px-4 py-2.5">
                <Check className="size-3.5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-xs text-foreground leading-relaxed">{win}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── History ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <button
          type="button"
          onClick={toggleHistory}
          className="flex items-center gap-2.5 w-full px-4 py-3 text-left hover:bg-muted/20 transition-colors"
        >
          <Clock className="size-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground flex-1">Historial de análisis</span>
          {isLoadingHistory
            ? <Loader2 className="size-4 text-muted-foreground animate-spin" />
            : showHistory ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </button>

        {showHistory && (
          <div className="border-t border-border px-4 py-3">
            {isLoadingHistory && (
              <div className="text-xs text-muted-foreground text-center py-4">Cargando historial...</div>
            )}
            {!isLoadingHistory && (!history || history.length === 0) && (
              <p className="text-xs text-muted-foreground text-center py-4">Solo se muestra el análisis actual.</p>
            )}
            {!isLoadingHistory && history && history.length > 0 && (
              <div className="space-y-2">
                {history.map((h) => (
                  <div key={h.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(h.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {h.summary && <p className="text-[11px] text-foreground/60 line-clamp-1">{h.summary}</p>}
                    </div>
                    <span className={cn('text-sm font-bold', scoreColor(h.score))}>{h.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

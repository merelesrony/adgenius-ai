'use client'

import { useState } from 'react'
import { Sparkles, RefreshCw, AlertCircle, Brain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CopyEditor } from '../components/copy-editor'
import { CampaignScore } from '../components/campaign-score'
import { useWizard } from '../context'
import type { AIGenerateResult } from '../types'
import { cn } from '@/lib/utils'
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency'

export function StepAI() {
  const { data, update, next, back } = useWizard()
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    update({ isGenerating: true, generationError: null })
    setError(null)

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: data.productName,
          productDescription: data.productDescription,
          productCategory: data.productCategory,
          productPrice: data.productPrice,
          productCurrency: data.productCurrency,
          country: data.country,
          city: data.city || undefined,
          objective: data.objective,
          audienceMode: data.audienceMode,
          dailyBudget: data.dailyBudget,
          targetAgeMin: data.targetAgeMin,
          targetAgeMax: data.targetAgeMax,
          targetGender: data.targetGender,
          targetInterests: data.targetInterests,
          targetLanguages: data.targetLanguages,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error ?? 'Error generando el contenido')
      }

      const result = json as AIGenerateResult

      update({
        aiHeadline: result.headline,
        aiBodyCopy: result.body,
        aiDescription: result.description,
        aiCTA: result.cta,
        aiAudienceResult: result.audience ?? null,
        campaignScore: result.score,
        aiGenerated: true,
        isGenerating: false,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado'
      setError(msg)
      update({ isGenerating: false, generationError: msg })
    }
  }

  const canProceed = data.aiGenerated &&
    data.aiHeadline.trim() &&
    data.aiBodyCopy.trim() &&
    data.aiDescription.trim() &&
    data.aiCTA.trim()

  return (
    <div className="space-y-6">
      {/* Generate button */}
      {!data.aiGenerated ? (
        <div className="rounded-2xl border-2 border-dashed border-brand/30 bg-brand/5 p-8 text-center space-y-4">
          <div className="flex size-14 mx-auto items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/30">
            <Sparkles className="size-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Generar con IA
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              Claude analizará tu producto y creará el copy perfecto para tu campaña de Facebook Ads.
            </p>
          </div>

          {/* Context summary */}
          <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-background border border-border px-2.5 py-1">
              📦 {data.productName || '—'}
            </span>
            <span className="rounded-full bg-background border border-border px-2.5 py-1">
              🎯 {data.objective}
            </span>
            <span className="rounded-full bg-background border border-border px-2.5 py-1">
              🌍 {data.country}
            </span>
            {data.dailyBudget && (
              <span className="rounded-full bg-background border border-border px-2.5 py-1">
                💰 {formatCurrency(data.dailyBudget, data.productCurrency || DEFAULT_CURRENCY)}/día
              </span>
            )}
            <span className="rounded-full bg-background border border-border px-2.5 py-1">
              {data.audienceMode === 'ai' ? '🤖 Audiencia IA' : '👥 Audiencia Manual'}
            </span>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-left max-w-sm mx-auto">
              <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          <Button
            onClick={generate}
            loading={data.isGenerating}
            size="lg"
            className="shadow-md shadow-brand/20"
          >
            <Sparkles className="size-4" />
            {data.isGenerating ? 'Generando con IA...' : 'Generar copy con IA'}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Regenerate bar */}
          <div className="flex items-center justify-between rounded-lg bg-brand/5 border border-brand/20 p-3">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Sparkles className="size-4 text-brand" />
              <span className="font-medium">Contenido generado por IA</span>
              <span className="text-xs text-muted-foreground">— Puedes editar cualquier campo</span>
            </div>
            <button
              type="button"
              onClick={generate}
              disabled={data.isGenerating}
              className="flex items-center gap-1.5 text-xs font-medium text-brand hover:text-brand/80 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('size-3', data.isGenerating && 'animate-spin')} />
              Regenerar
            </button>
          </div>

          {/* Copy editor */}
          <CopyEditor
            headline={data.aiHeadline}
            body={data.aiBodyCopy}
            description={data.aiDescription}
            cta={data.aiCTA}
            onChange={(field, value) => update({ [field]: value })}
          />

          {/* AI Audience result */}
          {data.audienceMode === 'ai' && data.aiAudienceResult && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Brain className="size-4 text-brand" />
                <h4 className="text-sm font-semibold text-foreground">Audiencia definida por IA</h4>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Edad</p>
                  <p className="font-medium text-foreground">
                    {data.aiAudienceResult.ageMin}–{data.aiAudienceResult.ageMax} años
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Género</p>
                  <p className="font-medium text-foreground capitalize">
                    {data.aiAudienceResult.gender === 'all' ? 'Todos' :
                     data.aiAudienceResult.gender === 'male' ? 'Hombres' : 'Mujeres'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Intereses</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {data.aiAudienceResult.interests.map((interest) => (
                      <span
                        key={interest}
                        className="rounded-md bg-brand/10 text-brand px-2 py-0.5 text-xs font-medium"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
                {data.aiAudienceResult.explanation && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Razón</p>
                    <p className="text-xs text-foreground mt-0.5 italic">
                      &ldquo;{data.aiAudienceResult.explanation}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Campaign score */}
          {data.campaignScore && (
            <CampaignScore score={data.campaignScore} />
          )}
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={back}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
        >
          ← Anterior
        </button>
        {canProceed && (
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 transition-colors"
          >
            Revisar campaña →
          </button>
        )}
      </div>
    </div>
  )
}

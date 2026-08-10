'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import {
  CheckCircle2, XCircle, AlertTriangle, Clock,
  FlaskConical, RefreshCw, Loader2, ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { validateMetaCampaignAction } from '@/features/meta-publisher/actions'
import type { PreflightCheck, PreflightInput, PreflightResult } from '@/features/meta-publisher/preflight-types'

interface MetaPreflightCardProps {
  input: PreflightInput
}

export function MetaPreflightCard({ input }: MetaPreflightCardProps) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<PreflightResult | null>(null)

  function runCheck() {
    startTransition(async () => {
      const res = await validateMetaCampaignAction(input)
      setResult(res)
    })
  }

  // Auto-run on mount
  useEffect(() => {
    runCheck()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const failCount = result?.checks.filter(c => c.status === 'failed').length ?? 0
  const warnCount = result?.checks.filter(c => c.status === 'warning').length ?? 0

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-muted/30">
        <ShieldCheck className="size-4 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex-1">
          Verificación para publicar
        </span>
        {result?.dryRun && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
            <FlaskConical className="size-2.5" />
            Modo prueba
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Loading (first load only) */}
        {isPending && !result && (
          <div className="flex items-center gap-2.5 py-4 justify-center">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Verificando conexión con Meta...</span>
          </div>
        )}

        {/* Check list */}
        {result && (
          <div className="space-y-2">
            {result.checks.map(check => (
              <CheckRow key={check.key} check={check} />
            ))}
          </div>
        )}

        {/* Meta currency notice */}
        {result?.metaCurrency && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 px-3 py-2">
            <p className="text-[11px] text-blue-700 dark:text-blue-400">
              Moneda de Meta: <strong>{result.metaCurrency}</strong>.
              Tu campaña se publicará con esta moneda — sin conversión.
            </p>
          </div>
        )}

        {/* Summary banner */}
        {result && (
          <div className={cn(
            'rounded-lg px-3 py-2 flex items-center gap-2',
            result.valid
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/40'
              : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40',
          )}>
            {result.valid ? (
              <CheckCircle2 className="size-3.5 text-green-600 dark:text-green-400 shrink-0" />
            ) : (
              <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
            )}
            <p className={cn(
              'text-[11px] font-medium',
              result.valid
                ? 'text-green-700 dark:text-green-400'
                : 'text-amber-700 dark:text-amber-400',
            )}>
              {result.valid
                ? '¡Todo listo para publicar en Meta!'
                : `${failCount} problema${failCount !== 1 ? 's' : ''} por resolver${warnCount > 0 ? ` · ${warnCount} advertencia${warnCount !== 1 ? 's' : ''}` : ''}`}
            </p>
          </div>
        )}

        {/* Recheck button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full gap-1.5 text-xs"
          onClick={runCheck}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <RefreshCw className="size-3" />
          )}
          Reverificar
        </Button>
      </div>
    </div>
  )
}

function CheckRow({ check }: { check: PreflightCheck }) {
  return (
    <div className="flex items-start gap-2.5">
      <StatusIcon status={check.status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-xs font-medium text-foreground leading-snug">{check.label}</span>
          {check.message && check.status === 'passed' && (
            <span className="text-[10px] text-muted-foreground">— {check.message}</span>
          )}
        </div>
        {check.message && check.status !== 'passed' && check.status !== 'skipped' && (
          <p className={cn(
            'text-[11px] mt-0.5 leading-relaxed',
            check.status === 'failed' ? 'text-destructive/80' : 'text-amber-600 dark:text-amber-400',
          )}>
            {check.message}
          </p>
        )}
        {check.status === 'skipped' && check.message && (
          <p className="text-[10px] mt-0.5 text-muted-foreground/60">{check.message}</p>
        )}
        {check.actionPath && check.status === 'failed' && (
          <Link
            href={check.actionPath}
            className="inline-flex items-center gap-1 text-[10px] font-medium text-brand hover:underline mt-0.5"
          >
            Ir a configuración →
          </Link>
        )}
      </div>
    </div>
  )
}

function StatusIcon({ status }: { status: PreflightCheck['status'] }) {
  switch (status) {
    case 'passed':
      return <CheckCircle2 className="size-3.5 text-green-500 shrink-0 mt-0.5" />
    case 'failed':
      return <XCircle className="size-3.5 text-destructive shrink-0 mt-0.5" />
    case 'warning':
      return <AlertTriangle className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
    case 'skipped':
      return <Clock className="size-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />
  }
}

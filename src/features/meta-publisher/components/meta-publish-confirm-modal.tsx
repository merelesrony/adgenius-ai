'use client'

import { AlertTriangle, Rocket, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { formatCurrency } from '@/lib/currency'
import type { CampaignStrategy, GeneratedCreative } from '@/features/campaign-builder/types'

interface MetaPublishConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  isConfirming: boolean
  // Campaign data
  productName: string
  aiStrategy: CampaignStrategy | null
  dailyBudget: string
  currency: string
  metaCurrency?: string
  country: string
  city: string | null
  selectedCreative: GeneratedCreative | null
  // Connection data (from preflight)
  adAccountName?: string | null
  pageName?: string | null
}

export function MetaPublishConfirmModal({
  open, onClose, onConfirm, isConfirming,
  productName, aiStrategy, dailyBudget, currency, metaCurrency,
  country, city, selectedCreative,
  adAccountName, pageName,
}: MetaPublishConfirmModalProps) {
  const daily = parseFloat(dailyBudget) || 0
  const displayCurrency = metaCurrency ?? currency

  return (
    <Modal
      open={open}
      onClose={isConfirming ? () => {} : onClose}
      title="¿Publicar esta campaña?"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isConfirming}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={isConfirming} className="gap-2">
            {isConfirming ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Publicando...
              </>
            ) : (
              <>
                <Rocket className="size-4" />
                Sí, publicar campaña
              </>
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Warning */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-300/40 bg-amber-50/50 dark:bg-amber-900/10 p-3">
          <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            Esta acción creará una campaña real en Meta y puede generar gasto publicitario.
          </p>
        </div>

        {/* Details grid */}
        <div className="rounded-xl border border-border bg-muted/20 overflow-hidden divide-y divide-border/40">
          {adAccountName && (
            <ConfirmRow label="Cuenta publicitaria" value={adAccountName} />
          )}
          {pageName && (
            <ConfirmRow label="Página de Facebook" value={pageName} />
          )}
          <ConfirmRow label="Nombre de campaña" value={`${productName} — IA`} />
          {aiStrategy && (
            <ConfirmRow label="Objetivo" value={aiStrategy.objectiveLabel} />
          )}
          {daily > 0 && (
            <ConfirmRow
              label="Presupuesto diario"
              value={formatCurrency(daily, displayCurrency)}
              note={metaCurrency ? `en ${metaCurrency} (moneda de Meta)` : undefined}
            />
          )}
          <ConfirmRow label="Ubicación" value={`${country}${city ? `, ${city}` : ''}`} />
          {aiStrategy && (
            <ConfirmRow
              label="Audiencia"
              value={`${aiStrategy.audience.ageMin}–${aiStrategy.audience.ageMax} años · ${
                aiStrategy.audience.gender === 'all' ? 'todos' :
                aiStrategy.audience.gender === 'male' ? 'hombres' : 'mujeres'
              }`}
            />
          )}
          {selectedCreative && (
            <>
              <ConfirmRow label="Titular" value={selectedCreative.headline} />
              <ConfirmRow label="Texto" value={selectedCreative.primaryText} truncate />
              <ConfirmRow label="CTA" value={selectedCreative.cta} />
            </>
          )}
        </div>

        <p className="text-[10px] text-center text-muted-foreground/70">
          La campaña se creará en estado <strong>PAUSED</strong> — no se activará automáticamente.
        </p>
      </div>
    </Modal>
  )
}

function ConfirmRow({
  label,
  value,
  note,
  truncate = false,
}: {
  label: string
  value: string
  note?: string
  truncate?: boolean
}) {
  return (
    <div className="flex items-start gap-3 px-3 py-2.5">
      <span className="text-[11px] text-muted-foreground w-32 shrink-0 pt-px">{label}</span>
      <div className="flex-1 min-w-0">
        <span className={`text-[11px] font-medium text-foreground leading-snug ${truncate ? 'line-clamp-2' : ''}`}>
          {value}
        </span>
        {note && <p className="text-[10px] text-muted-foreground mt-0.5">{note}</p>}
      </div>
    </div>
  )
}

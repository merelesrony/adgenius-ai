'use client'

import { useState } from 'react'
import { DollarSign, Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { AudienceSelector } from '../components/audience-selector'
import { stepBudgetSchema } from '@/lib/validations/campaign'
import { useWizard } from '../context'

export function StepBudget() {
  const { data, update, next, back } = useWizard()
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleNext() {
    const result = stepBudgetSchema.safeParse({
      dailyBudget: data.dailyBudget,
      startDate: data.startDate,
      endDate: data.endDate || undefined,
      audienceMode: data.audienceMode,
      targetAgeMin: data.targetAgeMin,
      targetAgeMax: data.targetAgeMax,
      targetGender: data.targetGender,
      targetInterests: data.targetInterests,
      targetLanguages: data.targetLanguages,
    })

    if (!result.success) {
      const flat = result.error.flatten().fieldErrors
      setErrors(Object.fromEntries(
        Object.entries(flat).map(([k, v]) => [k, v?.[0] ?? ''])
      ))
      return
    }
    setErrors({})
    next()
  }

  return (
    <div className="space-y-6">
      {/* Budget */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <DollarSign className="size-4 text-brand" />
          Presupuesto diario
        </h3>

        <Input
          label="Presupuesto por día (USD)"
          type="number"
          placeholder="10.00"
          value={data.dailyBudget ?? ''}
          onChange={(e) => update({ dailyBudget: e.target.value ? Number(e.target.value) : null })}
          error={errors.dailyBudget}
          hint="Recomendado: mínimo $5/día para resultados estables."
          leftIcon={<DollarSign />}
          required
        />

        <div className="rounded-lg bg-brand/5 border border-brand/20 p-3 text-xs text-muted-foreground space-y-0.5">
          <p>💡 <strong className="text-foreground">$5–$15/día</strong> — Prueba y validación</p>
          <p>🚀 <strong className="text-foreground">$15–$50/día</strong> — Escala progresiva</p>
          <p>⚡ <strong className="text-foreground">$50+/día</strong> — Máximo alcance</p>
        </div>
      </div>

      {/* Dates */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Calendar className="size-4 text-brand" />
          Fechas de la campaña
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Fecha de inicio"
            type="date"
            value={data.startDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => update({ startDate: e.target.value })}
            error={errors.startDate}
            required
          />
          <Input
            label="Fecha de fin (opcional)"
            type="date"
            value={data.endDate ?? ''}
            min={data.startDate || new Date().toISOString().split('T')[0]}
            onChange={(e) => update({ endDate: e.target.value || null })}
            hint="Deja vacío para sin fecha de fin."
          />
        </div>
      </div>

      {/* Audience */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Audiencia objetivo</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            ¿Prefieres definirla tú o que la IA la optimice automáticamente?
          </p>
        </div>
        <AudienceSelector
          data={{
            audienceMode: data.audienceMode,
            targetAgeMin: data.targetAgeMin,
            targetAgeMax: data.targetAgeMax,
            targetGender: data.targetGender,
            targetInterests: data.targetInterests,
            targetLanguages: data.targetLanguages,
          }}
          onChange={update}
        />
      </div>

      {/* Footer */}
      <div className="pt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={back}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
        >
          ← Anterior
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 transition-colors"
        >
          Siguiente paso →
        </button>
      </div>
    </div>
  )
}

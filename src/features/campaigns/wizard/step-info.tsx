'use client'

import { useState } from 'react'
import { Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input, Select } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { COUNTRIES, CAMPAIGN_OBJECTIVES } from '@/constants/options'
import { stepInfoSchema } from '@/lib/validations/campaign'
import { useWizard } from '../context'

export function StepInfo() {
  const { data, update, next } = useWizard()
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleNext() {
    const result = stepInfoSchema.safeParse({
      name: data.name,
      objective: data.objective,
      country: data.country,
      city: data.city,
      radiusKm: data.radiusKm,
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
      {/* Campaign name */}
      <Input
        label="Nombre de la campaña"
        placeholder="Ej: Promo verano 2025 — Tienda Ropa"
        value={data.name}
        onChange={(e) => update({ name: e.target.value })}
        error={errors.name}
        hint="Nombre interno para identificar la campaña."
        required
        maxLength={100}
      />

      {/* Objective */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          Objetivo de la campaña <span className="text-destructive">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {CAMPAIGN_OBJECTIVES.map((obj) => {
            const active = data.objective === obj.value
            return (
              <button
                key={obj.value}
                type="button"
                onClick={() => update({ objective: obj.value })}
                className={cn(
                  'flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all',
                  active
                    ? 'border-brand bg-brand/5 shadow-sm'
                    : 'border-border hover:border-brand/40 hover:bg-muted/20',
                )}
              >
                <div className={cn(
                  'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg',
                  active ? 'bg-brand text-white' : 'bg-muted text-muted-foreground',
                )}>
                  <Target className="size-3.5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground leading-tight">{obj.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{obj.description}</p>
                </div>
              </button>
            )
          })}
        </div>
        {errors.objective && (
          <p className="text-xs text-destructive">{errors.objective}</p>
        )}
      </div>

      {/* Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="País objetivo"
          value={data.country}
          onChange={(e) => update({ country: e.target.value })}
          options={COUNTRIES}
          placeholder="Selecciona un país"
          error={errors.country}
          required
        />
        <Input
          label="Ciudad (opcional)"
          placeholder="Ej: Ciudad de México"
          value={data.city}
          onChange={(e) => update({ city: e.target.value })}
          hint="Deja vacío para apuntar a todo el país."
        />
      </div>

      {/* Radius */}
      <Slider
        label="Radio de alcance"
        min={5}
        max={200}
        step={5}
        value={data.radiusKm}
        onChange={(v) => update({ radiusKm: v })}
        formatValue={(v) => `${v} km`}
      />

      {/* Footer */}
      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={handleNext}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          Siguiente paso →
        </button>
      </div>
    </div>
  )
}

'use client'

import { Brain, Users, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RangeSlider } from '@/components/ui/slider'
import { TagsInput } from '@/components/ui/tags-input'
import { GENDER_OPTIONS, LANGUAGES } from '@/constants/options'
import type { WizardData } from '../types'

interface AudienceSelectorProps {
  data: Pick<WizardData,
    'audienceMode' | 'targetAgeMin' | 'targetAgeMax' |
    'targetGender' | 'targetInterests' | 'targetLanguages'
  >
  onChange: (partial: Partial<WizardData>) => void
}

export function AudienceSelector({ data, onChange }: AudienceSelectorProps) {
  const isManual = data.audienceMode === 'manual'

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange({ audienceMode: 'ai' })}
          className={cn(
            'relative flex flex-col items-start gap-1.5 rounded-xl border-2 p-4 text-left transition-all',
            !isManual
              ? 'border-brand bg-brand/5 shadow-sm'
              : 'border-border hover:border-brand/40 hover:bg-muted/30',
          )}
        >
          <div className={cn(
            'flex size-9 items-center justify-center rounded-lg',
            !isManual ? 'bg-brand text-white' : 'bg-muted text-muted-foreground',
          )}>
            <Brain className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Audiencia IA</p>
            <p className="text-xs text-muted-foreground">
              Claude analiza tu producto y define la audiencia ideal
            </p>
          </div>
          {!isManual && (
            <div className="absolute top-3 right-3 size-2 rounded-full bg-brand" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onChange({ audienceMode: 'manual' })}
          className={cn(
            'relative flex flex-col items-start gap-1.5 rounded-xl border-2 p-4 text-left transition-all',
            isManual
              ? 'border-brand bg-brand/5 shadow-sm'
              : 'border-border hover:border-brand/40 hover:bg-muted/30',
          )}
        >
          <div className={cn(
            'flex size-9 items-center justify-center rounded-lg',
            isManual ? 'bg-brand text-white' : 'bg-muted text-muted-foreground',
          )}>
            <Users className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Manual</p>
            <p className="text-xs text-muted-foreground">
              Configura tú mismo la audiencia objetivo
            </p>
          </div>
          {isManual && (
            <div className="absolute top-3 right-3 size-2 rounded-full bg-brand" />
          )}
        </button>
      </div>

      {/* AI mode info */}
      {!isManual && (
        <div className="flex items-start gap-3 rounded-lg bg-brand/5 border border-brand/20 p-4">
          <Brain className="size-4 text-brand mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">
              La IA configurará la audiencia automáticamente
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              En el siguiente paso, Claude analizará tu producto y definirá la edad,
              género, intereses e idiomas óptimos para maximizar el rendimiento del anuncio.
            </p>
          </div>
          <ChevronRight className="size-4 text-brand shrink-0 mt-0.5" />
        </div>
      )}

      {/* Manual mode controls */}
      {isManual && (
        <div className="space-y-5 p-4 rounded-xl border border-border bg-card">
          {/* Age range */}
          <RangeSlider
            label="Rango de edad"
            min={18}
            max={65}
            valueMin={data.targetAgeMin}
            valueMax={data.targetAgeMax}
            onChangeMin={(v) => onChange({ targetAgeMin: v })}
            onChangeMax={(v) => onChange({ targetAgeMax: v })}
            formatValue={(v) => `${v} años`}
          />

          {/* Gender */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Género</label>
            <div className="flex gap-2">
              {GENDER_OPTIONS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => onChange({ targetGender: g.value as WizardData['targetGender'] })}
                  className={cn(
                    'flex-1 rounded-lg border py-2 px-3 text-sm font-medium transition-all',
                    data.targetGender === g.value
                      ? 'border-brand bg-brand text-white'
                      : 'border-border text-foreground hover:border-brand/50',
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <TagsInput
            label="Intereses"
            value={data.targetInterests}
            onChange={(v) => onChange({ targetInterests: v })}
            placeholder="Ej: fitness, nutrición, yoga... (Enter para agregar)"
            hint="Escribe intereses relevantes para tu audiencia y presiona Enter"
            maxTags={15}
          />

          {/* Languages */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Idiomas</label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => {
                const selected = data.targetLanguages.includes(lang.value)
                return (
                  <button
                    key={lang.value}
                    type="button"
                    onClick={() => {
                      if (selected) {
                        onChange({ targetLanguages: data.targetLanguages.filter((l) => l !== lang.value) })
                      } else {
                        onChange({ targetLanguages: [...data.targetLanguages, lang.value] })
                      }
                    }}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-sm font-medium transition-all',
                      selected
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-border text-foreground hover:border-brand/40',
                    )}
                  >
                    {lang.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

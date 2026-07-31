'use client'

import { cn } from '@/lib/utils'
import { Input, Textarea } from '@/components/ui/input'

type CopyField = 'aiHeadline' | 'aiBodyCopy' | 'aiDescription' | 'aiCTA'

interface FieldMeta {
  label: string
  key: CopyField
  max: number
  component: 'input' | 'textarea'
  hint: string
}

interface CopyEditorProps {
  headline: string
  body: string
  description: string
  cta: string
  onChange: (field: CopyField, value: string) => void
  className?: string
}

const FIELDS: FieldMeta[] = [
  {
    label: 'Título del anuncio',
    key: 'aiHeadline',
    max: 40,
    component: 'input',
    hint: 'Texto principal en negrita. Máximo 40 caracteres.',
  },
  {
    label: 'Copy principal',
    key: 'aiBodyCopy',
    max: 280,
    component: 'textarea',
    hint: 'Texto persuasivo con beneficios clave. 100–250 caracteres recomendados.',
  },
  {
    label: 'Descripción',
    key: 'aiDescription',
    max: 90,
    component: 'input',
    hint: 'Texto secundario bajo el título. Máximo 90 caracteres.',
  },
  {
    label: 'Call to action',
    key: 'aiCTA',
    max: 30,
    component: 'input',
    hint: 'Botón de acción. Ej: Comprar Ahora, Más Información, Registrarse.',
  },
]

function CharCount({ value, max }: { value: string; max: number }) {
  const len = value.length
  const over = len > max
  const warn = !over && len > max * 0.85
  return (
    <span className={cn(
      'text-xs',
      over ? 'text-destructive font-medium' : warn ? 'text-amber-500' : 'text-muted-foreground',
    )}>
      {len}/{max}
    </span>
  )
}

export function CopyEditor({ headline, body, description, cta, onChange, className }: CopyEditorProps) {
  const values: Record<CopyField, string> = {
    aiHeadline: headline,
    aiBodyCopy: body,
    aiDescription: description,
    aiCTA: cta,
  }

  return (
    <div className={cn('space-y-4', className)}>
      {FIELDS.map((field) => {
        const value = values[field.key]
        const isOver = value.length > field.max
        const error = isOver ? `Excede el límite de ${field.max} caracteres` : undefined

        return (
          <div key={field.key} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{field.label}</span>
              <CharCount value={value} max={field.max} />
            </div>
            {field.component === 'textarea' ? (
              <Textarea
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                hint={field.hint}
                error={error}
                rows={3}
              />
            ) : (
              <Input
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                hint={field.hint}
                error={error}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

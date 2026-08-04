'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Save, ArrowLeft, Sparkles, Image as ImageIcon, X, ExternalLink } from 'lucide-react'
import type { Database } from '@/types/database'
import { Input, Select, Textarea } from '@/components/ui/input'
import { TagsInput } from '@/components/ui/tags-input'
import { Button } from '@/components/ui/button'
import { COUNTRIES, CAMPAIGN_OBJECTIVES, GENDER_OPTIONS } from '@/constants/options'
import { ImageUpload } from './image-upload'
import { updateCampaignAction } from '../actions'

type CampaignRow = Database['public']['Tables']['campaigns']['Row']
type AiCopy = { headline: string; body: string; description: string; cta: string }

interface EditCampaignFormProps {
  campaign: CampaignRow
}

const AUDIENCE_MODE_OPTIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'ai', label: 'Generada por IA' },
]

export function EditCampaignForm({ campaign }: EditCampaignFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const rawAiCopy = campaign.ai_copy as AiCopy | null

  // Basic
  const [name, setName] = useState(campaign.name)
  const [objective, setObjective] = useState(campaign.objective ?? 'sales')

  // Location
  const [country, setCountry] = useState(campaign.target_country ?? '')
  const [city, setCity] = useState(campaign.target_city ?? '')
  const [radius, setRadius] = useState(String(campaign.target_radius_km ?? 20))

  // Budget
  const [dailyBudget, setDailyBudget] = useState(
    campaign.daily_budget != null ? String(campaign.daily_budget) : '',
  )
  const [startDate, setStartDate] = useState(campaign.start_date ?? '')
  const [endDate, setEndDate] = useState(campaign.end_date ?? '')

  // Audience
  const [audienceMode, setAudienceMode] = useState<'manual' | 'ai'>(
    (campaign.audience_mode as 'manual' | 'ai' | null) ?? 'manual',
  )
  const [ageMin, setAgeMin] = useState(String(campaign.target_age_min ?? 18))
  const [ageMax, setAgeMax] = useState(String(campaign.target_age_max ?? 65))
  const [gender, setGender] = useState<'all' | 'male' | 'female'>(
    (campaign.target_gender as 'all' | 'male' | 'female' | null) ?? 'all',
  )
  const [interests, setInterests] = useState<string[]>(
    (campaign.target_interests as string[] | null) ?? [],
  )
  const [languages, setLanguages] = useState<string[]>(
    (campaign.target_languages as string[] | null) ?? ['es'],
  )

  // Creative
  const [flyerImages, setFlyerImages] = useState<string[]>(campaign.flyer_url ? [campaign.flyer_url] : [])

  // AI Copy
  const [headline, setHeadline] = useState(rawAiCopy?.headline ?? '')
  const [body, setBody] = useState(rawAiCopy?.body ?? '')
  const [description, setDescription] = useState(rawAiCopy?.description ?? '')
  const [cta, setCta] = useState(rawAiCopy?.cta ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const newFlyerUrl = flyerImages.length > 0 ? flyerImages[0] : null
      const result = await updateCampaignAction(campaign.id, {
        name,
        objective: objective as 'awareness' | 'traffic' | 'engagement' | 'leads' | 'sales',
        target_country: country,
        target_city: city.trim() || null,
        target_radius_km: Number(radius) || 20,
        daily_budget: dailyBudget ? Number(dailyBudget) : null,
        start_date: startDate || null,
        end_date: endDate || null,
        audience_mode: audienceMode,
        target_age_min: Number(ageMin) || 18,
        target_age_max: Number(ageMax) || 65,
        target_gender: gender,
        target_interests: interests,
        target_languages: languages,
        ai_copy: campaign.ai_generated
          ? { headline, body, description, cta }
          : null,
        flyer_url: newFlyerUrl,
      })
      if (result.success) {
        toast.success('Campaña actualizada')
        router.push('/campaigns')
      } else if (!result.success) {
        toast.error(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Link
            href="/campaigns"
            className="flex size-8 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors shrink-0"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Editar campaña</h1>
            <p className="text-sm text-muted-foreground mt-0.5 truncate max-w-xs">{campaign.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:shrink-0">
          <Link href="/campaigns">
            <Button type="button" variant="outline" size="sm" disabled={isPending}>
              Cancelar
            </Button>
          </Link>
          <Button type="submit" size="sm" disabled={isPending} loading={isPending} className="gap-2">
            <Save className="size-4" />
            Guardar cambios
          </Button>
        </div>
      </div>

      {/* Básico */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Información básica</h2>
        <Input
          label="Nombre de la campaña"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          placeholder="Ej: Campaña verano 2025"
        />
        <Select
          label="Objetivo"
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          options={CAMPAIGN_OBJECTIVES}
        />
      </div>

      {/* Ubicación */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Ubicación</h2>
        <Select
          label="País"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          options={COUNTRIES}
          required
        />
        <Input
          label="Ciudad / Zona"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Todo el país"
        />
        <Input
          label="Radio (km)"
          type="number"
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
          min={1}
          max={500}
          hint="Área de alcance geográfico en kilómetros"
        />
      </div>

      {/* Presupuesto */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Presupuesto</h2>
        <Input
          label={`Presupuesto diario (${campaign.currency ?? 'USD'})`}
          type="number"
          value={dailyBudget}
          onChange={(e) => setDailyBudget(e.target.value)}
          placeholder="Ej: 10"
          min={1}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Fecha de inicio"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="Fecha de fin"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Audiencia */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Audiencia</h2>
        <Select
          label="Modo de audiencia"
          value={audienceMode}
          onChange={(e) => setAudienceMode(e.target.value as 'manual' | 'ai')}
          options={AUDIENCE_MODE_OPTIONS}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Edad mínima"
            type="number"
            value={ageMin}
            onChange={(e) => setAgeMin(e.target.value)}
            min={18}
            max={64}
          />
          <Input
            label="Edad máxima"
            type="number"
            value={ageMax}
            onChange={(e) => setAgeMax(e.target.value)}
            min={19}
            max={65}
          />
        </div>
        <Select
          label="Género"
          value={gender}
          onChange={(e) => setGender(e.target.value as 'all' | 'male' | 'female')}
          options={GENDER_OPTIONS}
        />
        <TagsInput
          label="Intereses"
          value={interests}
          onChange={setInterests}
          placeholder="Escribe un interés y presiona Enter..."
          hint="Ej: fitness, nutrición, tecnología"
          maxTags={20}
        />
        <TagsInput
          label="Idiomas"
          value={languages}
          onChange={setLanguages}
          placeholder="Código de idioma y presiona Enter..."
          hint="Códigos de idioma: es, en, pt, fr, it, de"
          maxTags={6}
        />
      </div>

      {/* Creativo / Imagen */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ImageIcon className="size-4 text-muted-foreground" />
            Creativo / Imagen
          </h2>
          <Link
            href="/products?tab=studio"
            className="text-xs text-brand hover:underline flex items-center gap-1"
            target="_blank"
            rel="noopener noreferrer"
          >
            Generar con IA en Creative Studio
            <ExternalLink className="size-3" />
          </Link>
        </div>

        {flyerImages.length > 0 && (
          <div className="relative rounded-xl overflow-hidden border border-border bg-muted/30 aspect-video max-h-52">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={flyerImages[0]}
              alt="Creativo actual"
              className="w-full h-full object-contain"
            />
            <button
              type="button"
              onClick={() => setFlyerImages([])}
              className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-destructive transition-colors"
              title="Quitar imagen"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        <ImageUpload
          images={flyerImages}
          onChange={setFlyerImages}
          userId={campaign.user_id}
          maxImages={1}
        />

        <p className="text-xs text-muted-foreground">
          Sube una imagen o genera una con IA desde el{' '}
          <Link href="/products?tab=studio" className="text-brand hover:underline" target="_blank">
            Creative Studio
          </Link>{' '}
          y luego asígnala a esta campaña desde la Biblioteca de Creativos.
        </p>
      </div>

      {/* Copy IA */}
      {campaign.ai_generated && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="size-4 text-brand" />
            Copy generado por IA
          </h2>
          <Input
            label="Título (headline)"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            maxLength={40}
            hint="Máximo 40 caracteres"
            placeholder="Ej: ¡Oferta imperdible!"
          />
          <Textarea
            label="Copy principal (body)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            hint="100–250 caracteres recomendados"
            placeholder="Texto persuasivo del anuncio..."
          />
          <Input
            label="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={90}
            hint="Máximo 90 caracteres"
            placeholder="Ej: Descubre nuestra oferta exclusiva"
          />
          <Input
            label="CTA (llamada a la acción)"
            value={cta}
            onChange={(e) => setCta(e.target.value)}
            placeholder="Ej: Comprar Ahora"
          />
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end gap-3 pb-6">
        <Link href="/campaigns">
          <Button type="button" variant="outline" disabled={isPending}>
            Cancelar
          </Button>
        </Link>
        <Button type="submit" disabled={isPending} loading={isPending} className="gap-2">
          <Save className="size-4" />
          Guardar cambios
        </Button>
      </div>
    </form>
  )
}

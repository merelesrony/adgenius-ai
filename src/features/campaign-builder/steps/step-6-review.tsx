'use client'

import { useState, useEffect } from 'react'
import type { ComponentType } from 'react'
import {
  Package, DollarSign, MapPin, Target, CheckCircle, Info,
  ExternalLink, Sparkles, Pencil, X, Save, Users, Lightbulb,
  MessageSquare, TrendingUp, AlertCircle, RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCampaignBuilder } from '../context'
import { META_PLATFORMS, BUILDER_STEPS } from '../constants'
import { formatCurrency } from '@/lib/currency'
import { COUNTRIES } from '@/constants/options'
import type { CampaignStrategy, AudienceStrategy } from '../types'

// ── Shared section wrapper ────────────────────────────────────────────────────

function ReviewSection({
  title,
  icon: Icon,
  badge,
  editLabel,
  onEdit,
  isEditing,
  children,
}: {
  title: string
  icon: ComponentType<{ className?: string }>
  badge?: React.ReactNode
  editLabel?: string
  onEdit?: () => void
  isEditing?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-muted/30">
        <Icon className="size-4 text-muted-foreground shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex-1">
          {title}
        </span>
        {badge}
        {onEdit && !isEditing && (
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="size-3" />
            {editLabel ?? 'Editar'}
          </button>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  )
}

function EditActions({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  return (
    <div className="flex gap-2 pt-3 border-t border-border/40 mt-3">
      <Button variant="outline" size="sm" onClick={onCancel} className="gap-1.5 flex-1">
        <X className="size-3.5" /> Cancelar
      </Button>
      <Button size="sm" onClick={onSave} className="gap-1.5 flex-1">
        <Save className="size-3.5" /> Guardar
      </Button>
    </div>
  )
}

// ── Gender labels ─────────────────────────────────────────────────────────────

const GENDER_LABELS: Record<AudienceStrategy['gender'], string> = {
  all: 'Todos',
  male: 'Hombres',
  female: 'Mujeres',
}

// ── Main component ────────────────────────────────────────────────────────────

export function Step6Review() {
  const { state, dispatch } = useCampaignBuilder()
  const {
    productMode, selectedProduct, productName, productDescription,
    dailyBudget, currency, totalBudget,
    country, city, radius, platforms, aiStrategy,
  } = state

  // Local draft mirrors aiStrategy — edits stay client-side until save is implemented
  const [draft, setDraft] = useState<CampaignStrategy | null>(null)

  useEffect(() => {
    if (aiStrategy) setDraft({ ...aiStrategy, audience: { ...aiStrategy.audience } })
  }, [aiStrategy])

  // Section edit modes
  type EditSection = 'copy' | 'audience' | 'creative'
  const [editing, setEditing] = useState<EditSection | null>(null)

  // Temp edit buffers (initialized when section opens)
  const [editCopy, setEditCopy] = useState({
    headline: '', primaryText: '', description: '', recommendedCTA: '', objectiveLabel: '',
  })
  const [editAudience, setEditAudience] = useState({
    ageMin: 18, ageMax: 65, gender: 'all' as AudienceStrategy['gender'],
    interests: '', behaviors: '',
  })
  const [editCreative, setEditCreative] = useState({ style: '', format: '', concept: '' })

  function openEdit(section: EditSection) {
    if (!draft) return
    if (section === 'copy') {
      setEditCopy({
        headline: draft.headline,
        primaryText: draft.primaryText,
        description: draft.description,
        recommendedCTA: draft.recommendedCTA,
        objectiveLabel: draft.objectiveLabel,
      })
    } else if (section === 'audience') {
      setEditAudience({
        ageMin: draft.audience.ageMin,
        ageMax: draft.audience.ageMax,
        gender: draft.audience.gender,
        interests: draft.audience.interests.join(', '),
        behaviors: draft.audience.behaviors.join(', '),
      })
    } else if (section === 'creative') {
      setEditCreative({
        style: draft.creativeDirection.style,
        format: draft.creativeDirection.format,
        concept: draft.creativeDirection.concept,
      })
    }
    setEditing(section)
  }

  function saveEdit(section: EditSection) {
    if (!draft) return
    if (section === 'copy') {
      setDraft({
        ...draft,
        headline: editCopy.headline || draft.headline,
        primaryText: editCopy.primaryText || draft.primaryText,
        description: editCopy.description || draft.description,
        recommendedCTA: editCopy.recommendedCTA || draft.recommendedCTA,
        objectiveLabel: editCopy.objectiveLabel || draft.objectiveLabel,
      })
    } else if (section === 'audience') {
      setDraft({
        ...draft,
        audience: {
          ...draft.audience,
          ageMin: editAudience.ageMin,
          ageMax: editAudience.ageMax,
          gender: editAudience.gender,
          interests: editAudience.interests.split(',').map((s) => s.trim()).filter(Boolean),
          behaviors: editAudience.behaviors.split(',').map((s) => s.trim()).filter(Boolean),
        },
      })
    } else if (section === 'creative') {
      setDraft({
        ...draft,
        creativeDirection: {
          style: editCreative.style || draft.creativeDirection.style,
          format: editCreative.format || draft.creativeDirection.format,
          concept: editCreative.concept || draft.creativeDirection.concept,
        },
      })
    }
    setEditing(null)
  }

  // Derived display values
  const daily = parseFloat(dailyBudget) || 0
  const total = parseFloat(totalBudget) || 0
  const selectedCountry = COUNTRIES.find((c) => c.value === country)

  const displayProductName =
    productMode === 'existing' || productMode === 'ai'
      ? selectedProduct?.name ?? '—'
      : productName || '—'

  const displayProduct = (productMode === 'existing' || productMode === 'ai') ? selectedProduct : null

  const inputCls = 'w-full rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'
  const labelCls = 'text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block font-semibold'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-success/10 mx-auto">
          <CheckCircle className="size-7 text-success" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Revisión de tu campaña</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Revisa y ajusta los detalles antes de guardar
          </p>
        </div>
      </div>

      {/* Completed steps badges */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {BUILDER_STEPS.filter((s) => s.id !== 6).map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20"
          >
            <CheckCircle className="size-2.5" />
            {s.label}
          </span>
        ))}
      </div>

      {/* ── Producto ── */}
      <ReviewSection title="Producto" icon={Package}>
        {displayProduct && (
          <div className="flex items-center gap-3 pb-3 mb-1 border-b border-border/40">
            <div className="size-12 rounded-lg bg-muted/60 overflow-hidden shrink-0 border border-border/40">
              {displayProduct.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={displayProduct.image} alt={displayProduct.name} className="size-full object-cover" />
              ) : (
                <div className="size-full flex items-center justify-center">
                  <Package className="size-5 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{displayProduct.name}</p>
              {displayProduct.category && (
                <p className="text-xs text-muted-foreground">{displayProduct.category}</p>
              )}
              {displayProduct.price !== null && (
                <p className="text-xs font-semibold text-brand mt-0.5">
                  {formatCurrency(displayProduct.price, displayProduct.currency ?? 'USD')}
                </p>
              )}
            </div>
          </div>
        )}
        <ReviewRow label="Nombre" value={displayProductName} />
        {productMode === 'manual' && productDescription && (
          <ReviewRow
            label="Descripción"
            value={<span className="text-xs text-muted-foreground line-clamp-2">{productDescription}</span>}
          />
        )}
      </ReviewSection>

      {/* ── AI Strategy sections (when available) ── */}
      {!aiStrategy && (
        <div className="rounded-xl border border-amber-300/40 bg-amber-50/50 dark:bg-amber-900/10 p-4 flex items-start gap-3">
          <AlertCircle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Estrategia IA no disponible</p>
            <p className="text-xs text-muted-foreground">
              Regresa al paso anterior para generar la estrategia.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => dispatch({ type: 'PREV_STEP' })}
              className="gap-2 mt-1"
            >
              <RefreshCw className="size-3.5" />
              Volver a generar
            </Button>
          </div>
        </div>
      )}

      {draft && (
        <>
          {/* ── Objetivo ── */}
          <ReviewSection
            title="Objetivo"
            icon={TrendingUp}
            badge={
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
                IA
              </span>
            }
          >
            <div className="flex items-center gap-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{draft.objectiveLabel}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  CTA recomendado: <span className="font-semibold text-foreground">{draft.recommendedCTA}</span>
                </p>
              </div>
            </div>
          </ReviewSection>

          {/* ── Copy / Anuncio ── */}
          <ReviewSection
            title="Anuncio"
            icon={MessageSquare}
            badge={
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
                IA
              </span>
            }
            onEdit={() => openEdit('copy')}
            isEditing={editing === 'copy'}
          >
            {editing === 'copy' ? (
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Título (máx. 40 chars)</label>
                  <input type="text" value={editCopy.headline} maxLength={40}
                    onChange={(e) => setEditCopy((p) => ({ ...p, headline: e.target.value }))}
                    className={inputCls}
                  />
                  <p className="text-[10px] text-muted-foreground text-right mt-0.5">{editCopy.headline.length}/40</p>
                </div>
                <div>
                  <label className={labelCls}>Texto principal</label>
                  <textarea value={editCopy.primaryText} rows={4} maxLength={500}
                    onChange={(e) => setEditCopy((p) => ({ ...p, primaryText: e.target.value }))}
                    className={cn(inputCls, 'resize-none')}
                  />
                </div>
                <div>
                  <label className={labelCls}>Descripción (máx. 90 chars)</label>
                  <input type="text" value={editCopy.description} maxLength={90}
                    onChange={(e) => setEditCopy((p) => ({ ...p, description: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>CTA</label>
                  <input type="text" value={editCopy.recommendedCTA}
                    onChange={(e) => setEditCopy((p) => ({ ...p, recommendedCTA: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <EditActions onSave={() => saveEdit('copy')} onCancel={() => setEditing(null)} />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Título</p>
                  <p className="text-sm font-bold text-foreground">{draft.headline}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Texto principal</p>
                  <p className="text-sm text-foreground leading-relaxed">{draft.primaryText}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Descripción</p>
                  <p className="text-sm text-muted-foreground">{draft.description}</p>
                </div>
                <div className="flex items-center justify-between py-1.5 border-t border-border/40">
                  <span className="text-xs text-muted-foreground">CTA</span>
                  <span className="text-sm font-semibold text-brand">{draft.recommendedCTA}</span>
                </div>
              </div>
            )}
          </ReviewSection>

          {/* ── Audiencia ── */}
          <ReviewSection
            title="Audiencia"
            icon={Users}
            badge={
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
                IA
              </span>
            }
            onEdit={() => openEdit('audience')}
            isEditing={editing === 'audience'}
          >
            {editing === 'audience' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className={labelCls}>Edad mín.</label>
                    <input type="number" value={editAudience.ageMin} min={13} max={65}
                      onChange={(e) => setEditAudience((p) => ({ ...p, ageMin: +e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Edad máx.</label>
                    <input type="number" value={editAudience.ageMax} min={13} max={65}
                      onChange={(e) => setEditAudience((p) => ({ ...p, ageMax: +e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Género</label>
                    <select value={editAudience.gender}
                      onChange={(e) => setEditAudience((p) => ({ ...p, gender: e.target.value as AudienceStrategy['gender'] }))}
                      className={inputCls}
                    >
                      <option value="all">Todos</option>
                      <option value="male">Hombres</option>
                      <option value="female">Mujeres</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Intereses (separados por coma)</label>
                  <textarea value={editAudience.interests} rows={2}
                    onChange={(e) => setEditAudience((p) => ({ ...p, interests: e.target.value }))}
                    className={cn(inputCls, 'resize-none')}
                    placeholder="moda, belleza, perfumes..."
                  />
                </div>
                <div>
                  <label className={labelCls}>Comportamientos (separados por coma)</label>
                  <textarea value={editAudience.behaviors} rows={2}
                    onChange={(e) => setEditAudience((p) => ({ ...p, behaviors: e.target.value }))}
                    className={cn(inputCls, 'resize-none')}
                    placeholder="compradores en línea, viajeros frecuentes..."
                  />
                </div>
                <EditActions onSave={() => saveEdit('audience')} onCancel={() => setEditing(null)} />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-3">
                  <div className="rounded-lg bg-muted/50 border border-border px-3 py-2 text-center min-w-[80px]">
                    <p className="text-[10px] text-muted-foreground">Edad</p>
                    <p className="text-sm font-bold text-foreground">{draft.audience.ageMin}–{draft.audience.ageMax}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 border border-border px-3 py-2 text-center min-w-[80px]">
                    <p className="text-[10px] text-muted-foreground">Género</p>
                    <p className="text-sm font-bold text-foreground">{GENDER_LABELS[draft.audience.gender]}</p>
                  </div>
                </div>
                {draft.audience.interests.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Intereses</p>
                    <div className="flex flex-wrap gap-1.5">
                      {draft.audience.interests.map((i) => (
                        <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">{i}</span>
                      ))}
                    </div>
                  </div>
                )}
                {draft.audience.behaviors.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Comportamientos</p>
                    <div className="flex flex-wrap gap-1.5">
                      {draft.audience.behaviors.map((b) => (
                        <span key={b} className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">{b}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ReviewSection>

          {/* ── Presupuesto ── */}
          <ReviewSection title="Presupuesto" icon={DollarSign}>
            <ReviewRow
              label="Tu inversión diaria"
              value={daily > 0 ? <span className="text-brand font-bold">{formatCurrency(daily, currency)}</span> : '—'}
            />
            {total > 0 && (
              <ReviewRow label="Presupuesto total" value={formatCurrency(total, currency)} />
            )}
            <ReviewRow label="Moneda" value={currency} />
            {draft.budgetRecommendation.reason && (
              <div className="mt-2 pt-2 border-t border-border/40">
                <div className="flex items-start gap-2">
                  <Sparkles className="size-3.5 text-brand shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {draft.budgetRecommendation.reason}
                  </p>
                </div>
              </div>
            )}
          </ReviewSection>

          {/* ── Dirección Creativa ── */}
          <ReviewSection
            title="Dirección creativa"
            icon={Lightbulb}
            badge={
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
                IA
              </span>
            }
            onEdit={() => openEdit('creative')}
            isEditing={editing === 'creative'}
          >
            {editing === 'creative' ? (
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Estilo visual</label>
                  <input type="text" value={editCreative.style}
                    onChange={(e) => setEditCreative((p) => ({ ...p, style: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Formato</label>
                  <input type="text" value={editCreative.format}
                    onChange={(e) => setEditCreative((p) => ({ ...p, format: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Concepto</label>
                  <textarea value={editCreative.concept} rows={3}
                    onChange={(e) => setEditCreative((p) => ({ ...p, concept: e.target.value }))}
                    className={cn(inputCls, 'resize-none')}
                  />
                </div>
                <EditActions onSave={() => saveEdit('creative')} onCancel={() => setEditing(null)} />
              </div>
            ) : (
              <div className="space-y-2.5">
                <ReviewRow label="Estilo" value={draft.creativeDirection.style} />
                <ReviewRow label="Formato" value={draft.creativeDirection.format} />
                <div className="pt-1.5">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Concepto</p>
                  <p className="text-sm text-foreground leading-relaxed">{draft.creativeDirection.concept}</p>
                </div>
              </div>
            )}
          </ReviewSection>
        </>
      )}

      {/* ── Ubicación ── */}
      <ReviewSection title="Ubicación" icon={MapPin}>
        <ReviewRow label="País" value={selectedCountry?.label ?? country ?? '—'} />
        <ReviewRow label="Ciudad" value={city || 'Todo el país'} />
        <ReviewRow label="Radio" value={`${radius} km`} />
      </ReviewSection>

      {/* ── Plataformas ── */}
      <ReviewSection title="Plataformas Meta" icon={Target}>
        {platforms.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin plataformas seleccionadas</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {platforms.map((id) => {
              const p = META_PLATFORMS.find((m) => m.id === id)
              return p ? (
                <span key={id} className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-brand/10 text-brand border border-brand/20">
                  {p.label}
                </span>
              ) : null
            })}
          </div>
        )}
      </ReviewSection>

      {/* Manual publishing notice */}
      <div className="rounded-xl border border-amber-300/40 bg-amber-50/50 dark:bg-amber-900/10 p-4">
        <div className="flex items-start gap-3">
          <Info className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Publicación manual requerida</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              La publicación en Meta Ads Manager es completamente manual. Usa los datos
              generados para configurar tu campaña directamente.
            </p>
            <a
              href="https://www.facebook.com/adsmanager"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-brand hover:underline mt-1"
            >
              Abrir Meta Ads Manager
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Save CTA */}
      <div className="flex justify-center pt-1">
        <Button
          onClick={() => toast.info('Guardar campaña estará disponible próximamente.')}
          className="gap-2 px-8"
        >
          Guardar campaña
        </Button>
      </div>
    </div>
  )
}

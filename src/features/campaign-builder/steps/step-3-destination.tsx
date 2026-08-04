'use client'

import { MapPin, Globe } from 'lucide-react'
import { useCampaignBuilder } from '../context'
import { COUNTRIES } from '@/constants/options'

export function Step3Destination() {
  const { state, dispatch } = useCampaignBuilder()
  const { country, city, radius } = state
  const radiusNum = parseInt(radius, 10) || 20
  const selectedCountry = COUNTRIES.find((c) => c.value === country)

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1.5">
        <h2 className="text-xl font-semibold text-foreground">¿Dónde quieres anunciar?</h2>
        <p className="text-sm text-muted-foreground">
          Define el área geográfica donde aparecerán tus anuncios
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        {/* Country */}
        <div>
          <label className="text-xs font-medium text-foreground mb-1.5 block">
            País <span className="text-destructive">*</span>
          </label>
          <select
            value={country}
            onChange={(e) => dispatch({ type: 'SET_COUNTRY', payload: e.target.value })}
            className="w-full py-2.5 px-3 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Selecciona un país</option>
            {COUNTRIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label className="text-xs font-medium text-foreground mb-1.5 block">
            Ciudad / Zona
            <span className="text-muted-foreground font-normal ml-1">(opcional)</span>
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => dispatch({ type: 'SET_CITY', payload: e.target.value })}
            placeholder="Todo el país"
            className="w-full rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2.5 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Radius slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-foreground">Radio de alcance</label>
            <span className="text-sm font-bold text-brand">{radiusNum} km</span>
          </div>
          <input
            type="range"
            value={radiusNum}
            onChange={(e) => dispatch({ type: 'SET_RADIUS', payload: e.target.value })}
            min={1}
            max={200}
            step={1}
            className="w-full h-1.5 rounded-full bg-muted accent-brand cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>1 km</span>
            <span>100 km</span>
            <span>200 km</span>
          </div>
        </div>
      </div>

      {/* Location summary */}
      {country && (
        <div className="rounded-xl border border-brand/20 bg-brand/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-full bg-brand/10 text-brand shrink-0">
              <MapPin className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {city ? `${city}, ` : ''}{selectedCountry?.label ?? country}
              </p>
              <p className="text-xs text-muted-foreground">
                Radio de {radiusNum} km · Segmentación geográfica activa
              </p>
            </div>
            <Globe className="size-4 text-muted-foreground/40 shrink-0" />
          </div>
        </div>
      )}
    </div>
  )
}

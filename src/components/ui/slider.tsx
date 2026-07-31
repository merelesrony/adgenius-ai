'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SliderProps {
  min: number
  max: number
  step?: number
  value: number
  onChange: (value: number) => void
  label?: string
  formatValue?: (v: number) => string
  className?: string
  disabled?: boolean
}

export function Slider({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  formatValue,
  className,
  disabled,
}: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">{label}</label>
          <span className="text-sm font-semibold text-brand">
            {formatValue ? formatValue(value) : value}
          </span>
        </div>
      )}
      <div className="relative flex items-center h-5">
        <div className="absolute w-full h-1.5 rounded-full bg-muted">
          <div
            className="absolute h-full rounded-full bg-brand transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cn(
            'relative w-full h-1.5 appearance-none bg-transparent cursor-pointer',
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4',
            '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand',
            '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background',
            '[&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer',
            '[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110',
            '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4',
            '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-brand',
            '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background',
            '[&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatValue ? formatValue(min) : min}</span>
        <span>{formatValue ? formatValue(max) : max}</span>
      </div>
    </div>
  )
}

interface RangeSliderProps {
  min: number
  max: number
  step?: number
  valueMin: number
  valueMax: number
  onChangeMin: (v: number) => void
  onChangeMax: (v: number) => void
  label?: string
  formatValue?: (v: number) => string
  className?: string
}

export function RangeSlider({
  min,
  max,
  step = 1,
  valueMin,
  valueMax,
  onChangeMin,
  onChangeMax,
  label,
  formatValue,
  className,
}: RangeSliderProps) {
  const fmt = formatValue ?? ((v: number) => String(v))

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">{label}</label>
          <span className="text-sm font-semibold text-brand">
            {fmt(valueMin)} — {fmt(valueMax)}
          </span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Slider
          min={min}
          max={valueMax - step}
          step={step}
          value={valueMin}
          onChange={onChangeMin}
          label="Mín"
          formatValue={formatValue}
        />
        <Slider
          min={valueMin + step}
          max={max}
          step={step}
          value={valueMax}
          onChange={onChangeMax}
          label="Máx"
          formatValue={formatValue}
        />
      </div>
    </div>
  )
}

'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagsInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  label?: string
  error?: string
  hint?: string
  maxTags?: number
  className?: string
}

export function TagsInput({
  value,
  onChange,
  placeholder = 'Escribe y presiona Enter...',
  label,
  error,
  hint,
  maxTags = 20,
  className,
}: TagsInputProps) {
  const [input, setInput] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase()
    if (!tag || value.includes(tag) || value.length >= maxTags) return
    onChange([...value, tag])
    setInput('')
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  const id = React.useId()

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-foreground"
        >
          {label}
          {maxTags && (
            <span className="ml-1.5 text-xs text-muted-foreground font-normal">
              ({value.length}/{maxTags})
            </span>
          )}
        </label>
      )}

      <div
        className={cn(
          'flex flex-wrap gap-1.5 min-h-[42px] w-full rounded-lg border bg-background px-3 py-2',
          'transition-colors focus-within:ring-2 focus-within:ring-brand/20 focus-within:border-brand',
          error ? 'border-destructive' : 'border-border',
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-brand/10 text-brand px-2 py-0.5 text-xs font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
              className="hover:text-brand/70 transition-colors"
              aria-label={`Eliminar ${tag}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (input.trim()) addTag(input) }}
          placeholder={value.length === 0 ? placeholder : ''}
          disabled={value.length >= maxTags}
          className="flex-1 min-w-24 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:cursor-not-allowed"
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

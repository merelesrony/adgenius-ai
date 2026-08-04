'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-2xl',
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}: ModalProps) {
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    // Mobile: items-end (bottom sheet), Desktop sm+: items-center (centered dialog)
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={cn(
          'relative z-10 w-full bg-card border border-border shadow-xl animate-fade-in',
          // Layout: flex column so header/footer stay sticky
          'flex flex-col',
          // Mobile: bottom-sheet — rounded top only, taller limit
          'rounded-t-2xl max-h-[95dvh]',
          // Desktop: centered dialog — all corners rounded, shorter limit
          'sm:rounded-lg sm:max-h-[85vh]',
          sizeMap[size],
          className,
        )}
      >
        {/* Header — shrink-0 so it never scrolls */}
        {(title || description) && (
          <div className="shrink-0 flex items-start justify-between p-5 border-b border-border">
            <div className="space-y-1 min-w-0 pr-2">
              {title && (
                <h2 id="modal-title" className="text-base font-semibold text-card-foreground">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Body — flex-1 + overflow-y-auto: content scrolls here */}
        <div className="flex-1 overflow-y-auto min-h-0 p-5 overscroll-contain">
          {children}
        </div>

        {/* Footer — shrink-0 so it stays pinned at the bottom */}
        {footer && (
          <div className="shrink-0 flex items-center justify-end gap-3 px-5 py-4 border-t border-border bg-card rounded-b-2xl sm:rounded-b-lg">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

interface ModalFooterProps {
  children: React.ReactNode
  className?: string
}

// ModalFooter is kept for backward compat with other modals that don't need the sticky pattern
export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn('flex items-center justify-end gap-3 pt-4 border-t border-border mt-4', className)}>
      {children}
    </div>
  )
}

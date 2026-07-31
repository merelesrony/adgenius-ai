import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-brand text-brand-foreground',
        secondary: 'border-transparent bg-muted text-muted-foreground',
        outline: 'border-border text-foreground',
        destructive: 'border-transparent bg-destructive/15 text-destructive border-destructive/20',
        success: 'border-transparent bg-success/15 text-success border-success/20',
        warning: 'border-transparent bg-warning/15 text-warning border-warning/20',
        info: 'border-transparent bg-brand/10 text-brand border-brand/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'size-1.5 rounded-full',
            variant === 'success' && 'bg-success',
            variant === 'destructive' && 'bg-destructive',
            variant === 'warning' && 'bg-warning',
            (variant === 'default' || !variant) && 'bg-brand-foreground',
            variant === 'secondary' && 'bg-muted-foreground',
            variant === 'info' && 'bg-brand',
          )}
        />
      )}
      {children}
    </div>
  )
}

// Status badge for subscriptions/campaigns
const statusVariantMap: Record<string, BadgeProps['variant']> = {
  active: 'success',
  inactive: 'secondary',
  trial: 'warning',
  cancelled: 'destructive',
  draft: 'secondary',
  pending: 'warning',
  paused: 'secondary',
  completed: 'info',
  failed: 'destructive',
}

const statusLabelMap: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  trial: 'Prueba',
  cancelled: 'Cancelado',
  draft: 'Borrador',
  pending: 'Pendiente',
  paused: 'Pausado',
  completed: 'Completado',
  failed: 'Fallido',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={statusVariantMap[status] ?? 'secondary'} dot>
      {statusLabelMap[status] ?? status}
    </Badge>
  )
}

export { Badge, badgeVariants, StatusBadge }

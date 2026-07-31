import * as React from 'react'
import { cn } from '@/lib/utils'

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border border-border bg-card text-card-foreground shadow-sm',
        className
      )}
      {...props}
    />
  )
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-5 pb-0', className)} {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('font-semibold leading-none tracking-tight text-base', className)}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-5', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-5 pt-0', className)} {...props} />
  )
)
CardFooter.displayName = 'CardFooter'

// ─── StatCard ─────────────────────────────────────────────────────────────────

type IconColor = 'default' | 'blue' | 'purple' | 'indigo' | 'green' | 'red' | 'yellow'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  iconColor?: IconColor
  trend?: { value: number; label: string }
  className?: string
}

const iconColorMap: Record<IconColor, { bg: string; text: string }> = {
  default: { bg: 'bg-muted',                              text: 'text-muted-foreground' },
  blue:    { bg: 'bg-blue-50 dark:bg-blue-900/20',        text: 'text-blue-600 dark:text-blue-400' },
  purple:  { bg: 'bg-purple-50 dark:bg-purple-900/20',    text: 'text-purple-600 dark:text-purple-400' },
  indigo:  { bg: 'bg-brand/10',                           text: 'text-brand' },
  green:   { bg: 'bg-emerald-50 dark:bg-emerald-900/20',  text: 'text-emerald-600 dark:text-emerald-400' },
  red:     { bg: 'bg-red-50 dark:bg-red-900/20',          text: 'text-red-600 dark:text-red-400' },
  yellow:  { bg: 'bg-amber-50 dark:bg-amber-900/20',      text: 'text-amber-600 dark:text-amber-400' },
}

function StatCard({
  title,
  value,
  description,
  icon,
  iconColor = 'indigo',
  trend,
  className,
}: StatCardProps) {
  const colors = iconColorMap[iconColor]

  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card p-5',
        'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200',
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        {icon && (
          <div
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-xl [&_svg]:size-5',
              colors.bg
            )}
          >
            <span className={colors.text}>{icon}</span>
          </div>
        )}
        {trend && (
          <span
            className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-full',
              trend.value >= 0
                ? 'bg-success/10 text-success'
                : 'bg-destructive/10 text-destructive'
            )}
          >
            {trend.value >= 0 ? '+' : ''}
            {trend.value}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
      <p className="text-sm font-medium text-muted-foreground mt-0.5">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground/70 mt-0.5">{description}</p>
      )}
    </div>
  )
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  StatCard,
}

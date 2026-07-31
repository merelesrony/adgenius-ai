'use client'

import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { Button, buttonVariants } from './button'
import { cn } from '@/lib/utils'

interface ActionConfig {
  label: string
  href?: string
  onClick?: () => void
}

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ActionConfig
  secondaryAction?: ActionConfig
  className?: string
}

function ActionButton({ label, href, onClick }: ActionConfig) {
  if (href) {
    return (
      <Link href={href} className={buttonVariants({ size: 'sm' })}>
        {label}
      </Link>
    )
  }
  return (
    <Button size="sm" onClick={onClick}>
      {label}
    </Button>
  )
}

function SecondaryActionButton({ label, href, onClick }: ActionConfig) {
  if (href) {
    return (
      <Link href={href} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
        {label}
      </Link>
    )
  }
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      {label}
    </Button>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-6',
        className
      )}
    >
      {Icon && (
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-muted mb-4">
          <Icon className="size-7 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {secondaryAction && <SecondaryActionButton {...secondaryAction} />}
          {action && <ActionButton {...action} />}
        </div>
      )}
    </div>
  )
}

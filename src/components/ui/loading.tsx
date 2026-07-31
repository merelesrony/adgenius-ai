import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-8',
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <Loader2
      className={cn('animate-spin text-brand', sizeMap[size], className)}
      aria-label="Cargando"
    />
  )
}

interface LoadingProps {
  message?: string
  fullPage?: boolean
  className?: string
}

export function Loading({ message = 'Cargando...', fullPage, className }: LoadingProps) {
  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center justify-center gap-2 py-8', className)}>
      <Spinner />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  )
}

// Skeleton loading
interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      aria-hidden="true"
    />
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-lg" />
    </div>
  )
}

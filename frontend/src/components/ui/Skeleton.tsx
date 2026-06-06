import { type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

// ─── Skeleton ──────────────────────────────────────────────────────────────

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  aspect?: string  // e.g. "16/9" or "square"
}

export function Skeleton({
  rounded = 'xl',
  aspect,
  className,
  style,
  ...props
}: SkeletonProps) {
  const roundedMap = {
    sm:   'rounded',
    md:   'rounded-md',
    lg:   'rounded-lg',
    xl:   'rounded-xl',
    '2xl':'rounded-2xl',
    full: 'rounded-full',
  }

  return (
    <div
      className={cn(
        'shimmer bg-surface-container-high',
        roundedMap[rounded],
        className,
      )}
      style={{
        ...(aspect ? { aspectRatio: aspect } : {}),
        ...style,
      }}
      {...props}
    />
  )
}

// ─── Card Skeleton Presets ─────────────────────────────────────────────────

export function StatCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-4 flex flex-col gap-3">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-9 w-24" />
      <Skeleton className="h-2.5 w-16" />
    </div>
  )
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton className="h-14 w-14 shrink-0" rounded="xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-2.5 w-1/2" />
      </div>
      <Skeleton className="h-5 w-16" rounded="full" />
    </div>
  )
}

export function PageSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {Array.from({ length: count }, (_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className="h-3"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  )
}

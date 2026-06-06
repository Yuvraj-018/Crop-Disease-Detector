import { type ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { Button } from './Button'

// ─── EmptyState ────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?:       ReactNode
  title:       string
  description?:string
  action?:     { label: string; onClick: () => void }
  className?:  string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 py-16 px-6 text-center',
        className,
      )}
    >
      {icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container-high text-on-surface-variant/40">
          {icon}
        </div>
      )}
      <div className="space-y-1.5 max-w-xs">
        <p className="text-title-md font-heading font-semibold text-on-surface">{title}</p>
        {description && (
          <p className="text-body-md text-on-surface-variant">{description}</p>
        )}
      </div>
      {action && (
        <Button
          onClick={action.onClick}
          variant="secondary"
          size="sm"
          className="mt-2"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

// ─── Leaf Empty Icon (crop-themed) ────────────────────────────────────────

export function LeafEmptyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-10 w-10', className)}
    >
      <path
        d="M24 6C14 6 8 14 8 24c0 5.5 2.5 10.5 6.5 14 2-8 6-14 9.5-14 3.5 0 7.5 6 9.5 14 4-3.5 6.5-8.5 6.5-14 0-10-6-18-16-18z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.4"
      />
      <path
        d="M24 24v16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.3"
      />
    </svg>
  )
}

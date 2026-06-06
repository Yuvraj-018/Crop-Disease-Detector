import { type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'
import type { Severity } from '../../styles/tokens'
import { severityConfig } from '../../styles/tokens'

// ─── Generic Badge ─────────────────────────────────────────────────────────

type BadgeVariant = 'default' | 'neon' | 'emerald' | 'amber' | 'orange' | 'red' | 'gray'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  dot?: boolean
  pulse?: boolean
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30',
  neon:    'bg-primary/10 text-primary border-primary/25',
  emerald: 'bg-emerald/10 text-emerald border-emerald/25',
  amber:   'bg-yellow-400/10 text-yellow-400 border-yellow-400/25',
  orange:  'bg-orange-400/10 text-orange-400 border-orange-400/25',
  red:     'bg-error/10 text-error border-error/25',
  gray:    'bg-outline/10 text-on-surface-variant border-outline/20',
}

export function Badge({
  variant = 'default',
  dot = false,
  pulse = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5',
        'text-label-sm font-label uppercase tracking-widest',
        'border',
        badgeVariants[variant],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full shrink-0',
            pulse && 'animate-pulse-glow',
            variant === 'neon'    && 'bg-primary',
            variant === 'emerald' && 'bg-emerald',
            variant === 'amber'   && 'bg-yellow-400',
            variant === 'orange'  && 'bg-orange-400',
            variant === 'red'     && 'bg-error',
            variant === 'gray'    && 'bg-on-surface-variant',
            variant === 'default' && 'bg-outline',
          )}
        />
      )}
      {children}
    </span>
  )
}

// ─── Severity Badge ────────────────────────────────────────────────────────

interface SeverityBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  severity: Severity
  pulse?: boolean
  showDot?: boolean
}

export function SeverityBadge({
  severity,
  pulse = false,
  showDot = true,
  className,
  ...props
}: SeverityBadgeProps) {
  const config = severityConfig[severity]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5',
        'text-label-sm font-label uppercase tracking-widest border',
        config.tailwind,
        className,
      )}
      style={{ boxShadow: config.glow }}
      {...props}
    >
      {showDot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full shrink-0',
            pulse && severity === 'healthy' && 'animate-pulse-glow',
          )}
          style={{ backgroundColor: config.color }}
        />
      )}
      {config.label}
    </span>
  )
}

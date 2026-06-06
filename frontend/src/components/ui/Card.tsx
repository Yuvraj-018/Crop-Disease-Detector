import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/utils'

// ─── GlassCard ─────────────────────────────────────────────────────────────

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Main glass variant */
  variant?: 'default' | 'heavy' | 'light' | 'solid' | 'neon'
  /** Size of internal padding */
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  /** Show neon inner-glow border */
  glow?: boolean
  /** Animated float */
  float?: boolean
  /** Optional header section above the main content */
  header?: ReactNode
  /** Optional footer section */
  footer?: ReactNode
}

const cardVariants: Record<NonNullable<CardProps['variant']>, string> = {
  default: 'glass',
  heavy:   'glass-heavy',
  light:   'glass-light',
  solid:   'bg-surface-container-high border border-white/[0.05]',
  neon:    'glass border-neon',
}

const cardPaddings: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm:   'p-3',
  md:   'p-4',
  lg:   'p-5',
  xl:   'p-6',
}

export function Card({
  variant = 'default',
  padding = 'md',
  glow = false,
  float = false,
  header,
  footer,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl overflow-hidden',
        cardVariants[variant],
        glow && 'shadow-neon-sm',
        float && 'animate-float-slow',
        className,
      )}
      {...props}
    >
      {header && (
        <div className="px-5 pt-5 pb-0">{header}</div>
      )}
      <div className={cardPaddings[padding]}>{children}</div>
      {footer && (
        <div className="px-5 pb-5 pt-0">{footer}</div>
      )}
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────

interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label:    string
  value:    string | number
  subValue?: string
  icon?:    ReactNode
  trend?:   { value: number; label: string }
  glow?:    'neon' | 'emerald' | 'error' | 'none'
  accent?:  string  // CSS color for value text
}

export function StatCard({
  label,
  value,
  subValue,
  icon,
  trend,
  glow = 'none',
  accent,
  className,
  ...props
}: StatCardProps) {
  const glowClasses: Record<NonNullable<StatCardProps['glow']>, string> = {
    neon:    'shadow-neon-sm border-primary/20',
    emerald: 'shadow-emerald-sm border-emerald/20',
    error:   'shadow-critical border-error/20',
    none:    '',
  }

  const defaultAccent =
    glow === 'neon'    ? '#3fff8b' :
    glow === 'emerald' ? '#10B981' :
    glow === 'error'   ? '#ff716c' :
    '#f9fdf7'

  const valueColor = accent ?? defaultAccent

  return (
    <div
      className={cn(
        'glass rounded-2xl p-4 flex flex-col gap-3',
        glow !== 'none' && glowClasses[glow],
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <p className="text-label-sm text-on-surface-variant font-label uppercase tracking-widest">
          {label}
        </p>
        {icon && (
          <div className="text-on-surface-variant/60 h-8 w-8 flex items-center justify-center rounded-xl bg-surface-container-highest/60">
            {icon}
          </div>
        )}
      </div>

      <div>
        <p
          className="text-display-sm font-heading font-bold leading-none"
          style={{ color: valueColor }}
        >
          {value}
        </p>
        {subValue && (
          <p className="mt-1 text-body-sm text-on-surface-variant">{subValue}</p>
        )}
      </div>

      {trend && (
        <div className={cn(
          'flex items-center gap-1 text-label-sm font-label',
          trend.value >= 0 ? 'text-primary' : 'text-error',
        )}>
          <span>{trend.value >= 0 ? '↑' : '↓'}</span>
          <span>{Math.abs(trend.value)}%</span>
          <span className="text-on-surface-variant font-normal">{trend.label}</span>
        </div>
      )}
    </div>
  )
}

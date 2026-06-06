import { type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'
import type { Severity } from '../../styles/tokens'

// ─── ProgressBar ───────────────────────────────────────────────────────────

interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value:        number  // 0–100
  max?:         number
  label?:       string
  showValue?:   boolean
  size?:        'xs' | 'sm' | 'md' | 'lg'
  color?:       'neon' | 'emerald' | 'amber' | 'orange' | 'red' | 'auto'
  severity?:    Severity
  animated?:    boolean
}

const colorMap: Record<string, string> = {
  neon:    'bg-primary from-primary/80 to-primary',
  emerald: 'bg-emerald from-emerald/80 to-emerald',
  amber:   'bg-yellow-400 from-yellow-500/80 to-yellow-400',
  orange:  'bg-orange-400 from-orange-500/80 to-orange-400',
  red:     'bg-error from-error/80 to-error',
}

const severityColorMap: Record<Severity, string> = {
  healthy:  colorMap.neon,
  low:      colorMap.emerald,
  medium:   colorMap.amber,
  high:     colorMap.orange,
  critical: colorMap.red,
}

const sizeMap = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  size = 'md',
  color = 'neon',
  severity,
  animated = true,
  className,
  ...props
}: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100)

  const barColor =
    severity
      ? severityColorMap[severity]
      : color === 'auto' && pct > 75
      ? colorMap.neon
      : color === 'auto' && pct > 40
      ? colorMap.amber
      : color === 'auto'
      ? colorMap.red
      : colorMap[color] ?? colorMap.neon

  return (
    <div className={cn('w-full', className)} {...props}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-label-sm text-on-surface-variant font-label">{label}</span>
          )}
          {showValue && (
            <span className="text-label-sm font-label text-on-surface">{Math.round(pct)}%</span>
          )}
        </div>
      )}

      <div
        className={cn(
          'w-full rounded-full bg-surface-container-highest overflow-hidden',
          sizeMap[size],
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out-expo',
            barColor,
            animated && 'animate-progress-bar',
          )}
          style={{
            width: `${pct}%`,
            '--progress-width': `${pct}%`,
          } as React.CSSProperties}
        />
      </div>
    </div>
  )
}

// ─── Confidence Meter (Ring) ───────────────────────────────────────────────

interface ConfidenceMeterProps {
  value:    number  // 0–100
  size?:    number  // px diameter
  strokeWidth?: number
  label?:   string
  className?: string
}

export function ConfidenceMeter({
  value,
  size = 96,
  strokeWidth = 8,
  label,
  className,
}: ConfidenceMeterProps) {
  const radius = (size - strokeWidth) / 2
  const circ   = 2 * Math.PI * radius
  const offset = circ - (value / 100) * circ

  // Color by value
  const color =
    value >= 80 ? '#3fff8b' :
    value >= 60 ? '#10B981' :
    value >= 40 ? '#fbbf24' :
    '#ff716c'

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#212722"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{
              filter: `drop-shadow(0 0 6px ${color}80)`,
              transition: 'stroke-dashoffset 1.2s ease-out',
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-title-lg font-heading font-bold leading-none"
            style={{ color }}
          >
            {Math.round(value)}%
          </span>
        </div>
      </div>

      {label && (
        <p className="text-label-sm text-on-surface-variant font-label">{label}</p>
      )}
    </div>
  )
}

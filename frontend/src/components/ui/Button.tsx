import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/utils'

// ─── Types ─────────────────────────────────────────────────────────────────

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  children?: ReactNode
}

// ─── Styles ────────────────────────────────────────────────────────────────

const base =
  'inline-flex items-center justify-center gap-2 rounded-pill font-label font-semibold ' +
  'tracking-wide transition-all duration-200 ease-out-expo select-none ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface ' +
  'disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]'

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-on-primary ' +
    'hover:bg-primary-container hover:shadow-neon-sm ' +
    'active:bg-primary-dim',

  secondary:
    'bg-transparent text-on-surface border border-outline-variant/40 ' +
    'hover:border-primary/40 hover:text-primary hover:shadow-neon-sm/20 ' +
    'hover:bg-primary/5',

  ghost:
    'bg-transparent text-on-surface-variant ' +
    'hover:bg-surface-container-high hover:text-on-surface',

  danger:
    'bg-error/10 text-error border border-error/25 ' +
    'hover:bg-error/20 hover:shadow-critical',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-4 text-label-sm gap-1.5',
  md: 'h-11 px-6 text-label-md',
  lg: 'h-14 px-8 text-label-lg',
}

// ─── Spinner ───────────────────────────────────────────────────────────────

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

// ─── Component ─────────────────────────────────────────────────────────────

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          base,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {loading ? (
          <>
            <Spinner className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
            {children}
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <span className="shrink-0">{icon}</span>
            )}
            {children}
            {icon && iconPosition === 'right' && (
              <span className="shrink-0">{icon}</span>
            )}
          </>
        )}
      </button>
    )
  },
)

Button.displayName = 'Button'

import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/utils'

// ─── Types ─────────────────────────────────────────────────────────────────

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  hint?: string
  leftAddon?: ReactNode
  rightAddon?: ReactNode
  /** If true, renders the floating-label variant */
  floating?: boolean
}

// ─── Eye Icon ─────────────────────────────────────────────────────────────

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7S3.732 16.057 2.458 12z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7 .835-2.664 2.614-4.891 4.981-6.22M6.71 6.71A9.955 9.955 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.964 9.964 0 01-4.337 5.35M4 4l16 16" />
    </svg>
  )
}

// ─── Component ─────────────────────────────────────────────────────────────

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftAddon,
      rightAddon,
      floating = false,
      type = 'text',
      className,
      id,
      disabled,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    const inputBase = cn(
      'w-full bg-surface-container-lowest rounded-xl px-4 py-3 text-body-md text-on-surface',
      'border border-outline-variant/30 transition-all duration-200',
      'placeholder:text-on-surface-variant/50',
      'focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30',
      'focus:shadow-[0_0_0_3px_rgba(0,230,118,0.08)]',
      error && 'border-error/50 focus:border-error/70 focus:ring-error/20',
      disabled && 'opacity-40 cursor-not-allowed',
      leftAddon && 'pl-10',
      (rightAddon || isPassword) && 'pr-10',
      className,
    )

    return (
      <div className="w-full">
        {label && !floating && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-label-md text-on-surface-variant mb-1.5 font-label uppercase tracking-wider',
              error && 'text-error',
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          {/* Left addon slot */}
          {leftAddon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              {leftAddon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={inputType}
            disabled={disabled}
            className={inputBase}
            {...props}
          />

          {/* Right addon or password toggle */}
          {(rightAddon || isPassword) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              {isPassword ? (
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="hover:text-on-surface transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon open={showPassword} />
                </button>
              ) : (
                rightAddon
              )}
            </div>
          )}
        </div>

        {/* Error / Hint */}
        {error ? (
          <p className="mt-1.5 text-body-sm text-error flex items-center gap-1">
            <svg className="h-3 w-3 shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 9.5a.75.75 0 010-1.5.75.75 0 010 1.5zm.75-3.75a.75.75 0 01-1.5 0V5.25a.75.75 0 011.5 0v1.5z" />
            </svg>
            {error}
          </p>
        ) : hint ? (
          <p className="mt-1.5 text-body-sm text-on-surface-variant">{hint}</p>
        ) : null}
      </div>
    )
  },
)

Input.displayName = 'Input'

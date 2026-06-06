import { Link, type To } from 'react-router-dom'
import { type ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface AuthLayoutProps {
  children:     ReactNode
  title:        string
  subtitle?:    string
  footerText?:  string
  footerLink?:  { label: string; to: To }
}

export function AuthLayout({
  children,
  title,
  subtitle,
  footerText,
  footerLink,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient top-left glow */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(0,230,118,0.4) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Ambient bottom-right glow */}
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(16,185,129,0.35) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-8 group">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-neon-sm group-hover:shadow-neon-md transition-shadow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary drop-shadow-neon">
              <path d="M17 8C8 10 5.9 16.17 3.82 19c-1.12-1-1.82-2.76-1.82-4.23C2 8.65 6.15 3 13.5 3c3.12 0 5.5 1.5 5.5 1.5L17 8z" />
              <path d="M17 8c0 4.97-4 9-9 9" />
            </svg>
          </div>
          <span className="text-headline-sm font-heading font-bold text-on-surface">
            Crop<span className="text-primary">Guard</span>
          </span>
        </Link>

        {/* Card */}
        <div className="glass-heavy rounded-3xl p-6 lg:p-8 shadow-glass-lg animate-scale-in">
          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-headline-md font-heading font-bold text-on-surface">{title}</h1>
            {subtitle && (
              <p className="mt-1.5 text-body-md text-on-surface-variant">{subtitle}</p>
            )}
          </div>

          {/* Form content */}
          <div className={cn('space-y-4')}>{children}</div>
        </div>

        {/* Footer link */}
        {(footerText || footerLink) && (
          <p className="mt-5 text-center text-body-sm text-on-surface-variant">
            {footerText}{' '}
            {footerLink && (
              <Link
                to={footerLink.to}
                className="text-primary hover:text-primary-container font-semibold transition-colors"
              >
                {footerLink.label}
              </Link>
            )}
          </p>
        )}
      </div>
    </div>
  )
}

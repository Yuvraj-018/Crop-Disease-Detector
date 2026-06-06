import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../store/authStore'
import { getInitials } from '../../lib/utils'
import { authApi } from '../../api/auth'

interface TopBarProps {
  title?: string
  backHref?: string
  actions?: React.ReactNode
}

export function TopBar({ title, backHref, actions }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const user     = useAuthStore((s) => s.user)
  const logout   = useAuthStore((s) => s.logout)
  const updateUser = useAuthStore((s) => s.updateUser)
  const navigate = useNavigate()
  const { i18n } = useTranslation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleLanguage = async () => {
    const nextLang = i18n.language.startsWith('hi') ? 'en' : 'hi'
    await i18n.changeLanguage(nextLang)
    if (user) {
      try {
        await authApi.updateMe({ language_pref: nextLang })
        updateUser({ language_pref: nextLang })
      } catch {
        // Safe to swallow in prod, or logs in dev
      }
    }
  }


  return (
    <header
      className={cn(
        'sticky top-0 z-30',
        'h-[var(--topbar-height)] px-4 lg:px-6',
        'flex items-center gap-4',
        'glass border-b border-white/[0.05]',
      )}
    >
      {/* Back button (mobile) */}
      {backHref && (
        <Link
          to={backHref}
          className="lg:hidden -ml-1 h-9 w-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
      )}

      {/* Logo (visible on mobile when no back/title) */}
      {!title && !backHref && (
        <Link to="/" className="lg:hidden flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 text-primary">
              <path d="M17 8C8 10 5.9 16.17 3.82 19c-1.12-1-1.82-2.76-1.82-4.23C2 8.65 6.15 3 13.5 3c3.12 0 5.5 1.5 5.5 1.5L17 8z" />
              <path d="M17 8c0 4.97-4 9-9 9" />
            </svg>
          </div>
          <span className="text-title-sm font-heading font-bold text-on-surface">CropGuard</span>
        </Link>
      )}

      {/* Page title */}
      {title && (
        <h1 className="text-title-md font-heading font-semibold text-on-surface">{title}</h1>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions slot */}
      {actions}

      {/* Language Toggle */}
      <button
        onClick={toggleLanguage}
        className={cn(
          'px-2.5 py-1.5 rounded-xl border border-white/[0.05]',
          'bg-surface-container hover:bg-surface-container-high hover:shadow-neon-sm',
          'text-label-sm font-label text-on-surface transition-all flex items-center gap-1.5'
        )}
      >
        <span className="text-primary font-semibold">🌍</span>
        <span>{i18n.language.startsWith('hi') ? 'हिंदी' : 'EN'}</span>
      </button>

      {/* User avatar + dropdown */}
      {user && (
        <div className="relative">
          <button
            id="user-menu-button"
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              'h-9 w-9 rounded-full flex items-center justify-center',
              'bg-primary/10 border border-primary/25',
              'text-label-md font-label text-primary',
              'hover:shadow-neon-sm transition-all',
            )}
          >
            {getInitials(user.full_name)}
          </button>

          {menuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              {/* Menu */}
              <div className="absolute right-0 top-full mt-2 w-48 z-50 glass-heavy rounded-2xl overflow-hidden shadow-glass-lg animate-scale-in">
                <div className="p-3 border-b border-white/[0.05]">
                  <p className="text-body-sm font-label text-on-surface truncate">{user.full_name}</p>
                  <p className="text-label-sm text-on-surface-variant truncate">{user.email}</p>
                </div>
                <div className="p-1.5 space-y-0.5">
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-body-sm text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                  >
                    Profile
                  </Link>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-body-sm text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-body-sm text-error hover:bg-error/10 transition-colors"
                  >
                    Log out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  )
}

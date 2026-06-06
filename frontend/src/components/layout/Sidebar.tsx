import { Link, useLocation } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../store/authStore'

// ─── Nav Items ─────────────────────────────────────────────────────────────

const navItems = [
  {
    label: 'Dashboard',
    path:  '/dashboard',
    icon:  (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: 'Analyse',
    path:  '/analyse',
    icon:  (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
        <path d="M11 8v6M8 11h6" />
      </svg>
    ),
  },
  {
    label: 'History',
    path:  '/history',
    icon:  (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    label: 'Treatments',
    path:  '/treatments',
    icon:  (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    label: 'Outbreak Map',
    path:  '/outbreak',
    icon:  (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
    ),
  },
  {
    label: 'Profile',
    path:  '/profile',
    icon:  (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

// ─── Sidebar ───────────────────────────────────────────────────────────────

export function Sidebar() {
  const { pathname } = useLocation()
  const user    = useAuthStore((s) => s.user)
  const logout  = useAuthStore((s) => s.logout)

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-screen w-[var(--sidebar-width)] shrink-0',
        'glass-heavy border-r border-white/[0.05] sticky top-0',
      )}
    >
      {/* Logo ─────────────────────────────────────────────────────────── */}
      <div className="p-5 border-b border-white/[0.05]">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shadow-neon-sm group-hover:shadow-neon-md transition-shadow">
            <LeafIcon className="h-5 w-5 text-primary drop-shadow-neon" />
          </div>
          <div>
            <p className="text-title-md font-heading font-bold text-on-surface leading-none group-hover:text-glow-sm transition-all">
              CropGuard
            </p>
            <p className="text-label-sm text-primary/70 font-label leading-none mt-0.5">
              COMMAND CENTER
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation ───────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.path ||
            (item.path !== '/dashboard' && pathname.startsWith(item.path))

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                'text-body-md font-label transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary shadow-[inset_0_0_0_1px_rgba(63,255,139,0.2)] shadow-neon-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
              )}
            >
              <span className={cn('shrink-0', isActive && 'drop-shadow-neon')}>{item.icon}</span>
              <span className="text-sm">{item.label}</span>
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User footer ──────────────────────────────────────────────────── */}
      <div className="p-3 border-t border-white/[0.05]">
        {user && (
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-container-high transition-colors">
            <div className="h-8 w-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-label-sm font-label text-primary shrink-0">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-label text-on-surface truncate">{user.full_name}</p>
              <p className="text-label-sm text-on-surface-variant capitalize truncate">{user.role}</p>
            </div>
            <button
              onClick={logout}
              className="text-on-surface-variant hover:text-error transition-colors p-1 rounded-lg hover:bg-error/10"
              title="Log out"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

// ─── Leaf Icon ─────────────────────────────────────────────────────────────
function LeafIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 8C8 10 5.9 16.17 3.82 19c-1.12-1-1.82-2.76-1.82-4.23C2 8.65 6.15 3 13.5 3c3.12 0 5.5 1.5 5.5 1.5L17 8z" />
      <path d="M17 8c0 4.97-4 9-9 9" />
    </svg>
  )
}

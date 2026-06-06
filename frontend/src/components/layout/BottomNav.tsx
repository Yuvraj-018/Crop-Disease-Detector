import { Link, useLocation } from 'react-router-dom'
import { cn } from '../../lib/utils'

const navItems = [
  {
    label: 'Home',
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
    // Scan — center FAB
    label: 'Scan',
    path:  '/analyse',
    isScan: true,
  },
  {
    label: 'Map',
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

export function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav
      className={cn(
        'lg:hidden fixed bottom-0 left-0 right-0 z-40',
        'glass-heavy border-t border-white/[0.05]',
        'flex items-center justify-around',
        'h-[var(--bottomnav-height)] safe-bottom px-2',
      )}
    >
      {navItems.map((item) => {
        if (item.isScan) {
          const isActive = pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center -mt-6"
            >
              {/* FAB Scan button */}
              <div
                className={cn(
                  'h-14 w-14 rounded-full flex items-center justify-center',
                  'bg-primary text-on-primary shadow-neon-md',
                  'transition-transform duration-200 active:scale-95',
                  isActive && 'shadow-neon-lg scale-105',
                )}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
              </div>
              <span className="text-label-sm font-label text-primary mt-0.5 leading-none">{item.label}</span>
            </Link>
          )
        }

        const isActive = pathname === item.path ||
          (pathname !== '/dashboard' && pathname.startsWith(item.path ?? ''))

        return (
          <Link
            key={item.path}
            to={item.path ?? '/'}
            className={cn(
              'flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl',
              'transition-all duration-200',
              isActive
                ? 'text-primary'
                : 'text-on-surface-variant hover:text-on-surface',
            )}
          >
            <span className={cn(isActive && 'drop-shadow-neon')}>{item.icon}</span>
            <span className="text-[10px] font-label leading-none">{item.label}</span>
            {isActive && (
              <span className="absolute -bottom-0 h-0.5 w-5 bg-primary rounded-full shadow-neon-sm" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}

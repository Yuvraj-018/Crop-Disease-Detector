import { Outlet, NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="glass border-b border-white/[0.05] px-6 py-4 flex items-center gap-4">
        <span className="text-title-md font-heading font-bold text-on-surface">
          Admin <span className="text-primary">Panel</span>
        </span>
        <nav className="flex gap-4 ml-6">
          {[
            { to: '/admin',             label: 'Overview', end: true },
            { to: '/admin/users',       label: 'Users',    end: false },
            { to: '/admin/predictions', label: 'Scans',    end: false },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'text-body-md font-label transition-colors',
                  isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}

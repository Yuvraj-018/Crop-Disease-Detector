import { type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { TopBar } from './TopBar'
import { cn } from '../../lib/utils'

interface AppLayoutProps {
  children: ReactNode
  /** Override the page title in TopBar (mobile) */
  title?: string
  /** Show back button on mobile */
  backHref?: string
  /** Extra actions in TopBar */
  topActions?: ReactNode
  /** Remove default page padding */
  noPadding?: boolean
}

export function AppLayout({
  children,
  title,
  backHref,
  topActions,
  noPadding = false,
}: AppLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (visible on all sizes — sidebar handles desktop nav) */}
        <TopBar title={title} backHref={backHref} actions={topActions} />

        {/* Page content */}
        <main
          className={cn(
            'flex-1',
            // Extra bottom padding on mobile for the bottom nav
            'pb-[calc(var(--bottomnav-height)+env(safe-area-inset-bottom,0px))] lg:pb-0',
            !noPadding && 'px-4 py-5 lg:px-6 lg:py-6',
            'animate-fade-in',
          )}
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  )
}

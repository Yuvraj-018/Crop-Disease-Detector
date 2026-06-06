/* eslint-disable react-refresh/only-export-components */
import React, { Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { ErrorBoundary } from './components/ui'


// ─── Pages (lazy-loaded) ────────────────────────────────────────────────────
const LandingPage      = React.lazy(() => import('./pages/LandingPage'))
const LoginPage        = React.lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage     = React.lazy(() => import('./pages/auth/RegisterPage'))
const DashboardPage    = React.lazy(() => import('./pages/DashboardPage'))
const AnalysePage      = React.lazy(() => import('./pages/AnalysePage'))
const HistoryPage      = React.lazy(() => import('./pages/HistoryPage'))
const HistoryDetailPage= React.lazy(() => import('./pages/HistoryDetailPage'))
const TreatmentsPage   = React.lazy(() => import('./pages/TreatmentsPage'))
const OutbreakMapPage  = React.lazy(() => import('./pages/OutbreakMapPage'))
const ProfilePage      = React.lazy(() => import('./pages/ProfilePage'))
const AdminLayout      = React.lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard   = React.lazy(() => import('./pages/admin/AdminDashboard'))
const AdminUsers       = React.lazy(() => import('./pages/admin/AdminUsers'))
const AdminPredictions = React.lazy(() => import('./pages/admin/AdminPredictions'))

// ─── Page Loader ────────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-label-sm font-label text-on-surface-variant animate-pulse">Loading…</p>
      </div>
    </div>
  )
}

// ─── Route Guards ────────────────────────────────────────────────────────────
function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </ErrorBoundary>
  )
}

function AdminRoute() {
  const user            = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </ErrorBoundary>
  )
}


// ─── Router ──────────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  // Landing page
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <LandingPage />
        </Suspense>
      </ErrorBoundary>
    ),
  },

  // Auth
  {
    path: '/login',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <LoginPage />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/register',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <RegisterPage />
        </Suspense>
      </ErrorBoundary>
    ),
  },


  // App (protected)
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/dashboard',    element: <DashboardPage /> },
      { path: '/analyse',      element: <AnalysePage /> },
      { path: '/history',      element: <HistoryPage /> },
      { path: '/history/:id',  element: <HistoryDetailPage /> },
      { path: '/treatments',   element: <TreatmentsPage /> },
      { path: '/outbreak',     element: <OutbreakMapPage /> },
      { path: '/profile',      element: <ProfilePage /> },
    ],
  },

  // Admin (protected + role check)
  {
    element: <AdminRoute />,
    children: [
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { index: true,           element: <AdminDashboard /> },
          { path: 'users',         element: <AdminUsers /> },
          { path: 'predictions',   element: <AdminPredictions /> },
        ],
      },
    ],
  },

  // 404 fallback
  { path: '*', element: <Navigate to="/" replace /> },
])

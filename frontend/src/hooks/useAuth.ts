import { useAuthStore } from '../store/authStore'

/**
 * Convenience hook for auth-related computed values.
 * Wraps the Zustand store with derived role booleans.
 */
export function useAuth() {
  const user            = useAuthStore((s) => s.user)
  const token           = useAuthStore((s) => s.token)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading       = useAuthStore((s) => s.isLoading)
  const login           = useAuthStore((s) => s.login)
  const logout          = useAuthStore((s) => s.logout)
  const updateUser      = useAuthStore((s) => s.updateUser)

  const isAdmin       = user?.role === 'admin'
  const isAgronomist  = user?.role === 'agronomist'
  const isFarmer      = user?.role === 'farmer'

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    isAdmin,
    isAgronomist,
    isFarmer,
    login,
    logout,
    updateUser,
  }
}

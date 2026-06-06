import apiClient from './client'
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '../types'

// ─── Auth API ──────────────────────────────────────────────────────────────

export const authApi = {
  /** POST /auth/login — returns JWT + user */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', data)
    return res.data
  },

  /** POST /auth/register */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/register', data)
    return res.data
  },

  /** GET /auth/me — returns current user */
  me: async (): Promise<User> => {
    const res = await apiClient.get<User>('/auth/me')
    return res.data
  },

  /** PATCH /auth/me — updates current user */
  updateMe: async (data: Partial<User>): Promise<User> => {
    const res = await apiClient.patch<User>('/auth/me', data)
    return res.data
  },
}


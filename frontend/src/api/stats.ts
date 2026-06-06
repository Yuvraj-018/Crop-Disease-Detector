import apiClient from './client'
import type { StatsOverview } from '../types'

// ─── Stats API ──────────────────────────────────────────────────────────────

export const statsApi = {
  /**
   * GET /stats/overview
   * Returns aggregated stats for the current authenticated user's dashboard.
   */
  overview: async (): Promise<StatsOverview> => {
    const res = await apiClient.get<StatsOverview>('/stats/overview')
    return res.data
  },

  /**
   * GET /stats/outbreak
   * Returns geo-clustered disease predictions for the outbreak map (public).
   */
  outbreak: async (): Promise<unknown[]> => {
    const res = await apiClient.get<unknown[]>('/stats/outbreak')
    return res.data
  },
}

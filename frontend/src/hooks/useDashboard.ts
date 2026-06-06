import { useQuery } from '@tanstack/react-query'
import { statsApi } from '../api/stats'
import { predictionsApi } from '../api/predictions'
import type { StatsOverview, PaginatedResponse, Prediction } from '../types'

// ─── Query Keys ─────────────────────────────────────────────────────────────
// Centralised key factory keeps query invalidation consistent across the app.

export const dashboardKeys = {
  all:         ['dashboard'] as const,
  overview:    () => [...dashboardKeys.all, 'overview'] as const,
  recentScans: (limit: number) => [...dashboardKeys.all, 'recentScans', limit] as const,
}

// ─── useStatsOverview ────────────────────────────────────────────────────────

/**
 * Fetches aggregated dashboard statistics for the current user.
 * Endpoint: GET /stats/overview  →  StatsOverview
 * Stale time: 5 minutes — stats don't change per second.
 */
export function useStatsOverview() {
  return useQuery<StatsOverview, Error>({
    queryKey: dashboardKeys.overview(),
    queryFn:  statsApi.overview,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── useRecentScans ──────────────────────────────────────────────────────────

/**
 * Fetches the most recent N scan predictions for the "Recent Scans" feed.
 * Endpoint: GET /predictions?per_page=5&page=1  →  PaginatedResponse<Prediction>
 * Stale time: 2 minutes — new scans may come in during a session.
 */
export function useRecentScans(limit = 5) {
  return useQuery<PaginatedResponse<Prediction>, Error>({
    queryKey: dashboardKeys.recentScans(limit),
    queryFn:  () => predictionsApi.list({ page: 1, per_page: limit }),
    staleTime: 2 * 60 * 1000,
  })
}

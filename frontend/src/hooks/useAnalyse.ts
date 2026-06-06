import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { predictionsApi } from '../api/predictions'
import { dashboardKeys } from './useDashboard'
import type { Prediction } from '../types'

// ─── Analyse Mutation ────────────────────────────────────────────────────────

export interface AnalysePayload {
  file:      File
  cropId?:   string
  latitude?: number
  longitude?: number
}

/**
 * useMutation hook that uploads a crop image to POST /predictions.
 *
 * On success:
 *  - Invalidates dashboard query cache so stats + recent scans refresh.
 *  - Returns the full PredictionDetailResponse (InferenceResult contract).
 *
 * On error:
 *  - Shows a sonner toast with the server error message.
 */
export function useAnalyseMutation() {
  const qc = useQueryClient()

  return useMutation<Prediction, Error, AnalysePayload>({
    mutationFn: async ({ file, cropId, latitude, longitude }) => {
      const fd = new FormData()
      fd.append('image', file)
      if (cropId)    fd.append('crop_id',   cropId)
      if (latitude != null)  fd.append('latitude',  String(latitude))
      if (longitude != null) fd.append('longitude', String(longitude))
      return predictionsApi.create(fd)
    },

    onSuccess: () => {
      // Refresh dashboard stats + recent scans after a new scan
      qc.invalidateQueries({ queryKey: dashboardKeys.all })
    },

    onError: (err) => {
      const msg =
        (err as unknown as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? err.message ?? 'Scan failed. Please try again.'
      toast.error(msg)
    },
  })
}

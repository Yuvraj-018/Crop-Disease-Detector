import apiClient from './client'
import type { Prediction, PaginatedResponse } from '../types'

// ─── Prediction Query Params ────────────────────────────────────────────────

export interface ListPredictionsParams {
  page?: number
  per_page?: number
  crop_id?: string
  disease_id?: string
  is_healthy?: boolean
  date_from?: string   // ISO date string YYYY-MM-DD
  date_to?: string
  feedback?: 'correct' | 'incorrect' | 'unsure'
}

// ─── Predictions API ────────────────────────────────────────────────────────

export const predictionsApi = {
  /**
   * POST /predictions
   * Upload a crop image (multipart/form-data) and receive an inference result.
   */
  create: async (formData: FormData): Promise<Prediction> => {
    const res = await apiClient.post<Prediction>('/predictions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  /**
   * GET /predictions
   * Paginated, filtered prediction history for the current user.
   */
  list: async (params: ListPredictionsParams = {}): Promise<PaginatedResponse<Prediction>> => {
    const res = await apiClient.get<PaginatedResponse<Prediction>>('/predictions', { params })
    return res.data
  },

  /**
   * GET /predictions/:id
   * Single prediction with full nested disease / crop / treatment details.
   */
  get: async (id: string): Promise<Prediction> => {
    const res = await apiClient.get<Prediction>(`/predictions/${id}`)
    return res.data
  },

  /**
   * PATCH /predictions/:id/feedback
   */
  feedback: async (
    id: string,
    body: { feedback: 'correct' | 'incorrect' | 'unsure'; notes?: string },
  ): Promise<Prediction> => {
    const res = await apiClient.patch<Prediction>(`/predictions/${id}/feedback`, body)
    return res.data
  },

  /**
   * DELETE /predictions/:id
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/predictions/${id}`)
  },
}

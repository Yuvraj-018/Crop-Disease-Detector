import apiClient from './client'
import type { Treatment, PaginatedResponse, DiseaseWithTreatments, Disease } from '../types'

// ─── Treatments API ──────────────────────────────────────────────────────────

export interface ListTreatmentsParams {
  page?: number
  per_page?: number
  disease_id?: string
  type?: 'organic' | 'chemical' | 'cultural' | 'biological'
  effectiveness?: 'low' | 'medium' | 'high'
  cost_estimate?: 'low' | 'medium' | 'high'
  is_certified_organic?: boolean
}

export const treatmentsApi = {
  list: async (params: ListTreatmentsParams = {}): Promise<PaginatedResponse<Treatment>> => {
    const res = await apiClient.get<PaginatedResponse<Treatment>>('/treatments', { params })
    return res.data
  },
  get: async (id: string): Promise<Treatment> => {
    const res = await apiClient.get<Treatment>(`/treatments/${id}`)
    return res.data
  },
}

// ─── Diseases API ────────────────────────────────────────────────────────────

export interface ListDiseasesParams {
  page?: number
  per_page?: number
  crop_id?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
  search?: string
}

export const diseasesApi = {
  list: async (params: ListDiseasesParams = {}): Promise<PaginatedResponse<Disease>> => {
    const res = await apiClient.get<PaginatedResponse<Disease>>('/diseases', { params })
    return res.data
  },
  get: async (id: string): Promise<DiseaseWithTreatments> => {
    const res = await apiClient.get<DiseaseWithTreatments>(`/diseases/${id}`)
    return res.data
  },
}

// ─── Stats / Outbreak API ────────────────────────────────────────────────────

export interface OutbreakPoint {
  latitude: number
  longitude: number
  disease_name: string
  severity: string
  count: number
}

export const outbreakApi = {
  getData: async (): Promise<OutbreakPoint[]> => {
    const res = await apiClient.get<OutbreakPoint[]>('/stats/outbreak')
    return res.data
  },
}

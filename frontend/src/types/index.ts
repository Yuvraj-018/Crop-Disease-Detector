// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export type UserRole = 'farmer' | 'agronomist' | 'admin'

export interface User {
  id: string
  email: string
  full_name: string
  phone: string | null
  region: string | null
  language_pref: string
  role: UserRole
  is_active: boolean
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  full_name: string
  phone?: string
  region?: string
  language_pref?: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

// ---------------------------------------------------------------------------
// Crop & Disease
// ---------------------------------------------------------------------------

export interface Crop {
  id: string
  name: string
  scientific_name: string | null
  description: string | null
  image_url: string | null
  created_at: string
  updated_at: string
}

export type DiseaseSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface Disease {
  id: string
  crop_id: string
  name: string
  description: string
  severity: DiseaseSeverity
  symptoms: string[]
  causes: string | null
  prevention: string | null
  class_label: string
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface DiseaseWithTreatments extends Disease {
  crop: Crop
  treatments: Treatment[]
}

// ---------------------------------------------------------------------------
// Treatment
// ---------------------------------------------------------------------------

export type TreatmentType = 'organic' | 'chemical' | 'cultural' | 'biological'
export type TreatmentEffectiveness = 'low' | 'medium' | 'high'

export interface Treatment {
  id: string
  disease_id: string
  name: string
  type: TreatmentType
  description: string
  active_ingredient: string | null
  dosage: string | null
  application_method: string | null
  timing: string | null
  waiting_period: string | null
  cost_estimate: 'low' | 'medium' | 'high'
  effectiveness: TreatmentEffectiveness
  is_certified_organic: boolean
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Prediction
// ---------------------------------------------------------------------------

export type PredictionFeedback = 'correct' | 'incorrect' | 'unsure'

export interface PredictionResult {
  label: string
  confidence: number
  disease_id: string | null
}

export interface Prediction {
  id: string
  user_id: string
  image_url: string
  thumbnail_url: string | null
  original_filename: string | null
  file_size_bytes: number | null
  disease_id: string | null
  confidence: number | null
  is_healthy: boolean
  gradcam_url: string | null
  model_version: string
  top_predictions: PredictionResult[] | null
  feedback: PredictionFeedback | null
  feedback_notes: string | null
  latitude: number | null
  longitude: number | null
  crop_id: string | null
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export interface StatsOverview {
  total_scans: number
  diseases_found: number
  healthy_count: number
  this_month_scans: number
  most_common_disease: { name: string; count: number } | null
  accuracy_rate: number
  scans_by_week: Array<{ week: string; count: number }>
  disease_distribution: Array<{
    disease_name: string
    count: number
    percentage: number
  }>
}

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface ApiError {
  error: {
    code: string
    message: string
    details: Record<string, unknown> | null
  }
}

import axios from 'axios'
import { AIAnalysis, AIStatus } from '../types/trace'

// Get API URL from environment, with better error handling for production
const getApiUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) {
    if (typeof window !== 'undefined') {
      // Client-side: show error
      console.error('NEXT_PUBLIC_API_URL is not set. Please configure it in Vercel environment variables.')
    }
    // Server-side or build-time: use localhost fallback only for development
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:8000'
    }
    // Production: throw error to prevent silent failures
    throw new Error('NEXT_PUBLIC_API_URL environment variable is required for production deployment')
  }
  return url
}

const API_BASE_URL = getApiUrl()

// Export API_BASE_URL for health checks and other direct fetch calls
export { API_BASE_URL }

let authToken: string | null = null

export const setAuthToken = (token: string | null) => {
  authToken = token
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

api.interceptors.request.use(
  (config) => {
    if (authToken && config.headers) {
      config.headers.Authorization = `Bearer ${authToken}`
    }
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log(`API ${config.method?.toUpperCase()} → ${config.url}`)
    }
    return config
  },
  (error) => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('Request error:', error)
    }
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Suppress console errors for expected 503 (Service Unavailable) - backend not configured
    if (error.response?.status === 503) {
      // Silently handle - this is expected when backend auth is not configured
      return Promise.reject(error)
    }
    
    if (process.env.NODE_ENV !== 'production') {
      // Only log unexpected errors
      // eslint-disable-next-line no-console
      console.warn('API error:', error.response?.status, error.response?.data?.detail || error.message)
    }
    return Promise.reject(error)
  }
)

export const getAIAnalysis = async (traceId: string, stepId: string): Promise<AIAnalysis> => {
  const response = await api.get<AIAnalysis>(`/api/traces/${traceId}/steps/${stepId}/ai-analysis`)
  return response.data
}

export const requestAIAnalysis = async (traceId: string, stepId: string, forceRefresh = false): Promise<AIAnalysis> => {
  const response = await api.post<AIAnalysis>(
    `/api/traces/${traceId}/steps/${stepId}/ai-analysis`,
    { force_refresh: forceRefresh }
  )
  return response.data
}

export const getAIStatus = async (): Promise<AIStatus> => {
  const response = await api.get<AIStatus>('/api/ai/status')
  return response.data
}

export interface QuickErrorAnalysisRequest {
  error_message: string
  context?: string
}

export const quickErrorAnalysis = async (request: QuickErrorAnalysisRequest): Promise<AIAnalysis> => {
  const response = await api.post<AIAnalysis>('/api/ai/quick-analysis', request)
  return response.data
}

export interface Subscription {
  plan_type: string
  status: string
  current_period_end?: string
  cancel_at_period_end: boolean
}

export interface UsageStats {
  trace_count: number
  trace_limit: number
  reset_date?: string
}

export interface CheckoutRequest {
  plan_type: string
  billing_interval?: string
}

export const getSubscription = async (): Promise<Subscription> => {
  const response = await api.get<Subscription>('/api/subscription')
  return response.data
}

export const getUsageStats = async (): Promise<UsageStats> => {
  const response = await api.get<UsageStats>('/api/subscription/usage')
  return response.data
}

export const createCheckoutSession = async (
  planType: string,
  billingInterval?: string
): Promise<{ checkout_url: string }> => {
  const payload: CheckoutRequest = {
    plan_type: planType,
  }

  if (billingInterval) {
    payload.billing_interval = billingInterval
  }

  const response = await api.post<{ checkout_url: string }>('/api/subscription/checkout', payload)
  return response.data
}

export const createPortalSession = async (): Promise<{ portal_url: string }> => {
  const response = await api.post<{ portal_url: string }>('/api/subscription/portal')
  return response.data
}

export default api

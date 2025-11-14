export interface AgentStep {
  id: string
  step_type: string
  timestamp: string
  content: string
  metadata?: Record<string, any>
  duration_ms?: number
  tokens_used?: number
  error?: string
  inputs?: Record<string, any>
  outputs?: Record<string, any>
}

export interface AgentTrace {
  id: string
  name?: string
  description?: string
  created_at: string
  steps: AgentStep[]
  metadata?: Record<string, any>
  total_duration_ms?: number
  total_tokens?: number
  error_count: number
  shareable_url?: string
  user_id?: string
  is_public?: boolean
}

export interface TraceFilters {
  stepTypes: string[]
  showErrors: boolean
  searchQuery: string
}

export interface TraceUploadRequest {
  trace_data: Record<string, any> | Record<string, any>[]
  name?: string
  description?: string
  is_public?: boolean
}

export interface TraceResponse {
  id: string
  name?: string
  description?: string
  created_at: string
  steps: AgentStep[]
  metadata: Record<string, any>
  total_duration_ms?: number
  total_tokens?: number
  error_count: number
  shareable_url: string
  user_id?: string
  is_public: boolean
}

export interface AIAnalysis {
  summary: string
  root_cause: string
  suggested_fix: string
  confidence?: number
  cached?: boolean
  model_used?: string
  created_at?: string
}

export interface AIStatus {
  enabled: boolean
  model?: string
  configured: boolean
}

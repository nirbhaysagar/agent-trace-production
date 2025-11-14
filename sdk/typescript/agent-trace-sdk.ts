/**
 * AgentTrace TypeScript SDK
 * 
 * A lightweight helper library for sending agent execution traces to AgentTrace.
 * 
 * Usage:
 * ```typescript
 * import { AgentTraceSDK } from './agent-trace-sdk'
 * 
 * const sdk = new AgentTraceSDK({
 *   apiUrl: 'http://localhost:8000',
 *   apiKey: 'your-auth-token' // Optional, if using auth
 * })
 * 
 * // Start a trace
 * const trace = sdk.startTrace('My Agent Run')
 * 
 * // Add steps
 * trace.addStep('thought', 'Analyzing user request...')
 * trace.addStep('action', 'Calling API', { query: 'test' }, { results: [] })
 * trace.addStep('observation', 'API call successful')
 * 
 * // Finish and upload
 * await trace.upload()
 * ```
 */

export interface StepData {
  type: 'thought' | 'action' | 'observation' | 'error'
  content: string
  inputs?: Record<string, any>
  outputs?: Record<string, any>
  error?: string
  duration_ms?: number
  tokens_used?: number
  metadata?: Record<string, any>
}

export interface TraceConfig {
  apiUrl: string
  apiKey?: string
  name?: string
  description?: string
  isPublic?: boolean
}

export class AgentTrace {
  private steps: Array<StepData & { timestamp: string; id: string }> = []
  private startTime: number = Date.now()
  private config: TraceConfig

  constructor(config: TraceConfig) {
    this.config = config
  }

  /**
   * Add a step to the trace
   */
  addStep(
    type: StepData['type'],
    content: string,
    inputs?: StepData['inputs'],
    outputs?: StepData['outputs'],
    error?: string,
    duration_ms?: number,
    tokens_used?: number,
    metadata?: StepData['metadata']
  ): void {
    this.steps.push({
      id: this.generateId(),
      type,
      content,
      inputs,
      outputs,
      error,
      duration_ms,
      tokens_used,
      metadata,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Add a thought step
   */
  thought(content: string, metadata?: Record<string, any>): void {
    this.addStep('thought', content, undefined, undefined, undefined, undefined, undefined, metadata)
  }

  /**
   * Add an action step
   */
  action(
    content: string,
    inputs?: Record<string, any>,
    outputs?: Record<string, any>,
    duration_ms?: number,
    tokens_used?: number
  ): void {
    this.addStep('action', content, inputs, outputs, undefined, duration_ms, tokens_used)
  }

  /**
   * Add an observation step
   */
  observation(content: string, metadata?: Record<string, any>): void {
    this.addStep('observation', content, undefined, undefined, undefined, undefined, undefined, metadata)
  }

  /**
   * Add an error step
   */
  error(errorMessage: string, errorDetails?: Record<string, any>): void {
    this.addStep('error', errorMessage, undefined, undefined, errorMessage, undefined, undefined, errorDetails)
  }

  /**
   * Upload the trace to AgentTrace
   */
  async upload(): Promise<{ id: string; shareable_url: string }> {
    const traceData = {
      steps: this.steps,
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`
    }

    const body: any = {
      trace_data: traceData,
    }

    if (this.config.name) {
      body.name = this.config.name
    }

    if (this.config.description) {
      body.description = this.config.description
    }

    if (this.config.isPublic !== undefined) {
      body.is_public = this.config.isPublic
    }

    const response = await fetch(`${this.config.apiUrl}/api/traces/upload`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(`Failed to upload trace: ${error.detail || response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Get the current trace data (for debugging)
   */
  getData(): { steps: typeof this.steps } {
    return { steps: this.steps }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

export class AgentTraceSDK {
  private config: TraceConfig

  constructor(config: TraceConfig) {
    this.config = config
  }

  /**
   * Start a new trace
   */
  startTrace(name?: string, description?: string, isPublic?: boolean): AgentTrace {
    return new AgentTrace({
      ...this.config,
      name,
      description,
      isPublic,
    })
  }

  /**
   * Upload a pre-formatted trace
   */
  async uploadTrace(traceData: { steps: StepData[] }, name?: string, description?: string, isPublic?: boolean): Promise<{ id: string; shareable_url: string }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`
    }

    const body: any = {
      trace_data: traceData.steps.map((step) => ({
        type: step.type,
        content: step.content,
        inputs: step.inputs,
        outputs: step.outputs,
        error: step.error,
        duration_ms: step.duration_ms,
        tokens_used: step.tokens_used,
        metadata: step.metadata,
        timestamp: new Date().toISOString(),
      })),
    }

    if (name) {
      body.name = name
    }

    if (description) {
      body.description = description
    }

    if (isPublic !== undefined) {
      body.is_public = isPublic
    }

    const response = await fetch(`${this.config.apiUrl}/api/traces/upload`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(`Failed to upload trace: ${error.detail || response.statusText}`)
    }

    return await response.json()
  }
}


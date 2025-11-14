import { useState } from 'react'
import { Clock, AlertCircle, CheckCircle, Brain, Zap, Search, Filter, Sparkles } from 'lucide-react'
import { AgentTrace, AgentStep, TraceFilters } from '../types/trace'
import { useAuth } from '../context/AuthContext'

interface TraceTimelineProps {
  trace: AgentTrace
  filters: TraceFilters
  selectedStep: AgentStep | null
  onStepSelect: (step: AgentStep) => void
  isBookmarked?: (stepId: string) => boolean
  onAIBadgeClick?: (step: AgentStep) => void
}

const TraceTimeline: React.FC<TraceTimelineProps> = ({ 
  trace, 
  filters, 
  selectedStep, 
  onStepSelect,
  isBookmarked,
  onAIBadgeClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const { user } = useAuth()

  // Filter steps based on current filters
  const filteredSteps = trace.steps.filter(step => {
    // Filter by step types
    if (filters.stepTypes.length > 0 && !filters.stepTypes.includes(step.step_type)) {
      return false
    }

    // Filter by errors
    if (filters.showErrors && !step.error) {
      return false
    }

    // Filter by search query
    const query = filters.searchQuery.toLowerCase()
    if (query && !step.content.toLowerCase().includes(query)) {
      return false
    }

    return true
  })

  const getStepIcon = (stepType: string, hasError: boolean) => {
    if (hasError) {
      return <AlertCircle className="w-4 h-4 text-red-500" />
    }

    // Handle undefined or null stepType
    if (!stepType) {
      return <Clock className="w-4 h-4 text-gray-500" />
    }

    switch (stepType.toLowerCase()) {
      case 'thought':
        return <Brain className="w-4 h-4 text-blue-500" />
      case 'action':
        return <Zap className="w-4 h-4 text-green-500" />
      case 'observation':
        return <CheckCircle className="w-4 h-4 text-purple-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStepColor = (stepType: string, hasError: boolean) => {
    if (hasError) {
      return 'border-red-200 bg-red-50'
    }

    // Handle undefined or null stepType
    if (!stepType) {
      return 'border-gray-200 bg-gray-50'
    }

    switch (stepType.toLowerCase()) {
      case 'thought':
        return 'border-blue-200 bg-blue-50'
      case 'action':
        return 'border-green-200 bg-green-50'
      case 'observation':
        return 'border-purple-200 bg-purple-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Execution Timeline</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>{filteredSteps.length} steps</span>
            {trace.error_count > 0 && (
              <span className="text-red-600">• {trace.error_count} errors</span>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        {filteredSteps.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Filter className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No steps match the current filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSteps.map((step, index) => (
              <div
                key={step.id}
                onClick={() => onStepSelect(step)}
                className={`p-4 rounded-xl border cursor-pointer transition-all card-hover ${
                  selectedStep?.id === step.id 
                    ? 'ring-2 ring-primary-500 border-primary-300 bg-primary-50' 
                    : getStepColor(step.step_type, !!step.error) + ' bg-white'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getStepIcon(step.step_type, !!step.error)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {step.step_type}
                      </span>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        {isBookmarked && isBookmarked(step.id) && (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">★</span>
                        )}
                        <span>{formatTimestamp(step.timestamp)}</span>
                        {step.duration_ms && (
                          <>
                            <span>•</span>
                            <span>{formatDuration(step.duration_ms)}</span>
                          </>
                        )}
                        {step.tokens_used && (
                          <>
                            <span>•</span>
                            <span>{step.tokens_used} tokens</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {step.content}
                    </p>
                    
                    {step.error && (
                      <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <strong>Error:</strong> {step.error}
                          </div>
                          {user && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (onAIBadgeClick) {
                                  onAIBadgeClick(step)
                                } else {
                                  onStepSelect(step)
                                  // Scroll to AI analysis section
                                  setTimeout(() => {
                                    const aiSection = document.querySelector('[data-ai-analysis]')
                                    if (aiSection) {
                                      aiSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                    }
                                  }, 100)
                                }
                              }}
                              className="ml-2 flex items-center space-x-1 px-2 py-0.5 bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-300 rounded text-purple-700 hover:from-purple-200 hover:to-blue-200 transition-all cursor-pointer shadow-sm hover:shadow"
                              title="Click to view AI analysis"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span className="text-xs font-medium">AI</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {(step.inputs && Object.keys(step.inputs).length > 0) && (
                      <div className="mt-2 text-xs text-gray-500">
                        <strong>Inputs:</strong> {Object.keys(step.inputs).length} field(s)
                      </div>
                    )}
                    
                    {(step.outputs && Object.keys(step.outputs).length > 0) && (
                      <div className="mt-1 text-xs text-gray-500">
                        <strong>Outputs:</strong> {Object.keys(step.outputs).length} field(s)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TraceTimeline

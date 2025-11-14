import { useState } from 'react'
import { Clock, AlertCircle, CheckCircle, Brain, Zap, Copy, Download, Eye, EyeOff, Sparkles, Lock } from 'lucide-react'
import { AgentStep, AgentTrace } from '../types/trace'
import AIAnalysis from './AIAnalysis'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'

interface TraceDetailsProps {
  step: AgentStep | null
  trace: AgentTrace
  onToggleBookmark?: (stepId: string) => void
  isBookmarked?: (stepId: string) => boolean
}

const TraceDetails: React.FC<TraceDetailsProps> = ({ step, trace, onToggleBookmark, isBookmarked }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['content']))
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatJson = (obj: any) => {
    return JSON.stringify(obj, null, 2)
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getStepIcon = (stepType: string, hasError: boolean) => {
    if (hasError) {
      return <AlertCircle className="w-5 h-5 text-red-500" />
    }

    switch (stepType.toLowerCase()) {
      case 'thought':
        return <Brain className="w-5 h-5 text-blue-500" />
      case 'action':
        return <Zap className="w-5 h-5 text-green-500" />
      case 'observation':
        return <CheckCircle className="w-5 h-5 text-purple-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  if (!step) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
        <div className="p-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mx-auto mb-4">
            <Eye className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Step</h3>
          <p className="text-gray-600">
            Click on any step in the timeline to view detailed information
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStepIcon(step.step_type, !!step.error)}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 capitalize">
                {step.step_type} Details
              </h3>
              <p className="text-sm text-gray-500">
                {formatTimestamp(step.timestamp)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            {step.duration_ms && (
              <span>{formatDuration(step.duration_ms)}</span>
            )}
            {step.tokens_used && (
              <>
                <span>•</span>
                <span>{step.tokens_used} tokens</span>
              </>
            )}
            {onToggleBookmark && (
              <button
                onClick={() => onToggleBookmark(step.id)}
                className={`ml-2 px-2 py-0.5 rounded text-xs ${isBookmarked && isBookmarked(step.id) ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}
                title="Toggle bookmark"
              >
                {isBookmarked && isBookmarked(step.id) ? '★ Bookmarked' : '☆ Bookmark'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-300px)]">
        {/* Content */}
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('content')}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium text-gray-900">Content</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  copyToClipboard(step.content, 'content')
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <Copy className="w-4 h-4 text-gray-500" />
              </button>
              {expandedSections.has('content') ? (
                <EyeOff className="w-4 h-4 text-gray-500" />
              ) : (
                <Eye className="w-4 h-4 text-gray-500" />
              )}
            </div>
          </button>
          {expandedSections.has('content') && (
            <div className="p-3 border-t border-gray-200">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                {step.content}
              </pre>
              {copiedField === 'content' && (
                <p className="text-xs text-green-600 mt-2">Copied to clipboard!</p>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {step.error && (
          <>
            <div className="border border-red-200 rounded-lg bg-red-50">
              <button
                onClick={() => toggleSection('error')}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-red-100 transition-colors"
              >
                <span className="font-medium text-red-900">Error</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      copyToClipboard(step.error!, 'error')
                    }}
                    className="p-1 hover:bg-red-200 rounded transition-colors"
                  >
                    <Copy className="w-4 h-4 text-red-500" />
                  </button>
                  {expandedSections.has('error') ? (
                    <EyeOff className="w-4 h-4 text-red-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </button>
              {expandedSections.has('error') && (
                <div className="p-3 border-t border-red-200">
                  <pre className="text-sm text-red-700 whitespace-pre-wrap font-mono">
                    {step.error}
                  </pre>
                  {copiedField === 'error' && (
                    <p className="text-xs text-green-600 mt-2">Copied to clipboard!</p>
                  )}
                </div>
              )}
            </div>

            {/* Prominent AI Analysis CTA */}
            {!user && (
              <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 border-2 border-purple-300 rounded-lg shadow-sm">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-gray-900 mb-1" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700 }}>
                      Analyze Error with AI
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Get AI-powered insights including error summary, root cause analysis, and suggested fixes.
                    </p>
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                    >
                      <Lock className="w-4 h-4" />
                      <span className="font-medium">Sign In to Use AI Analysis</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* AI Analysis Component */}
            {user && (
              <div className="mt-4" data-ai-analysis>
                <AIAnalysis step={step} trace={trace} />
              </div>
            )}
          </>
        )}

        {/* Inputs */}
        {step.inputs && Object.keys(step.inputs).length > 0 && (
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('inputs')}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900">Inputs</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    copyToClipboard(formatJson(step.inputs), 'inputs')
                  }}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  <Copy className="w-4 h-4 text-gray-500" />
                </button>
                {expandedSections.has('inputs') ? (
                  <EyeOff className="w-4 h-4 text-gray-500" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-500" />
                )}
              </div>
            </button>
            {expandedSections.has('inputs') && (
              <div className="p-3 border-t border-gray-200">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {formatJson(step.inputs)}
                </pre>
                {copiedField === 'inputs' && (
                  <p className="text-xs text-green-600 mt-2">Copied to clipboard!</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Outputs */}
        {step.outputs && Object.keys(step.outputs).length > 0 && (
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('outputs')}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900">Outputs</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    copyToClipboard(formatJson(step.outputs), 'outputs')
                  }}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  <Copy className="w-4 h-4 text-gray-500" />
                </button>
                {expandedSections.has('outputs') ? (
                  <EyeOff className="w-4 h-4 text-gray-500" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-500" />
                )}
              </div>
            </button>
            {expandedSections.has('outputs') && (
              <div className="p-3 border-t border-gray-200">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {formatJson(step.outputs)}
                </pre>
                {copiedField === 'outputs' && (
                  <p className="text-xs text-green-600 mt-2">Copied to clipboard!</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Metadata */}
        {step.metadata && Object.keys(step.metadata).length > 0 && (
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('metadata')}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900">Metadata</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    copyToClipboard(formatJson(step.metadata), 'metadata')
                  }}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  <Copy className="w-4 h-4 text-gray-500" />
                </button>
                {expandedSections.has('metadata') ? (
                  <EyeOff className="w-4 h-4 text-gray-500" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-500" />
                )}
              </div>
            </button>
            {expandedSections.has('metadata') && (
              <div className="p-3 border-t border-gray-200">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {formatJson(step.metadata)}
                </pre>
                {copiedField === 'metadata' && (
                  <p className="text-xs text-green-600 mt-2">Copied to clipboard!</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Raw Step Data */}
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('raw')}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium text-gray-900">Raw Step Data</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  copyToClipboard(formatJson(step), 'raw')
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <Copy className="w-4 h-4 text-gray-500" />
              </button>
              {expandedSections.has('raw') ? (
                <EyeOff className="w-4 h-4 text-gray-500" />
              ) : (
                <Eye className="w-4 h-4 text-gray-500" />
              )}
            </div>
          </button>
          {expandedSections.has('raw') && (
            <div className="p-3 border-t border-gray-200">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                {formatJson(step)}
              </pre>
              {copiedField === 'raw' && (
                <p className="text-xs text-green-600 mt-2">Copied to clipboard!</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TraceDetails

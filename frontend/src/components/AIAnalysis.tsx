import { useState, useEffect } from 'react'
import { Brain, Loader2, AlertCircle, Copy, RefreshCw, CheckCircle, Sparkles, Lock } from 'lucide-react'
import { AgentStep, AgentTrace, AIAnalysis } from '../types/trace'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../context/SubscriptionContext'
import { getAIAnalysis, requestAIAnalysis } from '../utils/api'
import toast from 'react-hot-toast'
import PaywallModal from './PaywallModal'

interface AIAnalysisProps {
  step: AgentStep
  trace: AgentTrace
}

const AIAnalysisComponent: React.FC<AIAnalysisProps> = ({ step, trace }) => {
  const { user } = useAuth()
  const { canUseAI } = useSubscription()
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']))
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)

  // Show AI features for guests but gate them
  if (!user) {
    return (
      <>
        <div className="border border-purple-200 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 p-4">
          <div className="flex items-start space-x-4">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 mb-1" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700 }}>
                AI Error Analysis Available
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Get instant insights into your agent errors with AI-powered analysis. Sign in and upgrade to Pro to unlock this feature.
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    // Redirect to sign in
                    window.location.href = '/dashboard'
                  }}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="font-medium">Sign In to Access</span>
                </button>
                <button
                  onClick={() => setShowPaywall(true)}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-all"
                >
                  <span className="font-medium">View Pricing</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <PaywallModal
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          feature="AI-Powered Error Analysis"
          description="Get instant insights into your agent errors with AI-powered analysis."
        />
      </>
    )
  }

  // Check if user has AI access
  if (!canUseAI()) {
    return (
      <>
        <div className="border border-purple-200 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 p-4">
          <div className="flex items-start space-x-4">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 mb-1" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700 }}>
                AI Analysis Available
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Upgrade to Pro to unlock AI-powered error analysis, root cause detection, and suggested fixes.
              </p>
              <button
                onClick={() => setShowPaywall(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                <span className="font-medium">Upgrade to Pro</span>
              </button>
            </div>
          </div>
        </div>
        <PaywallModal
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          feature="AI-Powered Error Analysis"
          description="Get instant insights into your agent errors with AI-powered analysis."
        />
      </>
    )
  }

  // Check if step has an error
  if (!step.error) {
    return null
  }

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
      toast.success('Copied to clipboard')
    } catch (err) {
      console.error('Failed to copy:', err)
      toast.error('Failed to copy')
    }
  }

  const fetchAnalysis = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      
      // Try to get cached analysis first (unless force refresh)
      if (!forceRefresh) {
        try {
          const cached = await getAIAnalysis(trace.id, step.id)
          setAnalysis(cached)
          setLoading(false)
          return
        } catch (err: any) {
          // If 404, no cached analysis exists, continue to request new one
          if (err.response?.status !== 404) {
            throw err
          }
        }
      }
      
      // Request new analysis
      const newAnalysis = await requestAIAnalysis(trace.id, step.id, forceRefresh)
      setAnalysis(newAnalysis)
    } catch (err: any) {
      console.error('Error fetching AI analysis:', err)
      if (err.response?.status === 503) {
        setError('AI features are currently disabled')
      } else if (err.response?.status === 401) {
        setError('Authentication required')
      } else {
        setError(err.response?.data?.detail || err.message || 'Failed to analyze error')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Auto-fetch analysis when component mounts
    if (user && step.error) {
      void fetchAnalysis(false)
    }
  }, [user, step.id, trace.id])

  return (
    <div className="border border-purple-200 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="p-4 border-b border-purple-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700 }}>
                AI Error Analysis
              </h3>
              {analysis?.model_used && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Powered by {analysis.model_used}
                  {analysis.cached && <span className="ml-2 text-green-600">• Cached</span>}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => void fetchAnalysis(true)}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-white border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="p-4">
        {loading && !analysis && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
            <span className="ml-3 text-gray-600">Analyzing error...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-900">Error</p>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {analysis && (
          <div className="space-y-3">
            {/* Summary */}
            <div className="border border-purple-200 rounded-lg bg-white">
              <button
                onClick={() => toggleSection('summary')}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-purple-50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="font-medium text-gray-900" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 600 }}>
                    Summary
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      copyToClipboard(analysis.summary, 'summary')
                    }}
                    className="p-1 hover:bg-purple-100 rounded transition-colors"
                  >
                    {copiedField === 'summary' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  {expandedSections.has('summary') ? (
                    <span className="text-xs text-gray-500">Hide</span>
                  ) : (
                    <span className="text-xs text-gray-500">Show</span>
                  )}
                </div>
              </button>
              {expandedSections.has('summary') && (
                <div className="p-3 border-t border-purple-200">
                  <p className="text-sm text-gray-700" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                    {analysis.summary}
                  </p>
                </div>
              )}
            </div>

            {/* Root Cause */}
            <div className="border border-purple-200 rounded-lg bg-white">
              <button
                onClick={() => toggleSection('root_cause')}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-purple-50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <span className="font-medium text-gray-900" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 600 }}>
                    Root Cause
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      copyToClipboard(analysis.root_cause, 'root_cause')
                    }}
                    className="p-1 hover:bg-purple-100 rounded transition-colors"
                  >
                    {copiedField === 'root_cause' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  {expandedSections.has('root_cause') ? (
                    <span className="text-xs text-gray-500">Hide</span>
                  ) : (
                    <span className="text-xs text-gray-500">Show</span>
                  )}
                </div>
              </button>
              {expandedSections.has('root_cause') && (
                <div className="p-3 border-t border-purple-200">
                  <p className="text-sm text-gray-700" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                    {analysis.root_cause}
                  </p>
                </div>
              )}
            </div>

            {/* Suggested Fix */}
            <div className="border border-purple-200 rounded-lg bg-white">
              <button
                onClick={() => toggleSection('suggested_fix')}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-purple-50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="font-medium text-gray-900" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 600 }}>
                    Suggested Fix
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      copyToClipboard(analysis.suggested_fix, 'suggested_fix')
                    }}
                    className="p-1 hover:bg-purple-100 rounded transition-colors"
                  >
                    {copiedField === 'suggested_fix' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  {expandedSections.has('suggested_fix') ? (
                    <span className="text-xs text-gray-500">Hide</span>
                  ) : (
                    <span className="text-xs text-gray-500">Show</span>
                  )}
                </div>
              </button>
              {expandedSections.has('suggested_fix') && (
                <div className="p-3 border-t border-purple-200">
                  <div className="text-sm text-gray-700 whitespace-pre-line" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                    {analysis.suggested_fix}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AIAnalysisComponent



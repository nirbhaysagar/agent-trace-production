import type { NextPage } from 'next'
import Head from 'next/head'
import Layout from '../../components/Layout'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { AlertCircle, ArrowLeft, Share2, Download, Globe, Lock, Sparkles, Zap, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import TraceTimeline from '../../components/TraceTimeline'
import TraceDetails from '../../components/TraceDetails'
import TraceFilters from '../../components/TraceFilters'
import { AgentTrace, AgentStep, TraceFilters as TraceFiltersType } from '../../types/trace'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'
import { getGuestTrace, cleanupExpiredTraces, setupGuestCleanup } from '../../utils/guestSession'

const TracePage: NextPage = () => {
  const router = useRouter()
  const { id } = router.query
  const { user, loading: authLoading } = useAuth()
  
  const [trace, setTrace] = useState<AgentTrace | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStep, setSelectedStep] = useState<AgentStep | null>(null)
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<TraceFiltersType>({
    stepTypes: [],
    showErrors: false,
    searchQuery: ''
  })

  useEffect(() => {
    cleanupExpiredTraces()
    setupGuestCleanup()
    
    if (id && typeof id === 'string') {
      void fetchTrace(id)
    }
  }, [id, user])

  const fetchTrace = async (traceId: string) => {
    try {
      setLoading(true)
      
      if (user) {
        // Authenticated: fetch from API
        const response = await api.get<AgentTrace>(`/api/traces/${traceId}`)
        const traceData = response.data
        setTrace(traceData)
      } else {
        // Guest: try localStorage first, then API (for guest traces stored on server)
        const guestTrace = getGuestTrace(traceId)
        if (guestTrace) {
          setTrace(guestTrace)
        } else {
          // Try API (guest traces might be in server memory)
          try {
            const response = await api.get<AgentTrace>(`/api/traces/${traceId}`)
            setTrace(response.data)
          } catch (apiErr) {
            throw new Error('Trace not found. Guest traces are cleared when the browser closes.')
          }
        }
      }
      
      // Load bookmarks
      try {
        const raw = localStorage.getItem(`bookmarks:${traceId}`)
        if (raw) setBookmarks(new Set(JSON.parse(raw)))
      } catch {}
    } catch (err) {
      console.error('Error fetching trace:', err)
      setError(err instanceof Error ? err.message : 'Failed to load trace')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!trace) return
    const stepId = typeof router.query.step === 'string' ? router.query.step : undefined
    if (stepId) {
      const found = trace.steps.find((s) => s.id === stepId)
      if (found) setSelectedStep(found)
    }
  }, [router.query.step, trace])

  const handleStepSelect = (step: AgentStep) => {
    setSelectedStep(step)
    const url = { pathname: router.pathname, query: { id, step: step.id } }
    void router.replace(url, undefined, { shallow: true })
  }

  const isBookmarked = useCallback((stepId: string) => bookmarks.has(stepId), [bookmarks])

  const toggleBookmark = (stepId: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev)
      if (next.has(stepId)) next.delete(stepId)
      else next.add(stepId)
      try {
        localStorage.setItem(`bookmarks:${id}`, JSON.stringify(Array.from(next)))
      } catch {}
      return next
    })
  }

  const handleFiltersChange = (newFilters: TraceFiltersType) => {
    setFilters(newFilters)
  }

  const handleShare = async () => {
    if (!trace) return
    // Use window.location for better compatibility with production URLs
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${origin}/trace/${trace.id}`
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url)
        toast.success('Link copied to clipboard')
      } else {
        // Fallback for browsers without clipboard API
        const textArea = document.createElement('textarea')
        textArea.value = url
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        toast.success('Link copied to clipboard')
      }
    } catch (err) {
      console.error('Failed to copy URL:', err)
      toast.error('Failed to copy link')
    }
  }

  const handleDownload = () => {
    if (!trace) return
    const dataStr = JSON.stringify(trace, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `trace-${trace.id}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleTogglePublic = async () => {
    if (!trace) return
    const newPublicState = !trace.is_public
    try {
      await api.put(`/api/traces/${trace.id}/visibility`, { is_public: newPublicState })
      setTrace({ ...trace, is_public: newPublicState })
      toast.success(newPublicState ? 'Trace is now public' : 'Trace is now private')
    } catch (error) {
      console.error('Failed to update trace visibility:', error)
      toast.error('Failed to update trace visibility')
    }
  }

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-600">Checking session…</div>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trace...</p>
        </div>
      </div>
    )
  }

  if (error || !trace) {
    return (
      <Layout title="Trace">
        <div className="card p-6 text-center text-gray-600">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Trace Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The requested trace could not be found.'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </button>
        </div>
      </Layout>
    )
  }

  const hasErrors = trace.error_count > 0

  const headerActions = (
    <div className="flex items-center gap-3">
      <button onClick={() => router.push('/dashboard')} className="btn-secondary">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </button>
      {hasErrors && (
        <button
          onClick={() => {
            // Scroll to first error step or navigate to AI analysis
            const firstErrorStep = trace.steps.find(s => s.error)
            if (firstErrorStep) {
              handleStepSelect(firstErrorStep)
              // Scroll to AI analysis section after a brief delay
              setTimeout(() => {
                const aiSection = document.querySelector('[data-ai-analysis]')
                if (aiSection) {
                  aiSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              }, 100)
            } else {
              router.push('/ai-analysis')
            }
          }}
          className="btn-secondary bg-gradient-to-r from-purple-50 to-blue-50 border-purple-300 text-purple-700 hover:from-purple-100 hover:to-blue-100"
          title="View AI Analysis"
        >
          <Sparkles className="mr-2 h-4 w-4" /> AI Analysis
        </button>
      )}
      {user && (
        <button
          onClick={handleTogglePublic}
          className={`btn-secondary ${trace.is_public ? 'bg-green-50 text-green-700 hover:bg-green-100' : ''}`}
          title={trace.is_public ? 'Make private' : 'Make public'}
        >
          {trace.is_public ? <Globe className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
          {trace.is_public ? 'Public' : 'Private'}
        </button>
      )}
      <button onClick={handleShare} className="btn-secondary">
        <Share2 className="mr-2 h-4 w-4" /> Share
      </button>
      <button onClick={handleDownload} className="btn-primary">
        <Download className="mr-2 h-4 w-4" /> Download
      </button>
    </div>
  )

  return (
    <>
      <Head>
        <title>{trace.name || 'Agent Trace'} - AgentTrace</title>
        <meta name="description" content="AI agent execution trace visualization" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <Layout 
        title={trace.name || `Trace ${trace.id.slice(0, 8)}`} 
        subtitle={`${trace.steps.length} steps · ${trace.total_tokens ?? 'N/A'} tokens${trace.is_public ? ' · Public' : trace.metadata?.guest ? ' · Guest' : ' · Private'}`} 
        actions={headerActions}
      >
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Total Steps</p>
                <p className="text-2xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  {trace.steps.length}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          
          <div className="card p-4 bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Errors</p>
                <p className="text-2xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  {trace.error_count || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          
          <div className="card p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Tokens</p>
                <p className="text-2xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  {trace.total_tokens ? trace.total_tokens.toLocaleString() : 'N/A'}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          
          <div className="card p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Status</p>
                <p className="text-sm font-semibold text-gray-900 mt-1 capitalize" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  {trace.error_count > 0 ? 'Has Errors' : 'Success'}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                {trace.error_count > 0 ? (
                  <AlertCircle className="w-5 h-5 text-white" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-white" />
                )}
              </div>
            </div>
          </div>
        </div>

        {!user && trace.metadata?.guest && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
            <div className="flex items-start space-x-3">
              <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-900 mb-1">Guest Mode</h3>
                <p className="text-sm text-amber-800">
                  This trace is stored temporarily and will be cleared when you close the browser. 
                  <span className="block mt-1">
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="text-amber-900 font-medium hover:underline"
                    >
                      Sign in to save traces permanently
                    </button>
                    {' '}and unlock AI-powered error analysis.
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Filters Sidebar */}
          <div className="lg:col-span-3">
            <div className="sticky top-6">
              <TraceFilters 
                trace={trace}
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="lg:col-span-9">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {/* Timeline */}
              <div className="card overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700 }}>
                    Execution Timeline
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Step-by-step execution flow</p>
                </div>
                <div className="p-4">
                  <TraceTimeline 
                    trace={trace}
                    filters={filters}
                    selectedStep={selectedStep}
                    onStepSelect={handleStepSelect}
                    isBookmarked={isBookmarked}
                  />
                </div>
              </div>
              
              {/* Details */}
              <div className="card overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700 }}>
                    Step Details
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Detailed information and AI analysis</p>
                </div>
                <div className="p-4">
                  <TraceDetails 
                    step={selectedStep}
                    trace={trace}
                    onToggleBookmark={toggleBookmark}
                    isBookmarked={isBookmarked}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}

export default TracePage

import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import { Upload, FileText, Search, Filter, Share2, Clock, AlertCircle, CheckCircle, Brain, Zap, ArrowLeft, Home, Play, Download, Copy, Sparkles, Target, BarChart3 } from 'lucide-react'
import TraceUploader from '../components/TraceUploader'
import TraceTimeline from '../components/TraceTimeline'
import TraceDetails from '../components/TraceDetails'
import TraceFilters from '../components/TraceFilters'
import { AgentTrace, AgentStep, TraceResponse } from '../types/trace'
import toast from 'react-hot-toast'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { cleanupExpiredTraces, setupGuestCleanup, saveGuestTrace } from '../utils/guestSession'
import { useEffect } from 'react'

const TestPage: NextPage = () => {
  const { user, loading: authLoading } = useAuth()
  const [trace, setTrace] = useState<AgentTrace | null>(null)
  const [selectedStep, setSelectedStep] = useState<AgentStep | null>(null)
  const [filters, setFilters] = useState({
    stepTypes: [] as string[],
    showErrors: false,
    searchQuery: ''
  })
  const router = useRouter()

  // Initialize guest session cleanup
  useEffect(() => {
    cleanupExpiredTraces()
    setupGuestCleanup()
  }, [])

  const navigateToTrace = (newTrace: AgentTrace) => {
    const shareableUrl = newTrace.shareable_url || (newTrace.id ? `/trace/${newTrace.id}` : null)
    if (shareableUrl) {
      void router.push(shareableUrl)
    }
  }

  const handleTraceUploaded = (newTrace: AgentTrace) => {
    setTrace(newTrace)
    setSelectedStep(null)
    navigateToTrace(newTrace)
  }

  const handleStepSelect = (step: AgentStep) => {
    setSelectedStep(step)
  }

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
  }

  const loadSampleTrace = async (fileName: string, name?: string, description?: string) => {
    try {
      const response = await fetch(`/examples/${fileName}`)
      if (!response.ok) {
        throw new Error(`Failed to load ${fileName}`)
      }
      const sampleData = await response.json()

      // Use guest endpoint if not authenticated
      const endpoint = user ? '/api/traces/upload' : '/api/traces/upload-guest'
      const uploadResponse = await api.post<TraceResponse>(endpoint, {
        trace_data: sampleData,
        name: name || fileName.replace('.json', ''),
        description,
      })

      const trace = uploadResponse.data
      // Save to localStorage if guest mode
      if (!user) {
        saveGuestTrace(trace)
        toast.success(`Loaded ${fileName}! (Guest mode - data will be cleared when you close the browser)`)
      } else {
        toast.success(`Loaded ${fileName} successfully!`)
      }

      handleTraceUploaded(trace)
    } catch (error) {
      console.error('Error loading sample trace:', error)
      toast.error(`Failed to load ${fileName}. Make sure backend is running.`)
    }
  }

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-600">Checking session…</div>
  }

  const renderActions = () => {
    if (trace) {
      return (
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="btn-secondary">
            <Home className="mr-2 h-4 w-4" /> Dashboard
          </Link>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-3">
        <Link href="/traces" className="btn-secondary">
          <Sparkles className="mr-2 h-4 w-4" /> Browse Traces
        </Link>
        <Link href="/dashboard" className="btn-primary">
          <Home className="mr-2 h-4 w-4" /> Dashboard
        </Link>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>AgentTrace Test - Debug Your AI Agents</title>
        <meta name="description" content="Test AgentTrace with your AI agent execution traces" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout 
        title="Upload Trace" 
        subtitle="Upload a JSON log to visualize your agent" 
        actions={renderActions()}
      >
        {!trace ? (
          /* Enhanced Upload Section */
          <div className="text-center">
            <div className="max-w-4xl mx-auto">
              {/* Hero Section */}
              <div className="mb-12">
                <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mx-auto mb-6 shadow-lg">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Test AgentTrace
                </h2>
                
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                  Upload your agent execution logs and see the magic happen. 
                  Transform complex traces into clear, interactive visualizations.
                </p>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  <div className="card p-6">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3">
                      <Target className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Precision Debugging</h3>
                    <p className="text-sm text-gray-600">Pinpoint exact failure points</p>
                  </div>
                  
                  <div className="card p-6">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3">
                      <BarChart3 className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Performance Insights</h3>
                    <p className="text-sm text-gray-600">Track execution metrics</p>
                  </div>
                  
                  <div className="card p-6">
                    <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-3">
                      <Share2 className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Team Collaboration</h3>
                    <p className="text-sm text-gray-600">Share and discuss traces</p>
                  </div>
                </div>
              </div>

              {/* Upload Section */}
              <div className="card overflow-hidden">
                <div className="bg-gradient-to-r from-primary-50 to-blue-50 px-8 py-6 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Upload Your Trace</h3>
                      <p className="text-sm text-gray-600">Drag & drop or paste JSON data</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-8">
                  <TraceUploader onTraceUploaded={handleTraceUploaded} />
                </div>
              </div>
              
              {/* Sample Data Section */}
              <div className="mt-12">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Try Sample Data</h3>
                  <p className="text-gray-600">
                    Don't have trace data? Try our sample traces to see AgentTrace in action.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border border-blue-200 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl">
                        <Play className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900">Sample Trace</h4>
                        <p className="text-sm text-blue-700">Normal execution flow</p>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-6">
                      A weather agent that successfully processes a user request. 
                      Shows the complete thought → action → observation cycle.
                    </p>
                    <button 
                      onClick={() => loadSampleTrace(
                        'sample-trace.json',
                        'Sample Weather Agent Trace',
                        'Example trace showing weather agent execution'
                      )}
                      className="btn-primary w-full"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      <span>Load Sample Trace</span>
                    </button>
                  </div>
                  
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-8 border border-red-200 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-red-600 rounded-xl">
                        <AlertCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900">Error Trace</h4>
                        <p className="text-sm text-red-700">Debugging failure scenario</p>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-6">
                      An agent that encounters an API error. 
                      Perfect for testing error handling and debugging capabilities.
                    </p>
                    <button 
                      onClick={() => loadSampleTrace(
                        'error-trace.json',
                        'Sample Error Trace',
                        'Example trace showing error handling'
                      )}
                      className="btn-secondary w-full"
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      <span>Load Error Trace</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Features Section */}
              <div className="mt-16">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">What You'll See</h3>
                  <p className="text-gray-600">Interactive features that make debugging effortless</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center p-6 card">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Step Details</h4>
                    <p className="text-sm text-gray-600">Click any step to see inputs, outputs, and metadata</p>
                  </div>
                  
                  <div className="text-center p-6 card">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4">
                      <Search className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Smart Search</h4>
                    <p className="text-sm text-gray-600">Find specific steps or content instantly</p>
                  </div>
                  
                  <div className="text-center p-6 card">
                    <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4">
                      <Filter className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Advanced Filters</h4>
                    <p className="text-sm text-gray-600">Filter by step type, errors, or time range</p>
                  </div>
                  
                  <div className="text-center p-6 card">
                    <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-4">
                      <Copy className="w-6 h-6 text-orange-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Copy & Share</h4>
                    <p className="text-sm text-gray-600">Copy data or share trace URLs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Trace Visualization */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <TraceFilters 
                trace={trace}
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
            </div>
            
            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Timeline */}
                <div className="xl:col-span-1">
                  <TraceTimeline 
                    trace={trace as any}
                    filters={filters}
                    selectedStep={selectedStep}
                    onStepSelect={handleStepSelect}
                  />
                </div>
                
                {/* Step Details */}
                <div className="xl:col-span-1">
                  <TraceDetails 
                    step={selectedStep}
                    trace={trace as any}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </>
  )
}

export default TestPage

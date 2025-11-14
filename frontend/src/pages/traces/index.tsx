import type { NextPage } from 'next'
import Head from 'next/head'
import Layout from '../../components/Layout'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Clock, AlertCircle, Zap, Loader2, PlusCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'
import { getGuestTraces, cleanupExpiredTraces, setupGuestCleanup } from '../../utils/guestSession'

interface TraceSummary {
  id: string
  name?: string
  description?: string
  created_at?: string
  total_duration_ms?: number
  total_tokens?: number
  error_count?: number
  shareable_url?: string
  metadata?: Record<string, any>
}

const TracesPage: NextPage = () => {
  const { user, loading: authLoading } = useAuth()
  const [traces, setTraces] = useState<TraceSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    cleanupExpiredTraces()
    setupGuestCleanup()
    
    const fetchTraces = async () => {
      try {
        setLoading(true)
        if (user) {
          // Authenticated: fetch from API
          const offset = (page - 1) * pageSize
          const response = await api.get<{ traces: TraceSummary[] }>('/api/traces', { params: { limit: pageSize, offset } })
          setTraces(response.data.traces || [])
        } else {
          // Guest: fetch from localStorage
          const guestTraces = getGuestTraces()
          const offset = (page - 1) * pageSize
          const paginated = guestTraces.slice(offset, offset + pageSize)
          setTraces(paginated.map(t => ({
            id: t.id,
            name: t.name,
            description: t.description,
            created_at: t.created_at,
            total_duration_ms: t.total_duration_ms,
            total_tokens: t.total_tokens,
            error_count: t.error_count,
            shareable_url: t.shareable_url,
            metadata: t.metadata,
          })))
        }
      } catch (err) {
        console.error('Failed to fetch traces:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    void fetchTraces()
  }, [page, user])

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A'
    if (duration < 1000) return `${duration}ms`
    return `${(duration / 1000).toFixed(2)}s`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown'
    try {
      const date = new Date(dateString)
      return date.toLocaleString()
    } catch (err) {
      return dateString
    }
  }

  const actions = (
    <Link href="/test" className="btn-primary">
      <PlusCircle className="mr-2 h-4 w-4" /> Upload Trace
    </Link>
  )

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-600">Checking session…</div>
  }

  return (
    <>
      <Head>
        <title>Recent Traces - AgentTrace</title>
        <meta name="description" content="Browse recent AI agent traces" />
      </Head>
      <Layout 
        title="Traces" 
        subtitle={user ? "Browse and reopen recent executions" : "Guest mode - Your traces will be cleared when you close the browser"} 
        actions={actions}
      >
        {!user && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            <strong>Guest Mode:</strong> You're viewing traces without signing in. Your data is stored temporarily and will be cleared when you close the browser. 
            <span className="block mt-1">Sign in to save traces permanently.</span>
          </div>
        )}
        <section className="card p-6">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Trace Library</h2>
              <p className="text-sm text-gray-500">All uploaded or ingested traces appear here.</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500">
              <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading traces...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
              <p className="font-medium">Failed to load traces.</p>
              <p className="text-sm mt-1">{error}</p>
              <button
                className="btn-primary mt-4"
                onClick={() => {
                  setError(null)
                  setPage(1)
                }}
              >
                Try again
              </button>
            </div>
          ) : traces.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No traces yet. Upload your first trace to begin.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {traces.map((trace) => (
                <Link
                  key={trace.id}
                  href={trace.shareable_url || `/trace/${trace.id}`}
                  className="card card-hover p-5 transition-colors"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{trace.name || `Trace ${trace.id.slice(0, 8)}`}</h3>
                      <p className="line-clamp-2 text-sm text-gray-500">{trace.description || '—'}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1"><Clock className="h-4 w-4" /> {formatDuration(trace.total_duration_ms)}</div>
                      <div className="flex items-center gap-1"><Zap className="h-4 w-4" /> {trace.total_tokens ?? 'N/A'} tokens</div>
                      <div className={`flex items-center gap-1 ${trace.error_count ? 'text-red-500' : 'text-green-600'}`}>
                        <AlertCircle className="h-4 w-4" /> {trace.error_count ?? 0} errors
                      </div>
                      <span>{formatDate(trace.created_at)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {traces.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">Page {page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                className="btn-primary"
              >
                Next
              </button>
            </div>
          )}
        </section>
      </Layout>
    </>
  )
}

export default TracesPage



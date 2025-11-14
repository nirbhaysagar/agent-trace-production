import type { NextPage } from 'next'
import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import TraceTimeline from '../components/TraceTimeline'
import TraceDetails from '../components/TraceDetails'
import TraceFilters from '../components/TraceFilters'
import { AgentTrace, AgentStep, TraceFilters as TraceFiltersType } from '../types/trace'
import { GitCompare, Zap, AlertCircle, Clock, ArrowUpRight, ArrowDownRight, Loader2, AlignVerticalJustifyCenter } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { getGuestTraces, getGuestTrace, cleanupExpiredTraces, setupGuestCleanup } from '../utils/guestSession'

interface TraceSummaryLite {
  id: string
  name?: string
  total_duration_ms?: number
  total_tokens?: number
  error_count?: number
}

const ComparePage: NextPage = () => {
  const router = useRouter()
  const { a, b } = router.query
  const { user, loading: authLoading } = useAuth()
  
  const [traceAId, setTraceAId] = useState('')
  const [traceBId, setTraceBId] = useState('')
  const [traceA, setTraceA] = useState<AgentTrace | null>(null)
  const [traceB, setTraceB] = useState<AgentTrace | null>(null)
  const [filtersA, setFiltersA] = useState<TraceFiltersType>({ stepTypes: [], showErrors: false, searchQuery: '' })
  const [filtersB, setFiltersB] = useState<TraceFiltersType>({ stepTypes: [], showErrors: false, searchQuery: '' })
  const [selectedA, setSelectedA] = useState<AgentStep | null>(null)
  const [selectedB, setSelectedB] = useState<AgentStep | null>(null)
  const [recentTraces, setRecentTraces] = useState<TraceSummaryLite[]>([])
  const [loadingA, setLoadingA] = useState(false)
  const [loadingB, setLoadingB] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cleanupExpiredTraces()
    setupGuestCleanup()
    
    const fetchRecent = async () => {
      try {
        if (user) {
          const res = await api.get<{ traces: TraceSummaryLite[] }>('/api/traces', { params: { limit: 15 } })
          setRecentTraces(res.data.traces || [])
        } else {
          // Guest: fetch from localStorage
          const guestTraces = getGuestTraces()
          setRecentTraces(guestTraces.slice(0, 15).map(t => ({
            id: t.id,
            name: t.name,
            total_duration_ms: t.total_duration_ms,
            total_tokens: t.total_tokens,
            error_count: t.error_count,
          })))
        }
      } catch (err) {
        console.error('Failed to load trace list', err)
      }
    }
    void fetchRecent()
  }, [user])

  useEffect(() => {
    if (typeof a === 'string') {
      setTraceAId(a)
      void handleLoadTrace(a, 'A')
    }
    if (typeof b === 'string') {
      setTraceBId(b)
      void handleLoadTrace(b, 'B')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, b, user])

  const handleLoadTrace = async (id: string, side: 'A' | 'B') => {
    if (!id) return
    side === 'A' ? setLoadingA(true) : setLoadingB(true)
    setError(null)
    try {
      let data: AgentTrace
      
      if (user) {
        // Authenticated: fetch from API
        const res = await api.get<AgentTrace>(`/api/traces/${id}`)
        data = res.data
      } else {
        // Guest: try localStorage first, then API
        const guestTrace = getGuestTrace(id)
        if (guestTrace) {
          data = guestTrace
        } else {
          // Try API (guest traces might be in server memory)
          const res = await api.get<AgentTrace>(`/api/traces/${id}`)
          data = res.data
        }
      }
      
      if (side === 'A') {
        setTraceA(data)
        setSelectedA(null)
        setFiltersA({ stepTypes: [], showErrors: false, searchQuery: '' })
      } else {
        setTraceB(data)
        setSelectedB(null)
        setFiltersB({ stepTypes: [], showErrors: false, searchQuery: '' })
      }
      const query = { a: side === 'A' ? id : traceAId, b: side === 'B' ? id : traceBId }
      router.replace({ pathname: '/compare', query }, undefined, { shallow: true })
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to load trace')
    } finally {
      side === 'A' ? setLoadingA(false) : setLoadingB(false)
    }
  }

  const diff = useMemo(() => {
    if (!traceA || !traceB) return null
    const delta = (valA?: number, valB?: number) => {
      const aVal = valA ?? 0
      const bVal = valB ?? 0
      return bVal - aVal
    }
    return {
      duration: delta(traceA.total_duration_ms, traceB.total_duration_ms),
      tokens: delta(traceA.total_tokens, traceB.total_tokens),
      errors: delta(traceA.error_count, traceB.error_count),
      steps: delta(traceA.steps.length, traceB.steps.length),
    }
  }, [traceA, traceB])

  const renderDelta = (value: number | null) => {
    if (value === null || value === 0) return <span className="text-gray-500">±0</span>
    const positive = value > 0
    return (
      <span className={positive ? 'text-red-500 flex items-center gap-1' : 'text-green-600 flex items-center gap-1'}>
        {positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
        {Math.abs(value)}
      </span>
    )
  }

  const alignedSteps = useMemo(() => {
    if (!traceA || !traceB) return []
    const remainingB = [...traceB.steps]
    const pairs: { stepA: AgentStep | null; stepB: AgentStep | null }[] = []

    traceA.steps.forEach((step) => {
      const index = remainingB.findIndex((candidate) => candidate.step_type === step.step_type)
      if (index >= 0) {
        pairs.push({ stepA: step, stepB: remainingB.splice(index, 1)[0] })
      } else {
        pairs.push({ stepA: step, stepB: null })
      }
    })

    remainingB.forEach((step) => pairs.push({ stepA: null, stepB: step }))
    return pairs
  }, [traceA, traceB])

  const subtitle = 'Load two traces to compare timelines and metrics'

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-600">Checking session…</div>
  }

  return (
    <>
      <Head>
        <title>Compare Traces - AgentTrace</title>
      </Head>
      <Layout 
        title="Compare Traces" 
        subtitle={user ? subtitle : `${subtitle} (Guest mode - data will be cleared when you close the browser)`}
      >
        {!user && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            <strong>Guest Mode:</strong> You're comparing traces without signing in. Your data is stored temporarily and will be cleared when you close the browser. 
            <span className="block mt-1">Sign in to save traces permanently.</span>
          </div>
        )}
        <section className="card p-6">
          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            {[{ label: 'Trace A', id: traceAId, setId: setTraceAId, loading: loadingA }, { label: 'Trace B', id: traceBId, setId: setTraceBId, loading: loadingB }].map((item, idx) => (
              <div key={idx} className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">{item.label}</label>
                <div className="flex items-center gap-3">
                  <input
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="Enter trace ID"
                    value={item.id}
                    onChange={(e) => item.setId(e.target.value)}
                    list={`trace-suggestions-${idx}`}
                  />
                  <button
                    onClick={() => void handleLoadTrace(item.id, idx === 0 ? 'A' : 'B')}
                    className="btn-primary"
                    disabled={!item.id || item.loading}
                  >
                    {item.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Load'}
                  </button>
                </div>
                <datalist id={`trace-suggestions-${idx}`}>
                  {recentTraces.map((t) => (
                    <option key={`${idx}-${t.id}`} value={t.id}>{t.name || t.id}</option>
                  ))}
                </datalist>
                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                  {recentTraces.map((t) => (
                    <button
                      key={`${item.label}-${t.id}`}
                      onClick={() => {
                        item.setId(t.id)
                        void handleLoadTrace(t.id, idx === 0 ? 'A' : 'B')
                      }}
                      className="rounded-full border px-3 py-1 hover:bg-gray-100"
                    >
                      {t.name || t.id.slice(0, 8)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        </section>

        {traceA && traceB && diff && (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[{
              label: 'Duration (ms)',
              a: traceA.total_duration_ms ?? 0,
              b: traceB.total_duration_ms ?? 0,
              delta: diff.duration,
              icon: <Clock className="h-4 w-4" />,
            }, {
              label: 'Tokens',
              a: traceA.total_tokens ?? 0,
              b: traceB.total_tokens ?? 0,
              delta: diff.tokens,
              icon: <Zap className="h-4 w-4" />,
            }, {
              label: 'Errors',
              a: traceA.error_count ?? 0,
              b: traceB.error_count ?? 0,
              delta: diff.errors,
              icon: <AlertCircle className="h-4 w-4" />,
            }, {
              label: 'Steps',
              a: traceA.steps.length,
              b: traceB.steps.length,
              delta: diff.steps,
              icon: <GitCompare className="h-4 w-4" />,
            }].map((metric) => (
              <div key={metric.label} className="card p-5">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-2">{metric.icon}{metric.label}</div>
                  {renderDelta(metric.delta)}
                </div>
                <div className="mt-3 flex items-center justify-between text-gray-900">
                  <div>
                    <div className="text-xs text-gray-500">Trace A</div>
                    <div className="text-lg font-semibold">{metric.a}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 text-right">Trace B</div>
                    <div className="text-lg font-semibold text-right">{metric.b}</div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {traceA && traceB && (
          <section className="card p-6">
            <div className="mb-4 flex items-center gap-2 text-gray-700">
              <AlignVerticalJustifyCenter className="h-4 w-4" />
              <h3 className="text-lg font-semibold">Aligned Steps</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">#</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Trace A</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Trace B</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Duration Δ</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {alignedSteps.map((pair, idx) => {
                    const durationDelta = pair.stepB && pair.stepA ? (pair.stepB.duration_ms ?? 0) - (pair.stepA.duration_ms ?? 0) : null
                    const errorDiff = pair.stepB?.error || pair.stepA?.error ? `${pair.stepA?.error ?? '—'} → ${pair.stepB?.error ?? '—'}` : '—'
                    return (
                      <tr key={`aligned-${idx}`} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-2">
                          {pair.stepA ? (
                            <div>
                              <div className="font-medium text-gray-900 capitalize">{pair.stepA.step_type}</div>
                              <div className="text-xs text-gray-500 line-clamp-1">{pair.stepA.content}</div>
                            </div>
                          ) : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-2">
                          {pair.stepB ? (
                            <div>
                              <div className="font-medium text-gray-900 capitalize">{pair.stepB.step_type}</div>
                              <div className="text-xs text-gray-500 line-clamp-1">{pair.stepB.content}</div>
                            </div>
                          ) : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-2">{renderDelta(durationDelta)}</td>
                        <td className="px-4 py-2 text-xs text-gray-600">{errorDiff}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="space-y-4">
            <header className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Trace A</h2>
                  {traceA ? (
                    <p className="text-sm text-gray-500">{traceA.name || traceA.id}</p>
                  ) : (
                    <p className="text-sm text-gray-500">Load a trace for comparison</p>
                  )}
                </div>
              </div>
            </header>
            {traceA && (
              <>
                <div className="card">
                  <TraceTimeline trace={traceA} filters={filtersA} selectedStep={selectedA} onStepSelect={setSelectedA} />
                </div>
                <div className="card">
                  <TraceDetails step={selectedA} trace={traceA} />
                </div>
                <TraceFilters trace={traceA} filters={filtersA} onFiltersChange={setFiltersA} />
              </>
            )}
          </section>

          <section className="space-y-4">
            <header className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Trace B</h2>
                  {traceB ? (
                    <p className="text-sm text-gray-500">{traceB.name || traceB.id}</p>
                  ) : (
                    <p className="text-sm text-gray-500">Load a trace for comparison</p>
                  )}
                </div>
              </div>
            </header>
            {traceB && (
              <>
                <div className="card">
                  <TraceTimeline trace={traceB} filters={filtersB} selectedStep={selectedB} onStepSelect={setSelectedB} />
                </div>
                <div className="card">
                  <TraceDetails step={selectedB} trace={traceB} />
                </div>
                <TraceFilters trace={traceB} filters={filtersB} onFiltersChange={setFiltersB} />
              </>
            )}
          </section>
        </div>
      </Layout>
    </>
  )
}

export default ComparePage



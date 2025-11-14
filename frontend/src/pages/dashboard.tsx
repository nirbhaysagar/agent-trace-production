import type { NextPage } from 'next'
import Head from 'next/head'
import Layout from '../components/Layout'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Activity, Zap, AlertCircle, Clock, PlusCircle, List, RefreshCw, TrendingDown, Sparkles, Brain, CheckCircle, ArrowRight } from 'lucide-react'
import { scaleBand, scaleLinear } from '@visx/scale'
import { Group } from '@visx/group'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../context/SubscriptionContext'
import api, { getAIStatus, API_BASE_URL } from '../utils/api'
import { getGuestTraces, cleanupExpiredTraces, setupGuestCleanup } from '../utils/guestSession'
import { AIStatus } from '../types/trace'

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

const DashboardPage: NextPage = () => {
  const { user, loading: authLoading } = useAuth()
  const { usage, subscription } = useSubscription()
  const [traces, setTraces] = useState<TraceSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [apiHealthy, setApiHealthy] = useState<'unknown' | 'up' | 'down'>('unknown')
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null)

  const refresh = async () => {
    setLoading(true)
    try {
      if (user) {
        // Authenticated: fetch from API
        const res = await api.get<{ traces: TraceSummary[] }>('/api/traces', { params: { limit: 50 } })
        setTraces(res.data.traces || [])
      } else {
        // Guest: fetch from localStorage
        const guestTraces = getGuestTraces()
        setTraces(guestTraces.map(t => ({
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
      // eslint-disable-next-line no-console
      console.error('Failed to load traces', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cleanupExpiredTraces()
    setupGuestCleanup()
    void refresh()
    
    // Fetch AI status if authenticated
    if (user) {
      getAIStatus().then(setAiStatus).catch(() => setAiStatus(null))
    }
  }, [user])

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/health`)
        setApiHealthy(res.ok ? 'up' : 'down')
      } catch {
        setApiHealthy('down')
      }
    }
    void checkHealth()
    const t = setInterval(checkHealth, 10000)
    return () => clearInterval(t)
  }, [])

  const stats = useMemo(() => {
    const total = traces.length
    const totalTokens = traces.reduce((s, t) => s + (t.total_tokens || 0), 0)
    const totalErrors = traces.reduce((s, t) => s + (t.error_count || 0), 0)
    const avgDuration = traces.length
      ? Math.round(traces.reduce((s, t) => s + (t.total_duration_ms || 0), 0) / traces.length)
      : 0
    const totalSteps = traces.reduce((s, t) => s + (Number(t.metadata?.step_count) || 0), 0)
    const errorRate = totalSteps ? Number(((totalErrors / totalSteps) * 100).toFixed(2)) : 0
    return { total, totalTokens, totalErrors, avgDuration, errorRate }
  }, [traces])

  const fmt = (ms?: number) => (ms ? (ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`) : 'N/A')

  const actions = (
    <div className="flex items-center gap-3">
      <Link href="/traces" className="btn-secondary">
        <List className="mr-2 h-4 w-4" /> View Traces
      </Link>
      <Link href="/test" className="btn-primary">
        <PlusCircle className="mr-2 h-4 w-4" /> Upload Trace
      </Link>
    </div>
  )

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-600">Checking session…</div>
  }

  return (
    <>
      <Head>
        <title>Dashboard - AgentTrace</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>
      <Layout 
        title="Dashboard" 
        subtitle={user ? "Your agent telemetry at a glance" : "Guest mode - Your traces will be cleared when you close the browser"} 
        actions={actions}
      >
        {!user && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            <strong>Guest Mode:</strong> You're viewing traces without signing in. Your data is stored temporarily and will be cleared when you close the browser. 
            <span className="block mt-1">Sign in to save traces permanently and access all features.</span>
          </div>
        )}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="card p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="text-sm text-blue-700 mb-2" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 500 }}>Total Traces</div>
            <div className="text-3xl font-bold text-blue-900" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 800 }}>{stats.total}</div>
          </div>
          <div className="card p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="text-sm text-purple-700 mb-2 flex items-center space-x-1" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 500 }}><Zap className="h-4 w-4" /><span>Total Tokens</span></div>
            <div className="text-3xl font-bold text-purple-900" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 800 }}>{stats.totalTokens}</div>
          </div>
          <div className="card p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <div className="text-sm text-red-700 mb-2 flex items-center space-x-1" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 500 }}><AlertCircle className="h-4 w-4" /><span>Total Errors</span></div>
            <div className="text-3xl font-bold text-red-900" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 800 }}>{stats.totalErrors}</div>
          </div>
          <div className="card p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="text-sm text-green-700 mb-2 flex items-center space-x-1" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 500 }}><Clock className="h-4 w-4" /><span>Avg Duration</span></div>
            <div className="text-3xl font-bold text-green-900" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 800 }}>{fmt(stats.avgDuration)}</div>
          </div>
          <div className="card p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="text-sm text-orange-700 mb-2 flex items-center space-x-1" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 500 }}><TrendingDown className="h-4 w-4" /><span>Error Rate</span></div>
            <div className="text-3xl font-bold text-orange-900" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 800 }}>{stats.errorRate}%</div>
          </div>
        </section>

        {/* AI Features Card */}
        {user && (
          <section className="card p-6 bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 border-2 border-purple-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700 }}>
                    AI-Powered Error Analysis
                  </h2>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Get instant insights into your agent errors
                  </p>
                </div>
              </div>
              {aiStatus && (
                <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg ${
                  aiStatus.enabled 
                    ? 'bg-green-100 text-green-700 border border-green-300' 
                    : 'bg-red-100 text-red-700 border border-red-300'
                }`}>
                  {aiStatus.enabled ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span className="text-xs font-medium">
                    {aiStatus.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-white rounded-lg border border-purple-200">
                <Sparkles className="w-5 h-5 text-purple-600 mb-2" />
                <h3 className="font-semibold text-gray-900 mb-1 text-sm" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 600 }}>
                  Error Summary
                </h3>
                <p className="text-xs text-gray-600">
                  Clear, concise error explanations
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-orange-200">
                <AlertCircle className="w-5 h-5 text-orange-600 mb-2" />
                <h3 className="font-semibold text-gray-900 mb-1 text-sm" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 600 }}>
                  Root Cause
                </h3>
                <p className="text-xs text-gray-600">
                  Understand why errors occur
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-green-200">
                <CheckCircle className="w-5 h-5 text-green-600 mb-2" />
                <h3 className="font-semibold text-gray-900 mb-1 text-sm" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 600 }}>
                  Suggested Fixes
                </h3>
                <p className="text-xs text-gray-600">
                  Actionable steps to resolve issues
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-purple-200">
              <div className="text-sm text-gray-600">
                {stats.totalErrors > 0 ? (
                  <span>
                    <strong className="text-purple-700">{stats.totalErrors}</strong> error{stats.totalErrors !== 1 ? 's' : ''} available for analysis
                  </span>
                ) : (
                  <span>Upload traces with errors to see AI analysis</span>
                )}
                {usage && subscription?.plan_type === 'free' && (
                  <span className="block mt-1 text-xs text-amber-600">
                    {usage.trace_count} / {usage.trace_limit} traces used this month
                  </span>
                )}
              </div>
              <Link 
                href="/ai-analysis" 
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
              >
                <span className="font-medium">Explore AI Features</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="card p-5 lg:col-span-1">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700 }}>API Health</h3>
              <button onClick={() => void refresh()} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900">
                <RefreshCw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>
            <p className="text-sm text-gray-600">Backend status: <span className="font-semibold capitalize">{apiHealthy}</span></p>
          </div>
          <div className="card p-5 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Durations (last {Math.min(10, traces.length)} traces)</h3>
            </div>
            {traces.length === 0 ? (
              <div className="text-sm text-gray-500">No data yet</div>
            ) : (
              <BarChart data={traces.slice(0, 10).map((t, i) => ({ label: t.name || t.id.slice(0, 6), value: t.total_duration_ms || 0, index: i }))} height={220} valueFormatter={fmt} colorClass="fill-blue-500" />
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Tokens (last {Math.min(10, traces.length)} traces)</h3>
            </div>
            {traces.length === 0 ? (
              <div className="text-sm text-gray-500">No data yet</div>
            ) : (
              <BarChart data={traces.slice(0, 10).map((t, i) => ({ label: t.name || t.id.slice(0, 6), value: t.total_tokens || 0, index: i }))} height={220} valueFormatter={(v) => `${v}`} colorClass="fill-purple-500" />
            )}
          </div>

          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Errors (last {Math.min(10, traces.length)} traces)</h3>
            </div>
            {traces.length === 0 ? (
              <div className="text-sm text-gray-500">No data yet</div>
            ) : (
              <BarChart data={traces.slice(0, 10).map((t, i) => ({ label: t.name || t.id.slice(0, 6), value: t.error_count || 0, index: i }))} height={220} valueFormatter={(v) => `${v}`} colorClass="fill-red-500" />
            )}
          </div>
        </section>

        <section className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700 }}><Activity className="h-4 w-4" /><span>Recent Traces</span></h2>
            <button onClick={() => void refresh()} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900">
              <RefreshCw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
          {loading ? (
            <div className="text-center py-10 text-gray-500">Loading…</div>
          ) : traces.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No traces yet. Upload one to get started.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {traces.slice(0, 8).map((t) => (
                <Link key={t.id} href={t.shareable_url || `/trace/${t.id}`} className="block rounded-xl px-3 py-3 transition-colors hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{t.name || `Trace ${t.id.slice(0, 8)}`}</div>
                      <div className="line-clamp-2 text-sm text-gray-500">{t.description || '—'}</div>
                    </div>
                    <div className="flex items-center space-x-6 text-xs text-gray-500">
                      <span>{fmt(t.total_duration_ms)}</span>
                      <span>{t.total_tokens ?? 0} tokens</span>
                      <span className={t.error_count ? 'text-red-500' : 'text-green-600'}>{t.error_count ?? 0} errors</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </Layout>
    </>
  )
}

export default DashboardPage

type ChartDatum = { label: string; value: number; index: number }

function BarChart({ data, height, valueFormatter, colorClass }: { data: ChartDatum[]; height: number; valueFormatter?: (v: number)=>string; colorClass?: string }) {
  const margin = { top: 10, right: 10, bottom: 30, left: 40 }
  const width = 600
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const x = scaleBand<number>({
    domain: data.map((d) => d.index),
    range: [0, innerWidth],
    padding: 0.2,
  })
  const y = scaleLinear<number>({
    domain: [0, Math.max(1, Math.max(...data.map((d) => d.value)))],
    range: [innerHeight, 0],
    nice: true,
  })

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="bar-chart">
      <Group left={margin.left} top={margin.top}>
        {data.map((d) => {
          const barWidth = x.bandwidth()
          const barHeight = innerHeight - y(d.value)
          const barX = x(d.index) || 0
          const barY = y(d.value)
          return (
            <g key={d.index}>
              <rect x={barX} y={barY} width={barWidth} height={barHeight} className={colorClass || 'fill-gray-500'} rx={3} />
              <text x={barX + barWidth / 2} y={innerHeight + 18} textAnchor="middle" className="fill-gray-500 text-[10px]">
                {d.index + 1}
              </text>
              <text x={barX + barWidth / 2} y={barY - 4} textAnchor="middle" className="fill-gray-700 text-[10px]">
                {valueFormatter ? valueFormatter(d.value) : d.value}
              </text>
            </g>
          )
        })}
        {/* y-axis ticks */}
        {y.ticks(4).map((tick, i) => (
          <g key={i}>
            <line x1={0} x2={innerWidth} y1={y(tick)} y2={y(tick)} stroke="#eee" />
            <text x={-8} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-gray-500 text-[10px]">
              {valueFormatter ? valueFormatter(tick) : tick}
            </text>
          </g>
        ))}
      </Group>
    </svg>
  )
}



import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import { LayoutGrid, List, Upload, Settings, Info, Brain, RefreshCw, LogOut, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../utils/api'

const TopNav: React.FC = () => {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()
  const active = (href: string) => router.pathname === href

  const linkCls = (href: string) => `flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors ${
    active(href) ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
  }`

  const [apiHealthy, setApiHealthy] = useState<'unknown' | 'up' | 'down'>('unknown')

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/health`)
      setApiHealthy(res.ok ? 'up' : 'down')
    } catch {
      setApiHealthy('down')
    }
  }, [])

  useEffect(() => {
    void checkHealth()
  }, [checkHealth])

  return (
    <nav className="bg-white/80 backdrop-blur border-b border-gray-200 rounded-xl shadow-sm">
      <div className="mx-auto flex h-12 max-w-full items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center space-x-2 text-gray-900">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-600">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold">AgentTrace</span>
        </Link>

        <div className="flex items-center space-x-1">
          <Link href="/dashboard" className={linkCls('/dashboard')}>
            <LayoutGrid className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          <Link href="/traces" className={linkCls('/traces')}>
            <List className="h-4 w-4" />
            <span>Traces</span>
          </Link>
          <Link href="/test" className={linkCls('/test')}>
            <Upload className="h-4 w-4" />
            <span>Upload</span>
          </Link>
          <Link href="/pricing" className={linkCls('/pricing')}>
            <Sparkles className="h-4 w-4" />
            <span>Pricing</span>
          </Link>
          {user && (
            <Link href="/ai-analysis" className={linkCls('/ai-analysis')}>
              <Sparkles className="h-4 w-4" />
              <span>AI Analysis</span>
            </Link>
          )}
          <Link href="/settings" className={linkCls('/settings')}>
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
          <Link href="/about" className={linkCls('/about')}>
            <Info className="h-4 w-4" />
            <span>About</span>
          </Link>

          <div className="hidden items-center border-l border-gray-200 pl-3 text-sm sm:flex">
            <span className="mr-2 text-gray-600">API:</span>
            <span className={`mr-2 inline-flex items-center space-x-1 rounded-full px-2 py-0.5 ${
              apiHealthy === 'up'
                ? 'bg-green-100 text-green-700'
                : apiHealthy === 'down'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                apiHealthy === 'up' ? 'bg-green-500' : apiHealthy === 'down' ? 'bg-red-500' : 'bg-gray-400'
              }`} />
              <span className="capitalize">{apiHealthy}</span>
            </span>
            <button
              onClick={() => void checkHealth()}
              title="Reconnect"
              className="inline-flex items-center rounded-md border px-2 py-1 text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="ml-3 flex items-center">
            {loading ? (
              <div className="text-sm text-gray-500">Loading…</div>
            ) : user ? (
              <div className="flex items-center space-x-2">
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="avatar" className="h-8 w-8 rounded-full" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700">
                    {user.email?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                <div className="hidden flex-col text-xs sm:flex">
                  <span className="font-medium text-gray-800">{user.user_metadata?.full_name || user.email}</span>
                  <span className="text-gray-500">Signed in</span>
                </div>
                <button onClick={() => void signOut()} className="btn-secondary">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href={{ pathname: '/login', query: { mode: 'signin', redirect: router.asPath } }}
                  className="btn-secondary"
                >
                  Sign in
                </Link>
                <Link href={{ pathname: '/login', query: { mode: 'signup' } }} className="btn-primary hidden sm:inline-flex">
                  Create account
                </Link>
                <div className="hidden text-sm text-gray-500 sm:block">Save traces, ingest via API, and unlock AI analysis.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default TopNav



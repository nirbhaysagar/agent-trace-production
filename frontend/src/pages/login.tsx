import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { FormEvent, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Brain } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

type AuthMode = 'signin' | 'signup'

const LoginPage: NextPage = () => {
  const router = useRouter()
  const { user, loading, signInWithPassword, signUpWithPassword, signOut } = useAuth()
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (router.query.mode === 'signup') {
      setMode('signup')
    } else if (router.query.mode === 'signin') {
      setMode('signin')
    }
  }, [router.query.mode])

  const toggleMode = () => {
    setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'))
  }

  const redirectPath = typeof router.query.redirect === 'string' ? router.query.redirect : null

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email || !password) {
      toast.error('Please enter email and password')
      return
    }

    try {
      setSubmitting(true)
      if (mode === 'signin') {
        await signInWithPassword(email, password)
        toast.success('Signed in successfully')
        await router.push(redirectPath || '/dashboard')
      } else {
        const result = await signUpWithPassword(email, password)
        // Check if email confirmation is required
        if (result?.session) {
          toast.success('Account created successfully')
          await router.push(redirectPath || '/dashboard')
        } else {
          toast.success('Account created! Please check your email to confirm your account.')
          await router.push('/login?mode=signin')
        }
      }
    } catch (error: any) {
      const message = error?.message ?? 'Authentication failed'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Head>
        <title>{`${mode === 'signin' ? 'Sign in' : 'Create account'} - AgentTrace`}</title>
      </Head>
      <div className="min-h-screen bg-gray-100 text-gray-900">
        <header className="border-b border-gray-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <Link href="/dashboard" className="flex items-center space-x-2 text-gray-900">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-600">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">AgentTrace</span>
            </Link>
            <Link href="/pricing" className="text-sm text-primary-600 hover:text-primary-700">
              View pricing
            </Link>
          </div>
        </header>

        <main className="mx-auto flex max-w-5xl flex-1 flex-col items-center px-4 py-12">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            {loading ? (
              <div className="text-center text-gray-500">Loading your session…</div>
            ) : user ? (
              <div className="space-y-4 text-center">
                <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700 }}>
                  You are signed in
                </h1>
                <p className="text-sm text-gray-600">
                  Signed in as <span className="font-medium text-gray-900">{user.email}</span>.
                </p>
                <div className="flex flex-col gap-2">
                  <Link href="/dashboard" className="btn-primary text-center">
                    Go to dashboard
                  </Link>
                  <button onClick={() => void signOut()} className="btn-secondary">
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700 }}>
                    {mode === 'signin' ? 'Sign in to AgentTrace' : 'Create your AgentTrace account'}
                  </h1>
                  <p className="mt-2 text-sm text-gray-600">
                    {mode === 'signin'
                      ? 'Access your private traces, automations, and AI assistance.'
                      : 'Unlock private trace storage, API ingestion, and AI-powered debugging.'}
                  </p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      required
                      minLength={8}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Password must be at least 8 characters. You can change it later.
                    </p>
                  </div>

                  <button type="submit" disabled={submitting} className="btn-primary w-full justify-center">
                    {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
                  </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                  {mode === 'signin' ? (
                    <>
                      Need an account?{' '}
                      <button onClick={toggleMode} className="font-medium text-primary-600 hover:text-primary-700">
                        Create one
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button onClick={toggleMode} className="font-medium text-primary-600 hover:text-primary-700">
                        Sign in
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  )
}

export default LoginPage



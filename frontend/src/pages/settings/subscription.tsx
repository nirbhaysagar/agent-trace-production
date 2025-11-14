import type { NextPage } from 'next'
import Head from 'next/head'
import Layout from '../../components/Layout'
import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Calendar, ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSubscription } from '../../context/SubscriptionContext'
import { createCheckoutSession } from '../../utils/api'
import toast from 'react-hot-toast'
import { useRouter } from 'next/router'
import Link from 'next/link'

const SubscriptionSettingsPage: NextPage = () => {
  const { user, loading: authLoading } = useAuth()
  const { subscription, usage, refresh, loading } = useSubscription()
  const router = useRouter()
  const [upgradeLoading, setUpgradeLoading] = useState(false)

  useEffect(() => {
    // Check for success parameter from Stripe redirect
    if (router.query.success === 'true') {
      toast.success('Subscription activated successfully!')
      void refresh()
      // Clean URL
      router.replace('/settings/subscription', undefined, { shallow: true })
    }
  }, [router.query, refresh, router])

  const handleUpgrade = async (planType: string = 'pro') => {
    try {
      setUpgradeLoading(true)
      const { checkout_url } = await createCheckoutSession(planType, 'lifetime')
      window.location.href = checkout_url
    } catch (err: any) {
      console.error('Error creating checkout session:', err)
      toast.error('Failed to start checkout. Please try again.')
      setUpgradeLoading(false)
    }
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <Layout title="Subscription">
        <div className="card p-8 text-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      </Layout>
    )
  }

  // Show sign in required only after loading is complete and user is not authenticated
  if (!user) {
    return (
      <Layout title="Subscription">
        <div className="card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-4">Please sign in to manage your subscription.</p>
          <Link href="/login?mode=signin" className="btn-primary">
            Sign In
          </Link>
        </div>
      </Layout>
    )
  }

  if (loading) {
    return (
      <Layout title="Subscription">
        <div className="card p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subscription...</p>
        </div>
      </Layout>
    )
  }

  const planLabelMap: Record<string, string> = {
    free: 'Developer',
    pro: 'Pro Lifetime',
  }
  const planName =
    (subscription?.plan_type && planLabelMap[subscription.plan_type]) || 'Developer'
  const isPro = subscription?.plan_type === 'pro'
  const isFree = subscription?.plan_type === 'free' || !subscription?.plan_type

  return (
    <>
      <Head>
        <title>Subscription Settings - AgentTrace</title>
        <meta name="description" content="Manage your subscription" />
      </Head>

      <Layout title="Subscription Settings" subtitle="Manage your plan and billing">
        <div className="space-y-6">
          {/* Current Plan Card */}
          <div className={`card p-6 border-2 ${
            isPro ? 'border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700 }}>
                  Current Plan: {planName}
                </h2>
                <p className="text-sm text-gray-600">
                  {isFree ? 'Manual debugging toolkit with guest-mode storage' : 'Lifetime access to all Pro automations & AI features'}
                </p>
              </div>
              {isPro && (
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Active</span>
                </div>
              )}
            </div>

            {subscription?.current_period_end && !isPro && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                <Calendar className="w-4 h-4" />
                <span>
                  {subscription.cancel_at_period_end
                    ? `Cancels on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                    : `Renews on ${new Date(subscription.current_period_end).toLocaleDateString()}`}
                </span>
              </div>
            )}

            {isPro && (
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                <span>Lifetime access unlocked</span>
              </div>
            )}
          </div>

          {/* Usage Stats */}
          {usage && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700 }}>
                Usage This Month
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Traces Created</span>
                    <span className="text-sm font-medium text-gray-900">
                      {usage.trace_count} / {usage.trace_limit === -1 ? '∞' : usage.trace_limit}
                    </span>
                  </div>
                  {usage.trace_limit !== -1 && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          usage.trace_count / usage.trace_limit > 0.8
                            ? 'bg-red-500'
                            : usage.trace_count / usage.trace_limit > 0.6
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((usage.trace_count / usage.trace_limit) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                  {usage.trace_limit !== -1 && usage.trace_count / usage.trace_limit > 0.8 && (
                    <p className="text-xs text-amber-600 mt-2">
                      You're approaching your monthly limit. Consider upgrading for unlimited traces.
                    </p>
                  )}
                </div>
                {usage.reset_date && (
                  <p className="text-xs text-gray-500">
                    Resets on {new Date(usage.reset_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Upgrade Section */}
          {isFree && (
            <div className="card p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
              <div className="flex items-start space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700 }}>
                    Unlock Premium Features
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Upgrade once to unlock private trace storage, authenticated API ingestion, and AI-guided triage for every error.
                  </p>
                  <button
                    onClick={() => handleUpgrade('pro')}
                    disabled={upgradeLoading}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                  >
                    <span>Upgrade to Pro – $59 Lifetime</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Plan Features */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700 }}>
              Plan Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Free Plan</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Up to 10 traces/month</li>
                  <li>• 30-day guest retention</li>
                  <li>• Timeline, comparison, and search filters</li>
                  <li>• Shareable public URLs</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Pro Plan</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Lifetime access (one-time $59 payment)</li>
                  <li>• Email/password auth with private traces & 90-day retention</li>
                  <li>• Authenticated API ingestion + SDKs</li>
                  <li>• AI summaries, root cause analysis, & saved filters</li>
                  <li>• Global search and usage analytics</li>
                </ul>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/pricing" className="text-sm text-purple-600 hover:text-purple-700">
                View all plans and pricing →
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}

export default SubscriptionSettingsPage



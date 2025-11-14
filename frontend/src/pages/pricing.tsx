import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../context/SubscriptionContext'
import { createCheckoutSession } from '../utils/api'
import toast from 'react-hot-toast'

const PricingPage: NextPage = () => {
  const router = useRouter()
  const { user } = useAuth()
  const { subscription } = useSubscription()
  const [loading, setLoading] = useState<string | null>(null)

  const handleUpgrade = async (planType: string, billingInterval?: string) => {
    if (!user) {
      await router.push({
        pathname: '/login',
        query: { mode: 'signup', redirect: router.asPath },
      })
      return
    }

    try {
      setLoading(planType)
      const { checkout_url } = await createCheckoutSession(planType, billingInterval)
      window.location.href = checkout_url
    } catch (err: any) {
      console.error('Error creating checkout session:', err)
      toast.error('Failed to start checkout. Please try again.')
      setLoading(null)
    }
  }

  const plans = useMemo(
    () => [
      {
        key: 'free',
        name: 'Developer',
        price: 0,
        priceNote: 'Forever free · Manual debugging toolkit',
        description: 'Perfect for quickly inspecting, comparing, and sharing agent traces without any setup.',
        featureSections: [
          {
            title: 'Trace Workspace',
            items: [
              'Paste JSON or upload log files in seconds',
              'Interactive timeline with full step context',
              'Side-by-side comparison for regression checks',
              'Exportable JSON & public share links',
            ],
          },
          {
            title: 'Guest Experience',
            items: [
              'No login required to get started',
              '24-hour guest retention with auto-cleanup',
              'Bookmarks, deep links, and local session storage',
            ],
          },
          {
            title: 'Search & Insights',
            items: [
              'Filter by step type, errors, or custom tags',
              'Inline search within a single trace',
              'Guest dashboard with duration & token charts',
            ],
          },
          {
            title: 'Product Experience',
            items: [
              'Responsive UI built for deep debugging sessions',
              'Toast notifications, loading states, and graceful errors',
              'Custom 404 and empty states that keep you oriented',
            ],
          },
        ],
        cta: user ? (subscription?.plan_type === 'free' ? 'Current Plan' : 'Included with your account') : 'Start for Free',
        disabled: subscription?.plan_type === 'free',
        requiresCheckout: false,
      },
      {
        key: 'mini',
        name: 'Mini Trial',
        price: 9,
        priceNote: '1-week trial · All Pro features',
        description: 'Try all Pro features for just $9. Perfect for testing before committing to lifetime.',
        featureSections: [
          {
            title: 'Privacy & Accounts',
            items: [
              'Secure Supabase auth (email today, OAuth-ready tomorrow)',
              'User profiles with avatars and session management',
              'Role-aware UI that separates personal and shared traces',
            ],
          },
          {
            title: 'Persistence & Control',
            items: [
              'Private trace vault with 90-day retention & pagination',
              'Public/private visibility toggles per trace',
              'Usage analytics and monthly limits dashboard',
            ],
          },
          {
            title: 'Workflow Automation',
            items: [
              'Direct API ingestion endpoint with bearer auth',
              'Official TypeScript & Python SDKs (AgentTraceSDK)',
              'CI-friendly uploads for automated test runs',
            ],
          },
          {
            title: 'AI Copilot',
            items: [
              'AI-powered error summaries and triage',
              'Root cause analysis with suggested fixes',
              'Response caching keeps OpenAI spend predictable',
            ],
          },
          {
            title: 'Pro Workflow',
            items: [
              'Global search across every private trace',
              'Saved filter presets for repeatable investigations',
              'Health indicator & reconnect controls for the API',
            ],
          },
        ],
        popular: false,
        cta: 'Start 1-Week Trial',
        disabled: subscription?.plan_type === 'mini',
        requiresCheckout: true,
        billingInterval: 'week',
      },
      {
        key: 'pro',
        name: 'Pro Lifetime',
        price: 59,
        priceNote: 'One-time payment · Lifetime access',
        description: 'Private, automated observability for professional teams who ship agents to production.',
        featureSections: [
          {
            title: 'Privacy & Accounts',
            items: [
              'Secure Supabase auth (email today, OAuth-ready tomorrow)',
              'User profiles with avatars and session management',
              'Role-aware UI that separates personal and shared traces',
            ],
          },
          {
            title: 'Persistence & Control',
            items: [
              'Private trace vault with 90-day retention & pagination',
              'Public/private visibility toggles per trace',
              'Usage analytics and monthly limits dashboard',
            ],
          },
          {
            title: 'Workflow Automation',
            items: [
              'Direct API ingestion endpoint with bearer auth',
              'Official TypeScript & Python SDKs (AgentTraceSDK)',
              'CI-friendly uploads for automated test runs',
            ],
          },
          {
            title: 'AI Copilot',
            items: [
              'AI-powered error summaries and triage',
              'Root cause analysis with suggested fixes',
              'Response caching keeps OpenAI spend predictable',
            ],
          },
          {
            title: 'Pro Workflow',
            items: [
              'Global search across every private trace',
              'Saved filter presets for repeatable investigations',
              'Health indicator & reconnect controls for the API',
            ],
          },
        ],
        popular: true,
        cta: 'Unlock Lifetime Pro',
        disabled: subscription?.plan_type === 'pro',
        requiresCheckout: true,
        billingInterval: 'lifetime',
      },
    ],
    [subscription?.plan_type, user]
  )

  return (
    <>
      <Head>
        <title>Pricing - AgentTrace</title>
        <meta name="description" content="Choose the right plan for your needs" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen bg-[#0a0a0a] text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        {/* Header */}
        <header className="border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center space-x-2 text-white">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-semibold">AgentTrace</span>
            </Link>
            <nav className="hidden items-center space-x-6 text-sm text-gray-400 md:flex">
              <Link href="#plans" className="hover:text-white transition-colors">Plans</Link>
              <Link href="/#features" className="hover:text-white transition-colors">Features</Link>
              <Link href="/#how-it-works" className="hover:text-white transition-colors">How it works</Link>
              <Link href="#plans" className="hover:text-white transition-colors">Compare</Link>
            </nav>
            <div className="flex items-center space-x-3 text-sm">
              <Link href={{ pathname: '/login', query: { mode: 'signin', redirect: '/dashboard' } }} className="text-gray-300 hover:text-white transition-colors">
                Log in
              </Link>
              <Link
                href={{ pathname: '/login', query: { mode: 'signup', redirect: router.asPath } }}
                className="inline-flex items-center space-x-2 rounded-lg bg-white px-4 py-2 font-medium text-black hover:bg-gray-100 transition-colors"
              >
                <span>Start free trial</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute left-[20%] top-[-20%] h-[480px] w-[480px] rounded-full bg-orange-500/20 blur-3xl" />
            <div className="absolute right-[15%] bottom-[-25%] h-[520px] w-[520px] rounded-full bg-purple-600/20 blur-3xl" />
          </div>
          <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 lg:px-8">
            <span className="inline-flex items-center space-x-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-wide text-gray-300">
              <Sparkles className="h-3.5 w-3.5 text-orange-400" />
              <span>Pricing</span>
            </span>
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
              Two simple plans.
              <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">One observability engine.</span>
            </h1>
            <p className="max-w-2xl text-base text-gray-400 sm:text-lg">
              Start with the free Developer toolkit for manual debugging. Upgrade once to unlock private storage, automated ingestion, and AI-assisted resolution.
            </p>
          </div>
        </section>

        {/* Plans */}
        <section id="plans" className="relative pb-16">
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] lg:gap-8 lg:px-8">
            {plans.map((plan) => {
              const isCurrentPlan = subscription?.plan_type === plan.key
              const isLoading = loading === plan.key
              const isPro = plan.key === 'pro'

              return (
                <div
                  key={plan.name}
                  className={`relative rounded-3xl border ${
                    isPro
                      ? 'border-purple-500/50 bg-gradient-to-br from-purple-600/20 via-blue-600/10 to-purple-700/20 shadow-2xl'
                      : 'border-white/10 bg-white/5 backdrop-blur shadow-xl'
                  } p-8`}
                >
                  {isPro && (
                    <div className="absolute -top-3 left-8 inline-flex items-center rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-1 text-xs font-semibold text-white">
                      Most loved by teams
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-gray-300">
                        {plan.priceNote}
                      </span>
                      <h2 className="mt-4 text-3xl font-semibold text-white">{plan.name}</h2>
                      <p className="mt-2 text-sm text-gray-300">{plan.description}</p>
                    </div>
                    <span className="text-4xl font-bold text-white">${plan.price}</span>
                  </div>

                  <div className="mt-8 space-y-6 text-sm text-gray-200">
                    {plan.featureSections.map((section) => (
                      <div key={section.title}>
                        <h3 className={`text-xs font-semibold uppercase tracking-wide ${isPro ? 'text-white/70' : 'text-gray-400'}`}>
                          {section.title}
                        </h3>
                        <ul className="mt-3 space-y-2">
                          {section.items.map((feature) => (
                            <li key={feature} className="flex items-start space-x-2">
                              <CheckCircle className={`mt-0.5 h-4 w-4 ${isPro ? 'text-emerald-300' : 'text-green-500'}`} />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 space-y-3">
                    {!user ? (
                      <Link
                        href={{
                          pathname: '/login',
                          query: { mode: plan.key === 'free' ? 'signin' : 'signup', redirect: router.asPath },
                        }}
                        className={`inline-flex w-full items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition-all ${
                          isPro
                            ? 'bg-white text-black hover:bg-gray-100 shadow-lg'
                            : 'border border-white/20 bg-white/10 text-white hover:bg-white/15'
                        }`}
                      >
                        {plan.requiresCheckout ? 'Create account to upgrade' : 'Start for free'}
                      </Link>
                    ) : plan.requiresCheckout ? (
                      <button
                        onClick={() => handleUpgrade(plan.key, plan.billingInterval)}
                        disabled={isCurrentPlan || isLoading || plan.disabled}
                        className={`inline-flex w-full items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition-all ${
                          isPro
                            ? 'bg-white text-black hover:bg-gray-100 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
                            : 'border border-white/20 bg-white/10 text-white hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                      >
                        {isLoading ? 'Processing…' : isCurrentPlan ? 'Current Plan' : plan.cta}
                      </button>
                    ) : (
                      <div className="rounded-xl border border-dashed border-white/20 bg-white/5 px-6 py-3 text-center text-sm text-gray-300">
                        {isCurrentPlan ? 'Current Plan' : plan.cta}
                      </div>
                    )}
                    {isPro && (
                      <p className="text-xs text-white/70 text-center">Secured with Stripe · Instant activation · No recurring fees</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mx-auto mt-12 w-full max-w-6xl rounded-3xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-sm text-gray-300">
            <h3 className="text-lg font-semibold text-white">Team Tier — Contact us</h3>
            <p className="mt-2">
              Collaboration workspaces, live trace streaming, and Slack/Jira integrations are in flight.{' '}
              <Link href="mailto:hello@agenttrace.com" className="text-orange-400 hover:text-orange-300">
                Join the waitlist
              </Link>{' '}
              to help shape the roadmap.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-white/5 bg-[#0a0a0a] py-16">
          <div className="mx-auto grid w-full max-w-4xl gap-6 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
            {[
              {
                question: 'Is the Pro plan a recurring subscription?',
                answer: 'No. It is a single $59 lifetime payment with instant activation via Stripe.',
              },
              {
                question: 'Can I upgrade later?',
                answer: 'Absolutely. Stay on Developer as long as you like and upgrade when you need private storage or automation.',
              },
              {
                question: 'Does the free plan require a credit card?',
                answer: 'Never. Developer mode is 100% free, no credit card required, and lets you debug manually in seconds.',
              },
              {
                question: 'What happens to my data if I downgrade?',
                answer: 'Downgrading reverts to guest mode. Private traces follow your retention policy and can be exported before downgrading.',
              },
            ].map((item) => (
              <div key={item.question} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h4 className="text-base font-semibold text-white">{item.question}</h4>
                <p className="mt-2 text-sm text-gray-300">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 bg-[#0a0a0a] py-10">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between space-y-4 px-4 text-sm text-gray-500 sm:flex-row sm:px-6 lg:px-8">
            <span>© {new Date().getFullYear()} AgentTrace. All rights reserved.</span>
            <div className="space-x-4">
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="mailto:hello@agenttrace.com" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

export default PricingPage



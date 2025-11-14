import type { NextPage } from 'next'
import Head from 'next/head'
import Layout from '../components/Layout'
import { Brain, Sparkles, MessageSquare, FileText, HelpCircle, TrendingUp, Rocket, GitCompare, Hourglass, Zap, CheckCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Link from 'next/link'

const AIAnalysisPage: NextPage = () => {
  const { user, loading: authLoading } = useAuth()

  if (authLoading) {
    return (
      <Layout title="AI Analysis">
        <div className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-600">
          Loading...
        </div>
      </Layout>
    )
  }

  if (!user) {
    return (
      <Layout title="AI Analysis">
        <div className="card p-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mx-auto mb-4">
            <Brain className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700 }}>
            Sign In Required
          </h1>
          <p className="text-gray-600 mb-6">
            AI-powered features are only available for authenticated users.
          </p>
          <Link href="/dashboard" className="btn-primary">
            Sign In to Continue
          </Link>
        </div>
      </Layout>
    )
  }

  const colorClasses: Record<string, { icon: string; check: string; badge: string; border: string }> = {
    indigo: {
      icon: 'text-indigo-500',
      check: 'text-indigo-500',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      border: 'hover:border-indigo-300'
    },
    blue: {
      icon: 'text-blue-500',
      check: 'text-blue-500',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      border: 'hover:border-blue-300'
    },
    green: {
      icon: 'text-green-500',
      check: 'text-green-500',
      badge: 'bg-green-50 text-green-700 border-green-200',
      border: 'hover:border-green-300'
    },
    orange: {
      icon: 'text-orange-500',
      check: 'text-orange-500',
      badge: 'bg-orange-50 text-orange-700 border-orange-200',
      border: 'hover:border-orange-300'
    },
    purple: {
      icon: 'text-purple-500',
      check: 'text-purple-500',
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
      border: 'hover:border-purple-300'
    },
    cyan: {
      icon: 'text-cyan-500',
      check: 'text-cyan-500',
      badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      border: 'hover:border-cyan-300'
    }
  }

  const upcomingFeatures = [
    {
      id: 'chat-assistant',
      icon: MessageSquare,
      title: 'AI Chat Assistant',
      description: 'Ask questions about your traces in natural language and get instant, intelligent answers.',
      benefits: [
        'Get instant answers about errors, performance, and optimizations',
        'Understand complex trace behavior through conversational queries',
        'Compare traces and analyze patterns with simple questions'
      ],
      examples: [
        'Why did the agent fail here?',
        'What was the slowest step?',
        'Compare this trace to my previous one'
      ],
      color: 'indigo',
      gradient: 'from-indigo-500 to-purple-600'
    },
    {
      id: 'trace-summary',
      icon: FileText,
      title: 'AI-Powered Trace Summary',
      description: 'Automatically generate comprehensive executive summaries of your traces in seconds.',
      benefits: [
        'Quick overview of key events and performance metrics',
        'Identify bottlenecks and critical issues at a glance',
        'Save time understanding long and complex traces'
      ],
      examples: [
        'Executive summary of trace execution',
        'Performance insights and recommendations',
        'Key events and error highlights'
      ],
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-600'
    },
    {
      id: 'step-explanations',
      icon: HelpCircle,
      title: 'Step-by-Step Explanations',
      description: 'Understand what each step does in plain, accessible language.',
      benefits: [
        'Make traces accessible to non-technical team members',
        'Learn how your agent works step by step',
        'Get context-aware explanations for each action'
      ],
      examples: [
        'Hover or click any step for AI explanation',
        'Understand tool calls and API interactions',
        'Learn about decision-making processes'
      ],
      color: 'green',
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      id: 'anomaly-detection',
      icon: TrendingUp,
      title: 'Anomaly Detection',
      description: 'Automatically detect and flag unusual patterns in your traces before they become problems.',
      benefits: [
        'Proactive issue detection and early warning system',
        'Identify performance regressions automatically',
        'Spot unexpected errors and token usage spikes'
      ],
      examples: [
        'Unusually slow steps flagged automatically',
        'Unexpected error patterns detected',
        'Token usage anomalies highlighted'
      ],
      color: 'orange',
      gradient: 'from-orange-500 to-red-600'
    },
    {
      id: 'optimization',
      icon: Rocket,
      title: 'Optimization Suggestions',
      description: 'Get actionable performance recommendations tailored to your specific traces.',
      benefits: [
        'Receive specific, actionable optimization strategies',
        'Identify caching and parallelization opportunities',
        'Reduce token usage and improve response times'
      ],
      examples: [
        'Caching strategies for API calls',
        'Parallelization recommendations',
        'Token usage optimization tips'
      ],
      color: 'purple',
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      id: 'trace-comparison',
      icon: GitCompare,
      title: 'Intelligent Trace Comparison',
      description: 'Compare two traces side-by-side with AI-powered insights and analysis.',
      benefits: [
        'Identify key differences between trace versions',
        'Understand performance deltas and behavioral changes',
        'Perfect for A/B testing and regression analysis'
      ],
      examples: [
        'Compare before and after optimizations',
        'Analyze differences between agent versions',
        'Track performance improvements over time'
      ],
      color: 'cyan',
      gradient: 'from-cyan-500 to-blue-600'
    }
  ]

  return (
    <>
      <Head>
        <title>AI Features - AgentTrace</title>
        <meta name="description" content="Upcoming AI-powered features for intelligent trace analysis" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <Layout title="AI Features" subtitle="Powerful AI capabilities coming soon">
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="card p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 text-center">
            <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-lg mx-auto mb-6">
              <Hourglass className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700 }}>
              AI Features Coming Soon
            </h1>
            <p className="text-xl text-gray-700 mb-6 max-w-2xl mx-auto">
              We're building powerful AI capabilities to make trace analysis faster, smarter, and more intuitive.
            </p>
            <div className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full text-sm font-semibold shadow-lg">
              <Sparkles className="w-5 h-5" />
              <span>Launching Soon</span>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {upcomingFeatures.map((feature) => {
              const IconComponent = feature.icon
              const colors = colorClasses[feature.color]
              return (
                <div
                  key={feature.id}
                  className={`relative card p-6 bg-white border-2 border-gray-200 ${colors.border} hover:shadow-xl transition-all group overflow-hidden`}
                >
                  {/* Coming Soon Badge */}
                  <div className={`absolute top-0 right-0 bg-gradient-to-br ${feature.gradient} text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl shadow-md`}>
                    Coming Soon
                  </div>

                  {/* Header */}
                  <div className="flex items-start space-x-4 mb-4 mt-2">
                    <div className={`flex items-center justify-center w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl shadow-lg group-hover:scale-110 transition-transform flex-shrink-0`}>
                      <IconComponent className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700 }}>
                        {feature.title}
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  {/* Benefits Section */}
                  <div className="mt-5 pt-5 border-t border-gray-100">
                    <div className="flex items-center space-x-2 mb-3">
                      <Zap className={`w-5 h-5 ${colors.icon}`} />
                      <h4 className="font-semibold text-gray-900" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 600 }}>
                        Key Benefits
                      </h4>
                    </div>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className={`w-5 h-5 ${colors.check} flex-shrink-0 mt-0.5`} />
                          <span className="text-sm text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Examples Section */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-2">Examples:</p>
                    <div className="flex flex-wrap gap-2">
                      {feature.examples.map((example, index) => (
                        <span
                          key={index}
                          className={`inline-flex items-center px-3 py-1 ${colors.badge} rounded-lg text-xs border`}
                        >
                          {example}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer CTA */}
          <div className="card p-6 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Sparkles className="w-6 h-6 text-indigo-500" />
              <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700 }}>
                Stay Tuned
              </h3>
            </div>
            <p className="text-gray-700 mb-6 max-w-xl mx-auto">
              These AI features are currently in active development. We're working hard to bring you the most powerful and intuitive trace analysis experience.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-medium"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/traces"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-white border-2 border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-all shadow-sm hover:shadow font-medium"
              >
                <span>View Traces</span>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}

export default AIAnalysisPage

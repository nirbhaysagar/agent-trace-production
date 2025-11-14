import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import api from '../utils/api'

export interface Subscription {
  plan_type: 'free' | 'pro'
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  current_period_end?: string
  cancel_at_period_end: boolean
}

export interface UsageStats {
  trace_count: number
  trace_limit: number
  reset_date?: string
}

interface SubscriptionContextValue {
  subscription: Subscription | null
  usage: UsageStats | null
  loading: boolean
  refresh: () => Promise<void>
  canUseAI: () => boolean
  canCreateTrace: () => boolean
  getTraceLimit: () => number
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined)

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null)
      setUsage(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const [subResponse, usageResponse] = await Promise.all([
        api.get<Subscription>('/api/subscription'),
        api.get<UsageStats>('/api/subscription/usage'),
      ])
      setSubscription(subResponse.data)
      setUsage(usageResponse.data)
    } catch (err: any) {
      // Handle 503 (Service Unavailable) gracefully - backend not configured
      if (err.response?.status === 503) {
        // Silently default to free plan when backend is not configured
        // Don't log errors for expected 503 responses
      } else {
        // Only log unexpected errors
        console.warn('Error fetching subscription:', err.response?.status || err.message)
      }
      // Default to free plan on any error
      setSubscription({
        plan_type: 'free',
        status: 'active',
        cancel_at_period_end: false,
      })
      setUsage({
        trace_count: 0,
        trace_limit: 10,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchSubscription()
  }, [user])

  const canUseAI = () => subscription?.plan_type === 'pro'

  const canCreateTrace = () => {
    if (!subscription || !usage) return true // Default to true if data not loaded
    const limit = subscription.plan_type === 'free' ? usage.trace_limit : -1
    if (limit === -1) return true // Unlimited
    return usage.trace_count < limit
  }

  const getTraceLimit = () => {
    if (!subscription || !usage) return 10 // Default
    if (subscription.plan_type === 'free') return usage.trace_limit
    return -1 // Unlimited
  }

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      subscription,
      usage,
      loading,
      refresh: fetchSubscription,
      canUseAI,
      canCreateTrace,
      getTraceLimit,
    }),
    [subscription, usage, loading]
  )

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
}

export const useSubscription = () => {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}



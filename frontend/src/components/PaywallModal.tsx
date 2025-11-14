import { useState } from 'react'
import { X, Sparkles, CheckCircle, ArrowRight, Lock } from 'lucide-react'
import { useSubscription } from '../context/SubscriptionContext'
import { useAuth } from '../context/AuthContext'
import { createCheckoutSession } from '../utils/api'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'

interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
  feature: string
  description?: string
}

const PaywallModal: React.FC<PaywallModalProps> = ({ isOpen, onClose, feature, description }) => {
  const { subscription } = useSubscription()
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleUpgrade = async (planType: string = 'pro') => {
    if (!user) {
      onClose()
      await router.push({
        pathname: '/login',
        query: { mode: 'signup', redirect: router.asPath },
      })
      return
    }

    try {
      setLoading(true)
      const { checkout_url } = await createCheckoutSession(planType, 'lifetime')
      window.location.href = checkout_url
    } catch (err: any) {
      console.error('Error creating checkout session:', err)
      toast.error('Failed to start checkout. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 border-2 border-purple-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700 }}>
                Upgrade Required
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-700 mb-2" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
              <strong className="text-purple-700">{feature}</strong> is part of the Pro plan.
            </p>
            {description && (
              <p className="text-sm text-gray-600">{description}</p>
            )}
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 mb-6 border border-purple-200">
            <h3 className="font-semibold text-gray-900 mb-3" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 600 }}>
              Pro Lifetime unlocks:
            </h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Email/password authentication with private trace storage</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>90-day retention, privacy controls, and pagination</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Authenticated API ingestion + official TS/Python SDKs</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>AI-powered error summaries & suggested fixes</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Global search, saved filters, and usage analytics</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col space-y-3">
            <button
              onClick={() => handleUpgrade('pro')}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">
                {user ? 'Upgrade to Pro – $59 lifetime' : 'Create account to upgrade'}
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push('/pricing')}
              className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              View all plans →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaywallModal



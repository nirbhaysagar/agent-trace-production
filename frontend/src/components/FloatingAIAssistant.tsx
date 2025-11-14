import { useState } from 'react'
import { Sparkles, X, Brain } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Link from 'next/link'

const FloatingAIAssistant: React.FC = () => {
  const { user } = useAuth()
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)

  // Don't show on AI analysis page itself
  if (!user || router.pathname === '/ai-analysis') {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isExpanded ? (
        <div className="bg-white rounded-xl shadow-2xl border-2 border-purple-200 p-4 w-80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 600 }}>
                AI Assistant
              </h3>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="space-y-2">
            <Link
              href="/ai-analysis"
              className="block w-full px-3 py-2 text-left text-sm bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg hover:from-purple-100 hover:to-blue-100 transition-all"
            >
              <div className="font-medium text-gray-900">View AI Features</div>
              <div className="text-xs text-gray-600">Learn about AI error analysis</div>
            </Link>
            <Link
              href="/traces"
              className="block w-full px-3 py-2 text-left text-sm bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all"
            >
              <div className="font-medium text-gray-900">View Traces</div>
              <div className="text-xs text-gray-600">Analyze errors with AI</div>
            </Link>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
          title="AI Assistant"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}
    </div>
  )
}

export default FloatingAIAssistant


import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from '../components/ErrorBoundary'
import { AuthProvider } from '../context/AuthContext'
import { SubscriptionProvider } from '../context/SubscriptionContext'
import { useEffect } from 'react'
import { cleanupExpiredTraces, setupGuestCleanup } from '../utils/guestSession'
import CursorGradient from '../components/CursorGradient'
import FloatingAIAssistant from '../components/FloatingAIAssistant'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize guest session cleanup on app load
    cleanupExpiredTraces()
    setupGuestCleanup()
  }, [])

  return (
    <ErrorBoundary>
      <AuthProvider>
        <SubscriptionProvider>
          <CursorGradient />
          <Component {...pageProps} />
          <FloatingAIAssistant />
          <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              fontFamily: "'Inter', system-ui, sans-serif",
            },
          }}
        />
        </SubscriptionProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

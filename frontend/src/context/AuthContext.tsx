import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import supabase from '../lib/supabaseClient'
import { setAuthToken } from '../utils/api'
import { getUserFriendlyAuthError, isCorsError } from '../lib/supabaseConfig'

interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  signInWithProvider: (provider: 'google' | 'github') => Promise<void>
  signInWithPassword: (email: string, password: string) => Promise<void>
  signUpWithPassword: (email: string, password: string) => Promise<{ session: Session | null; user: User | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Initialize session from storage
    const initSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (error) {
          console.error('Error getting session:', error)
          setSession(null)
          setUser(null)
          setAuthToken(null)
          setLoading(false)
          return
        }

        if (currentSession) {
          // Verify session is still valid
          const now = Math.floor(Date.now() / 1000)
          const expiresAt = currentSession.expires_at || 0
          
          if (expiresAt > now) {
            // Session is valid
            setSession(currentSession)
            setUser(currentSession.user ?? null)
            setAuthToken(currentSession.access_token ?? null)
          } else {
            // Session expired, try to refresh
            console.log('Session expired, attempting refresh...')
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
            
            if (!mounted) return

            if (refreshError || !refreshedSession) {
              console.error('Failed to refresh session:', refreshError)
              setSession(null)
              setUser(null)
              setAuthToken(null)
            } else {
              setSession(refreshedSession)
              setUser(refreshedSession.user ?? null)
              setAuthToken(refreshedSession.access_token ?? null)
            }
          }
        } else {
          setSession(null)
          setUser(null)
          setAuthToken(null)
        }
      } catch (error) {
        console.error('Failed to initialize session:', error)
        if (mounted) {
          setSession(null)
          setUser(null)
          setAuthToken(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void initSession()

    // Listen for auth state changes (sign in, sign out, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return

      console.log('Auth state changed:', event, newSession?.user?.email)
      
      // Update state based on new session
      setSession(newSession)
      setUser(newSession?.user ?? null)
      setAuthToken(newSession?.access_token ?? null)
      setLoading(false)

      // Handle token refresh
      if (event === 'TOKEN_REFRESHED' && newSession) {
        setAuthToken(newSession.access_token ?? null)
      }

      // Handle sign out
      if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
        setAuthToken(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signInWithProvider = useCallback(async (provider: 'google' | 'github') => {
    const redirectTo = `${window.location.origin}/auth/callback`
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } })
    if (error) {
      throw error
    }
  }, [])

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address')
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim().toLowerCase(), 
        password 
      })
      
      if (error) {
        // Check for email confirmation errors first (before using generic handler)
        if (error.message.includes('Email not confirmed') || 
            error.message.includes('not confirmed') || 
            error.message.includes('email_not_confirmed') ||
            (error.status === 400 && error.message.includes('email'))) {
          throw new Error('Please check your email and confirm your account before signing in. If you just signed up, check your inbox (and spam folder) for the confirmation email.')
        } else if (error.message.includes('Invalid login credentials') || 
                   error.message.includes('invalid') || 
                   error.status === 400) {
          throw new Error('Invalid email or password. If you just signed up, please check your email to confirm your account first.')
        } else if (error.message.includes('too many requests')) {
          throw new Error('Too many login attempts. Please wait a moment and try again.')
        }
        
        // Use the user-friendly error handler for other errors
        const friendlyError = getUserFriendlyAuthError(error)
        
        // Log fix steps to console for CORS/configuration errors
        if (isCorsError(error) && friendlyError.fixSteps) {
          console.error('🔧 CORS Configuration Error - Fix Steps:')
          friendlyError.fixSteps.forEach(step => console.error(`  ${step}`))
        }
        
        throw new Error(friendlyError.message)
      }

      // Set session and token
      if (data.session) {
        setSession(data.session)
        setUser(data.user ?? null)
        setAuthToken(data.session.access_token ?? null)
      }
    } catch (err: any) {
      // Handle network errors with user-friendly messages
      if (isCorsError(err)) {
        const friendlyError = getUserFriendlyAuthError(err)
        if (friendlyError.fixSteps) {
          console.error('🔧 Configuration Error - Fix Steps:')
          friendlyError.fixSteps.forEach(step => console.error(`  ${step}`))
        }
        throw new Error(friendlyError.message)
      }
      throw err
    }
  }, [])

  const signUpWithPassword = useCallback(async (email: string, password: string) => {
    // Validate password length
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address')
    }

    try {
      const { data, error } = await supabase.auth.signUp({ 
        email: email.trim().toLowerCase(), 
        password
        // Removed emailRedirectTo since email confirmation is disabled
      })
      
      if (error) {
        // Use the user-friendly error handler
        const friendlyError = getUserFriendlyAuthError(error)
        
        // Log fix steps to console for CORS/configuration errors
        if (isCorsError(error) && friendlyError.fixSteps) {
          console.error('🔧 CORS Configuration Error - Fix Steps:')
          friendlyError.fixSteps.forEach(step => console.error(`  ${step}`))
        }
        
        throw new Error(friendlyError.message)
      }

      // Set session if available (may be null if email confirmation is required)
      if (data.session) {
        setSession(data.session)
        setUser(data.user ?? null)
        setAuthToken(data.session.access_token ?? null)
      } else {
        // Email confirmation required - session will be set after confirmation
        setSession(null)
        setUser(null)
        setAuthToken(null)
      }
      
      return { session: data.session, user: data.user }
    } catch (err: any) {
      // Use the user-friendly error handler for network errors
      const friendlyError = getUserFriendlyAuthError(err)
      
      // Log fix steps to console for CORS/configuration errors
      if (isCorsError(err) && friendlyError.fixSteps) {
        console.error('🔧 Configuration Error - Fix Steps:')
        friendlyError.fixSteps.forEach(step => console.error(`  ${step}`))
      }
      
      throw new Error(friendlyError.message)
    }

  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setAuthToken(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      loading,
      signInWithProvider,
      signInWithPassword,
      signUpWithPassword,
      signOut,
    }),
    [session, user, loading, signInWithProvider, signInWithPassword, signUpWithPassword, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

import { useEffect } from 'react'
import { useRouter } from 'next/router'
import supabase from '../../lib/supabaseClient'

const AuthCallback = () => {
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) return
    const handleAuth = async () => {
      const { searchParams, hash } = new URL(window.location.href)
      
      // Handle email confirmation (token and type params)
      const token = searchParams.get('token')
      const type = searchParams.get('type')
      
      if (token && type) {
        // Email confirmation flow - Supabase sends token and type as query params
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: type as 'email' | 'signup' | 'recovery' | 'invite' | 'magiclink' | 'email_change',
          })
          
          if (error) {
            console.error('Failed to verify email:', error)
            await router.replace('/login?error=email_verification_failed&message=' + encodeURIComponent(error.message))
            return
          }
          
          if (data.session) {
            // Email confirmed, session created
            await router.replace('/dashboard')
            return
          }
        } catch (err: any) {
          console.error('Error verifying email:', err)
          await router.replace('/login?error=email_verification_failed')
          return
        }
      }
      
      // Handle OAuth PKCE flow (code param)
      const code = searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          console.error('Failed to exchange code for session', error)
          await router.replace('/login?error=oauth_failed')
          return
        }
        await router.replace('/dashboard')
        return
      }
      
      // Handle hash fragment (email confirmation or OAuth implicit flow)
      if (hash) {
        const hashParams = new URLSearchParams(hash.substring(1))
        const access_token = hashParams.get('access_token')
        const refresh_token = hashParams.get('refresh_token')
        const type = hashParams.get('type')
        
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token })
          if (error) {
            console.error('Failed to set session', error)
            const errorMsg = type === 'email' ? 'email_verification_failed' : 'session_failed'
            await router.replace(`/login?error=${errorMsg}`)
            return
          }
          await router.replace('/dashboard')
          return
        }
      }
      
      // If no auth params found, redirect to login
      await router.replace('/login')
    }
    void handleAuth()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center text-gray-600">Signing you in…</div>
    </div>
  )
}

export default AuthCallback

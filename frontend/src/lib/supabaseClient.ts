import { createClient } from '@supabase/supabase-js'
import { validateSupabaseConfig } from './supabaseConfig'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate configuration
if (typeof window !== 'undefined') {
  const configStatus = validateSupabaseConfig()
  
  if (!configStatus.isValid) {
    console.error('❌ Supabase Configuration Errors:')
    configStatus.errors.forEach(error => console.error(`  - ${error}`))
    
    if (configStatus.fixSteps.length > 0) {
      console.error('\n📋 Fix Steps:')
      configStatus.fixSteps.forEach(step => console.error(`  ${step}`))
    }
    
    // In production, fail fast
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Supabase configuration is invalid. Please check your environment variables.')
    }
  }
  
  if (configStatus.warnings.length > 0) {
    console.warn('⚠️ Supabase Configuration Warnings:')
    configStatus.warnings.forEach(warning => console.warn(`  - ${warning}`))
  }
}

// Only use fallback values in development
const finalSupabaseUrl = supabaseUrl || (process.env.NODE_ENV === 'development' ? 'https://placeholder.supabase.co' : '')
const finalSupabaseKey = supabaseKey || (process.env.NODE_ENV === 'development' ? 'placeholder-key' : '')

export const supabase = createClient(
  finalSupabaseUrl,
  finalSupabaseKey,
  {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      autoRefreshToken: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'supabase.auth.token',
    },
  }
)

export default supabase

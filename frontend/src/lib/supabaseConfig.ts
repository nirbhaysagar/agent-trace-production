/**
 * Supabase Configuration Validator
 * Validates Supabase configuration and provides helpful error messages
 */

export interface SupabaseConfigStatus {
  isValid: boolean
  errors: string[]
  warnings: string[]
  fixSteps: string[]
}

export function validateSupabaseConfig(): SupabaseConfigStatus {
  const errors: string[] = []
  const warnings: string[] = []
  const fixSteps: string[] = []

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Check if environment variables are set
  if (!supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl.includes('your_')) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is missing or contains placeholder value')
    fixSteps.push('1. Go to your Supabase project dashboard')
    fixSteps.push('2. Navigate to Settings → API')
    fixSteps.push('3. Copy the "Project URL" and set it as NEXT_PUBLIC_SUPABASE_URL in your .env.local file')
  }

  if (!supabaseKey || supabaseKey.includes('placeholder') || supabaseKey.includes('your_')) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or contains placeholder value')
    fixSteps.push('1. Go to your Supabase project dashboard')
    fixSteps.push('2. Navigate to Settings → API')
    fixSteps.push('3. Copy the "anon public" key and set it as NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file')
  }

  // Validate URL format
  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    try {
      const url = new URL(supabaseUrl)
      if (url.protocol !== 'https:') {
        warnings.push('Supabase URL should use HTTPS protocol')
      }
      if (!url.hostname.includes('supabase.co')) {
        warnings.push('Supabase URL should be from supabase.co domain')
      }
    } catch (e) {
      errors.push('NEXT_PUBLIC_SUPABASE_URL is not a valid URL')
    }
  }

  // Validate key format (JWT tokens start with eyJ)
  if (supabaseKey && !supabaseKey.includes('placeholder')) {
    if (!supabaseKey.startsWith('eyJ')) {
      warnings.push('Supabase anon key should be a valid JWT token (starts with eyJ)')
    }
    if (supabaseKey.length < 100) {
      warnings.push('Supabase anon key seems too short (should be ~200+ characters)')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fixSteps: fixSteps.length > 0 ? fixSteps : []
  }
}

/**
 * Get helpful CORS error message with fix steps
 */
export function getCorsErrorMessage(): { message: string; fixSteps: string[] } {
  return {
    message: 'CORS Error: Supabase is blocking requests from your origin. This is a Supabase dashboard configuration issue.',
    fixSteps: [
      '1. Go to https://app.supabase.com and select your project',
      '2. Navigate to Authentication → URL Configuration',
      '3. Set "Site URL" to: http://localhost:3000 (for development)',
      '4. Add to "Redirect URLs" (one per line):',
      '   - http://localhost:3000',
      '   - http://localhost:3000/**',
      '   - http://localhost:3000/auth/callback',
      '5. Click "Save" and wait 30-60 seconds for changes to propagate',
      '6. Hard refresh your browser (Cmd+Shift+R or Ctrl+Shift+R)',
      '',
      'Note: For production, use your production domain instead of localhost:3000'
    ]
  }
}

/**
 * Check if error is a CORS error
 */
export function isCorsError(error: any): boolean {
  if (!error) return false
  
  const errorMessage = error.message || error.toString() || ''
  const errorStatus = error.status || error.statusCode || 0
  
  return (
    errorMessage.includes('CORS') ||
    errorMessage.includes('Access-Control-Allow-Origin') ||
    errorMessage.includes('blocked by CORS policy') ||
    errorMessage.includes('Failed to fetch') ||
    (errorStatus === 403 && errorMessage.includes('Forbidden'))
  )
}

/**
 * Get user-friendly error message with actionable steps
 */
export function getUserFriendlyAuthError(error: any): { message: string; fixSteps?: string[] } {
  if (!error) {
    return { message: 'An unknown error occurred' }
  }

  const errorMessage = error.message || error.toString() || ''
  const errorStatus = error.status || error.statusCode || 0

  // CORS errors
  if (isCorsError(error)) {
    const corsInfo = getCorsErrorMessage()
    return {
      message: corsInfo.message,
      fixSteps: corsInfo.fixSteps
    }
  }

  // 403 Forbidden
  if (errorStatus === 403) {
    return {
      message: 'Access forbidden. This usually means the redirect URL is not whitelisted in Supabase.',
      fixSteps: [
        '1. Go to Supabase Dashboard → Authentication → URL Configuration',
        '2. Add your redirect URL to the "Redirect URLs" list',
        '3. Save and wait 30-60 seconds',
        '4. Try again'
      ]
    }
  }

  // Network errors
  if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
    return {
      message: 'Network error. Please check your internet connection and Supabase configuration.',
      fixSteps: [
        '1. Check your internet connection',
        '2. Verify Supabase is accessible: https://status.supabase.com',
        '3. Check your .env.local file has correct Supabase credentials',
        '4. Restart your development server'
      ]
    }
  }

  // Email already exists
  if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
    return {
      message: 'An account with this email already exists. Please sign in instead.'
    }
  }

  // Password errors
  if (errorMessage.includes('password') && errorMessage.includes('weak')) {
    return {
      message: 'Password is too weak. Please use at least 8 characters with a mix of letters, numbers, and symbols.'
    }
  }

  // Email errors
  if (errorMessage.includes('email') && errorMessage.includes('invalid')) {
    return {
      message: 'Invalid email address. Please check and try again.'
    }
  }

  // Default: return the error message
  return {
    message: errorMessage || 'Authentication failed. Please try again.'
  }
}


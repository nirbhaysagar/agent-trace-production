# Supabase Configuration Guide

This guide helps you configure Supabase correctly to avoid CORS and authentication errors.

## Quick Setup Checklist

- [ ] Supabase project created
- [ ] Environment variables set in `.env.local`
- [ ] Site URL configured in Supabase dashboard
- [ ] Redirect URLs configured in Supabase dashboard
- [ ] Email confirmation settings configured (if needed)

## Step-by-Step Configuration

### 1. Create/Select Supabase Project

1. Go to https://app.supabase.com
2. Create a new project or select existing project
3. Note your project URL (e.g., `https://xxxxx.supabase.co`)

### 2. Get API Credentials

1. In Supabase dashboard, go to **Settings → API**
2. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Configure Environment Variables

Create/update `frontend/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Important:** 
- Never commit `.env.local` to git (it's in `.gitignore`)
- Use `NEXT_PUBLIC_` prefix for client-side variables
- Restart your dev server after changing `.env.local`

### 4. Configure Authentication URLs (CRITICAL)

This is the most common source of CORS errors!

1. Go to **Authentication → URL Configuration**
2. Set **Site URL**:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`
3. Add **Redirect URLs** (one per line):
   ```
   http://localhost:3000
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   http://localhost:3000/dashboard
   ```
   For production, replace `localhost:3000` with your domain.

4. **Click Save** and wait 30-60 seconds for changes to propagate

### 5. Configure Email Settings

1. Go to **Authentication → Providers → Email**
2. Configure based on your needs:
   - **Enable email provider**: ON
   - **Confirm email**: OFF (for development) or ON (for production)
   - **Secure email change**: ON (recommended)

### 6. Test Configuration

1. Restart your Next.js dev server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Open browser console and check for:
   - ✅ No Supabase configuration errors
   - ✅ No CORS warnings

3. Try signing up/signing in

## Common Errors and Fixes

### CORS Error: "No 'Access-Control-Allow-Origin' header"

**Cause:** Site URL or Redirect URLs not configured correctly

**Fix:**
1. Go to Supabase → Authentication → URL Configuration
2. Verify Site URL matches your frontend URL exactly
3. Add all redirect URLs to the list
4. Save and wait 30-60 seconds
5. Hard refresh browser (Cmd+Shift+R)

### 403 Forbidden Error

**Cause:** Redirect URL not whitelisted

**Fix:**
1. Add the redirect URL to Supabase → Authentication → URL Configuration
2. Make sure URL matches exactly (including protocol http/https)
3. Save and wait

### "Invalid API key" Error

**Cause:** Wrong or missing API key

**Fix:**
1. Check `.env.local` has correct `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Copy fresh key from Supabase → Settings → API
3. Restart dev server

### "Configuration is missing" Error

**Cause:** Environment variables not loaded

**Fix:**
1. Verify `.env.local` exists in `frontend/` directory
2. Check variable names start with `NEXT_PUBLIC_`
3. Restart dev server (required after changing `.env.local`)

## Production Configuration

For production deployment:

1. **Set environment variables** in your hosting platform (Vercel, etc.)
2. **Update Site URL** in Supabase to your production domain
3. **Add production redirect URLs**:
   ```
   https://yourdomain.com
   https://yourdomain.com/**
   https://yourdomain.com/auth/callback
   ```
4. **Enable email confirmation** (recommended for production)
5. **Review security settings** in Supabase dashboard

## Automatic Configuration Validation

The app now includes automatic configuration validation:

- ✅ Checks environment variables on startup
- ✅ Validates Supabase URL and key format
- ✅ Shows helpful error messages with fix steps
- ✅ Logs configuration warnings to console

If you see configuration errors in the console, follow the fix steps provided.

## Troubleshooting

### Changes Not Taking Effect

1. **Wait 30-60 seconds** after saving Supabase settings
2. **Hard refresh browser** (Cmd+Shift+R / Ctrl+Shift+R)
3. **Clear browser cache** or use incognito mode
4. **Restart dev server**

### Still Getting CORS Errors

1. Double-check Site URL matches exactly (no trailing slash)
2. Verify you're using `http://` for localhost (not `https://`)
3. Check browser console for specific error message
4. Try incognito/private browsing mode
5. Verify Supabase project is active (not paused)

### Need More Help?

- Check Supabase docs: https://supabase.com/docs/guides/auth
- Check browser console for detailed error messages
- Review the fix steps logged in console for CORS errors

## Best Practices

1. **Never commit `.env.local`** - it contains secrets
2. **Use different Supabase projects** for dev/staging/production
3. **Test authentication** after any Supabase configuration changes
4. **Keep redirect URLs updated** when adding new routes
5. **Monitor Supabase dashboard** for any service issues

## Quick Reference

| Setting | Development | Production |
|---------|------------|------------|
| Site URL | `http://localhost:3000` | `https://yourdomain.com` |
| Redirect URLs | `http://localhost:3000/**` | `https://yourdomain.com/**` |
| Email Confirmation | OFF (optional) | ON (recommended) |
| Environment File | `.env.local` | Hosting platform env vars |

---

**Last Updated:** Configuration validation and error handling added to prevent future issues.


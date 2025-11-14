# Vercel Deployment Guide

## Fixing 404 Errors on Vercel

### Common Causes:
1. **Missing environment variables** - Backend API URL not configured
2. **Routing issues** - Next.js dynamic routes not properly configured
3. **Build errors** - Check Vercel build logs
4. **Backend not accessible** - CORS or network issues

### Step 1: Configure Environment Variables in Vercel

1. Go to your Vercel project dashboard: https://vercel.com/dashboard
2. Select your project: `agent-trace-production`
3. Navigate to **Settings** → **Environment Variables**
4. Add these variables (for Production, Preview, and Development):
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
5. **Important:** After adding variables, **redeploy** your application

### Step 2: Verify Backend is Running

1. Test your backend URL:
   ```bash
   curl https://your-backend-url.railway.app/health
   ```
2. Should return: `{"status": "healthy", "timestamp": "..."}`
3. If backend is not accessible, deploy it first on Railway/Fly.io

### Step 3: Check Build Logs

1. Go to **Deployments** tab in Vercel
2. Click on the failed deployment
3. Check **Build Logs** for errors
4. Common issues:
   - Missing dependencies
   - TypeScript errors
   - Environment variable errors

### Step 4: Fix Common 404 Issues

#### Issue: 404 on all routes
**Solution:** 
- Check if `next.config.js` exists and is valid
- Ensure all pages are in `frontend/src/pages/` directory
- Verify build completes successfully

#### Issue: 404 on dynamic routes (like `/trace/[id]`)
**Solution:**
- This is normal for Next.js - ensure the route file exists: `frontend/src/pages/trace/[id].tsx`
- Check Vercel build logs for TypeScript errors

#### Issue: 404 on API calls
**Solution:**
- Verify `NEXT_PUBLIC_API_URL` is set correctly in Vercel
- Check backend CORS settings allow your Vercel domain
- Test backend URL directly: `curl https://your-backend-url/health`

### Step 5: Redeploy After Changes

After fixing environment variables or configuration:
1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger automatic deployment

## Alternative Deployment Options

### Option 1: Railway (Full Stack)
- Deploy both frontend and backend on Railway
- Easier to manage, single platform
- Better for full-stack apps

### Option 2: Netlify
- Similar to Vercel
- Good Next.js support
- Easy environment variable management

### Option 3: Self-Hosted (VPS)
- More control
- Requires server management
- Use Docker for easier deployment

## Quick Fix Checklist

- [ ] Environment variables set in Vercel
- [ ] Backend API is accessible (test with curl)
- [ ] Build succeeds without errors
- [ ] Check Vercel function logs for runtime errors
- [ ] Verify CORS settings on backend
- [ ] Check Next.js routing configuration


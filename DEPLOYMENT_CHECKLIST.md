# ✅ Pre-Deployment Checklist

## 🔍 Code Issues Fixed

All deployment issues have been fixed:

- ✅ **Removed hardcoded localhost URLs** - Now uses environment variables with proper error handling
- ✅ **Centralized API configuration** - All API calls use the centralized `api.ts` module
- ✅ **Improved environment variable validation** - Fails fast in production if missing
- ✅ **Fixed Supabase client** - Better error handling for missing credentials
- ✅ **Backend CORS** - Improved configuration for production
- ✅ **No TypeScript errors** - All files pass linting

## 📋 Pre-Deployment Checklist

### Frontend (Vercel)

- [ ] **Root Directory Set**: Vercel project root is set to `frontend/`
- [ ] **Environment Variables Added**:
  - [ ] `NEXT_PUBLIC_API_URL` - Your backend URL (e.g., `https://your-app.railway.app`)
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase URL
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- [ ] **Build Test**: Run `npm run build` locally - should succeed
- [ ] **Type Check**: Run `npm run type-check` - should pass

### Backend (Railway/Fly.io)

- [ ] **Environment Variables Added**:
  - [ ] `SUPABASE_URL` - Your Supabase URL
  - [ ] `SUPABASE_ANON_KEY` - Your Supabase anon key
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` - Your service role key (optional but recommended)
  - [ ] `FRONTEND_URL` - Your Vercel URL (e.g., `https://your-app.vercel.app`)
  - [ ] `ALLOWED_ORIGINS` - Your Vercel domains (comma-separated)
  - [ ] `DEBUG` - Set to `False` for production
- [ ] **CORS Configured**: `ALLOWED_ORIGINS` includes your Vercel domain
- [ ] **Health Check**: Backend `/health` endpoint is accessible

### Database (Supabase)

- [ ] **Schema Run**: `database/schema.sql` executed in Supabase SQL Editor
- [ ] **Subscription Schema**: `database/subscription_schema.sql` executed (if using subscriptions)
- [ ] **OAuth Redirect URLs**: Added Vercel domain to Supabase Auth settings
  - Format: `https://your-app.vercel.app/auth/callback`

### Testing

- [ ] **Local Build Test**:
  ```bash
  cd frontend
  npm install
  npm run build
  npm run type-check
  ```
- [ ] **Backend Health Check**:
  ```bash
  curl https://your-backend.railway.app/health
  ```
- [ ] **Frontend Accessible**: Visit Vercel URL - should load
- [ ] **API Calls Work**: Check browser console for errors
- [ ] **OAuth Works**: Test sign in with Google/GitHub
- [ ] **Trace Upload Works**: Test uploading a trace

## 🚨 Common Deployment Errors & Fixes

### Error: "NEXT_PUBLIC_API_URL is not set"
**Fix**: Add `NEXT_PUBLIC_API_URL` to Vercel environment variables and redeploy

### Error: "404 Not Found" on all pages
**Fix**: Set Root Directory to `frontend` in Vercel project settings

### Error: "CORS policy" errors
**Fix**: Add Vercel URL to backend `ALLOWED_ORIGINS` environment variable

### Error: "Supabase configuration is missing"
**Fix**: Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vercel

### Error: Build fails with TypeScript errors
**Fix**: Run `npm run type-check` locally and fix errors before deploying

### Error: "Module not found"
**Fix**: Ensure `node_modules` is not in `.gitignore` or run `npm install` in build

## 📝 Environment Variables Reference

### Vercel (Frontend)
```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://dzvadxyndemwfyffigzw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Backend (Railway/Fly.io)
```bash
SUPABASE_URL=https://dzvadxyndemwfyffigzw.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FRONTEND_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app,https://*.vercel.app
DEBUG=False
```

## ✅ Verification Steps

1. **Check Build Logs**: Vercel deployment should complete without errors
2. **Check Runtime Logs**: No errors in Vercel function logs
3. **Test Homepage**: Should load without errors
4. **Test API**: Browser console should show successful API calls
5. **Test Auth**: Sign in should work
6. **Test Features**: Upload trace, view dashboard, etc.

## 🎯 Quick Test Commands

```bash
# Test frontend build
cd frontend
npm install
npm run build
npm run type-check

# Test backend (if running locally)
cd backend
source venv/bin/activate
python -m pytest  # if you have tests
uvicorn main:app --reload  # test locally

# Test production URLs
curl https://your-app.vercel.app
curl https://your-backend.railway.app/health
```

---

**All code issues have been fixed. Follow this checklist before deploying!** ✅


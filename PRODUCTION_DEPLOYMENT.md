# 🚀 Production Deployment Guide - AgentTrace

## 📋 Overview

This guide will help you deploy AgentTrace to production with:
- **Frontend**: Vercel (Next.js)
- **Backend**: Railway/Render/Fly.io (FastAPI)
- **Database**: Supabase (already configured)

---

## 🎯 Step 1: Deploy Backend First (REQUIRED)

### Option A: Railway (Recommended - Easiest)

#### Commands:
```bash
# 1. Go to https://railway.app and sign up/login
# 2. Click "New Project" → "Deploy from GitHub repo"
# 3. Select your repository: nirbhaysagar/agent-trace-production
# 4. In Railway dashboard:
#    - Click on your service
#    - Go to Settings → Root Directory → Set to: backend
#    - Go to Settings → Start Command → Set to: uvicorn main:app --host 0.0.0.0 --port $PORT
```

#### Environment Variables in Railway:
```
SUPABASE_URL=https://dzvadxyndemwfyffigzw.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6dmFkeHluZGVtd2Z5ZmZpZ3p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NjQ5MjYsImV4cCI6MjA3ODI0MDkyNn0.ULaJDDdqQSyTtYN2jT-s67CIWraJn358ApX6PAS4Az0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6dmFkeHluZGVtd2Z5ZmZpZ3p3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjY2NDkyNiwiZXhwIjoyMDc4MjQwOTI2fQ.ZlsnkllxdKBZU-Jv1kQxqtBm7HQ9zkdnT9zwek4oHdM
FRONTEND_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com
DEBUG=False
API_PORT=8000
```

**Note**: Replace `https://your-app.vercel.app` with your actual Vercel URL after Step 2.

#### Get Backend URL:
- Railway will provide a URL like: `https://your-app.railway.app`
- Copy this URL - you'll need it for frontend deployment

---

### Option B: Render

#### Commands:
```bash
# 1. Go to https://render.com and sign up/login
# 2. Click "New" → "Web Service"
# 3. Connect your GitHub repository
# 4. Configure:
#    - Name: agent-trace-backend
#    - Root Directory: backend
#    - Environment: Python 3
#    - Build Command: pip install -r requirements.txt
#    - Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

#### Environment Variables in Render:
Same as Railway (see above)

---

### Option C: Fly.io

#### Commands:
```bash
# 1. Install Fly CLI
# Windows (PowerShell):
iwr https://fly.io/install.ps1 -useb | iex

# 2. Login to Fly.io
fly auth login

# 3. Navigate to backend directory
cd backend

# 4. Initialize Fly.io app
fly launch

# 5. Follow prompts:
#    - App name: agent-trace-backend (or your choice)
#    - Region: Choose closest to you
#    - PostgreSQL: No (we use Supabase)
#    - Redis: No

# 6. Set environment variables
fly secrets set SUPABASE_URL=https://dzvadxyndemwfyffigzw.supabase.co
fly secrets set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6dmFkeHluZGVtd2Z5ZmZpZ3p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NjQ5MjYsImV4cCI6MjA3ODI0MDkyNn0.ULaJDDdqQSyTtYN2jT-s67CIWraJn358ApX6PAS4Az0
fly secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6dmFkeHluZGVtd2Z5ZmZpZ3p3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjY2NDkyNiwiZXhwIjoyMDc4MjQwOTI2fQ.ZlsnkllxdKBZU-Jv1kQxqtBm7HQ9zkdnT9zwek4oHdM
fly secrets set FRONTEND_URL=https://your-app.vercel.app
fly secrets set ALLOWED_ORIGINS=https://your-app.vercel.app
fly secrets set DEBUG=False

# 7. Deploy
fly deploy

# 8. Get your URL
fly info
```

---

## 🎨 Step 2: Deploy Frontend to Vercel

### Commands:

```bash
# 1. Install Vercel CLI (if not installed)
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Navigate to project root
cd C:\Users\admin\Downloads\agent-trace-production-main\agent-trace-production-main

# 4. Deploy to Vercel
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (Select your account)
# - Link to existing project? No
# - What's your project's name? agent-trace (or your choice)
# - In which directory is your code located? ./frontend
# - Want to override settings? No
```

### Or Deploy via Vercel Dashboard:

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository: `nirbhaysagar/agent-trace-production`
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

### Environment Variables in Vercel:

Go to Project Settings → Environment Variables and add:

```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://dzvadxyndemwfyffigzw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6dmFkeHluZGVtd2Z5ZmZpZ3p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NjQ5MjYsImV4cCI6MjA3ODI0MDkyNn0.ULaJDDdqQSyTtYN2jT-s67CIWraJn358ApX6PAS4Az0
```

**Important**: Replace `https://your-backend.railway.app` with your actual backend URL from Step 1.

---

## 🔄 Step 3: Update Backend with Frontend URL

After deploying frontend, update backend environment variables:

### Railway:
1. Go to Railway dashboard
2. Click on your backend service
3. Go to Variables tab
4. Update `FRONTEND_URL` to your Vercel URL
5. Update `ALLOWED_ORIGINS` to include your Vercel domain

### Render:
1. Go to Render dashboard
2. Click on your service
3. Go to Environment tab
4. Update `FRONTEND_URL` and `ALLOWED_ORIGINS`

### Fly.io:
```bash
fly secrets set FRONTEND_URL=https://your-app.vercel.app
fly secrets set ALLOWED_ORIGINS=https://your-app.vercel.app
fly deploy
```

---

## 🗄️ Step 4: Configure Supabase

### 1. Update Auth Redirect URLs:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Add to **Redirect URLs**:
   ```
   https://your-app.vercel.app/auth/callback
   https://your-app.vercel.app/**
   ```
5. Add to **Site URL**:
   ```
   https://your-app.vercel.app
   ```

### 2. Verify Database Schema:

1. Go to **SQL Editor** in Supabase
2. Run `database/schema.sql` (if not already done)
3. Run `database/subscription_schema.sql` (if using subscriptions)
4. Run `database/auth_schema.sql` (if not already done)

---

## ✅ Step 5: Production Checklist

### Backend:
- [ ] Backend is deployed and accessible
- [ ] Health check endpoint works: `https://your-backend.railway.app/health`
- [ ] All environment variables are set
- [ ] CORS is configured correctly
- [ ] `DEBUG=False` in production

### Frontend:
- [ ] Frontend is deployed on Vercel
- [ ] All environment variables are set
- [ ] Build succeeds without errors
- [ ] Site is accessible at Vercel URL

### Database:
- [ ] Supabase redirect URLs are configured
- [ ] Database schema is applied
- [ ] RLS (Row Level Security) policies are set (if needed)

### Testing:
- [ ] Sign up works
- [ ] Sign in works
- [ ] API calls work (check browser console)
- [ ] No CORS errors
- [ ] Traces can be uploaded
- [ ] AI features work (if enabled)

---

## 🔧 Troubleshooting

### Backend not accessible:
```bash
# Check backend logs
# Railway: Go to Deployments → View logs
# Render: Go to Logs tab
# Fly.io: fly logs
```

### CORS errors:
- Verify `ALLOWED_ORIGINS` includes your Vercel domain
- Check backend logs for CORS errors
- Ensure `FRONTEND_URL` is set correctly

### Authentication errors:
- Verify Supabase redirect URLs are configured
- Check that environment variables match in both frontend and backend
- Verify Supabase keys are correct

### Build failures:
```bash
# Test build locally first
cd frontend
npm install
npm run build
```

---

## 🌐 Step 6: Custom Domain (Optional)

### Vercel:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update Supabase redirect URLs with new domain

### Backend:
- Update `ALLOWED_ORIGINS` to include custom domain
- Update `FRONTEND_URL` if needed

---

## 📊 Monitoring & Analytics

### Vercel Analytics:
- Enable in Project Settings → Analytics
- View performance metrics in dashboard

### Backend Monitoring:
- Railway: Built-in metrics in dashboard
- Render: View logs and metrics
- Fly.io: `fly metrics` command

---

## 🔐 Security Checklist

- [ ] All environment variables are set (no hardcoded secrets)
- [ ] `DEBUG=False` in production
- [ ] CORS is properly configured
- [ ] Supabase RLS policies are enabled (if needed)
- [ ] HTTPS is enabled (automatic on Vercel/Railway)
- [ ] API rate limiting is configured
- [ ] Error messages don't expose sensitive information

---

## 🚀 Quick Deploy Commands Summary

```bash
# 1. Backend (Railway - via dashboard)
# Go to railway.app → New Project → Deploy from GitHub

# 2. Frontend (Vercel)
cd C:\Users\admin\Downloads\agent-trace-production-main\agent-trace-production-main
vercel

# Or use Vercel dashboard:
# Go to vercel.com → Add New Project → Import GitHub repo
```

---

## 📞 Support

If you encounter issues:
1. Check deployment logs
2. Verify all environment variables
3. Test endpoints individually
4. Check browser console for errors
5. Review Supabase logs

---

**Your app should now be live in production! 🎉**


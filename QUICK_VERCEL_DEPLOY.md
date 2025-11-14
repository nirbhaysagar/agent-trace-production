# ⚡ Quick Vercel Deployment (5 Minutes)

## 🎯 What You Need

1. **Backend URL** (from Railway/Fly.io) - e.g., `https://your-app.railway.app`
2. **Supabase credentials** (already have these)
3. **GitHub repository** connected

---

## 🚀 Quick Steps

### 1. Deploy Backend (if not done)

**Railway (Easiest):**
1. Go to https://railway.app → New Project → Deploy from GitHub
2. Select your repo → Set root to `backend/`
3. Add environment variables (see below)
4. Copy the Railway URL

### 2. Deploy Frontend to Vercel

**Via Dashboard:**
1. Go to https://vercel.com → Add New Project
2. Import your GitHub repo
3. **CRITICAL:** Set **Root Directory** to `frontend` ⚠️
4. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   NEXT_PUBLIC_SUPABASE_URL=https://dzvadxyndemwfyffigzw.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6dmFkeHluZGVtd2Z5ZmZpZ3p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NjQ5MjYsImV4cCI6MjA3ODI0MDkyNn0.ULaJDDdqQSyTtYN2jT-s67CIWraJn358ApX6PAS4Az0
   ```
5. Click Deploy

**Via CLI:**
```bash
cd frontend
npm i -g vercel
vercel login
vercel
# Follow prompts, set root to frontend
```

### 3. Fix Backend CORS

Update `backend/main.py` line 41-44:
```python
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,https://your-app.vercel.app"
).split(",")
```

Add to backend environment:
```bash
ALLOWED_ORIGINS=https://your-app.vercel.app,https://*.vercel.app
```

### 4. Update Supabase OAuth

1. Supabase Dashboard → Authentication → URL Configuration
2. Add redirect URL: `https://your-app.vercel.app/auth/callback`

---

## ✅ Test

1. Visit your Vercel URL
2. Check browser console for errors
3. Try signing in
4. Test trace upload

---

## 🐛 Common Error Fixes

**Error: "404 Not Found"**
→ Set Root Directory to `frontend` in Vercel settings

**Error: "API calls failing"**
→ Add Vercel URL to backend `ALLOWED_ORIGINS` and restart

**Error: "Build failed"**
→ Check build logs, fix TypeScript errors

**Error: "Environment variable not found"**
→ Add variables in Vercel, then **redeploy**

---

## 📋 Environment Variables Summary

**Vercel (Frontend):**
- `NEXT_PUBLIC_API_URL` = Your backend URL
- `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase URL  
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase key

**Backend (Railway/Fly.io):**
- `SUPABASE_URL` = Your Supabase URL
- `SUPABASE_ANON_KEY` = Your Supabase key
- `FRONTEND_URL` = Your Vercel URL
- `ALLOWED_ORIGINS` = Your Vercel domains

---

**That's it! Your app should be live.** 🎉


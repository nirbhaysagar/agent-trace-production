# 🚀 Complete Vercel Deployment Guide

## ⚠️ Important: Project Structure

Your project has a **monorepo structure** with:
- `frontend/` - Next.js app (deploy this to Vercel)
- `backend/` - FastAPI app (deploy separately to Railway/Fly.io)

**Vercel will only deploy the frontend!**

---

## 📋 Step-by-Step Deployment

### Step 1: Deploy Backend First (REQUIRED)

**Option A: Railway (Recommended)**
1. Go to https://railway.app
2. Create new project → Deploy from GitHub
3. Connect your repository
4. Select `backend/` folder as root
5. Add environment variables:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```
6. Railway auto-detects Python and installs dependencies
7. Copy the Railway URL (e.g., `https://your-app.railway.app`)

**Option B: Fly.io**
```bash
cd backend
fly launch
# Follow prompts
fly deploy
```

**Option C: Render**
1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repo
4. Root Directory: `backend`
5. Build Command: `pip install -r requirements.txt`
6. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

### Step 2: Deploy Frontend to Vercel

#### Method 1: Vercel Dashboard (Easiest)

1. **Go to Vercel Dashboard:**
   - Visit https://vercel.com
   - Sign in with GitHub

2. **Import Project:**
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - **IMPORTANT:** Set **Root Directory** to `frontend`
     - Click "Edit" next to Root Directory
     - Enter: `frontend`
     - Click "Continue"

3. **Configure Build Settings:**
   - Framework Preset: **Next.js** (auto-detected)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

4. **Add Environment Variables:**
   Click "Environment Variables" and add:

   ```bash
   # Required
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
   NEXT_PUBLIC_SUPABASE_URL=https://dzvadxyndemwfyffigzw.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6dmFkeHluZGVtd2Z5ZmZpZ3p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NjQ5MjYsImV4cCI6MjA3ODI0MDkyNn0.ULaJDDdqQSyTtYN2jT-s67CIWraJn358ApX6PAS4Az0
   
   # Optional (for Stripe)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

   **Important:** Add these for **Production**, **Preview**, and **Development** environments.

5. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

#### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend directory
cd frontend

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name? agent-trace
# - Directory? ./
# - Override settings? N

# Add environment variables
vercel env add NEXT_PUBLIC_API_URL
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# Deploy to production
vercel --prod
```

---

### Step 3: Fix Common Errors

#### Error: "404 Not Found" on all pages

**Cause:** Vercel is deploying from root instead of `frontend/` directory

**Solution:**
1. Go to Vercel Dashboard → Your Project → Settings
2. Scroll to "Root Directory"
3. Click "Edit"
4. Set to: `frontend`
5. Save and redeploy

#### Error: "Module not found" or build errors

**Cause:** Missing dependencies or TypeScript errors

**Solution:**
```bash
# Test build locally first
cd frontend
npm install
npm run build

# Fix any errors, then redeploy
```

#### Error: "API calls failing" or CORS errors

**Cause:** Backend CORS not configured for Vercel domain

**Solution:**
Update `backend/main.py`:
```python
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,https://your-app.vercel.app"
).split(",")
```

Then add to backend environment:
```bash
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-git-main.vercel.app
```

#### Error: "Environment variable not found"

**Cause:** Environment variables not set in Vercel

**Solution:**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add all required variables
3. **Redeploy** after adding variables (they don't apply to existing deployments)

---

### Step 4: Update Supabase OAuth Redirect URLs

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add to **Redirect URLs**:
   ```
   https://your-app.vercel.app/auth/callback
   https://your-app-git-main.vercel.app/auth/callback
   https://your-app-*.vercel.app/auth/callback
   ```
3. Save changes

---

### Step 5: Verify Deployment

1. **Check Frontend:**
   ```bash
   curl https://your-app.vercel.app
   # Should return HTML
   ```

2. **Check Backend:**
   ```bash
   curl https://your-backend.railway.app/health
   # Should return: {"status": "healthy", ...}
   ```

3. **Test Full Flow:**
   - Visit your Vercel URL
   - Try signing in
   - Upload a trace
   - Check if API calls work

---

## 🔧 Quick Fix Commands

```bash
# 1. Test build locally
cd frontend
npm install
npm run build

# 2. Check for TypeScript errors
npm run type-check

# 3. Test production build
npm run build
npm start
# Visit http://localhost:3000

# 4. Deploy with Vercel CLI
cd frontend
vercel --prod
```

---

## 📝 Environment Variables Checklist

### Frontend (Vercel):
- [ ] `NEXT_PUBLIC_API_URL` - Your backend URL
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - (Optional) Stripe key

### Backend (Railway/Fly.io):
- [ ] `SUPABASE_URL` - Your Supabase URL
- [ ] `SUPABASE_ANON_KEY` - Your Supabase anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Your service role key
- [ ] `FRONTEND_URL` - Your Vercel URL
- [ ] `ALLOWED_ORIGINS` - Your Vercel domains
- [ ] `STRIPE_SECRET_KEY` - (Optional) Stripe key
- [ ] `STRIPE_WEBHOOK_SECRET` - (Optional) Webhook secret

---

## 🐛 Troubleshooting

### Build fails with "Cannot find module"
**Solution:** Make sure Root Directory is set to `frontend` in Vercel settings

### Pages show 404
**Solution:** 
- Check build logs for errors
- Verify all pages are in `frontend/src/pages/`
- Check Next.js routing

### API calls return CORS errors
**Solution:**
- Add Vercel domain to backend `ALLOWED_ORIGINS`
- Restart backend after updating CORS

### Environment variables not working
**Solution:**
- Variables must start with `NEXT_PUBLIC_` to be available in browser
- Redeploy after adding variables
- Check variable names match exactly

---

## 🎯 Next Steps After Deployment

1. **Set up custom domain** (optional):
   - Vercel Dashboard → Settings → Domains
   - Add your domain
   - Update DNS records

2. **Enable analytics** (optional):
   - Vercel Dashboard → Analytics
   - Enable Web Analytics

3. **Set up monitoring:**
   - Check Vercel function logs
   - Monitor backend logs on Railway/Fly.io

4. **Test production:**
   - Test all features
   - Verify OAuth works
   - Check subscription flow

---

## 📚 Resources

- [Vercel Next.js Documentation](https://vercel.com/docs/frameworks/nextjs)
- [Railway Python Deployment](https://docs.railway.app/languages/python)
- [Supabase OAuth Setup](https://supabase.com/docs/guides/auth)

---

## ✅ Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Vercel project created with `frontend` as root
- [ ] Environment variables added to Vercel
- [ ] Build succeeds without errors
- [ ] Frontend accessible at Vercel URL
- [ ] API calls working (check browser console)
- [ ] OAuth redirect URLs updated in Supabase
- [ ] CORS configured on backend
- [ ] Test sign in/out flow
- [ ] Test trace upload
- [ ] Test subscription page


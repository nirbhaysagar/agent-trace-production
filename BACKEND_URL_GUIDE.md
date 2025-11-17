# Backend URL Guide - Where to Find It

## 🔍 What is Backend URL?

Your **backend URL** is the address where your FastAPI server is running. This is what you'll use for:
- Webhook endpoints (Dodo Payments needs this)
- Frontend API calls
- Testing API endpoints

## 📍 Where to Find Your Backend URL

### **For Local Development (Testing Now):**

**Backend URL:** `http://localhost:8000`

This is where your backend runs when you start it locally:
```bash
cd backend
python3 -m uvicorn main:app --reload --port 8000
```

**For webhooks in local development:**
- You'll need a tool like **ngrok** to expose localhost to the internet
- Or use a service like **localtunnel** or **serveo**

### **For Production (Deployed):**

Your backend URL depends on where you've deployed it:

#### **Option 1: Vercel (Most Common for Next.js)**
- Go to your Vercel dashboard
- Select your project
- Go to **Settings** → **Domains**
- Your backend URL will be: `https://your-project-name.vercel.app`
- Or if you have a custom domain: `https://api.yourdomain.com`

#### **Option 2: Railway**
- Go to Railway dashboard
- Select your backend service
- Your URL will be: `https://your-service-name.up.railway.app`
- Or check **Settings** → **Domains**

#### **Option 3: Heroku**
- Go to Heroku dashboard
- Select your app
- Your URL will be: `https://your-app-name.herokuapp.com`

#### **Option 4: AWS/DigitalOcean/Other**
- Check your hosting platform dashboard
- Look for "Domain" or "URL" in your service settings

#### **Option 5: Not Deployed Yet?**
- You need to deploy your backend first
- Or use ngrok for local testing

## 🔧 How to Set Backend URL

### **For Local Development:**

1. **Start your backend:**
   ```bash
   cd backend
   python3 -m uvicorn main:app --reload --port 8000
   ```
   Backend will be at: `http://localhost:8000`

2. **For webhooks (expose localhost):**
   ```bash
   # Install ngrok
   brew install ngrok  # or download from ngrok.com
   
   # Expose port 8000
   ngrok http 8000
   ```
   This will give you a URL like: `https://abc123.ngrok.io`
   Use this for webhook URL: `https://abc123.ngrok.io/api/webhooks/dodo`

### **For Production:**

1. **Deploy your backend** to a hosting platform
2. **Get the URL** from your hosting dashboard
3. **Set environment variable** in frontend:
   ```bash
   # In Vercel: Project Settings → Environment Variables
   NEXT_PUBLIC_API_URL=https://your-backend-url.com
   ```

## 📋 Webhook URL Format

Your webhook URL for Dodo Payments will be:

```
https://your-backend-url.com/api/webhooks/dodo
```

**Examples:**
- Local with ngrok: `https://abc123.ngrok.io/api/webhooks/dodo`
- Production: `https://api.yourdomain.com/api/webhooks/dodo`
- Vercel: `https://your-project.vercel.app/api/webhooks/dodo`

## ✅ Quick Checklist

- [ ] **Local Dev**: Backend URL is `http://localhost:8000`
- [ ] **For Webhooks**: Use ngrok or deploy to production
- [ ] **Production**: Get URL from hosting platform dashboard
- [ ] **Set in Frontend**: Add `NEXT_PUBLIC_API_URL` environment variable

## 🆘 Still Not Sure?

**Tell me:**
1. Have you deployed your backend yet? (Yes/No)
2. If yes, which platform? (Vercel, Railway, Heroku, etc.)
3. If no, are you testing locally?

I can help you find the exact URL based on your setup!


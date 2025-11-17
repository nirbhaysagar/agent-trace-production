# Troubleshooting 503 Error - Step by Step

## 🔍 Understanding the Error

The 503 error means "Service Unavailable". This usually happens when:
1. Backend server is not running
2. Supabase authentication is not configured
3. Environment variables are missing
4. API endpoint is incorrect

## ✅ Step-by-Step Fix

### Step 1: Check if Backend is Running

**Open a new terminal and check:**

```bash
# Check if backend is running on port 8000
curl http://localhost:8000/health
```

**If you get "Connection refused":**
- Backend is NOT running
- Start it:
  ```bash
  cd backend
  python3 -m uvicorn main:app --reload --port 8000
  ```

**If you get a response:**
- Backend IS running ✅
- Move to Step 2

### Step 2: Verify Environment Variables

**Check your `backend/.env` file exists and has:**

```bash
cd backend
cat .env
```

**Must have these:**
```bash
# Supabase (REQUIRED for authentication)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# OR
SUPABASE_ANON_KEY=your_anon_key

# Dodo Payments
DODO_API_KEY=K8aZ4tj6UyB4iK1r.aQLqIZ4yR3qDB9f-UDC5J_-zTWB6I5YqSCCaSgPs6jk79wMv
DODO_API_URL=https://api.dodopayments.com/v1
DODO_WEBHOOK_SECRET=your_webhook_secret

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

**If `.env` doesn't exist:**
```bash
cd backend
touch .env
nano .env  # Add the variables above
```

### Step 3: Check Which Endpoint You're Calling

**The error shows:** `POST http://localhost:8000/api/subscription/checkout`

**This is the STRIPE endpoint, not Dodo!**

**You need to call:** `/api/subscription/checkout-dodo`

**Check your frontend code:**
- Look for where checkout is called
- Should be calling `/api/subscription/checkout-dodo` for Dodo Payments

### Step 4: Verify Supabase Configuration

**The 503 might be from authentication check failing.**

**Check if Supabase is configured:**
```bash
# In backend/.env, verify you have:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_key_here
```

**If Supabase is not configured:**
- The authentication check will fail
- You'll get 503 errors
- Either configure Supabase OR we need to make auth optional for testing

### Step 5: Check Backend Logs

**When you click the button, check your backend terminal:**

You should see error messages like:
- "Dodo Payments API key not configured"
- "Supabase not configured"
- "Authentication not configured"
- Or API errors from Dodo Payments

**Share the error message** from backend logs.

## 🔧 Quick Fixes

### Fix 1: Backend Not Running
```bash
cd backend
python3 -m uvicorn main:app --reload --port 8000
```

### Fix 2: Missing .env File
```bash
cd backend
cat > .env << EOF
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_key
DODO_API_KEY=K8aZ4tj6UyB4iK1r.aQLqIZ4yR3qDB9f-UDC5J_-zTWB6I5YqSCCaSgPs6jk79wMv
DODO_API_URL=https://api.dodopayments.com/v1
DODO_WEBHOOK_SECRET=your_secret
FRONTEND_URL=http://localhost:3000
EOF
```

### Fix 3: Wrong Endpoint
Update frontend to call `/api/subscription/checkout-dodo` instead of `/api/subscription/checkout`

## 📋 Diagnostic Checklist

Run these checks:

1. **Backend running?**
   ```bash
   curl http://localhost:8000/health
   ```

2. **.env file exists?**
   ```bash
   ls -la backend/.env
   ```

3. **Environment variables loaded?**
   ```bash
   cd backend
   python3 -c "from dotenv import load_dotenv; import os; load_dotenv(); print('DODO_API_KEY:', 'SET' if os.getenv('DODO_API_KEY') else 'MISSING')"
   ```

4. **Supabase configured?**
   ```bash
   python3 -c "from dotenv import load_dotenv; import os; load_dotenv(); print('SUPABASE_URL:', 'SET' if os.getenv('SUPABASE_URL') else 'MISSING')"
   ```

## 🆘 Share These Details

To help debug, please share:

1. **Backend terminal output** when you click the button
2. **Result of:** `curl http://localhost:8000/health`
3. **Contents of:** `backend/.env` (hide actual keys, just show if they exist)
4. **Which endpoint** the frontend is calling (check browser Network tab)


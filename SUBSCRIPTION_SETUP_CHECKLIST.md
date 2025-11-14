# Subscription System Setup Checklist

## ✅ What's Already Implemented

- ✅ Frontend subscription settings page (`/settings/subscription`)
- ✅ Subscription context provider
- ✅ Backend subscription service
- ✅ Backend Stripe service
- ✅ API endpoints for subscription management
- ✅ Database schema files
- ✅ Usage tracking system

## 🔧 What Needs to Be Done

### 1. Database Setup (REQUIRED)

**Run the subscription schema in Supabase:**

```bash
# View the schema
cat database/subscription_schema.sql
```

**Steps:**
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/dzvadxyndemwfyffigzw
2. Click on "SQL Editor" in the left sidebar
3. Copy the entire contents of `database/subscription_schema.sql`
4. Paste it into the SQL Editor
5. Click "Run" to execute

**This creates:**
- `subscriptions` table (stores user subscriptions)
- `usage_limits` table (tracks monthly usage)
- Indexes for performance
- Functions for auto-updating timestamps
- Function for resetting monthly usage

### 2. Stripe Account Setup (REQUIRED for payments)

**Steps:**

1. **Create Stripe Account** (if you don't have one):
   - Go to https://stripe.com
   - Sign up for an account
   - Complete account setup

2. **Get API Keys:**
   - Go to Stripe Dashboard → Developers → API keys
   - Copy your **Secret key** (starts with `sk_test_` for test mode)
   - Copy your **Publishable key** (starts with `pk_test_` for test mode) - optional for frontend

<<<<<<< HEAD
3. **Create Product and Price:**
   - Go to Products → Add Product
   - Name: "AgentTrace Pro Lifetime"
   - Pricing model: One-time
   - Price: $59.00 USD
   - Copy the **Price ID** (starts with `price_`)

=======
3. **Create Products and Prices:**
   
   **Pro Monthly ($19/month):**
   - Go to Products → Add Product
   - Name: "AgentTrace Pro Monthly"
   - Price: $19.00 USD
   - Billing period: Monthly
   - Copy the **Price ID** (starts with `price_`)

   **Pro Yearly ($190/year):**
   - Add Product
   - Name: "AgentTrace Pro Yearly"
   - Price: $190.00 USD
   - Billing period: Yearly
   - Copy the **Price ID**

   **Team Monthly ($49/month):**
   - Add Product
   - Name: "AgentTrace Team Monthly"
   - Price: $49.00 USD
   - Billing period: Monthly
   - Copy the **Price ID**

>>>>>>> 15c854915bbd8a81e28d90794abc55b5466a9512
4. **Set up Webhook:**
   - Go to Developers → Webhooks
   - Click "Add endpoint"
   - Endpoint URL: `https://your-backend-url.com/api/webhooks/stripe`
   - Events to send: Select these events:
<<<<<<< HEAD
     - `checkout.session.completed`
     - `payment_intent.succeeded`
=======
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
>>>>>>> 15c854915bbd8a81e28d90794abc55b5466a9512
   - Copy the **Webhook signing secret** (starts with `whsec_`)

### 3. Environment Variables Setup

**Update `backend/.env`:**

```bash
# Stripe Configuration (REQUIRED for payments)
STRIPE_SECRET_KEY=sk_test_your_actual_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret_here
<<<<<<< HEAD
STRIPE_PRICE_PRO_LIFETIME=price_your_pro_lifetime_price_id_here
=======
STRIPE_PRICE_PRO_MONTHLY=price_your_pro_monthly_price_id_here
STRIPE_PRICE_PRO_YEARLY=price_your_pro_yearly_price_id_here
STRIPE_PRICE_TEAM_MONTHLY=price_your_team_monthly_price_id_here
>>>>>>> 15c854915bbd8a81e28d90794abc55b5466a9512

# Frontend URL (for Stripe redirects)
FRONTEND_URL=http://localhost:3000
```

**For production, also add to `frontend/.env.local` (optional):**
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

### 4. Verify Backend Endpoints

**Check these endpoints exist in `backend/main.py`:**
- ✅ `GET /api/subscription` - Get user subscription
- ✅ `GET /api/subscription/usage` - Get usage stats
- ✅ `POST /api/subscription/checkout` - Create checkout session
<<<<<<< HEAD
=======
- ✅ `POST /api/subscription/portal` - Create portal session
>>>>>>> 15c854915bbd8a81e28d90794abc55b5466a9512
- ✅ `POST /api/webhooks/stripe` - Handle webhooks

### 5. Test the Setup

**Test Commands:**

```bash
# 1. Check if backend is running
curl http://localhost:8000/health

# 2. Test subscription endpoint (requires auth token)
# Get your auth token from browser dev tools → Application → Local Storage → supabase.auth.token
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/subscription

# 3. Test usage endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/subscription/usage
```

### 6. Webhook Testing (Local Development)

**For local testing, use Stripe CLI:**

```bash
# Install Stripe CLI
# macOS:
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local backend
stripe listen --forward-to localhost:8000/api/webhooks/stripe
```

This will give you a webhook signing secret for local testing.

### 7. Frontend Integration Check

**Verify these are set up:**

1. **SubscriptionProvider in `_app.tsx`:**
   ```tsx
   <SubscriptionProvider>
     <Component {...pageProps} />
   </SubscriptionProvider>
   ```

2. **API functions in `utils/api.ts`:**
   - `getSubscription()`
   - `createCheckoutSession()`
<<<<<<< HEAD
=======
   - `createPortalSession()`
>>>>>>> 15c854915bbd8a81e28d90794abc55b5466a9512

## 🚀 Quick Setup Commands

```bash
# 1. Set up database (run in Supabase SQL Editor)
cat database/subscription_schema.sql

# 2. Update backend .env with Stripe keys
cd backend
nano .env
# Add Stripe configuration

# 3. Restart backend
source venv/bin/activate
uvicorn main:app --reload

# 4. Test subscription page
# Open http://localhost:3000/settings/subscription
```

## 📋 Verification Checklist

- [ ] Database schema run in Supabase
- [ ] Stripe account created
- [ ] Stripe products and prices created
- [ ] Stripe API keys added to `backend/.env`
- [ ] Webhook endpoint configured in Stripe
- [ ] Webhook signing secret added to `backend/.env`
- [ ] Backend restarted with new environment variables
- [ ] Subscription page accessible at `/settings/subscription`
- [ ] Can view current plan (should show "Free" by default)
- [ ] Can see usage stats
- [ ] "Upgrade to Pro" button works (redirects to Stripe checkout)

## 🐛 Troubleshooting

### Issue: "No active subscription found"
- **Solution:** This is normal for new users. They default to "free" plan.

### Issue: "Failed to create checkout session"
- **Solution:** Check Stripe API key and price IDs in `.env` file

### Issue: Webhook not receiving events
- **Solution:** 
  - Verify webhook URL is correct
  - Check webhook signing secret matches
  - Use Stripe CLI for local testing

### Issue: Subscription not updating after payment
- **Solution:** 
  - Check webhook is receiving events
  - Verify webhook handler is working
  - Check database for subscription record

## 📝 Notes

- **Free Plan:** Users automatically get free plan (no database record needed)
- **Test Mode:** Use Stripe test mode keys (start with `sk_test_` and `pk_test_`)
- **Production:** Switch to live keys when ready for production
- **Webhooks:** Must be publicly accessible URL (use ngrok for local testing)

## 🎯 Next Steps After Setup

1. Test the complete flow:
   - Sign up as new user
   - View subscription page (should show Free plan)
   - Click "Upgrade to Pro"
   - Complete Stripe checkout
   - Verify subscription updates

2. Set up webhook monitoring:
   - Check Stripe Dashboard → Webhooks for event logs
   - Monitor backend logs for webhook processing

3. Test usage limits:
   - Create traces as free user
   - Verify limit enforcement
   - Upgrade and verify unlimited access


# Dodo Payments Integration - Final Steps

## ✅ What's Done
- [x] Database migration completed
- [x] Product IDs added to code
- [x] Backend endpoints added
- [x] Environment variables set

## 🔧 What's Next

### Step 1: Get Dodo Payments API Documentation

You need to find:
1. **API Base URL** - Is it `https://api.dodopayments.com/v1`?
2. **Checkout Endpoint** - What's the exact endpoint name?
   - `/checkout/sessions`?
   - `/payments/create`?
   - `/checkout`?
3. **Request Format** - Does it use `product_id` or `amount` + `currency`?
4. **Webhook Events** - What are the exact event type names?

**Where to find:**
- Check Developer → Others section
- Look for "API Documentation" link
- Check "Getting Started" guide

### Step 2: Customize API Calls

**Update `backend/dodo_service.py`** based on Dodo Payments actual API:

1. **Update API URL** (if different):
   ```python
   DODO_API_URL = os.getenv("DODO_API_URL", "https://api.dodopayments.com/v1")
   ```

2. **Update Checkout Endpoint**:
   - Current: `"checkout/sessions"`
   - May need to change to: `"payments/create"` or `"checkout"`

3. **Update Request Format**:
   - Currently uses `product_id`
   - May need to use `amount` + `currency` instead
   - Check Dodo Payments API docs

### Step 3: Set Up Webhook

1. **Get your backend URL:**
   - **Local testing**: Use ngrok
     ```bash
     ngrok http 8000
     # Copy the URL (e.g., https://abc123.ngrok.io)
     ```
   - **Production**: Your deployed backend URL

2. **Create webhook in Dodo Payments:**
   - Go to **Developer** → **Webhooks**
   - Click "Add Webhook" or "Create Webhook"
   - **Webhook URL**: `https://your-backend-url.com/api/webhooks/dodo`
   - **Events to listen for**:
     - `payment.completed`
     - `checkout.completed`
     - `subscription.created`
     - `subscription.updated`
     - `subscription.canceled`
   - **Copy the webhook secret**
   - Add to `backend/.env`: `DODO_WEBHOOK_SECRET=your_secret_here`

### Step 4: Test the Integration

1. **Start your backend:**
   ```bash
   cd backend
   python3 -m uvicorn main:app --reload --port 8000
   ```

2. **Test checkout creation:**
   ```bash
   # Make a test API call
   curl -X POST http://localhost:8000/api/subscription/checkout-dodo \
     -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"plan_type": "pro", "billing_interval": "lifetime"}'
   ```

3. **Check the response:**
   - Should return `{"checkout_url": "https://..."}`
   - If error, check backend logs for details

4. **Test webhook:**
   - Complete a test payment in Dodo Payments
   - Check backend logs for webhook received
   - Verify subscription created in database

### Step 5: Update Frontend (Optional)

If you want to use Dodo Payments instead of Stripe, update the frontend to call the Dodo endpoint:

**Update `frontend/src/utils/api.ts` or wherever checkout is called:**
```typescript
// Change from:
const response = await api.post('/api/subscription/checkout', {...})

// To:
const response = await api.post('/api/subscription/checkout-dodo', {...})
```

## 📋 Final Checklist

- [x] Database migration done
- [x] Product IDs set
- [ ] Get Dodo Payments API documentation
- [ ] Customize API endpoints in `dodo_service.py`
- [ ] Set up webhook in Dodo dashboard
- [ ] Add webhook secret to `.env`
- [ ] Test checkout creation
- [ ] Test webhook handling
- [ ] Update frontend (if switching from Stripe)

## 🆘 Need Help?

**If you have API documentation:**
- Share the API base URL
- Share endpoint names
- Share request/response examples

**If you don't have documentation:**
- We can test and adjust based on API responses
- Check backend logs for error messages
- Try common endpoint patterns

## 🚀 Ready to Test?

1. Start backend: `cd backend && python3 -m uvicorn main:app --reload --port 8000`
2. Test checkout endpoint
3. Set up webhook
4. Test complete payment flow

Let me know what happens when you test!


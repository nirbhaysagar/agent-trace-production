# Dodo Payments Integration - Next Steps

## ✅ What You've Done
- [x] Created products in Dodo Payments dashboard
- [x] Set up `.env` file with API key and values

## 🔧 What's Next - Step by Step

### Step 1: Update Database Schema

Add Dodo Payments columns to your `subscriptions` table.

**Run this SQL in Supabase SQL Editor:**

```sql
-- Add Dodo Payments columns to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS dodo_customer_id TEXT,
ADD COLUMN IF NOT EXISTS dodo_subscription_id TEXT;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS subscriptions_dodo_customer_id_idx 
ON public.subscriptions (dodo_customer_id);

CREATE INDEX IF NOT EXISTS subscriptions_dodo_subscription_id_idx 
ON public.subscriptions (dodo_subscription_id);
```

### Step 2: Add Backend Endpoints

Add Dodo Payments endpoints to `backend/main.py`.

**Add these imports at the top:**
```python
from dodo_service import get_dodo_service
```

**Add these endpoints (after your Stripe endpoints):**

```python
@app.post("/api/subscription/checkout-dodo")
async def create_dodo_checkout_session(
    request: CheckoutRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Create Dodo Payments checkout session"""
    try:
        if request.plan_type not in ["pro", "team", "mini"]:
            raise HTTPException(status_code=400, detail="Invalid plan type")
        
        billing_interval = request.billing_interval or "month"
        if billing_interval not in ["month", "year", "lifetime", "week", "test"]:
            raise HTTPException(status_code=400, detail="Invalid billing interval")
        
        dodo_service = get_dodo_service(supabase)
        session = dodo_service.create_checkout_session(
            user_id=current_user.id,
            email=current_user.email or "",
            plan_type=request.plan_type,
            billing_interval=billing_interval,
        )
        
        if not session:
            raise HTTPException(status_code=500, detail="Failed to create checkout session")
        
        return {"checkout_url": session.get("url")}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating Dodo checkout session: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")

@app.post("/api/webhooks/dodo")
async def dodo_webhook(request: Request):
    """Handle Dodo Payments webhook events"""
    try:
        payload = await request.body()
        # Dodo Payments might use different header names - adjust based on their docs
        signature = (
            request.headers.get("X-Dodo-Signature") or 
            request.headers.get("Signature") or
            request.headers.get("X-Signature")
        )
        
        if not signature:
            raise HTTPException(status_code=400, detail="Missing signature header")
        
        dodo_service = get_dodo_service(supabase)
        result = dodo_service.handle_webhook(payload, signature)
        
        if not result:
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error handling Dodo webhook: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to handle webhook: {str(e)}")
```

### Step 3: Update Product IDs in Code

**Update `backend/dodo_service.py`** to use your actual product IDs from Dodo Payments:

1. Go to Dodo Payments dashboard → Products
2. Copy the Product IDs (like `pdt_zd9n4Tc...`)
3. Update the `PLAN_PRICES` in `dodo_service.py`:

```python
PLAN_PRICES = {
    "mini_weekly": {
        "product_id": "pdt_zd9n4Tc...",  # Your Mini Week product ID
        "amount": 900,
        "currency": "usd",
    },
    "pro_lifetime": {
        "product_id": "pdt_zgMCWJ...",  # Your Pro Lifetime product ID
        "amount": 5900,
        "currency": "usd",
    },
    "pro_monthly": {
        "product_id": "pdt_8T2gDR...",  # Your Pro Monthly product ID
        "amount": 1900,
        "currency": "usd",
    },
    "pro_test": {
        "product_id": "pdt_c3uzRgf...",  # Your Pro Test product ID
        "amount": 1,
        "currency": "usd",
    },
}
```

### Step 4: Customize API Endpoints

**Update `backend/dodo_service.py`** based on Dodo Payments actual API:

1. **Check API Documentation** for:
   - Actual API base URL
   - Endpoint names (customers, checkout, etc.)
   - Request/response format

2. **Update these sections:**
   - `DODO_API_URL` - if different from `https://api.dodopayments.com/v1`
   - `_make_request()` - adjust authentication if needed
   - `create_checkout_session()` - adjust endpoint and payload format
   - `verify_webhook_signature()` - adjust signature verification method

### Step 5: Set Up Webhook in Dodo Payments

1. **Get your backend URL:**
   - Local testing: Use ngrok (`ngrok http 8000`)
   - Production: Your deployed backend URL

2. **Create webhook in Dodo Payments:**
   - Go to **Developer** → **Webhooks**
   - Click "Add Webhook" or "Create Webhook"
   - Set URL: `https://your-backend-url.com/api/webhooks/dodo`
   - Select events:
     - `payment.completed`
     - `checkout.completed`
     - `subscription.created`
     - `subscription.updated`
     - `subscription.canceled`
   - Copy the **webhook secret**
   - Add it to your `.env`: `DODO_WEBHOOK_SECRET=your_secret_here`

### Step 6: Test the Integration

1. **Start your backend:**
   ```bash
   cd backend
   python3 -m uvicorn main:app --reload --port 8000
   ```

2. **Test checkout creation:**
   - Make a request to create checkout session
   - Verify it returns a checkout URL

3. **Test webhook:**
   - Complete a test payment in Dodo Payments
   - Check if webhook is received
   - Verify subscription is created in database

## 📋 Checklist

- [ ] Update database schema (add Dodo columns)
- [ ] Add backend endpoints to `main.py`
- [ ] Update product IDs in `dodo_service.py`
- [ ] Customize API endpoints based on Dodo docs
- [ ] Set up webhook in Dodo Payments dashboard
- [ ] Add webhook secret to `.env`
- [ ] Test checkout creation
- [ ] Test webhook handling

## 🆘 Need Help?

If you get stuck:
1. Share the Dodo Payments API documentation
2. Share any error messages
3. Share what happens when you test the endpoints

I can help customize the code based on their actual API structure!


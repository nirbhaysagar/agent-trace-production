# Dodo Payments Setup - Quick Start

## ✅ Good News: No Package Installation Needed!

**Dodo Payments doesn't have a Python SDK** - we use REST API calls with `httpx`, which is **already installed** in your project!

## 🔧 Step 1: Add Your API Key to `.env`

**IMPORTANT:** Add your keys to `backend/.env` (NOT `env.example`):

```bash
# Create or edit backend/.env
cd backend
nano .env  # or use your preferred editor
```

Add these lines:
```bash
DODO_API_KEY=K8aZ4tj6UyB4iK1r.aQLqIZ4yR3qDB9f-UDC5J_-zTWB6I5YqSCCaSgPs6jk79wMv
DODO_API_URL=https://api.dodopayments.com/v1
DODO_WEBHOOK_SECRET=your_webhook_secret_here
```

## 🔧 Step 2: Update Database Schema

Run this SQL in your Supabase SQL Editor:

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

## 🔧 Step 3: Get Dodo Payments API Documentation

You need to find:
1. **API Base URL** - Is it `https://api.dodopayments.com/v1` or different?
2. **Authentication Method** - Bearer token? API key in header?
3. **Endpoint Names**:
   - Create customer: `/customers` or `/api/customers`?
   - Create checkout: `/checkout/sessions` or `/payments/create`?
4. **Webhook Events** - What are the event type names?
5. **Webhook Signature** - How to verify signatures?

## 🔧 Step 4: Customize `dodo_service.py`

I've created `backend/dodo_service.py` with a working template. You need to:

1. **Update API URL** (if different):
   ```python
   DODO_API_URL = os.getenv("DODO_API_URL", "https://api.dodopayments.com/v1")
   ```

2. **Update Authentication** (if not Bearer token):
   ```python
   headers = {
       "Authorization": f"Bearer {self.api_key}",  # May need to change
       # OR
       "X-API-Key": self.api_key,  # If they use API key header
   }
   ```

3. **Update Endpoints** based on Dodo Payments docs:
   - Customer creation endpoint
   - Checkout session endpoint
   - Webhook verification method

## 🔧 Step 5: Add Backend Endpoints

Add to `backend/main.py`:

```python
from dodo_service import get_dodo_service

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
        signature = request.headers.get("X-Dodo-Signature") or request.headers.get("Signature")
        
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

## 🔧 Step 6: Configure Webhook in Dodo Dashboard

1. Go to Dodo Payments Dashboard → Developer → Webhooks
2. Add webhook URL: `https://your-backend-url.com/api/webhooks/dodo`
3. Select events to listen for
4. Copy the webhook secret

## 📝 Next Steps

1. **Find Dodo Payments API Documentation** - Check their website or dashboard
2. **Test API Calls** - Try creating a customer first
3. **Update Endpoints** - Adjust based on actual API structure
4. **Test Webhooks** - Use their test mode

## ⚠️ Important Notes

- **No Python package needed** - `httpx` is already installed ✅
- **API key is in `.env`** - Never commit it to Git
- **Customize endpoints** - Based on Dodo Payments actual API structure
- **Test first** - Use test mode before going live

## 🆘 Need Help?

Share:
- Dodo Payments API documentation link
- Example API request/response
- Error messages you're seeing

I can help customize the integration based on their actual API!


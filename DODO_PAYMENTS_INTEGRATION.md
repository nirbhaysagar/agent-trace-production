# Dodo Payments Integration Guide

This guide will help you integrate Dodo Payments into AgentTrace, replacing or supplementing Stripe.

## 📋 Overview

Dodo Payments is a payment gateway that supports various payment methods. This integration follows the same pattern as your existing Stripe integration.

## 🔧 Step 1: Set Up Dodo Payments Account

1. **Sign up for Dodo Payments:**
   - Go to [Dodo Payments](https://dodopayments.com) (or your Dodo Payments provider)
   - Create a merchant account
   - Complete verification process

2. **Get API Credentials:**
   - Navigate to Developer/API section in dashboard
   - Generate API Key (Secret Key)
   - Generate Webhook Secret Key
   - Save these securely

3. **Create Products:**
   - Create products for each plan:
     - Pro Lifetime ($59)
     - Pro Monthly ($19/month)
     - Mini Weekly ($9/week)
     - Pro Test ($0.01 - for testing)

## 🔧 Step 2: Install Dodo Payments SDK

Add Dodo Payments SDK to your backend:

```bash
cd backend
pip install dodo-payments  # or whatever the package name is
# OR if they use REST API only:
pip install requests httpx
```

## 🔧 Step 3: Create Dodo Payments Service

Create `backend/dodo_service.py` (similar to `stripe_service.py`):

```python
import os
import logging
import hmac
import hashlib
import json
from typing import Optional, Dict, Any
from datetime import datetime
import httpx
from supabase import Client
from dotenv import load_dotenv
from subscription_service import get_subscription_service

load_dotenv()

logger = logging.getLogger(__name__)

# Dodo Payments API configuration
DODO_API_KEY = os.getenv("DODO_API_KEY")
DODO_API_URL = os.getenv("DODO_API_URL", "https://api.dodopayments.com/v1")  # Update with actual URL
DODO_WEBHOOK_SECRET = os.getenv("DODO_WEBHOOK_SECRET")

# Plan pricing configuration (same as Stripe)
PLAN_PRICES = {
    "mini_weekly": {
        "amount": 900,  # $9.00 in cents
        "currency": "usd",
        "interval": "week",
        "product_name": "AgentTrace Mini Trial",
        "description": "1-week trial with all Pro features",
    },
    "pro_lifetime": {
        "amount": 5900,  # $59.00 in cents
        "currency": "usd",
        "product_name": "AgentTrace Pro Lifetime",
        "description": "Lifetime access to AgentTrace Pro",
    },
    "pro_monthly": {
        "amount": 1900,  # $19.00 in cents
        "currency": "usd",
        "interval": "month",
    },
    "pro_test": {
        "amount": 1,  # $0.01
        "currency": "usd",
        "product_name": "AgentTrace Pro Test Plan",
        "description": "TEST ONLY - Full Pro features for testing",
    },
}


class DodoService:
    """Service for handling Dodo Payments operations"""

    def __init__(self, supabase_client: Optional[Client] = None):
        self.supabase = supabase_client
        self.api_key = DODO_API_KEY
        self.api_url = DODO_API_URL
        if not self.api_key:
            logger.warning("Dodo Payments API key not configured")

    def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Optional[Dict]:
        """Make authenticated request to Dodo Payments API"""
        if not self.api_key:
            logger.error("Dodo Payments API key not configured")
            return None

        url = f"{self.api_url}/{endpoint}"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            with httpx.Client(timeout=10.0) as client:
                if method == "GET":
                    response = client.get(url, headers=headers)
                elif method == "POST":
                    response = client.post(url, headers=headers, json=data)
                else:
                    logger.error(f"Unsupported HTTP method: {method}")
                    return None

                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Dodo Payments API error: {e}")
            return None

    def create_customer(self, user_id: str, email: str) -> Optional[str]:
        """Create a Dodo Payments customer and return customer ID"""
        if not self.api_key:
            logger.error("Dodo Payments API key not configured")
            return None

        try:
            # Check if customer already exists
            existing = self._get_customer_by_user_id(user_id)
            if existing:
                return existing.get("dodo_customer_id")

            # Create new customer (adjust API endpoint based on Dodo Payments docs)
            customer_data = {
                "email": email,
                "metadata": {"user_id": user_id},
            }

            customer = self._make_request("POST", "customers", customer_data)
            if not customer:
                return None

            customer_id = customer.get("id")

            # Store customer ID in database
            if self.supabase and customer_id:
                try:
                    self.supabase.table("subscriptions").upsert({
                        "user_id": user_id,
                        "dodo_customer_id": customer_id,  # Add this column to your schema
                    }, on_conflict="user_id").execute()
                except Exception as e:
                    logger.error(f"Error storing customer ID: {e}")

            return customer_id
        except Exception as e:
            logger.error(f"Error creating Dodo customer: {e}")
            return None

    def _get_customer_by_user_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get customer record by user_id"""
        if not self.supabase:
            return None

        try:
            response = (
                self.supabase.table("subscriptions")
                .select("*")
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )

            if response.data and len(response.data) > 0:
                return response.data[0]
        except Exception as e:
            logger.error(f"Error fetching customer: {e}")

        return None

    def create_checkout_session(
        self, user_id: str, email: str, plan_type: str, billing_interval: str = "month"
    ) -> Optional[Dict[str, Any]]:
        """Create a Dodo Payments checkout session"""
        if not self.api_key:
            logger.error("Dodo Payments API key not configured")
            return None

        try:
            # Get or create customer
            customer_id = self.create_customer(user_id, email)
            if not customer_id:
                return None

            # Determine price key
            if billing_interval == "lifetime":
                price_key = f"{plan_type}_lifetime"
            elif billing_interval == "week":
                price_key = f"{plan_type}_weekly"
            elif billing_interval == "test":
                price_key = f"{plan_type}_test"
            else:
                price_key = f"{plan_type}_{billing_interval}ly"

            price_config = PLAN_PRICES.get(price_key)
            if not price_config:
                logger.error(f"Invalid plan type: {plan_type} with interval {billing_interval}")
                return None

            # Get base URL
            base_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

            # Create checkout session (adjust based on Dodo Payments API)
            checkout_data = {
                "customer_id": customer_id,
                "amount": price_config["amount"],
                "currency": price_config["currency"],
                "description": price_config.get("description", f"{plan_type.capitalize()} subscription"),
                "success_url": f"{base_url}/settings/subscription?success=true",
                "cancel_url": f"{base_url}/pricing?canceled=true",
                "metadata": {
                    "user_id": user_id,
                    "plan_type": plan_type,
                    "billing_interval": billing_interval,
                },
            }

            # Add recurring billing if applicable
            if billing_interval in ["month", "year", "week"]:
                checkout_data["recurring"] = {
                    "interval": price_config.get("interval", "month"),
                }

            session = self._make_request("POST", "checkout/sessions", checkout_data)
            if not session:
                return None

            return {
                "session_id": session.get("id"),
                "url": session.get("checkout_url") or session.get("url"),
            }
        except Exception as e:
            logger.error(f"Error creating checkout session: {e}")
            return None

    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """Verify webhook signature from Dodo Payments"""
        if not DODO_WEBHOOK_SECRET:
            logger.error("Dodo Payments webhook secret not configured")
            return False

        try:
            # Adjust signature verification based on Dodo Payments method
            # Common methods: HMAC SHA256
            expected_signature = hmac.new(
                DODO_WEBHOOK_SECRET.encode(),
                payload,
                hashlib.sha256
            ).hexdigest()

            return hmac.compare_digest(expected_signature, signature)
        except Exception as e:
            logger.error(f"Error verifying webhook signature: {e}")
            return False

    def handle_webhook(self, payload: bytes, signature: str) -> Optional[Dict[str, Any]]:
        """Handle Dodo Payments webhook events"""
        if not self.api_key:
            logger.error("Dodo Payments API key not configured")
            return None

        # Verify signature
        if not self.verify_webhook_signature(payload, signature):
            logger.error("Invalid webhook signature")
            return None

        try:
            event = json.loads(payload.decode())
            event_type = event.get("type")
            data = event.get("data", {})

            logger.info(f"Processing Dodo Payments webhook: {event_type}")

            # Handle different event types (adjust based on Dodo Payments events)
            if event_type == "payment.completed" or event_type == "checkout.completed":
                self._handle_payment_completed(data)
            elif event_type == "subscription.created":
                self._handle_subscription_created(data)
            elif event_type == "subscription.updated":
                self._handle_subscription_updated(data)
            elif event_type == "subscription.canceled":
                self._handle_subscription_canceled(data)
            else:
                logger.info(f"Unhandled event type: {event_type}")

            return {"status": "success"}
        except Exception as e:
            logger.error(f"Error handling webhook: {e}")
            return None

    def _handle_payment_completed(self, payment: Dict[str, Any]):
        """Handle payment completed event (for one-time payments like lifetime)"""
        if not self.supabase:
            return

        try:
            metadata = payment.get("metadata", {})
            user_id = metadata.get("user_id")
            plan_type = metadata.get("plan_type")

            if not user_id or not plan_type:
                logger.error("Missing user_id or plan_type in payment metadata")
                return

            customer_id = payment.get("customer_id")

            # Update subscription
            self.supabase.table("subscriptions").upsert({
                "user_id": user_id,
                "plan_type": plan_type,
                "status": "active",
                "dodo_subscription_id": None,  # One-time payment
                "dodo_customer_id": customer_id,
                "current_period_start": datetime.utcnow().isoformat(),
                "current_period_end": None,
                "cancel_at_period_end": False,
            }, on_conflict="user_id").execute()

            # Provision AI credits
            subscription_service = get_subscription_service(self.supabase)
            if plan_type == "pro_test":
                subscription_service.set_ai_credits(user_id, 5000)
            elif plan_type == "pro":
                subscription_service.set_ai_credits(user_id, 5000)
            else:
                logger.warning(f"Unknown plan type: {plan_type}")

            logger.info(f"Payment completed for user {user_id}, plan {plan_type}")
        except Exception as e:
            logger.error(f"Error handling payment completed: {e}")

    def _handle_subscription_created(self, subscription: Dict[str, Any]):
        """Handle subscription created event"""
        if not self.supabase:
            return

        try:
            customer_id = subscription.get("customer_id")
            metadata = subscription.get("metadata", {})
            user_id = metadata.get("user_id")

            if not user_id:
                logger.error("Missing user_id in subscription metadata")
                return

            plan_type = metadata.get("plan_type", "pro")

            # Create or update subscription
            self.supabase.table("subscriptions").upsert({
                "user_id": user_id,
                "plan_type": plan_type,
                "status": "active",
                "dodo_subscription_id": subscription.get("id"),
                "dodo_customer_id": customer_id,
                "current_period_start": datetime.fromisoformat(
                    subscription.get("current_period_start", datetime.utcnow().isoformat())
                ).isoformat(),
                "current_period_end": datetime.fromisoformat(
                    subscription.get("current_period_end", datetime.utcnow().isoformat())
                ).isoformat() if subscription.get("current_period_end") else None,
                "cancel_at_period_end": subscription.get("cancel_at_period_end", False),
            }, on_conflict="user_id").execute()

            # Provision AI credits for monthly subscriptions
            subscription_service = get_subscription_service(self.supabase)
            subscription_service.set_ai_credits(user_id, 1000)
            logger.info(f"Subscription created for user {user_id}, provisioned 1000 AI credits")
        except Exception as e:
            logger.error(f"Error handling subscription created: {e}")

    def _handle_subscription_updated(self, subscription: Dict[str, Any]):
        """Handle subscription updated event"""
        if not self.supabase:
            return

        try:
            subscription_id = subscription.get("id")
            if not subscription_id:
                return

            # Update subscription record
            update_data = {
                "status": subscription.get("status", "active"),
                "current_period_start": datetime.fromisoformat(
                    subscription.get("current_period_start", datetime.utcnow().isoformat())
                ).isoformat(),
                "current_period_end": datetime.fromisoformat(
                    subscription.get("current_period_end", datetime.utcnow().isoformat())
                ).isoformat() if subscription.get("current_period_end") else None,
                "cancel_at_period_end": subscription.get("cancel_at_period_end", False),
            }

            self.supabase.table("subscriptions").update(update_data).eq(
                "dodo_subscription_id", subscription_id
            ).execute()

            logger.info(f"Subscription updated: {subscription_id}")
        except Exception as e:
            logger.error(f"Error handling subscription updated: {e}")

    def _handle_subscription_canceled(self, subscription: Dict[str, Any]):
        """Handle subscription canceled event"""
        if not self.supabase:
            return

        try:
            subscription_id = subscription.get("id")
            if not subscription_id:
                return

            # Update subscription status
            self.supabase.table("subscriptions").update({
                "status": "canceled",
            }).eq("dodo_subscription_id", subscription_id).execute()

            logger.info(f"Subscription canceled: {subscription_id}")
        except Exception as e:
            logger.error(f"Error handling subscription canceled: {e}")


# Global instance
_dodo_service: Optional[DodoService] = None


def get_dodo_service(supabase_client: Optional[Client] = None) -> DodoService:
    """Get or create the global Dodo Payments service instance"""
    global _dodo_service
    if _dodo_service is None:
        _dodo_service = DodoService(supabase_client)
    return _dodo_service
```

## 🔧 Step 4: Update Database Schema

Add Dodo Payments columns to your `subscriptions` table:

```sql
-- Add Dodo Payments columns
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS dodo_customer_id TEXT,
ADD COLUMN IF NOT EXISTS dodo_subscription_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS subscriptions_dodo_customer_id_idx 
ON public.subscriptions (dodo_customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_dodo_subscription_id_idx 
ON public.subscriptions (dodo_subscription_id);
```

## 🔧 Step 5: Update Backend Endpoints

Add Dodo Payments endpoints to `backend/main.py`:

```python
from dodo_service import get_dodo_service

# Add after existing Stripe endpoints

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
        # Adjust header name based on Dodo Payments documentation
        
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

## 🔧 Step 6: Update Environment Variables

Add to `backend/.env`:

```bash
# Dodo Payments Configuration
DODO_API_KEY=your_dodo_api_key_here
DODO_API_URL=https://api.dodopayments.com/v1  # Update with actual URL
DODO_WEBHOOK_SECRET=your_dodo_webhook_secret_here

# Keep Stripe for now (or remove if switching completely)
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

## 🔧 Step 7: Update Frontend (Optional)

If you want to use Dodo Payments instead of Stripe, update `frontend/src/utils/api.ts`:

```typescript
export const createCheckoutSession = async (
  planType: string,
  billingInterval: string = 'month',
  paymentProvider: 'stripe' | 'dodo' = 'dodo'  // Default to Dodo
): Promise<{ checkout_url: string }> => {
  const endpoint = paymentProvider === 'dodo' 
    ? '/api/subscription/checkout-dodo'
    : '/api/subscription/checkout';
    
  const response = await api.post<{ checkout_url: string }>(endpoint, {
    plan_type: planType,
    billing_interval: billingInterval,
  })
  return response.data
}
```

## 🔧 Step 8: Configure Webhook in Dodo Payments Dashboard

1. Go to Dodo Payments Dashboard → Developer → Webhooks
2. Add webhook URL: `https://your-backend-url.com/api/webhooks/dodo`
3. Select events to listen for:
   - `payment.completed` (for one-time payments)
   - `checkout.completed` (alternative event name)
   - `subscription.created`
   - `subscription.updated`
   - `subscription.canceled`
4. Copy the webhook secret key

## ⚠️ Important Notes

1. **API Documentation**: The exact API endpoints and event names may differ. Check Dodo Payments documentation for:
   - Actual API base URL
   - Request/response formats
   - Webhook event names
   - Signature verification method
   - Authentication method

2. **Payment Methods**: Dodo Payments may support different payment methods (UPI, cards, etc.). Adjust the checkout session creation accordingly.

3. **Testing**: Use Dodo Payments test mode to verify the integration before going live.

4. **Migration**: If switching from Stripe to Dodo:
   - Keep both services running initially
   - Migrate existing customers gradually
   - Update frontend to use Dodo endpoints
   - Monitor webhook events closely

## 📚 Resources

- Dodo Payments API Documentation (check their official docs)
- Webhook Event Reference
- Payment Method Support

## ✅ Testing Checklist

- [ ] Create test customer
- [ ] Create checkout session
- [ ] Complete test payment
- [ ] Verify webhook received
- [ ] Check subscription created in database
- [ ] Verify AI credits provisioned
- [ ] Test subscription cancellation
- [ ] Test recurring payments (if applicable)


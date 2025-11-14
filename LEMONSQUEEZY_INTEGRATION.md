# 🍋 LemonSqueezy Integration Guide for AgentTrace

## Overview

This guide will help you replace Stripe with LemonSqueezy for subscription management. LemonSqueezy is a modern payment platform that handles taxes, compliance, and subscriptions automatically.

## Why LemonSqueezy?

- ✅ **Automatic tax handling** (VAT, sales tax, etc.)
- ✅ **Built-in compliance** (GDPR, PCI-DSS)
- ✅ **Lower fees** than Stripe in many regions
- ✅ **Better developer experience** with simpler API
- ✅ **No webhook complexity** - simpler event handling

## Step 1: Create LemonSqueezy Account

1. Go to [lemonsqueezy.com](https://lemonsqueezy.com)
2. Sign up for an account
3. Complete store setup
4. Get your API keys from Settings → API

## Step 2: Create Products & Variants

### Create Products in LemonSqueezy Dashboard

1. **Mini Trial Product**
   - Name: "AgentTrace Mini Trial"
   - Price: $9.00
   - Billing: Weekly (recurring)
   - Variant ID: Copy this (you'll need it)

2. **Pro Lifetime Product**
   - Name: "AgentTrace Pro Lifetime"
   - Price: $59.00
   - Billing: One-time payment
   - Variant ID: Copy this (you'll need it)

### Get Variant IDs

After creating products, you'll get variant IDs like:
- `variant_xxxxxxxxxxxxx` (for Mini Trial)
- `variant_yyyyyyyyyyyyy` (for Pro Lifetime)

## Step 3: Install LemonSqueezy SDK

```bash
cd backend
pip install lemonsqueezy-python
```

Or add to `requirements.txt`:
```
lemonsqueezy-python>=1.0.0
```

## Step 4: Update Backend Configuration

### Update `backend/env.example`:

```env
# LemonSqueezy Configuration
LEMONSQUEEZY_API_KEY=your_api_key_here
LEMONSQUEEZY_STORE_ID=your_store_id_here
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret_here

# Product Variant IDs
LEMONSQUEEZY_VARIANT_MINI_WEEKLY=variant_xxxxxxxxxxxxx
LEMONSQUEEZY_VARIANT_PRO_LIFETIME=variant_yyyyyyyyyyyyy

# Frontend URL (for redirects)
FRONTEND_URL=http://localhost:3000
```

### Create `backend/lemonsqueezy_service.py`:

```python
import os
import logging
from typing import Optional, Dict, Any
from datetime import datetime
from lemonsqueezy import LemonSqueezy
from supabase import Client
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Initialize LemonSqueezy
api_key = os.getenv("LEMONSQUEEZY_API_KEY")
store_id = os.getenv("LEMONSQUEEZY_STORE_ID")
ls = LemonSqueezy(api_key) if api_key else None

# Product Variant IDs
VARIANT_IDS = {
    "mini_weekly": os.getenv("LEMONSQUEEZY_VARIANT_MINI_WEEKLY", ""),
    "pro_lifetime": os.getenv("LEMONSQUEEZY_VARIANT_PRO_LIFETIME", ""),
}


class LemonSqueezyService:
    """Service for handling LemonSqueezy payment operations"""

    def __init__(self, supabase_client: Optional[Client] = None):
        self.supabase = supabase_client
        if not api_key:
            logger.warning("LemonSqueezy API key not configured")

    def create_checkout_session(
        self, user_id: str, email: str, plan_type: str, billing_interval: str = "month"
    ) -> Optional[Dict[str, Any]]:
        """Create a LemonSqueezy checkout session"""
        if not ls or not store_id:
            logger.error("LemonSqueezy not configured")
            return None

        try:
            # Determine variant ID
            if billing_interval == "week":
                variant_key = "mini_weekly"
            elif billing_interval == "lifetime":
                variant_key = "pro_lifetime"
            else:
                logger.error(f"Invalid billing interval: {billing_interval}")
                return None

            variant_id = VARIANT_IDS.get(variant_key)
            if not variant_id:
                logger.error(f"Variant ID not configured for {variant_key}")
                return None

            # Get base URL
            base_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

            # Create checkout session
            checkout = ls.checkouts.create(
                store_id=store_id,
                variant_id=variant_id,
                custom_price=None,  # Use variant's default price
                product_options={
                    "name": f"AgentTrace {plan_type.capitalize()}",
                    "description": f"{plan_type.capitalize()} subscription",
                },
                checkout_options={
                    "embed": False,
                    "media": False,
                    "logo": True,
                },
                checkout_data={
                    "email": email,
                    "name": email,  # You can customize this
                    "custom": {
                        "user_id": user_id,
                        "plan_type": plan_type,
                        "billing_interval": billing_interval,
                    },
                },
                preview=False,
                expires_at=None,
            )

            # Get checkout URL
            checkout_url = checkout.data.attributes.url

            return {
                "checkout_url": checkout_url,
                "checkout_id": checkout.data.id,
            }
        except Exception as e:
            logger.error(f"Error creating LemonSqueezy checkout: {e}")
            return None

    def handle_webhook(self, payload: bytes, signature: str) -> Optional[Dict[str, Any]]:
        """Handle LemonSqueezy webhook events"""
        webhook_secret = os.getenv("LEMONSQUEEZY_WEBHOOK_SECRET")
        if not webhook_secret:
            logger.error("LemonSqueezy webhook secret not configured")
            return None

        try:
            # Verify webhook signature
            # LemonSqueezy uses HMAC SHA256
            import hmac
            import hashlib

            expected_signature = hmac.new(
                webhook_secret.encode(),
                payload,
                hashlib.sha256
            ).hexdigest()

            if signature != expected_signature:
                logger.error("Invalid webhook signature")
                return None

            # Parse webhook data
            import json
            event = json.loads(payload.decode())
            event_type = event.get("meta", {}).get("event_name")
            data = event.get("data", {})

            logger.info(f"Processing LemonSqueezy webhook: {event_type}")

            # Handle different event types
            if event_type == "subscription_created":
                self._handle_subscription_created(data)
            elif event_type == "subscription_updated":
                self._handle_subscription_updated(data)
            elif event_type == "subscription_cancelled":
                self._handle_subscription_cancelled(data)
            elif event_type == "order_created":
                self._handle_order_created(data)  # For one-time payments

            return {"status": "success"}
        except Exception as e:
            logger.error(f"Error handling webhook: {e}")
            return None

    def _handle_subscription_created(self, subscription_data: Dict[str, Any]):
        """Handle subscription created event"""
        if not self.supabase:
            return

        try:
            # Extract data from LemonSqueezy subscription object
            attributes = subscription_data.get("attributes", {})
            custom_data = attributes.get("custom_price", {}).get("custom", {}) or {}
            
            user_id = custom_data.get("user_id")
            plan_type = custom_data.get("plan_type", "pro")
            
            if not user_id:
                logger.error("No user_id in subscription custom data")
                return

            # Create or update subscription record
            self.supabase.table("subscriptions").upsert({
                "user_id": user_id,
                "plan_type": plan_type,
                "status": "active",
                "stripe_subscription_id": subscription_data.get("id"),  # Store LS subscription ID
                "stripe_customer_id": attributes.get("customer_id"),
                "current_period_start": datetime.fromisoformat(
                    attributes.get("created_at", "").replace("Z", "+00:00")
                ).isoformat() if attributes.get("created_at") else None,
                "current_period_end": datetime.fromisoformat(
                    attributes.get("renews_at", "").replace("Z", "+00:00")
                ).isoformat() if attributes.get("renews_at") else None,
                "cancel_at_period_end": False,
            }, on_conflict="user_id").execute()

            logger.info(f"Subscription created for user {user_id}")
        except Exception as e:
            logger.error(f"Error handling subscription created: {e}")

    def _handle_order_created(self, order_data: Dict[str, Any]):
        """Handle one-time payment (lifetime plan)"""
        if not self.supabase:
            return

        try:
            attributes = order_data.get("attributes", {})
            custom_data = attributes.get("custom_price", {}).get("custom", {}) or {}
            
            user_id = custom_data.get("user_id")
            plan_type = custom_data.get("plan_type", "pro")
            
            if not user_id:
                logger.error("No user_id in order custom data")
                return

            # Create lifetime subscription
            self.supabase.table("subscriptions").upsert({
                "user_id": user_id,
                "plan_type": plan_type,
                "status": "active",
                "stripe_subscription_id": None,
                "stripe_customer_id": attributes.get("customer_id"),
                "current_period_start": datetime.utcnow().isoformat(),
                "current_period_end": None,
                "cancel_at_period_end": False,
            }, on_conflict="user_id").execute()

            logger.info(f"Lifetime order created for user {user_id}")
        except Exception as e:
            logger.error(f"Error handling order created: {e}")

    def _handle_subscription_updated(self, subscription_data: Dict[str, Any]):
        """Handle subscription updated event"""
        # Similar to created, but update existing record
        pass

    def _handle_subscription_cancelled(self, subscription_data: Dict[str, Any]):
        """Handle subscription cancelled event"""
        if not self.supabase:
            return

        try:
            subscription_id = subscription_data.get("id")
            if not subscription_id:
                return

            self.supabase.table("subscriptions").update({
                "status": "canceled",
            }).eq("stripe_subscription_id", subscription_id).execute()

            logger.info(f"Subscription cancelled: {subscription_id}")
        except Exception as e:
            logger.error(f"Error handling subscription cancelled: {e}")


# Global instance
_lemon_squeezy_service: Optional[LemonSqueezyService] = None


def get_lemon_squeezy_service(supabase_client: Optional[Client] = None) -> LemonSqueezyService:
    """Get or create the global LemonSqueezy service instance"""
    global _lemon_squeezy_service
    if _lemon_squeezy_service is None:
        _lemon_squeezy_service = LemonSqueezyService(supabase_client)
    return _lemon_squeezy_service
```

## Step 5: Update Backend Endpoints

### Update `backend/main.py`:

Replace Stripe service imports with LemonSqueezy:

```python
# Replace this:
from backend.stripe_service import get_stripe_service

# With this:
from backend.lemonsqueezy_service import get_lemon_squeezy_service
```

Update checkout endpoint:

```python
@app.post("/api/subscription/checkout")
async def create_checkout_session(
    request: CheckoutRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Create LemonSqueezy checkout session"""
    try:
        if request.plan_type not in ["mini", "pro"]:
            raise HTTPException(status_code=400, detail="Invalid plan type")
        
        billing_interval = request.billing_interval or "lifetime"
        if billing_interval not in ["week", "lifetime"]:
            raise HTTPException(status_code=400, detail="Invalid billing interval")
        
        ls_service = get_lemon_squeezy_service(supabase)
        session = ls_service.create_checkout_session(
            user_id=current_user.id,
            email=current_user.email or "",
            plan_type=request.plan_type,
            billing_interval=billing_interval,
        )
        
        if not session:
            raise HTTPException(status_code=500, detail="Failed to create checkout session")
        
        return {"checkout_url": session.get("checkout_url")}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating checkout session: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")
```

Update webhook endpoint:

```python
@app.post("/api/webhooks/lemonsqueezy")
async def lemonsqueezy_webhook(request: Request):
    """Handle LemonSqueezy webhook events"""
    try:
        payload = await request.body()
        signature = request.headers.get("X-Signature", "")
        
        ls_service = get_lemon_squeezy_service(supabase)
        result = ls_service.handle_webhook(payload, signature)
        
        if not result:
            raise HTTPException(status_code=400, detail="Invalid webhook")
        
        return result
    except Exception as e:
        logger.error(f"Error handling webhook: {e}")
        raise HTTPException(status_code=500, detail=f"Webhook error: {str(e)}")
```

## Step 6: Configure Webhook in LemonSqueezy

1. Go to LemonSqueezy Dashboard → Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhooks/lemonsqueezy`
3. Select events:
   - `subscription_created`
   - `subscription_updated`
   - `subscription_cancelled`
   - `order_created`
4. Copy the webhook secret to your `.env` file

## Step 7: Update Frontend (Optional)

The frontend doesn't need changes - it just calls `/api/subscription/checkout` and redirects to the checkout URL. LemonSqueezy handles the payment flow.

## Step 8: Test Integration

1. Use LemonSqueezy test mode
2. Create a test checkout
3. Complete test payment
4. Verify webhook is received
5. Check subscription is created in database

## Migration Checklist

- [ ] Create LemonSqueezy account
- [ ] Create products and get variant IDs
- [ ] Install `lemonsqueezy-python` SDK
- [ ] Create `lemonsqueezy_service.py`
- [ ] Update environment variables
- [ ] Update backend endpoints
- [ ] Configure webhook in LemonSqueezy
- [ ] Test checkout flow
- [ ] Test webhook handling
- [ ] Remove Stripe dependencies (optional)

## Benefits Over Stripe

1. **Simpler API** - Less boilerplate code
2. **Automatic taxes** - No manual tax calculation
3. **Better compliance** - Built-in GDPR, PCI-DSS
4. **Lower fees** - Often cheaper than Stripe
5. **Easier webhooks** - Simpler event handling

## Support

- [LemonSqueezy Docs](https://docs.lemonsqueezy.com)
- [LemonSqueezy API Reference](https://docs.lemonsqueezy.com/api)
- [Python SDK](https://github.com/lemonsqueezy/lemonsqueezy-python)

## Notes

- You can keep Stripe for now and migrate gradually
- LemonSqueezy handles VAT automatically (great for EU customers)
- Webhook signature verification is simpler than Stripe
- No need for customer portal - LemonSqueezy provides it


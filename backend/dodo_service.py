"""
Dodo Payments Service
Uses REST API calls (no Python SDK needed - httpx is already installed)
"""
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

# Dodo Payments API Configuration
DODO_API_KEY = os.getenv("DODO_API_KEY")
DODO_API_URL = os.getenv("DODO_API_URL", "https://test.dodopayments.com")
DODO_WEBHOOK_SECRET = os.getenv("DODO_WEBHOOK_SECRET")

# Plan pricing configuration (matches your products in Dodo dashboard)
PLAN_PRICES = {
    "mini_weekly": {
        "product_id": "pdt_zd9n4Tc3yLooF5JHKjwvk",  # Mini Week
        "amount": 900,  # $9.00 in cents
        "currency": "usd",
        "interval": "week",
        "product_name": "Mini Week",
    },
    "pro_lifetime": {
        "product_id": "pdt_zgMCWJXVWEOMyOhfzeEeY",  # Pro Lifetime
        "amount": 5900,  # $59.00 in cents
        "currency": "usd",
        "product_name": "Pro Lifetime",
    },
    "pro_monthly": {
        "product_id": "pdt_8T2gDRSaIuHHPXihW2SxN",  # Pro Monthly Plan
        "amount": 1900,  # $19.00 in cents
        "currency": "usd",
        "interval": "month",
        "product_name": "Pro Monthly Plan",
    },
    "pro_test": {
        "product_id": "pdt_c3uzRgfNimSsk2lHk5haU",  # Pro Test
        "amount": 1,  # ₹1.00 or $0.01
        "currency": "usd",  # or "inr" if using Indian Rupees
        "product_name": "Pro Test",
    },
}


class DodoService:
    """Service for handling Dodo Payments operations via REST API"""

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

        # Ensure proper URL construction (handle trailing slashes)
        api_url = self.api_url.rstrip('/')
        endpoint = endpoint.lstrip('/')
        url = f"{api_url}/{endpoint}"
        
        # Dodo Payments typically uses Bearer token authentication
        # Adjust if they use a different method (check their docs)
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            logger.info(f"Dodo API Request: {method} {url}")
            logger.info(f"Request data: {data}")
            with httpx.Client(timeout=10.0) as client:
                if method == "GET":
                    response = client.get(url, headers=headers)
                elif method == "POST":
                    response = client.post(url, headers=headers, json=data)
                elif method == "PUT":
                    response = client.put(url, headers=headers, json=data)
                else:
                    logger.error(f"Unsupported HTTP method: {method}")
                    return None

                logger.info(f"Dodo API Response Status: {response.status_code}")
                logger.info(f"Dodo API Response: {response.text[:500]}")
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Dodo Payments API HTTP error: {e.response.status_code}")
            logger.error(f"Response text: {e.response.text}")
            return None
        except httpx.HTTPError as e:
            logger.error(f"Dodo Payments API error: {e}")
            if hasattr(e, 'response') and e.response:
                logger.error(f"Response: {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error in Dodo API request: {e}")
            return None

    def create_customer(self, user_id: str, email: str) -> Optional[str]:
        """Create a Dodo Payments customer"""
        try:
            # Check if customer already exists
            existing = self._get_customer_by_user_id(user_id)
            if existing and existing.get("dodo_customer_id"):
                return existing.get("dodo_customer_id")

            # Create customer via API
            # NOTE: Adjust endpoint and payload based on Dodo Payments API docs
            customer_data = {
                "email": email,
                "metadata": {"user_id": user_id},
            }

            customer = self._make_request("POST", "customers", customer_data)
            if not customer:
                return None

            customer_id = customer.get("id") or customer.get("customer_id")

            if self.supabase and customer_id:
                try:
                    self.supabase.table("subscriptions").upsert({
                        "user_id": user_id,
                        "dodo_customer_id": customer_id,
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
        try:
            # Try to create/get customer, but don't fail if it doesn't work
            # Dodo may allow checkout without pre-creating customer
            customer_id = self.create_customer(user_id, email)

            # Determine price config
            # Special handling for pro_test plan
            if plan_type == "pro_test" or (plan_type == "pro" and billing_interval == "test"):
                price_key = "pro_test"
            elif billing_interval == "lifetime":
                price_key = f"{plan_type}_lifetime"
            elif billing_interval == "week":
                price_key = f"{plan_type}_weekly"
            else:
                price_key = f"{plan_type}_{billing_interval}ly"

            price_config = PLAN_PRICES.get(price_key)
            if not price_config:
                logger.error(f"Invalid plan: {plan_type} / {billing_interval}")
                return None

            base_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

            # Create checkout session
            # Dodo Payments requires product_cart as an array of product items
            checkout_data = {
                "product_cart": [
                    {
                        "product_id": price_config.get("product_id"),
                        "quantity": 1,
                    }
                ],
                "success_url": f"{base_url}/settings/subscription?success=true",
                "cancel_url": f"{base_url}/pricing?canceled=true",
                "metadata": {
                    "user_id": user_id,
                    "plan_type": plan_type,
                    "billing_interval": billing_interval,
                },
            }
            
            # Add customer_id if we have one (optional for checkout, can create customer during checkout)
            if customer_id:
                checkout_data["customer_id"] = customer_id

            # Dodo Payments uses POST /checkouts endpoint
            session = self._make_request("POST", "checkouts", checkout_data)
            if not session:
                return None

            return {
                "session_id": session.get("id") or session.get("session_id"),
                "url": session.get("checkout_url") or session.get("url") or session.get("redirect_url"),
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
            # Common signature verification methods
            # Adjust based on Dodo Payments documentation
            expected_signature = hmac.new(
                DODO_WEBHOOK_SECRET.encode(),
                payload,
                hashlib.sha256  # May be sha512 or other
            ).hexdigest()

            return hmac.compare_digest(expected_signature, signature)
        except Exception as e:
            logger.error(f"Error verifying signature: {e}")
            return False

    def handle_webhook(self, payload: bytes, signature: str) -> Optional[Dict[str, Any]]:
        """Handle Dodo Payments webhook events"""
        if not self.verify_webhook_signature(payload, signature):
            logger.error("Invalid webhook signature")
            return None

        try:
            event = json.loads(payload.decode())
            
            # Adjust event structure based on Dodo Payments format
            event_type = event.get("type") or event.get("event_type") or event.get("event")
            data = event.get("data") or event.get("payload") or event

            logger.info(f"Processing Dodo webhook: {event_type}")

            # Handle different event types
            if event_type in ["payment.completed", "checkout.completed", "payment.succeeded"]:
                self._handle_payment_completed(data)
            elif event_type in ["subscription.created", "subscription.activated"]:
                self._handle_subscription_created(data)
            elif event_type == "subscription.updated":
                self._handle_subscription_updated(data)
            elif event_type in ["subscription.canceled", "subscription.cancelled"]:
                self._handle_subscription_canceled(data)
            else:
                logger.info(f"Unhandled event: {event_type}")

            return {"status": "success"}
        except Exception as e:
            logger.error(f"Error handling webhook: {e}")
            return None

    def _handle_payment_completed(self, payment: Dict[str, Any]):
        """Handle one-time payment completion (lifetime plans)"""
        if not self.supabase:
            return

        try:
            metadata = payment.get("metadata", {})
            user_id = metadata.get("user_id")
            plan_type = metadata.get("plan_type")
            customer_id = payment.get("customer_id") or payment.get("customer")

            if not user_id or not plan_type:
                logger.error("Missing metadata in payment")
                return

            self.supabase.table("subscriptions").upsert({
                "user_id": user_id,
                "plan_type": plan_type,
                "status": "active",
                "dodo_subscription_id": None,
                "dodo_customer_id": customer_id,
                "current_period_start": datetime.utcnow().isoformat(),
            }, on_conflict="user_id").execute()

            subscription_service = get_subscription_service(self.supabase)
            if plan_type in ["pro", "pro_test"]:
                subscription_service.set_ai_credits(user_id, 5000)
            logger.info(f"Payment completed: user {user_id}, plan {plan_type}")
        except Exception as e:
            logger.error(f"Error handling payment: {e}")

    def _handle_subscription_created(self, subscription: Dict[str, Any]):
        """Handle subscription creation (recurring plans)"""
        if not self.supabase:
            return

        try:
            metadata = subscription.get("metadata", {})
            user_id = metadata.get("user_id")
            customer_id = subscription.get("customer_id") or subscription.get("customer")
            plan_type = metadata.get("plan_type", "pro")

            if not user_id:
                logger.error("Missing user_id in subscription")
                return

            self.supabase.table("subscriptions").upsert({
                "user_id": user_id,
                "plan_type": plan_type,
                "status": "active",
                "dodo_subscription_id": subscription.get("id"),
                "dodo_customer_id": customer_id,
                "current_period_start": datetime.utcnow().isoformat(),
            }, on_conflict="user_id").execute()

            subscription_service = get_subscription_service(self.supabase)
            subscription_service.set_ai_credits(user_id, 1000)
            logger.info(f"Subscription created: user {user_id}")
        except Exception as e:
            logger.error(f"Error handling subscription: {e}")

    def _handle_subscription_updated(self, subscription: Dict[str, Any]):
        """Handle subscription update"""
        if not self.supabase:
            return

        try:
            subscription_id = subscription.get("id")
            if not subscription_id:
                return

            self.supabase.table("subscriptions").update({
                "status": subscription.get("status", "active"),
            }).eq("dodo_subscription_id", subscription_id).execute()

            logger.info(f"Subscription updated: {subscription_id}")
        except Exception as e:
            logger.error(f"Error updating subscription: {e}")

    def _handle_subscription_canceled(self, subscription: Dict[str, Any]):
        """Handle subscription cancellation"""
        if not self.supabase:
            return

        try:
            subscription_id = subscription.get("id")
            if not subscription_id:
                return

            self.supabase.table("subscriptions").update({
                "status": "canceled",
            }).eq("dodo_subscription_id", subscription_id).execute()

            logger.info(f"Subscription canceled: {subscription_id}")
        except Exception as e:
            logger.error(f"Error canceling subscription: {e}")


# Global instance
_dodo_service: Optional[DodoService] = None

def get_dodo_service(supabase_client: Optional[Client] = None) -> DodoService:
    """Get or create Dodo Payments service instance"""
    global _dodo_service
    if _dodo_service is None:
        _dodo_service = DodoService(supabase_client)
    return _dodo_service


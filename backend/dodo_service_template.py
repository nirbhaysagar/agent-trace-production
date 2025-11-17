"""
Dodo Payments Service Template
Customize this based on your actual Dodo Payments API documentation
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

# ============================================
# CONFIGURATION - UPDATE THESE VALUES
# ============================================
DODO_API_KEY = os.getenv("DODO_API_KEY")
DODO_API_URL = os.getenv("DODO_API_URL", "https://api.dodopayments.com/v1")  # UPDATE THIS
DODO_WEBHOOK_SECRET = os.getenv("DODO_WEBHOOK_SECRET")

# Plan pricing (same structure as Stripe)
PLAN_PRICES = {
    "mini_weekly": {
        "amount": 900,  # $9.00 in cents
        "currency": "usd",
        "interval": "week",
        "product_name": "AgentTrace Mini Trial",
    },
    "pro_lifetime": {
        "amount": 5900,  # $59.00
        "currency": "usd",
        "product_name": "AgentTrace Pro Lifetime",
    },
    "pro_monthly": {
        "amount": 1900,  # $19.00
        "currency": "usd",
        "interval": "month",
    },
    "pro_test": {
        "amount": 1,  # $0.01
        "currency": "usd",
        "product_name": "AgentTrace Pro Test Plan",
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

        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        
        # UPDATE: Adjust headers based on Dodo Payments authentication method
        headers = {
            "Authorization": f"Bearer {self.api_key}",  # May be "Api-Key" or different format
            "Content-Type": "application/json",
        }

        try:
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

                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Dodo Payments API error: {e}")
            if hasattr(e, 'response') and e.response:
                logger.error(f"Response: {e.response.text}")
            return None

    def create_customer(self, user_id: str, email: str) -> Optional[str]:
        """Create a Dodo Payments customer"""
        try:
            existing = self._get_customer_by_user_id(user_id)
            if existing and existing.get("dodo_customer_id"):
                return existing.get("dodo_customer_id")

            # UPDATE: Adjust API endpoint and payload based on Dodo Payments docs
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
            customer_id = self.create_customer(user_id, email)
            if not customer_id:
                return None

            # Determine price config
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
                logger.error(f"Invalid plan: {plan_type} / {billing_interval}")
                return None

            base_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

            # UPDATE: Adjust checkout session creation based on Dodo Payments API
            checkout_data = {
                "customer_id": customer_id,
                "amount": price_config["amount"],
                "currency": price_config["currency"],
                "description": price_config.get("product_name", f"{plan_type} plan"),
                "success_url": f"{base_url}/settings/subscription?success=true",
                "cancel_url": f"{base_url}/pricing?canceled=true",
                "metadata": {
                    "user_id": user_id,
                    "plan_type": plan_type,
                    "billing_interval": billing_interval,
                },
            }

            # Add recurring if needed
            if billing_interval in ["month", "year", "week"]:
                checkout_data["recurring"] = {
                    "interval": price_config.get("interval", "month"),
                }

            # UPDATE: Adjust endpoint name
            session = self._make_request("POST", "checkout/sessions", checkout_data)
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
        """Verify webhook signature"""
        if not DODO_WEBHOOK_SECRET:
            logger.error("Dodo Payments webhook secret not configured")
            return False

        try:
            # UPDATE: Adjust signature verification method based on Dodo Payments docs
            # Common methods: HMAC SHA256, SHA512, etc.
            expected_signature = hmac.new(
                DODO_WEBHOOK_SECRET.encode(),
                payload,
                hashlib.sha256  # May be sha512 or other
            ).hexdigest()

            # May need to compare differently (e.g., with prefix)
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
            
            # UPDATE: Adjust event structure based on Dodo Payments format
            event_type = event.get("type") or event.get("event_type") or event.get("event")
            data = event.get("data") or event.get("payload") or event

            logger.info(f"Processing Dodo webhook: {event_type}")

            # UPDATE: Adjust event type names based on Dodo Payments documentation
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
        """Handle one-time payment completion"""
        if not self.supabase:
            return

        try:
            # UPDATE: Adjust field names based on Dodo Payments response
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
        """Handle subscription creation"""
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


import os
import logging
from typing import Optional, Dict, Any
from datetime import datetime
import stripe
from supabase import Client
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# Plan pricing configuration
PLAN_PRICES = {
    "mini_weekly": {
        "price_id": os.getenv("STRIPE_PRICE_MINI_WEEKLY", ""),
        "amount": 900,  # $9.00
        "currency": "usd",
        "interval": "week",
        "product_name": "AgentTrace Mini Trial",
        "description": "1-week trial with all Pro features",
    },
    "pro_lifetime": {
        "price_id": os.getenv("STRIPE_PRICE_PRO_LIFETIME", ""),
        "amount": 5900,  # $59.00
        "currency": "usd",
        "mode": "payment",
        "product_name": "AgentTrace Pro Lifetime",
        "description": "Lifetime access to AgentTrace Pro",
    },
    "pro_monthly": {
        "price_id": os.getenv("STRIPE_PRICE_PRO_MONTHLY", ""),
        "amount": 1900,  # $19.00
        "currency": "usd",
        "interval": "month",
    },
    "pro_yearly": {
        "price_id": os.getenv("STRIPE_PRICE_PRO_YEARLY", ""),
        "amount": 19000,  # $190.00
        "currency": "usd",
        "interval": "year",
    },
    "team_monthly": {
        "price_id": os.getenv("STRIPE_PRICE_TEAM_MONTHLY", ""),
        "amount": 4900,  # $49.00
        "currency": "usd",
        "interval": "month",
    },
}


class StripeService:
    """Service for handling Stripe payment operations"""

    def __init__(self, supabase_client: Optional[Client] = None):
        self.supabase = supabase_client
        if not stripe.api_key:
            logger.warning("Stripe API key not configured")

    def create_customer(self, user_id: str, email: str) -> Optional[str]:
        """Create a Stripe customer and return customer ID"""
        if not stripe.api_key:
            logger.error("Stripe API key not configured")
            return None

        try:
            # Check if customer already exists
            existing = self._get_customer_by_user_id(user_id)
            if existing:
                return existing.get("stripe_customer_id")

            # Create new customer
            customer = stripe.Customer.create(
                email=email,
                metadata={"user_id": user_id},
            )

            # Store customer ID in database
            if self.supabase:
                try:
                    self.supabase.table("subscriptions").upsert({
                        "user_id": user_id,
                        "stripe_customer_id": customer.id,
                    }, on_conflict="user_id").execute()
                except Exception as e:
                    logger.error(f"Error storing customer ID: {e}")

            return customer.id
        except Exception as e:
            logger.error(f"Error creating Stripe customer: {e}")
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
        """Create a Stripe Checkout session"""
        if not stripe.api_key:
            logger.error("Stripe API key not configured")
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
            else:
                price_key = f"{plan_type}_{billing_interval}ly"
            price_config = PLAN_PRICES.get(price_key)

            if not price_config:
                logger.error(f"Invalid plan type: {plan_type} with interval {billing_interval}")
                return None

            # Get base URL from environment or use default
            base_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

            # Determine mode and build line items
            mode = price_config.get("mode", "subscription")
            line_item: Dict[str, Any] = {"quantity": 1}

            price_id = price_config.get("price_id")
            if price_id:
                line_item["price"] = price_id
            else:
                price_data: Dict[str, Any] = {
                    "currency": price_config["currency"],
                    "product_data": {
                        "name": price_config.get("product_name", f"AgentTrace {plan_type.capitalize()} Plan"),
                        "description": price_config.get("description", f"{plan_type.capitalize()} subscription"),
                    },
                    "unit_amount": price_config["amount"],
                }
                if mode == "subscription":
                    price_data["recurring"] = {
                        "interval": price_config.get("interval", "month"),
                    }
                line_item["price_data"] = price_data

            # Create checkout session
            session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=["card"],
                line_items=[line_item],
                mode=mode,
                success_url=f"{base_url}/settings/subscription?success=true",
                cancel_url=f"{base_url}/pricing?canceled=true",
                metadata={
                    "user_id": user_id,
                    "plan_type": plan_type,
                    "billing_interval": billing_interval,
                    "mode": mode,
                },
            )

            return {
                "session_id": session.id,
                "url": session.url,
            }
        except Exception as e:
            logger.error(f"Error creating checkout session: {e}")
            return None

    def create_portal_session(self, user_id: str) -> Optional[str]:
        """Create a Stripe Customer Portal session"""
        if not stripe.api_key:
            logger.error("Stripe API key not configured")
            return None

        try:
            # Get customer ID
            customer_record = self._get_customer_by_user_id(user_id)
            if not customer_record or not customer_record.get("stripe_customer_id"):
                logger.error(f"No Stripe customer found for user {user_id}")
                return None

            customer_id = customer_record["stripe_customer_id"]

            # Get base URL
            base_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

            # Create portal session
            session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=f"{base_url}/settings/subscription",
            )

            return session.url
        except Exception as e:
            logger.error(f"Error creating portal session: {e}")
            return None

    def handle_webhook(self, payload: bytes, signature: str) -> Optional[Dict[str, Any]]:
        """Handle Stripe webhook events"""
        if not stripe.api_key:
            logger.error("Stripe API key not configured")
            return None

        webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
        if not webhook_secret:
            logger.error("Stripe webhook secret not configured")
            return None

        try:
            event = stripe.Webhook.construct_event(payload, signature, webhook_secret)
        except ValueError as e:
            logger.error(f"Invalid payload: {e}")
            return None
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid signature: {e}")
            return None

        # Handle the event
        event_type = event["type"]
        data = event["data"]["object"]

        logger.info(f"Processing Stripe webhook: {event_type}")

        if event_type == "customer.subscription.created":
            self._handle_subscription_created(data)
        elif event_type == "customer.subscription.updated":
            self._handle_subscription_updated(data)
        elif event_type == "customer.subscription.deleted":
            self._handle_subscription_deleted(data)
        elif event_type == "checkout.session.completed":
            self._handle_checkout_completed(data)
        else:
            logger.info(f"Unhandled event type: {event_type}")

        return {"status": "success"}

    def _handle_subscription_created(self, subscription: Dict[str, Any]):
        """Handle subscription created event"""
        if not self.supabase:
            return

        try:
            customer_id = subscription.get("customer")
            metadata = subscription.get("metadata", {})
            user_id = metadata.get("user_id")

            if not user_id:
                # Try to get user_id from customer metadata
                customer = stripe.Customer.retrieve(customer_id)
                user_id = customer.metadata.get("user_id")

            if not user_id:
                logger.error("Could not find user_id for subscription")
                return

            # Determine plan type from metadata or price
            plan_type = metadata.get("plan_type", "pro")
            if not plan_type:
                # Try to infer from price
                items = subscription.get("items", {}).get("data", [])
                if items:
                    price_id = items[0].get("price", {}).get("id")
                    # This would need to be configured based on your actual price IDs
                    plan_type = "pro"  # Default

            # Create or update subscription record
            self.supabase.table("subscriptions").upsert({
                "user_id": user_id,
                "plan_type": plan_type,
                "status": subscription.get("status", "active"),
                "stripe_subscription_id": subscription.get("id"),
                "stripe_customer_id": customer_id,
                "current_period_start": datetime.fromtimestamp(
                    subscription.get("current_period_start", 0)
                ).isoformat() if subscription.get("current_period_start") else None,
                "current_period_end": datetime.fromtimestamp(
                    subscription.get("current_period_end", 0)
                ).isoformat() if subscription.get("current_period_end") else None,
                "cancel_at_period_end": subscription.get("cancel_at_period_end", False),
            }, on_conflict="user_id").execute()

            logger.info(f"Subscription created for user {user_id}")
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
                "current_period_start": datetime.fromtimestamp(
                    subscription.get("current_period_start", 0)
                ).isoformat() if subscription.get("current_period_start") else None,
                "current_period_end": datetime.fromtimestamp(
                    subscription.get("current_period_end", 0)
                ).isoformat() if subscription.get("current_period_end") else None,
                "cancel_at_period_end": subscription.get("cancel_at_period_end", False),
            }

            self.supabase.table("subscriptions").update(update_data).eq(
                "stripe_subscription_id", subscription_id
            ).execute()

            logger.info(f"Subscription updated: {subscription_id}")
        except Exception as e:
            logger.error(f"Error handling subscription updated: {e}")

    def _handle_subscription_deleted(self, subscription: Dict[str, Any]):
        """Handle subscription deleted event"""
        if not self.supabase:
            return

        try:
            subscription_id = subscription.get("id")
            if not subscription_id:
                return

            # Update subscription status to canceled
            self.supabase.table("subscriptions").update({
                "status": "canceled",
            }).eq("stripe_subscription_id", subscription_id).execute()

            logger.info(f"Subscription canceled: {subscription_id}")
        except Exception as e:
            logger.error(f"Error handling subscription deleted: {e}")

    def _handle_checkout_completed(self, session: Dict[str, Any]):
        """Handle checkout completion for one-time purchases"""
        if not self.supabase:
            return

        try:
            metadata = session.get("metadata", {}) or {}
            plan_type = metadata.get("plan_type")
            user_id = metadata.get("user_id")
            mode = metadata.get("mode", "subscription")

            # Only handle one-time payments (lifetime plans)
            if mode != "payment" or not user_id or not plan_type:
                logger.info("Checkout session completed without applicable plan metadata")
                return

            customer_id = session.get("customer")

            self.supabase.table("subscriptions").upsert({
                "user_id": user_id,
                "plan_type": plan_type,
                "status": "active",
                "stripe_subscription_id": None,
                "stripe_customer_id": customer_id,
                "current_period_start": datetime.utcnow().isoformat(),
                "current_period_end": None,
                "cancel_at_period_end": False,
            }, on_conflict="user_id").execute()

            logger.info(f"Checkout completed for user {user_id}, plan {plan_type}")
        except Exception as e:
            logger.error(f"Error handling checkout completion: {e}")


# Global instance
_stripe_service: Optional[StripeService] = None


def get_stripe_service(supabase_client: Optional[Client] = None) -> StripeService:
    """Get or create the global Stripe service instance"""
    global _stripe_service
    if _stripe_service is None:
        _stripe_service = StripeService(supabase_client)
    return _stripe_service


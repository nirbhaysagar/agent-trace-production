import os
import logging
from typing import Optional, Dict, Any
from datetime import datetime, date
from supabase import Client
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Plan limits
PLAN_LIMITS = {
    "free": {
        "traces_per_month": 10,
        "ai_features": False,
        "api_access": False,
        "trace_retention_days": 30,
    },
    "mini": {
        "traces_per_month": -1,  # Unlimited
        "ai_features": True,
        "api_access": True,
        "trace_retention_days": -1,  # Unlimited
    },
    "pro": {
        "traces_per_month": -1,  # Unlimited
        "ai_features": True,
        "api_access": True,
        "trace_retention_days": -1,  # Unlimited
    },
    "team": {
        "traces_per_month": -1,  # Unlimited
        "ai_features": True,
        "api_access": True,
        "trace_retention_days": -1,  # Unlimited
    },
}


class SubscriptionService:
    """Service for managing user subscriptions and feature access"""

    def __init__(self, supabase_client: Optional[Client] = None):
        self.supabase = supabase_client

    def get_user_subscription(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user's current subscription"""
        if not self.supabase:
            logger.warning("Supabase not configured, defaulting to free plan")
            return self._default_free_subscription(user_id)

        try:
            response = (
                self.supabase.table("subscriptions")
                .select("*")
                .eq("user_id", user_id)
                .eq("status", "active")
                .limit(1)
                .execute()
            )

            if response.data and len(response.data) > 0:
                return response.data[0]

            # No active subscription, return free plan
            return self._default_free_subscription(user_id)
        except Exception as e:
            logger.error(f"Error fetching subscription: {e}")
            return self._default_free_subscription(user_id)

    def _default_free_subscription(self, user_id: str) -> Dict[str, Any]:
        """Return default free subscription"""
        return {
            "id": None,
            "user_id": user_id,
            "plan_type": "free",
            "status": "active",
            "stripe_subscription_id": None,
            "stripe_customer_id": None,
            "current_period_start": None,
            "current_period_end": None,
            "cancel_at_period_end": False,
        }

    def get_plan_limits(self, plan_type: str) -> Dict[str, Any]:
        """Get limits for a plan type"""
        return PLAN_LIMITS.get(plan_type, PLAN_LIMITS["free"])

    def check_feature_access(self, user_id: str, feature: str) -> bool:
        """Check if user has access to a specific feature"""
        subscription = self.get_user_subscription(user_id)
        plan_type = subscription.get("plan_type", "free")
        limits = self.get_plan_limits(plan_type)

        feature_map = {
            "ai_features": limits.get("ai_features", False),
            "api_access": limits.get("api_access", False),
        }

        return feature_map.get(feature, False)

    def get_usage_stats(self, user_id: str) -> Dict[str, Any]:
        """Get current usage statistics for user"""
        if not self.supabase:
            return {"trace_count": 0, "trace_limit": 10, "reset_date": None}

        try:
            # Get subscription to determine limits
            subscription = self.get_user_subscription(user_id)
            plan_type = subscription.get("plan_type", "free")
            limits = self.get_plan_limits(plan_type)
            trace_limit = limits.get("traces_per_month", 10)

            # Get current usage
            response = (
                self.supabase.table("usage_limits")
                .select("*")
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )

            if response.data and len(response.data) > 0:
                usage = response.data[0]
                # Check if reset is needed
                reset_date = datetime.fromisoformat(usage["reset_date"]).date()
                if reset_date <= date.today():
                    # Reset usage
                    self._reset_usage(user_id)
                    return {
                        "trace_count": 0,
                        "trace_limit": trace_limit,
                        "reset_date": reset_date.isoformat(),
                    }

                return {
                    "trace_count": usage.get("trace_count", 0),
                    "trace_limit": trace_limit,
                    "reset_date": usage.get("reset_date"),
                }

            # No usage record, create one
            self._initialize_usage(user_id)
            return {
                "trace_count": 0,
                "trace_limit": trace_limit,
                "reset_date": None,
            }
        except Exception as e:
            logger.error(f"Error fetching usage stats: {e}")
            return {"trace_count": 0, "trace_limit": 10, "reset_date": None}

    def _initialize_usage(self, user_id: str):
        """Initialize usage tracking for a new user"""
        if not self.supabase:
            return

        try:
            reset_date = (date.today().replace(day=1) + 
                         __import__('datetime').timedelta(days=32)).replace(day=1)
            
            self.supabase.table("usage_limits").insert({
                "user_id": user_id,
                "trace_count": 0,
                "reset_date": reset_date.isoformat(),
            }).execute()
        except Exception as e:
            logger.error(f"Error initializing usage: {e}")

    def _reset_usage(self, user_id: str):
        """Reset monthly usage counters"""
        if not self.supabase:
            return

        try:
            reset_date = (date.today().replace(day=1) + 
                         __import__('datetime').timedelta(days=32)).replace(day=1)
            
            self.supabase.table("usage_limits").update({
                "trace_count": 0,
                "reset_date": reset_date.isoformat(),
            }).eq("user_id", user_id).execute()
        except Exception as e:
            logger.error(f"Error resetting usage: {e}")

    def increment_usage(self, user_id: str, resource_type: str = "trace"):
        """Increment usage counter for a resource"""
        if not self.supabase:
            return

        try:
            if resource_type == "trace":
                # Get current usage
                response = (
                    self.supabase.table("usage_limits")
                    .select("*")
                    .eq("user_id", user_id)
                    .limit(1)
                    .execute()
                )

                if response.data and len(response.data) > 0:
                    current_count = response.data[0].get("trace_count", 0)
                    self.supabase.table("usage_limits").update({
                        "trace_count": current_count + 1,
                    }).eq("user_id", user_id).execute()
                else:
                    # Initialize and increment
                    self._initialize_usage(user_id)
                    self.supabase.table("usage_limits").update({
                        "trace_count": 1,
                    }).eq("user_id", user_id).execute()
        except Exception as e:
            logger.error(f"Error incrementing usage: {e}")

    def can_create_trace(self, user_id: str) -> tuple[bool, Optional[str]]:
        """Check if user can create a new trace. Returns (can_create, error_message)"""
        subscription = self.get_user_subscription(user_id)
        plan_type = subscription.get("plan_type", "free")
        limits = self.get_plan_limits(plan_type)
        trace_limit = limits.get("traces_per_month", 10)

        # Unlimited plans
        if trace_limit == -1:
            return True, None

        # Check usage
        usage_stats = self.get_usage_stats(user_id)
        current_count = usage_stats.get("trace_count", 0)

        if current_count >= trace_limit:
            return False, f"You've reached your monthly limit of {trace_limit} traces. Upgrade to Pro for unlimited traces."

        return True, None


# Global instance
_subscription_service: Optional[SubscriptionService] = None


def get_subscription_service(supabase_client: Optional[Client] = None) -> SubscriptionService:
    """Get or create the global subscription service instance"""
    global _subscription_service
    if _subscription_service is None:
        _subscription_service = SubscriptionService(supabase_client)
    return _subscription_service



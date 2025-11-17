# 🧪 Test Plan Removal Guide

## Overview
A test plan (`pro_test`) has been added for testing purposes at $0.01. This guide shows you how to remove it before production launch.

## What Was Added

### Backend Changes:
1. **`backend/stripe_service.py`**:
   - Added `pro_test` plan configuration
   - Added `billing_interval == "test"` handling
   - Updated webhook handler for test plan

2. **`backend/subscription_service.py`**:
   - Added `pro_test` to `PLAN_LIMITS` (same as `pro`)

3. **`backend/env.example`**:
   - Added `STRIPE_PRICE_PRO_TEST` environment variable

### Frontend Changes:
1. **`frontend/src/context/SubscriptionContext.tsx`**:
   - Added `'pro_test'` to `Subscription` interface
   - Updated `canUseAI()` to include `pro_test`

2. **`frontend/src/pages/pricing.tsx`**:
   - Added test plan card to pricing page

### Database Changes:
1. **`database/complete_schema.sql`**:
   - Added `'pro_test'` to plan_type check constraint

2. **`database/complete_schema_safe.sql`**:
   - Added `'pro_test'` to plan_type check constraint

## How to Remove Before Production

### Step 1: Remove from Backend

**`backend/stripe_service.py`**:
```python
# Remove this section (lines ~53-61):
"pro_test": {
    "price_id": os.getenv("STRIPE_PRICE_PRO_TEST", ""),
    "amount": 1,  # $0.01
    "currency": "usd",
    "mode": "payment",
    "product_name": "AgentTrace Pro Test Plan",
    "description": "TEST ONLY - Full Pro features for testing (will be removed)",
},

# Remove this from create_checkout_session (lines ~146-147):
elif billing_interval == "test":
    price_key = f"{plan_type}_test"
```

**`backend/subscription_service.py`**:
```python
# Remove this section (lines ~32-37):
"pro_test": {  # TEST PLAN - Same as pro, remove before production
    "traces_per_month": -1,
    "ai_features": True,
    "api_access": True,
    "trace_retention_days": -1,
},
```

**`backend/env.example`**:
```bash
# Remove this line:
STRIPE_PRICE_PRO_TEST=price_your_pro_test_price_id  # TEST ONLY - Remove before production
```

### Step 2: Remove from Frontend

**`frontend/src/context/SubscriptionContext.tsx`**:
```typescript
// Remove 'pro_test' from interface (line 6):
export interface Subscription {
  plan_type: 'free' | 'pro' | 'mini' | 'team'  // Remove 'pro_test'
  // ...
}

// Update canUseAI() (line 83):
const canUseAI = () => subscription?.plan_type === 'pro' || subscription?.plan_type === 'mini'
// Remove: || subscription?.plan_type === 'pro_test'
```

**`frontend/src/pages/pricing.tsx`**:
```typescript
// Remove the entire pro_test plan object from the plans array (lines ~147-209)
// This is the plan with key: 'pro_test'
```

### Step 3: Update Database Schema

**Option A: Update existing constraint** (if you have existing data):
```sql
-- Run in Supabase SQL Editor
ALTER TABLE public.subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;

ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_plan_type_check 
CHECK (plan_type IN ('free', 'mini', 'pro', 'team'));
```

**Option B: Use updated schema files**:
- Update `database/complete_schema.sql` - remove `'pro_test'` from check constraint
- Update `database/complete_schema_safe.sql` - remove `'pro_test'` from check constraint

### Step 4: Remove from Stripe Dashboard

1. Go to Stripe Dashboard → Products
2. Find "AgentTrace Pro Test Plan"
3. Archive or delete the product
4. Remove the price ID from your environment variables

### Step 5: Clean Up Existing Test Subscriptions (Optional)

If you want to convert existing test plan users to free:
```sql
-- Run in Supabase SQL Editor
UPDATE public.subscriptions 
SET plan_type = 'free', status = 'canceled'
WHERE plan_type = 'pro_test';
```

## Quick Removal Checklist

- [ ] Remove `pro_test` from `backend/stripe_service.py` (PLAN_PRICES and billing_interval check)
- [ ] Remove `pro_test` from `backend/subscription_service.py` (PLAN_LIMITS)
- [ ] Remove `STRIPE_PRICE_PRO_TEST` from `backend/env.example`
- [ ] Remove `pro_test` from `frontend/src/context/SubscriptionContext.tsx` (interface and canUseAI)
- [ ] Remove test plan card from `frontend/src/pages/pricing.tsx`
- [ ] Update database constraint to remove `'pro_test'`
- [ ] Archive/delete test product in Stripe Dashboard
- [ ] Remove `STRIPE_PRICE_PRO_TEST` from production environment variables
- [ ] Test that regular plans still work

## Notes

- The test plan gives full Pro features (5000 AI credits, unlimited traces, etc.)
- All test plan code is marked with comments like `# TEST PLAN` or `🧪 TEST`
- Search for "pro_test" or "TEST" in the codebase to find all references
- The test plan appears on the pricing page with clear "TEST ONLY" labels

## After Removal

Once removed, users who purchased the test plan will need to:
- Either keep their test subscription (if you don't clean it up)
- Or be migrated to free plan (if you run the cleanup SQL)

You may want to notify test users before removing the plan.


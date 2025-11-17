-- ============================================
-- Add Dodo Payments Columns to Subscriptions
-- ============================================
-- Run this in Supabase SQL Editor if you already have the subscriptions table
-- This adds Dodo Payments columns without dropping existing data

-- Add Dodo Payments columns
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS dodo_customer_id TEXT,
ADD COLUMN IF NOT EXISTS dodo_subscription_id TEXT;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS subscriptions_dodo_customer_id_idx 
ON public.subscriptions (dodo_customer_id);

CREATE INDEX IF NOT EXISTS subscriptions_dodo_subscription_id_idx 
ON public.subscriptions (dodo_subscription_id);

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
AND column_name LIKE 'dodo%';


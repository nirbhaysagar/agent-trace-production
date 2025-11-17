-- ============================================
-- COMPLETE USER DATA VIEW
-- Shows users with their subscription and usage information
-- ============================================

SELECT 
  u.id as user_id,
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  u.created_at as user_created_at,
  u.last_sign_in_at,
  
  -- Subscription Info
  COALESCE(s.plan_type, 'free') as plan_type,
  s.status as subscription_status,
  s.stripe_subscription_id,
  s.current_period_start,
  s.current_period_end,
  
  -- Usage Limits
  COALESCE(ul.trace_count, 0) as trace_count,
  COALESCE(ul.ai_credits, 10) as ai_credits,
  ul.reset_date as usage_reset_date,
  
  -- Timestamps
  ul.created_at as usage_limits_created_at,
  ul.updated_at as usage_limits_updated_at

FROM auth.users u
LEFT JOIN public.subscriptions s ON u.id = s.user_id
LEFT JOIN public.usage_limits ul ON u.id = ul.user_id
ORDER BY u.created_at DESC;

-- ============================================
-- QUICK SUMMARY
-- ============================================

-- SELECT 
--   COUNT(DISTINCT u.id) as total_users,
--   COUNT(DISTINCT CASE WHEN s.plan_type = 'pro' THEN u.id END) as pro_users,
--   COUNT(DISTINCT CASE WHEN s.plan_type = 'free' OR s.plan_type IS NULL THEN u.id END) as free_users,
--   SUM(COALESCE(ul.ai_credits, 10)) as total_ai_credits,
--   SUM(COALESCE(ul.trace_count, 0)) as total_traces_uploaded
-- FROM auth.users u
-- LEFT JOIN public.subscriptions s ON u.id = s.user_id
-- LEFT JOIN public.usage_limits ul ON u.id = ul.user_id;


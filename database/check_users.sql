-- ============================================
-- USER DIAGNOSTIC QUERIES
-- Run these in Supabase SQL Editor
-- ============================================

-- 1. Check if auth.users table exists and has data
-- This is the MAIN table where Supabase stores user accounts
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
  COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed_users
FROM auth.users;

-- 2. View all users with details
SELECT 
  id,
  email,
  email_confirmed_at IS NOT NULL as email_confirmed,
  created_at,
  last_sign_in_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 50;

-- 3. Check if user exists by email (replace with your email)
-- SELECT 
--   id,
--   email,
--   email_confirmed_at,
--   created_at,
--   last_sign_in_at
-- FROM auth.users
-- WHERE email = 'your-email@example.com';

-- 4. Check user's subscription and usage data
SELECT 
  u.id as user_id,
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  u.created_at as user_created_at,
  COALESCE(s.plan_type, 'free') as plan_type,
  s.status as subscription_status,
  COALESCE(ul.trace_count, 0) as trace_count,
  COALESCE(ul.ai_credits, 10) as ai_credits,
  ul.created_at as usage_limits_created_at
FROM auth.users u
LEFT JOIN public.subscriptions s ON u.id = s.user_id
LEFT JOIN public.usage_limits ul ON u.id = ul.user_id
ORDER BY u.created_at DESC;

-- 5. Check recent signups (last 24 hours)
SELECT 
  id,
  email,
  email_confirmed_at IS NOT NULL as email_confirmed,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as hours_ago
FROM auth.users
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 6. Check if usage_limits were created for users
SELECT 
  u.id,
  u.email,
  CASE WHEN ul.id IS NULL THEN 'MISSING' ELSE 'EXISTS' END as usage_limits_status
FROM auth.users u
LEFT JOIN public.usage_limits ul ON u.id = ul.user_id
ORDER BY u.created_at DESC;

-- ============================================
-- TROUBLESHOOTING QUERIES
-- ============================================

-- If users exist but no usage_limits, run this to create them:
-- INSERT INTO public.usage_limits (user_id, trace_count, ai_credits)
-- SELECT 
--   u.id,
--   0,
--   10
-- FROM auth.users u
-- WHERE NOT EXISTS (
--   SELECT 1 FROM public.usage_limits ul WHERE ul.user_id = u.id
-- );

-- ============================================
-- NOTES
-- ============================================
-- 1. auth.users is automatically managed by Supabase
-- 2. Users are created immediately on signup (even if email confirmation is required)
-- 3. If you don't see users here, check:
--    - Supabase Dashboard → Authentication → Users (GUI view)
--    - Browser console for signup errors
--    - Environment variables (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY)
-- 4. Email confirmation only affects email_confirmed_at, not user creation


-- Supabase Authentication Schema
-- NOTE: Supabase automatically manages these tables in the `auth` schema
-- You do NOT need to run this manually - it's for reference only
-- 
-- Supabase Auth automatically creates and manages:
-- - auth.users (user accounts)
-- - auth.sessions (active sessions)
-- - auth.refresh_tokens (token refresh)
-- - auth.audit_log_entries (audit logs)
-- - auth.identities (OAuth identities)
-- - auth.instances (instance metadata)

-- ============================================
-- AUTH SCHEMA (Managed by Supabase)
-- ============================================

-- auth.users table (automatically created by Supabase)
-- This is the main user table that stores:
-- - id (uuid, primary key)
-- - email (text, unique)
-- - encrypted_password (text)
-- - email_confirmed_at (timestamptz)
-- - invited_at (timestamptz)
-- - confirmation_token (text)
-- - recovery_token (text)
-- - email_change_token_new (text)
-- - email_change (text)
-- - created_at (timestamptz)
-- - updated_at (timestamptz)
-- - raw_app_meta_data (jsonb)
-- - raw_user_meta_data (jsonb)
-- - is_super_admin (boolean)
-- - role (text)
-- - aud (text)
-- - confirmation_sent_at (timestamptz)
-- - recovery_sent_at (timestamptz)
-- - email_change_sent_at (timestamptz)
-- - last_sign_in_at (timestamptz)
-- - phone (text)
-- - phone_confirmed_at (timestamptz)
-- - phone_change (text)
-- - phone_change_token (text)
-- - phone_change_sent_at (timestamptz)
-- - confirmed_at (timestamptz)
-- - email_change_token_current (text)
-- - email_change_confirm_status (smallint)
-- - banned_until (timestamptz)
-- - reauthentication_token (text)
-- - reauthentication_sent_at (timestamptz)
-- - is_sso_user (boolean)
-- - deleted_at (timestamptz)

-- auth.sessions table (automatically created by Supabase)
-- Stores active user sessions:
-- - id (uuid, primary key)
-- - user_id (uuid, foreign key to auth.users)
-- - created_at (timestamptz)
-- - updated_at (timestamptz)
-- - factor_id (uuid)
-- - aal (text) - Authenticator Assurance Level
-- - not_after (timestamptz)
-- - refreshed_at (timestamptz)
-- - user_agent (text)
-- - ip (inet)
-- - tag (text)

-- auth.refresh_tokens table (automatically created by Supabase)
-- Stores refresh tokens for session management:
-- - instance_id (uuid)
-- - id (bigint, primary key)
-- - token (text, unique)
-- - user_id (uuid, foreign key to auth.users)
-- - revoked (boolean)
-- - created_at (timestamptz)
-- - updated_at (timestamptz)
-- - parent (text)
-- - session_id (uuid, foreign key to auth.sessions)

-- auth.identities table (automatically created by Supabase)
-- Stores OAuth identities (Google, GitHub, etc.):
-- - id (text, primary key)
-- - user_id (uuid, foreign key to auth.users)
-- - identity_data (jsonb)
-- - provider (text)
-- - last_sign_in_at (timestamptz)
-- - created_at (timestamptz)
-- - updated_at (timestamptz)
-- - email (text)

-- ============================================
-- PUBLIC SCHEMA (Your Application Tables)
-- ============================================

-- These are the tables YOU need to create for your application:

-- 1. Traces table (already in schema.sql)
-- Links to auth.users via user_id
create table if not exists public.traces (
  id uuid primary key,
  name text,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  steps jsonb not null,
  metadata jsonb,
  total_duration_ms integer,
  total_tokens integer,
  error_count integer default 0,
  shareable_url text,
  user_id uuid references auth.users(id) on delete cascade,  -- Links to auth.users
  is_public boolean not null default false
);

-- 2. Saved filters table (already in schema.sql)
-- Links to auth.users via user_id
create table if not exists public.saved_filters (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,  -- Links to auth.users
  name text not null,
  filters jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

-- 3. Subscriptions table (already in subscription_schema.sql)
-- Links to auth.users via user_id
create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,  -- Links to auth.users
  plan_type text not null check (plan_type in ('free', 'pro')),
  status text not null check (status in ('active', 'canceled', 'past_due', 'trialing')),
  stripe_subscription_id text unique,
  stripe_customer_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- 4. Usage limits table (already in subscription_schema.sql)
-- Links to auth.users via user_id
create table if not exists public.usage_limits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,  -- Links to auth.users
  trace_count integer not null default 0,
  trace_limit integer not null default 10,
  reset_date timestamptz not null default (timezone('utc', now()) + interval '1 month'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- ============================================
-- HELPFUL QUERIES
-- ============================================

-- View all users (requires admin access)
-- SELECT id, email, created_at, email_confirmed_at, last_sign_in_at 
-- FROM auth.users 
-- ORDER BY created_at DESC;

-- View user's traces
-- SELECT t.* 
-- FROM public.traces t
-- WHERE t.user_id = 'user-uuid-here';

-- Count users by plan type
-- SELECT s.plan_type, COUNT(*) as user_count
-- FROM public.subscriptions s
-- GROUP BY s.plan_type;

-- ============================================
-- IMPORTANT NOTES
-- ============================================

-- 1. DO NOT manually modify auth.* tables
--    Supabase manages these automatically

-- 2. Always use foreign key references
--    When creating tables that link to users, use:
--    user_id uuid references auth.users(id) on delete cascade

-- 3. Row Level Security (RLS)
--    You can enable RLS on your public tables for additional security:
--    ALTER TABLE public.traces ENABLE ROW LEVEL SECURITY;
--    CREATE POLICY "Users can view own traces" ON public.traces
--      FOR SELECT USING (auth.uid() = user_id);

-- 4. Accessing user data in your backend
--    Use the Supabase service role key to query auth.users:
--    supabase.auth.admin.get_user_by_id(user_id)

-- 5. Session management
--    Sessions are automatically managed by Supabase client
--    Stored in localStorage (browser) or secure storage (mobile)
--    Tokens are automatically refreshed


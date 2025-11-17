-- ============================================
-- AgentTrace Complete Database Schema
-- ============================================
-- Run this entire file in the Supabase SQL Editor
-- This replaces all previous schemas with the complete, updated version
-- 
-- IMPORTANT: This will create all tables, indexes, functions, and triggers
-- If you have existing data, consider backing it up first
-- ============================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. TRACES TABLE
-- ============================================
-- Stores all agent execution traces
drop table if exists public.traces cascade;
create table public.traces (
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
  user_id uuid references auth.users(id) on delete cascade,
  is_public boolean not null default false
);

-- Indexes for traces
create index traces_created_at_idx on public.traces (created_at desc);
create index traces_error_count_idx on public.traces (error_count);
create index traces_name_search_idx on public.traces using gin (to_tsvector('simple', coalesce(name, '')));
create index traces_user_id_idx on public.traces (user_id);
create index traces_is_public_idx on public.traces (is_public) where is_public = true;

-- ============================================
-- 2. SAVED FILTERS TABLE
-- ============================================
-- Stores user's saved filter presets
drop table if exists public.saved_filters cascade;
create table public.saved_filters (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  filters jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

-- Indexes for saved_filters
create index saved_filters_user_id_idx on public.saved_filters (user_id);
create index saved_filters_created_at_idx on public.saved_filters (created_at desc);

-- ============================================
-- 3. SUBSCRIPTIONS TABLE
-- ============================================
-- Stores user subscription information
drop table if exists public.subscriptions cascade;
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_type text not null check (plan_type in ('free', 'mini', 'pro', 'pro_test', 'team')),
  status text not null check (status in ('active', 'canceled', 'past_due', 'trialing')),
  stripe_subscription_id text unique,
  stripe_customer_id text,
  dodo_customer_id text,
  dodo_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Indexes for subscriptions
create index subscriptions_user_id_idx on public.subscriptions (user_id);
create index subscriptions_status_idx on public.subscriptions (status);
create index subscriptions_stripe_subscription_id_idx on public.subscriptions (stripe_subscription_id);
create index subscriptions_stripe_customer_id_idx on public.subscriptions (stripe_customer_id);
create index subscriptions_dodo_customer_id_idx on public.subscriptions (dodo_customer_id);
create index subscriptions_dodo_subscription_id_idx on public.subscriptions (dodo_subscription_id);

-- Partial unique index to ensure only one active subscription per user
create unique index subscriptions_unique_active_subscription 
  on public.subscriptions (user_id) 
  where status = 'active';

-- ============================================
-- 4. USAGE LIMITS TABLE
-- ============================================
-- Tracks user usage and AI credits
drop table if exists public.usage_limits cascade;
create table public.usage_limits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  trace_count integer not null default 0,
  ai_credits integer not null default 10, -- AI credits: 10 for free users, 1000/month for pro_monthly, 5000 one-time for pro_lifetime
  reset_date date not null default (date_trunc('month', now()) + interval '1 month')::date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Indexes for usage_limits
create index usage_limits_user_id_idx on public.usage_limits (user_id);
create index usage_limits_reset_date_idx on public.usage_limits (reset_date);

-- ============================================
-- 5. FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp automatically
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

-- Function to reset monthly usage (trace_count only, not credits)
create or replace function reset_monthly_usage()
returns void as $$
begin
  update public.usage_limits
  set 
    trace_count = 0,
    reset_date = (date_trunc('month', now()) + interval '1 month')::date,
    updated_at = timezone('utc', now())
  where reset_date <= now()::date;
end;
$$ language plpgsql;

-- ============================================
-- 6. TRIGGERS
-- ============================================

-- Auto-update updated_at for subscriptions
drop trigger if exists update_subscriptions_updated_at on public.subscriptions;
create trigger update_subscriptions_updated_at
  before update on public.subscriptions
  for each row
  execute function update_updated_at_column();

-- Auto-update updated_at for usage_limits
drop trigger if exists update_usage_limits_updated_at on public.usage_limits;
create trigger update_usage_limits_updated_at
  before update on public.usage_limits
  for each row
  execute function update_updated_at_column();

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================
-- Disable RLS - backend handles access control via service role key
alter table public.traces disable row level security;
alter table public.saved_filters disable row level security;
alter table public.subscriptions disable row level security;
alter table public.usage_limits disable row level security;

-- ============================================
-- 8. HELPFUL QUERIES (for reference)
-- ============================================

-- View all users with their subscription status
-- SELECT 
--   u.id,
--   u.email,
--   u.created_at,
--   s.plan_type,
--   s.status,
--   ul.ai_credits,
--   ul.trace_count
-- FROM auth.users u
-- LEFT JOIN public.subscriptions s ON u.id = s.user_id AND s.status = 'active'
-- LEFT JOIN public.usage_limits ul ON u.id = ul.user_id
-- ORDER BY u.created_at DESC;

-- View subscription statistics
-- SELECT 
--   plan_type,
--   status,
--   COUNT(*) as user_count
-- FROM public.subscriptions
-- GROUP BY plan_type, status;

-- View users with low AI credits
-- SELECT 
--   u.email,
--   ul.ai_credits,
--   s.plan_type
-- FROM auth.users u
-- JOIN public.usage_limits ul ON u.id = ul.user_id
-- LEFT JOIN public.subscriptions s ON u.id = s.user_id AND s.status = 'active'
-- WHERE ul.ai_credits < 100
-- ORDER BY ul.ai_credits ASC;

-- ============================================
-- SCHEMA COMPLETE
-- ============================================
-- All tables, indexes, functions, and triggers have been created
-- Your database is ready to use!
-- ============================================


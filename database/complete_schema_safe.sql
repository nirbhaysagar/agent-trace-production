-- ============================================
-- AgentTrace Complete Database Schema (Safe Version)
-- ============================================
-- This version uses "IF NOT EXISTS" and "ADD COLUMN IF NOT EXISTS"
-- Safe to run on existing databases - won't delete data
-- ============================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. TRACES TABLE
-- ============================================
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
  user_id uuid,
  is_public boolean not null default false
);

-- Add columns if they don't exist (for existing installations)
alter table public.traces add column if not exists user_id uuid;
alter table public.traces add column if not exists is_public boolean not null default false;

-- Add foreign key if it doesn't exist
do $$
begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'traces_user_id_fkey'
  ) then
    alter table public.traces 
    add constraint traces_user_id_fkey 
    foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end $$;

-- Indexes for traces
create index if not exists traces_created_at_idx on public.traces (created_at desc);
create index if not exists traces_error_count_idx on public.traces (error_count);
create index if not exists traces_name_search_idx on public.traces using gin (to_tsvector('simple', coalesce(name, '')));
create index if not exists traces_user_id_idx on public.traces (user_id);
create index if not exists traces_is_public_idx on public.traces (is_public) where is_public = true;

-- ============================================
-- 2. SAVED FILTERS TABLE
-- ============================================
create table if not exists public.saved_filters (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  name text not null,
  filters jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

-- Add foreign key if it doesn't exist
do $$
begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'saved_filters_user_id_fkey'
  ) then
    alter table public.saved_filters 
    add constraint saved_filters_user_id_fkey 
    foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end $$;

-- Indexes for saved_filters
create index if not exists saved_filters_user_id_idx on public.saved_filters (user_id);
create index if not exists saved_filters_created_at_idx on public.saved_filters (created_at desc);

-- ============================================
-- 3. SUBSCRIPTIONS TABLE
-- ============================================
create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  plan_type text not null check (plan_type in ('free', 'mini', 'pro', 'pro_test', 'team')),
  status text not null check (status in ('active', 'canceled', 'past_due', 'trialing')),
  stripe_subscription_id text unique,
  stripe_customer_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Update check constraint if it doesn't include all plan types
do $$
begin
  -- Drop old constraint if it exists and doesn't include 'mini' and 'team'
  if exists (
    select 1 from pg_constraint 
    where conname = 'subscriptions_plan_type_check'
  ) then
    alter table public.subscriptions drop constraint if exists subscriptions_plan_type_check;
  end if;
  
  -- Add new constraint with all plan types (including test)
  alter table public.subscriptions 
  add constraint subscriptions_plan_type_check 
  check (plan_type in ('free', 'mini', 'pro', 'pro_test', 'team'));
exception
  when duplicate_object then null;
end $$;

-- Add foreign key if it doesn't exist
do $$
begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'subscriptions_user_id_fkey'
  ) then
    alter table public.subscriptions 
    add constraint subscriptions_user_id_fkey 
    foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end $$;

-- Indexes for subscriptions
create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);
create index if not exists subscriptions_stripe_subscription_id_idx on public.subscriptions (stripe_subscription_id);
create index if not exists subscriptions_stripe_customer_id_idx on public.subscriptions (stripe_customer_id);

-- Partial unique index to ensure only one active subscription per user
drop index if exists subscriptions_unique_active_subscription;
create unique index subscriptions_unique_active_subscription 
  on public.subscriptions (user_id) 
  where status = 'active';

-- ============================================
-- 4. USAGE LIMITS TABLE
-- ============================================
create table if not exists public.usage_limits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique,
  trace_count integer not null default 0,
  ai_credits integer not null default 10,
  reset_date date not null default (date_trunc('month', now()) + interval '1 month')::date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Add ai_credits column if it doesn't exist (for existing installations)
alter table public.usage_limits add column if not exists ai_credits integer not null default 10;

-- Update existing rows to have default credits if they don't have it
update public.usage_limits 
set ai_credits = 10 
where ai_credits is null;

-- Add foreign key if it doesn't exist
do $$
begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'usage_limits_user_id_fkey'
  ) then
    alter table public.usage_limits 
    add constraint usage_limits_user_id_fkey 
    foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end $$;

-- Indexes for usage_limits
create index if not exists usage_limits_user_id_idx on public.usage_limits (user_id);
create index if not exists usage_limits_reset_date_idx on public.usage_limits (reset_date);

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
-- SCHEMA COMPLETE
-- ============================================
-- All tables, indexes, functions, and triggers have been created/updated
-- Your database is ready to use!
-- ============================================


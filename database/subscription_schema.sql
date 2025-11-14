-- AgentTrace Subscription Schema
-- Run this in the Supabase SQL editor

-- Subscriptions table
create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  plan_type text not null check (plan_type in ('free', 'mini', 'pro', 'team')),
  status text not null check (status in ('active', 'canceled', 'past_due', 'trialing')),
  stripe_subscription_id text unique,
  stripe_customer_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Usage limits table for tracking monthly usage
create table if not exists public.usage_limits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique,
  trace_count integer not null default 0,
  reset_date date not null default (date_trunc('month', now()) + interval '1 month')::date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Indexes for performance
create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);
create index if not exists subscriptions_stripe_subscription_id_idx on public.subscriptions (stripe_subscription_id);
create index if not exists usage_limits_user_id_idx on public.usage_limits (user_id);
create index if not exists usage_limits_reset_date_idx on public.usage_limits (reset_date);

-- Partial unique index to ensure only one active subscription per user
create unique index if not exists subscriptions_unique_active_subscription 
  on public.subscriptions (user_id) 
  where status = 'active';

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

-- Triggers to auto-update updated_at
create trigger update_subscriptions_updated_at
  before update on public.subscriptions
  for each row
  execute function update_updated_at_column();

create trigger update_usage_limits_updated_at
  before update on public.usage_limits
  for each row
  execute function update_updated_at_column();

-- Function to reset monthly usage
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

-- Disable row level security (backend handles access control)
alter table public.subscriptions disable row level security;
alter table public.usage_limits disable row level security;



-- AgentTrace Supabase schema
-- Run this in the Supabase SQL editor

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Traces table stores serialized AgentTrace objects
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

-- Helpful indexes
create index if not exists traces_created_at_idx on public.traces (created_at desc);
create index if not exists traces_error_count_idx on public.traces (error_count);
create index if not exists traces_name_search_idx on public.traces using gin (to_tsvector('simple', coalesce(name, '')));
create index if not exists traces_user_id_idx on public.traces (user_id);

-- Backfill commands for existing installations
alter table public.traces add column if not exists user_id uuid;
alter table public.traces add column if not exists is_public boolean not null default false;

-- Saved filters table for user filter presets
create table if not exists public.saved_filters (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  name text not null,
  filters jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists saved_filters_user_id_idx on public.saved_filters (user_id);
create index if not exists saved_filters_created_at_idx on public.saved_filters (created_at desc);

-- Disable row level security so backend anon/service key can access without policies
alter table public.traces disable row level security;
alter table public.saved_filters disable row level security;

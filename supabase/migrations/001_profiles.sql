-- Phase 1: Auth & User Management
-- Extends Supabase Auth with app-specific profile fields.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  age smallint,
  role text not null check (role in ('learner', 'therapist')),
  preferred_language text not null default 'en-US' check (preferred_language in ('en-US', 'zh-CN')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

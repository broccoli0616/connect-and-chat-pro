-- Phase 3: Session Persistence
-- Stores practice session results and individual checkpoint outcomes.

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  scenario_id text not null,
  mode text not null check (mode in ('voice', 'aac', 'text')),
  ai_mode text check (ai_mode in ('coaching', 'realistic')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  is_complete boolean not null default false
);

create table public.checkpoint_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  checkpoint_id text not null,
  user_speech text,
  accepted boolean not null,
  feedback text,
  extracted_value text,
  coaching_tip text,
  attempts smallint not null default 1,
  responded_at timestamptz not null default now()
);

-- RLS: users see only their own sessions
alter table public.sessions enable row level security;
alter table public.checkpoint_results enable row level security;

create policy "Users see own sessions"
  on public.sessions for select using (auth.uid() = user_id);

create policy "Users insert own sessions"
  on public.sessions for insert with check (auth.uid() = user_id);

create policy "Users update own sessions"
  on public.sessions for update using (auth.uid() = user_id);

create policy "Users see own checkpoint results"
  on public.checkpoint_results for select
  using (session_id in (select id from public.sessions where user_id = auth.uid()));

create policy "Users insert own checkpoint results"
  on public.checkpoint_results for insert
  with check (session_id in (select id from public.sessions where user_id = auth.uid()));

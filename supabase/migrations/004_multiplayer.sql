-- Phase 5: Real-Time Multiplayer
-- Matchmaking queue and multiplayer session tracking.

create table public.multiplayer_sessions (
  id uuid primary key default gen_random_uuid(),
  player_a uuid not null references public.profiles(id),
  player_b uuid not null references public.profiles(id),
  scenario_id text not null,
  current_turn uuid,
  state text not null default 'active' check (state in ('active', 'completed', 'abandoned')),
  created_at timestamptz not null default now()
);

create table public.matchmaking_queue (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  scenario_id text not null default 'airport-checkin',
  joined_at timestamptz not null default now(),
  matched_session_id uuid references public.multiplayer_sessions(id)
);

create table public.multiplayer_turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.multiplayer_sessions(id) on delete cascade,
  player_id uuid not null references public.profiles(id),
  checkpoint_id text not null,
  user_speech text,
  accepted boolean,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.multiplayer_sessions enable row level security;
alter table public.matchmaking_queue enable row level security;
alter table public.multiplayer_turns enable row level security;

-- Players can see sessions they are part of
create policy "Players see own multiplayer sessions"
  on public.multiplayer_sessions for select
  using (auth.uid() = player_a or auth.uid() = player_b);

-- Players can manage their own queue entry
create policy "Users manage own queue entry"
  on public.matchmaking_queue for all
  using (auth.uid() = user_id);

-- Players can see turns in their sessions
create policy "Players see own session turns"
  on public.multiplayer_turns for select
  using (
    session_id in (
      select id from public.multiplayer_sessions
      where player_a = auth.uid() or player_b = auth.uid()
    )
  );

create policy "Players insert own turns"
  on public.multiplayer_turns for insert
  with check (
    auth.uid() = player_id and
    session_id in (
      select id from public.multiplayer_sessions
      where player_a = auth.uid() or player_b = auth.uid()
    )
  );

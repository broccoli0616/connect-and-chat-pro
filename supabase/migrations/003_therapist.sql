-- Phase 4: Therapist Dashboard (Real Data)
-- Links therapists to learners and provides aggregated stats.

create table public.therapist_learners (
  therapist_id uuid not null references public.profiles(id) on delete cascade,
  learner_id uuid not null references public.profiles(id) on delete cascade,
  support_need text,
  notes text,
  weekly_goal smallint default 12,
  linked_at timestamptz not null default now(),
  primary key (therapist_id, learner_id)
);

alter table public.therapist_learners enable row level security;

-- Therapists can manage their own learner links
create policy "Therapists see own learners"
  on public.therapist_learners for select
  using (auth.uid() = therapist_id);

create policy "Therapists insert own learners"
  on public.therapist_learners for insert
  with check (auth.uid() = therapist_id);

create policy "Therapists update own learners"
  on public.therapist_learners for update
  using (auth.uid() = therapist_id);

create policy "Therapists delete own learners"
  on public.therapist_learners for delete
  using (auth.uid() = therapist_id);

-- Therapists can read their learners' sessions
create policy "Therapists see learner sessions"
  on public.sessions for select
  using (
    user_id in (
      select learner_id from public.therapist_learners
      where therapist_id = auth.uid()
    )
  );

create policy "Therapists see learner checkpoint results"
  on public.checkpoint_results for select
  using (
    session_id in (
      select s.id from public.sessions s
      join public.therapist_learners tl on tl.learner_id = s.user_id
      where tl.therapist_id = auth.uid()
    )
  );

-- Aggregated view for learner stats
create view public.learner_stats as
select
  s.user_id,
  count(distinct s.id) filter (where s.is_complete) as completed_sessions,
  count(distinct s.id) as total_sessions,
  round(100.0 * avg(case when cr.accepted then 1 else 0 end), 0) as acceptance_rate,
  max(s.started_at) as last_active
from public.sessions s
left join public.checkpoint_results cr on cr.session_id = s.id
group by s.user_id;

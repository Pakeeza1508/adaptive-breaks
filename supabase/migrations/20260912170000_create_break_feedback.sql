create extension if not exists pgcrypto;

create table if not exists public.break_feedback (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,

  primary_state text not null
    check (primary_state in ('drained', 'overwhelmed', 'distracted', 'stuck')),

  energy text not null
    check (energy in ('low', 'normal', 'high')),

  tension text not null
    check (tension in ('low', 'medium', 'high')),

  attention text not null
    check (attention in ('okay', 'scattered', 'stuck')),

  break_mode text not null
    check (break_mode in ('downshift', 'activate', 'refocus', 'detach')),

  feedback text not null
    check (feedback in ('better', 'same', 'worse')),

  challenge_title text,
  challenge_duration_seconds integer
    check (challenge_duration_seconds is null or challenge_duration_seconds > 0),

  available_time_seconds integer
    check (available_time_seconds is null or available_time_seconds > 0),

  scene_confidence real
    check (scene_confidence is null or (scene_confidence >= 0 and scene_confidence <= 1)),

  break_started_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists break_feedback_client_state_created_idx
  on public.break_feedback (client_id, primary_state, created_at desc);

alter table public.break_feedback enable row level security;

-- The browser never talks directly to this table.
-- Only the server-side Edge Function uses the service-role credential.
revoke all on table public.break_feedback from anon, authenticated;
grant all on table public.break_feedback to service_role;

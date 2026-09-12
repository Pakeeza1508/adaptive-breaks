create table if not exists public.scene_corrections (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,

  predicted_state text not null
    check (predicted_state in ('drained', 'overwhelmed', 'distracted', 'stuck')),

  corrected_state text not null
    check (corrected_state in ('drained', 'overwhelmed', 'distracted', 'stuck')),

  predicted_energy text not null
    check (predicted_energy in ('low', 'normal', 'high')),

  predicted_tension text not null
    check (predicted_tension in ('low', 'medium', 'high')),

  predicted_attention text not null
    check (predicted_attention in ('okay', 'scattered', 'stuck')),

  scene_confidence real
    check (scene_confidence is null or (scene_confidence >= 0 and scene_confidence <= 1)),

  created_at timestamptz not null default now()
);

create index if not exists scene_corrections_client_created_idx
  on public.scene_corrections (client_id, created_at desc);

alter table public.scene_corrections enable row level security;

revoke all on table public.scene_corrections from anon, authenticated;
grant all on table public.scene_corrections to service_role;

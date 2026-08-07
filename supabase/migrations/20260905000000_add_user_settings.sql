-- ============================================================================
-- 20260905000000: Tabla user_settings para backup remoto de configuración
-- ============================================================================
-- Permite sincronizar UISettings por usuario en Supabase.
-- Cada usuario tiene una sola fila con su configuración completa en JSONB
-- y la URL del logo subido a Storage. Incluye RLS y trigger updated_at.
-- ============================================================================

begin;

create table if not exists public.user_settings (
  user_id uuid not null primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  logo_url text null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_settings_user_id
  on public.user_settings (user_id);

alter table public.user_settings enable row level security;

create policy "Users can view own settings"
  on public.user_settings for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on public.user_settings for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.user_settings for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.update_user_settings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.update_user_settings_updated_at();

commit;

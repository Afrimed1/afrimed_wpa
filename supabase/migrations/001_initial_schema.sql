-- AFRIMED - Schéma initial (Phase 1)
-- Exécuter dans Supabase : SQL Editor → New query → Run

-- Établissement pilote
create table if not exists public.establishments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Profils staff (liés à auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  establishment_id uuid not null references public.establishments(id),
  role text not null check (role in ('admin', 'doctor', 'lab')),
  first_name text not null,
  last_name text not null,
  email text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Patients (accès par code - enrichi en Phase 2)
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id),
  first_name text not null,
  last_name text not null,
  access_code text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_establishment on public.profiles(establishment_id);
create index if not exists idx_patients_access_code on public.patients(access_code);

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- RLS
alter table public.establishments enable row level security;
alter table public.profiles enable row level security;
alter table public.patients enable row level security;

-- Helper : rôle et établissement de l'utilisateur connecté
create or replace function public.current_profile()
returns public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select * from public.profiles where id = auth.uid();
$$;

revoke all on function public.current_profile() from public;
grant execute on function public.current_profile() to authenticated;

-- Établissements : lecture pour les membres
create policy "establishments_select_member"
  on public.establishments for select
  to authenticated
  using (
    id = (select establishment_id from public.profiles where id = auth.uid())
  );

-- Profils : lecture de son propre profil
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

-- Profils : admin lit tous les profils de son etablissement (via current_profile, pas de recursion)
create policy "profiles_select_admin_establishment"
  on public.profiles for select
  to authenticated
  using (
    coalesce((public.current_profile()).role, '') = 'admin'
    and coalesce((public.current_profile()).is_active, false) = true
    and establishment_id = (public.current_profile()).establishment_id
  );

-- Profils : admin cree des comptes staff
create policy "profiles_insert_admin"
  on public.profiles for insert
  to authenticated
  with check (
    coalesce((public.current_profile()).role, '') = 'admin'
    and coalesce((public.current_profile()).is_active, false) = true
    and establishment_id = (public.current_profile()).establishment_id
    and role in ('doctor', 'lab')
  );

-- Profils : admin met a jour is_active dans son etablissement
create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (
    coalesce((public.current_profile()).role, '') = 'admin'
    and coalesce((public.current_profile()).is_active, false) = true
    and establishment_id = (public.current_profile()).establishment_id
  )
  with check (
    coalesce((public.current_profile()).role, '') = 'admin'
    and coalesce((public.current_profile()).is_active, false) = true
    and establishment_id = (public.current_profile()).establishment_id
  );

-- Patients : accès public en lecture par code (anon) pour espace patient
create policy "patients_select_by_code"
  on public.patients for select
  to anon, authenticated
  using (is_active = true);

-- Données initiales
insert into public.establishments (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Centre de Santé Pilote AFRIMED')
on conflict (id) do nothing;

-- Patient démo (code AF7K2M)
insert into public.patients (establishment_id, first_name, last_name, access_code)
values (
  '00000000-0000-0000-0000-000000000001',
  'Aminata',
  'Sawadogo',
  'AF7K2M'
)
on conflict (access_code) do nothing;

-- IMPORTANT : après avoir créé l'utilisateur admin dans Authentication,
-- exécuter (remplacer USER_UUID par l'UUID de auth.users) :
--
-- insert into public.profiles (id, establishment_id, role, first_name, last_name, email)
-- values (
--   'USER_UUID',
--   '00000000-0000-0000-0000-000000000001',
--   'admin',
--   'Admin',
--   'AFRIMED',
--   'admin@afrimed.bf'
-- );

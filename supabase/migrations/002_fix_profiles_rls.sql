-- Fix RLS profiles : recursion infinie
-- Les policies ne doivent pas relire public.profiles directement.

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

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_admin_establishment" on public.profiles;
drop policy if exists "profiles_insert_admin" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_select_admin_establishment"
  on public.profiles for select
  to authenticated
  using (
    coalesce((public.current_profile()).role, '') = 'admin'
    and coalesce((public.current_profile()).is_active, false) = true
    and establishment_id = (public.current_profile()).establishment_id
  );

create policy "profiles_insert_admin"
  on public.profiles for insert
  to authenticated
  with check (
    coalesce((public.current_profile()).role, '') = 'admin'
    and coalesce((public.current_profile()).is_active, false) = true
    and establishment_id = (public.current_profile()).establishment_id
    and role in ('doctor', 'lab')
  );

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

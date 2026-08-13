-- Permite que un responsable lea sus propios frentes operativos.
-- Sin estas politicas, el SQL Editor puede mostrar datos como postgres,
-- pero la app autenticada puede quedar sin frentes por Row Level Security.

drop policy if exists "users read own profile" on public.user_profiles;
create policy "users read own profile"
on public.user_profiles
for select
using (
  auth_user_id = auth.uid()
  and is_active = true
);

drop policy if exists "responsibles read own assignments" on public.user_position_assignments;
create policy "responsibles read own assignments"
on public.user_position_assignments
for select
using (
  exists (
    select 1
    from public.user_profiles up
    where up.id = user_position_assignments.user_profile_id
      and up.auth_user_id = auth.uid()
      and up.is_active = true
  )
);

drop policy if exists "responsibles read assigned positions" on public.positions;
create policy "responsibles read assigned positions"
on public.positions
for select
using (
  company_id = public.current_company_id()
  or exists (
    select 1
    from public.user_position_assignments a
    join public.user_profiles up on up.id = a.user_profile_id
    where a.position_id = positions.id
      and up.auth_user_id = auth.uid()
      and up.is_active = true
      and a.status = 'active'
  )
);

drop policy if exists "responsibles read assigned operational fronts" on public.operational_fronts;
create policy "responsibles read assigned operational fronts"
on public.operational_fronts
for select
using (
  company_id = public.current_company_id()
  or exists (
    select 1
    from public.user_position_assignments a
    join public.user_profiles up on up.id = a.user_profile_id
    where a.operational_front_id = operational_fronts.id
      and up.auth_user_id = auth.uid()
      and up.is_active = true
      and a.status = 'active'
  )
);

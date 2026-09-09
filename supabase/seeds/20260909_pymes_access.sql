-- Ejecutar en SQL Editor con sesión administrativa, después de confirmar correos.
-- Requiere las siete cuentas ya creadas en Supabase Auth y los cargos existentes.
-- No crea contraseñas ni envía correos. Vincula perfiles existentes sin cuenta.
-- Cualquier discrepancia cancela la transacción completa.
begin;

create temporary table pymes_access_expected (
  email text primary key,
  full_name text not null,
  external_key text unique not null,
  access_role public.access_role not null
) on commit drop;

insert into pymes_access_expected values
  -- Correo de José Fernando confirmado por el usuario.

  ('fernandopalacios145@hotmail.com', 'José Fernando Palacios', 'gerencia-09', 'gerencia'),
  ('sadipymes1@gmail.com', 'Jhonatan Alvarez', 'unidad-pymes-01', 'responsable'),
  ('sadi.pymes2@gmail.com', 'Yuranny Córdoba', 'unidad-pymes-02', 'responsable'),
  ('sadi.juliomedina@gmail.com', 'Julio Medina', 'unidad-pymes-04', 'responsable'),
  ('sadi.andersonosorio@gmail.com', 'Anderson Osorio', 'unidad-pymes-05', 'responsable'),
  ('sanchez.estivenortiz@gmail.com', 'Estiven Sanchez', 'unidad-pymes-06', 'responsable'),
  ('diana.j.bernal.g@gmail.com', 'Diana Bernal', 'unidad-pymes-07', 'responsable');

-- Serializa la validación y la escritura frente a otros cambios de perfiles/cargos.
lock table public.companies, public.positions, public.user_profiles in share row exclusive mode;

do $$
declare
  target_company constant uuid := '4fc5d223-4ae6-4011-af66-627957d2d80a';
  expected record;
  target_position uuid;
  target_auth uuid;
begin
  if not exists (select 1 from public.companies where id = target_company and status = 'active') then
    raise exception 'La empresa del piloto no existe o está inactiva';
  end if;

  for expected in select * from pymes_access_expected order by external_key loop
    select id into target_position from public.positions
      where company_id = target_company and external_key = expected.external_key;
    if target_position is null then
      raise exception 'Falta el cargo %', expected.external_key;
    end if;

    if (select count(*) from auth.users where lower(email) = lower(expected.email)) <> 1 then
      raise exception 'Se requiere exactamente una cuenta Auth para %', expected.email;
    end if;
    select id into target_auth from auth.users where lower(email) = lower(expected.email);
    if exists (select 1 from auth.users where id = target_auth
      and (email_confirmed_at is null or banned_until > now() or deleted_at is not null)) then
      raise exception 'Cuenta sin confirmar, bloqueada o eliminada: %', expected.email;
    end if;

    if exists (
      select 1 from public.user_profiles u
      where (u.auth_user_id = target_auth
        or (u.company_id = target_company and lower(u.email) = lower(expected.email))
        or (u.company_id = target_company and u.position_id = target_position))
      and (u.company_id is distinct from target_company
        or (u.auth_user_id is not null and u.auth_user_id is distinct from target_auth)
        or lower(u.email) is distinct from lower(expected.email)
        or u.position_id is distinct from target_position
        or u.access_role is distinct from expected.access_role
        or u.is_active is distinct from true)
    ) then
      raise exception 'Revisar perfil existente para %: empresa, cuenta, cargo, rol o estado distintos', expected.email;
    end if;

    update public.user_profiles set auth_user_id = target_auth
    where company_id = target_company and lower(email) = lower(expected.email)
      and position_id = target_position and auth_user_id is null;

    insert into public.user_profiles (company_id, auth_user_id, full_name, email, access_role, position_id, is_active)
    select target_company, target_auth, expected.full_name, expected.email, expected.access_role, target_position, true
    where not exists (select 1 from public.user_profiles where auth_user_id = target_auth);
  end loop;
end $$;

select u.full_name, u.email, p.external_key, u.access_role, u.is_active
from public.user_profiles u
join public.positions p on p.id = u.position_id and p.company_id = u.company_id
join pymes_access_expected e on lower(u.email) = lower(e.email)
where u.company_id = '4fc5d223-4ae6-4011-af66-627957d2d80a'
order by p.external_key;

commit;

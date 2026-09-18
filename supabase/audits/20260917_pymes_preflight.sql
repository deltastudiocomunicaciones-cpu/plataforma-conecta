-- Preflight Pymes. Solo lectura. Ejecutar en SQL Editor como administrador.
-- Revisar estos correos antes de vincular accesos. No crea cuentas Auth.
with expected(external_key, person, email, expected_role) as (
  values ('gerencia-09', 'José Fernando Palacios', 'fernandopalacios145@hotmail.com', 'gerencia'),
         ('unidad-pymes-01', 'Jhonatan Alvarez', 'sadipymes1@gmail.com', 'responsable'),
         ('unidad-pymes-02', 'Yuranny Córdoba', 'sadi.pymes2@gmail.com', 'responsable'),
         ('unidad-pymes-04', 'Julio Medina', 'sadi.juliomedina@gmail.com', 'responsable'),
         ('unidad-pymes-05', 'Anderson Osorio', 'sadi.andersonosorio@gmail.com', 'responsable'),
         ('unidad-pymes-06', 'Estiven Sanchez', 'sanchez.estivenortiz@gmail.com', 'responsable'),
         ('unidad-pymes-07', 'Diana Bernal', 'diana.j.bernal.g@gmail.com', 'responsable')
), target as (
  select '4fc5d223-4ae6-4011-af66-627957d2d80a'::uuid as company_id
)
select e.person, e.email, e.external_key, e.expected_role,
       a.last_sign_in_at,
       case
         when c.id is null or c.status is distinct from 'active' then 'REVISAR_EMPRESA'
         when p.id is null then 'FALTA_CARGO'
         when (select count(*) from auth.users au where lower(au.email) = lower(e.email)) > 1 then 'REVISAR_AUTH_DUPLICADO'
         when a.id is null then 'CREAR_O_INVITAR_EN_AUTH'
         when a.deleted_at is not null or a.banned_until > now() then 'REVISAR_CUENTA_BLOQUEADA'
         when a.email_confirmed_at is null then 'PENDIENTE_CONFIRMACION'
         when exists (
           select 1 from public.user_profiles u
           where (u.auth_user_id = a.id
             or (u.company_id = t.company_id and lower(u.email) = lower(e.email))
             or (u.company_id = t.company_id and u.position_id = p.id))
           and (u.company_id is distinct from t.company_id
             or (u.auth_user_id is not null and u.auth_user_id is distinct from a.id)
             or lower(u.email) is distinct from lower(e.email)
             or u.position_id is distinct from p.id
             or u.access_role::text is distinct from e.expected_role
             or u.is_active is distinct from true)
         ) then 'REVISAR_CONFLICTO_PERFIL'
         when not exists (select 1 from public.user_profiles u where u.auth_user_id = a.id)
           then 'LISTO_PARA_VINCULAR_CON_SQL'
         else 'VINCULADO_PROBAR_LOGIN_Y_PERMISOS'
       end as estado
from expected e
cross join target t
left join public.companies c on c.id = t.company_id
left join public.positions p on p.company_id = t.company_id and p.external_key = e.external_key
left join auth.users a on lower(a.email) = lower(e.email)
order by e.external_key;

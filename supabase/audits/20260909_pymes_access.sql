-- Read-only: run in the project's SQL editor with an authorized admin session.
-- Does not expose passwords, tokens, or password hashes. No writes.
with expected(external_key, person, expected_role) as (
  values ('gerencia-09', 'José Fernando Palacios', 'gerencia'),
         ('unidad-pymes-01', 'Jhonatan Alvarez', 'responsable'),
         ('unidad-pymes-02', 'Yuranny Córdoba', 'responsable'),
         ('unidad-pymes-04', 'Julio Medina', 'responsable'),
         ('unidad-pymes-05', 'Anderson Osorio', 'responsable'),
         ('unidad-pymes-06', 'Estiven Sanchez', 'responsable'),
         ('unidad-pymes-07', 'Diana Bernal', 'responsable')
)
select e.person as expected_person, e.external_key, c.name as company,
       p.responsible_name, u.full_name, u.email, u.access_role, u.is_active,
       a.id is not null as auth_account_exists,
       a.email_confirmed_at is not null as email_confirmed,
       coalesce(a.banned_until > now(), false) as currently_banned,
       a.last_sign_in_at,
       case when p.id is null then 'MISSING_POSITION'
            when u.id is null then 'MISSING_PROFILE'
            when a.id is null then 'MISSING_AUTH_ACCOUNT'
            when not u.is_active then 'INACTIVE_PROFILE'
            when c.status <> 'active' then 'INACTIVE_COMPANY'
            when a.banned_until > now() then 'BANNED_ACCOUNT'
            when a.email_confirmed_at is null then 'EMAIL_NOT_CONFIRMED'
            when u.access_role::text <> e.expected_role then 'REVIEW_ROLE'
            when lower(u.email) <> lower(a.email) then 'REVIEW_EMAIL'
            else 'STRUCTURALLY_READY_REQUIRES_DEVICE_LOGIN'
       end as audit_status
from expected e
left join public.positions p on p.external_key = e.external_key
left join public.companies c on c.id = p.company_id
left join public.user_profiles u on u.position_id = p.id and u.company_id = p.company_id
left join auth.users a on a.id = u.auth_user_id
order by e.external_key, c.name, u.email;

-- Caso piloto: Daniel Andres Fernandez como nodo transversal.
-- Ejecuta primero supabase/migrations/20260812_operational_assignments.sql.
-- Este bloque crea los frentes reales de gestion sin duplicar el cargo ni romper el organigrama.

with company as (
  select id
  from public.companies
  where slug = 'grupo-ayc-cultura-conecta'
  limit 1
)
insert into public.operational_fronts (
  company_id,
  external_key,
  name,
  description
)
select
  company.id,
  fronts.external_key,
  fronts.name,
  fronts.description
from company
cross join (
  values
    (
      'activos-inmobiliarios',
      'Activos inmobiliarios',
      'Gestion, seguimiento y trazabilidad de apartamentos, oficinas, parqueaderos y predios.'
    ),
    (
      'compras-servicios',
      'Compras y servicios',
      'Solicitudes, proveedores, compras, servicios generales, soportes y entregables operativos.'
    ),
    (
      'archivo-documental',
      'Archivo documental',
      'Organizacion, custodia, ubicacion y trazabilidad de documentos fisicos o digitales.'
    ),
    (
      'rentas-mantenimiento',
      'Rentas y mantenimiento',
      'Seguimiento a novedades, mantenimiento, ocupacion, recaudos no financieros y alertas operativas.'
    ),
    (
      'apoyo-operativo-especial',
      'Apoyo operativo especial',
      'Actividades transversales asignadas por direccion o gerencias que requieren evidencia y cierre.'
    )
) as fronts(external_key, name, description)
on conflict (company_id, external_key)
do update set
  name = excluded.name,
  description = excluded.description,
  status = 'active'
returning id, external_key, name;

-- Cuando Daniel ya tenga usuario en auth.users y perfil en public.user_profiles,
-- usa este bloque como plantilla para conectar sus asignaciones.
-- Cambia el correo si usas otro acceso temporal.
--
-- with company as (
--   select id from public.companies where slug = 'grupo-ayc-cultura-conecta' limit 1
-- ),
-- daniel as (
--   select up.id, up.company_id
--   from public.user_profiles up
--   join company c on c.id = up.company_id
--   where up.email = 'responsableactivosdf@grupoayc.com'
--   limit 1
-- ),
-- targets as (
--   select *
--   from (
--     values
--       ('unidad-activos-01', 'activos-inmobiliarios', 'Apartamentos', true),
--       ('unidad-activos-02', 'activos-inmobiliarios', 'Oficinas', false),
--       ('unidad-activos-03', 'activos-inmobiliarios', 'Parqueaderos', false),
--       ('unidad-activos-04', 'activos-inmobiliarios', 'Predios', false),
--       ('gestion-compras-servicios', 'compras-servicios', 'Compras y servicios', false)
--   ) as t(position_external_key, front_external_key, label, is_primary)
-- )
-- insert into public.user_position_assignments (
--   company_id,
--   user_profile_id,
--   position_id,
--   operational_front_id,
--   assignment_kind,
--   label,
--   report_frequency,
--   is_primary
-- )
-- select
--   d.company_id,
--   d.id,
--   p.id,
--   f.id,
--   case when targets.is_primary then 'principal'::public.assignment_kind else 'transversal'::public.assignment_kind end,
--   targets.label,
--   'semanal',
--   targets.is_primary
-- from daniel d
-- join targets on true
-- join public.positions p
--   on p.company_id = d.company_id
--  and p.external_key = targets.position_external_key
-- join public.operational_fronts f
--   on f.company_id = d.company_id
--  and f.external_key = targets.front_external_key
-- on conflict (user_profile_id, position_id, operational_front_id)
-- do update set
--   assignment_kind = excluded.assignment_kind,
--   label = excluded.label,
--   report_frequency = excluded.report_frequency,
--   is_primary = excluded.is_primary,
--   status = 'active'
-- returning id, label, assignment_kind, is_primary;

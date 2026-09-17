# E13 — Contraste de Supabase para el contexto agéntico

## Procedencia y alcance

- Proyecto: `dttljewnvuwhizldnhld` / **plataforma-conecta**.
- Organización visible: **Cultura Conecta**. Rama: **main / PRODUCTION**.
- Fuente: sesión autenticada del usuario en [dashboard del proyecto](https://supabase.com/dashboard/project/dttljewnvuwhizldnhld), SQL Editor.
- Corte final devuelto por `now()`: **2026-09-16 06:08:43 UTC**, equivalente a **01:08:43 de Colombia**.
- Usuario SQL: `postgres`. Solo SELECT sobre metadatos, cantidades y proyecciones de cargos/asignaciones. Sin migraciones, escrituras de negocio, cambios de permisos, lectura de archivos ni extracción de credenciales o datos de contacto.
- El conector MCP continuó devolviendo falta de permiso. La sesión del dashboard sí permitió el acceso al proyecto correcto; son dos sesiones diferentes.
- Esta revisión acredita definiciones desplegadas y la foto de datos. No prueba el comportamiento de una cuenta de aplicación de menor privilegio ni registra un incidente de acceso indebido.

## 1. Inventario desplegado

| Concepto | Resultado |
| --- | --- |
| Tablas públicas | 11 |
| RLS | Activado en las 11; FORCE RLS desactivado |
| Políticas públicas | 21, permisivas |
| Vistas/materialized views públicas | Ninguna en el inventario |
| Triggers públicos no internos | 0 |
| Funciones públicas no pertenecientes a extensiones | current_profile, current_company_id, current_access_role |
| Historial `supabase_migrations.schema_migrations` | No existe (`to_regclass` devolvió null) |
| Estado del dashboard | Healthy; “No migrations” |
| Buckets | 1 privado: conecta-evidencias |
| Objetos en ese bucket | 0 |
| Políticas de Storage | 4 |

Tablas: `companies`, `positions`, `user_profiles`, `operational_fronts`, `user_position_assignments`, `management_reports`, `report_evidence`, `report_reviews`, `notifications`, `meeting_events`, `meeting_responses`.

**Ausentes:** `nivelar_employee_links`, `nivelar_daily_summaries`, `nivelar_sync_runs`. Existen en archivos locales, no en este esquema público desplegado. No interpretar sus tipos o migración como evidencia de integración activa.

Las columnas consultadas de las once tablas corresponden al modelo local. `management_reports` sí tiene `assignment_id` y `operational_front_id`. `positions` no tiene `positionLabel`, `functionalProfile`, fotos ni entidad de contenido funcional publicado. Los tipos locales omiten las dos tablas de convocatorias y declaran tres tablas Nivelar inexistentes remotamente.

## 2. Cantidades y cobertura

| Entidad | Cantidad |
| --- | --- |
| Empresas | 1, activa |
| Cargos | 8 |
| Perfiles | 15, todos activos |
| Perfiles vinculados a Auth | 10 |
| Perfiles sin cargo | 6; los seis vinculados a Auth |
| Frentes | 5 |
| Asignaciones | 5, pertenecientes a un único perfil |
| Informes / evidencias / revisiones | 0 / 0 / 0 |

Por rol: superadmin 1 perfil/1 vinculado; dirección 1/1; cultura 1/1; gerencia 3/2; responsable 8/4; lector 1/1. “Vinculado” significa `auth_user_id IS NOT NULL`, no demuestra sesión utilizable, confirmación de correo o último ingreso.

Cobertura de perfiles por cargo: gerencia-04 tiene 2 perfiles, ambos vinculados; gerencia-09 tiene 1 sin vínculo; unidad-pymes-01 y unidad-pymes-05 tienen cada uno 1 vinculado; unidad-pymes-02, -04, -06 y -07 tienen cada uno 1 sin vínculo. Por eso un cargo no identifica por sí solo a una persona única.

Las cinco asignaciones apuntan a `gerencia-04`, están active, comienzan el 13 de agosto de 2026 y no tienen fecha final:

| Frente | Tipo | Principal |
| --- | --- | --- |
| activos-inmobiliarios | principal | Sí |
| apoyo-operativo-especial | transversal | No |
| archivo-documental | transversal | No |
| compras-servicios | transversal | No |
| rentas-mantenimiento | transversal | No |

No se hallaron perfiles con cargo de otra empresa, padres de otra empresa, incoherencia de empresa entre las cinco asignaciones y sus referencias, ni varios primarios activos por perfil. Solo hay una empresa: la ausencia actual de incoherencias no acredita aislamiento multiempresa.

## 3. Reconciliación del cargo: evidencia concreta

Hay 54 nodos en JSON y ocho claves equivalentes en DB. Las otras 46 claves no tienen fila en `positions`.

| Clave | DB | JSON actual | Diferencia comprobada |
| --- | --- | --- | --- |
| gerencia-04 | Gerencia de Activos; padre nulo; 3 responsabilidades; 0 actividades | Mismo título, padre ceo; 5 responsabilidades; 2 actividades | Padre, propósito (hash distinto) y contenido funcional |
| gerencia-09 | Gerencia Pymes; padre nulo; propósito vacío; 0 responsabilidades/actividades | Gerente PYMES; padre ceo; 7 responsabilidades/actividades | Nombre, padre y contenido |
| unidad-pymes-01 / -02 / -04 / -05 | title contiene nombre de la persona; padre gerencia-09; funciones vacías | title mantiene persona; positionLabel=Contador Auditor; 36 responsabilidades/actividades | Etiqueta profesional no modelada en DB; contenido ausente |
| unidad-pymes-06 | title contiene persona; padre gerencia-09; funciones vacías | positionLabel=Analista Integrador; mismo padre; 36 responsabilidades/actividades | Etiqueta profesional y contenido |
| unidad-pymes-07 | title contiene persona; padre gerencia-09; funciones vacías | positionLabel=Analista Integrador; padre unidad-pymes-02; 36 responsabilidades/actividades | Padre, etiqueta profesional y contenido |

En los siete cargos PYMES también hay cero documentos, procesos, autoridad e indicadores. El propósito vacío se comprobó por hash del string vacío; se compararon conteos de arrays sin copiar textos personales. En las ocho posiciones el hash de propósito difiere del JSON.

**Consecuencia:** el workspace del agente consulta correctamente el UUID del cargo, pero recibe un contexto funcional vacío para PYMES. Resolver la identidad no resuelve la publicación del contenido. No debe completarse con un fallback silencioso al catálogo.

## 4. Políticas públicas efectivas

Abreviaturas: **empresa** = `company_id = current_company_id()`; **revisores** = superadmin, direccion, gerencia, cultura_conecta. Las funciones current_* filtran el usuario Auth y perfil activo. Esta tabla transcribe el significado de los predicados leídos en `pg_policies`, no políticas deseadas.

| Tabla | Nombre exacto | Comando | Predicado efectivo |
| --- | --- | --- | --- |
| companies | read own company | SELECT | id = current_company_id() |
| positions | read positions by company | SELECT | empresa |
| positions | responsibles read assigned positions | SELECT | empresa OR asignación propia active, perfil activo |
| user_profiles | read profiles by company | SELECT | empresa |
| user_profiles | users read own profile | SELECT | auth_user_id = auth.uid() AND is_active |
| operational_fronts | responsibles read assigned operational fronts | SELECT | empresa OR asignación propia active, perfil activo |
| user_position_assignments | responsibles read own assignments | SELECT | perfil de la asignación con auth_user_id = auth.uid() y activo; no verifica fechas/status de asignación |
| management_reports | read reports by company | SELECT | empresa |
| management_reports | responsibles create reports for company | INSERT | WITH CHECK empresa; sin rol/autor/asignación vinculados a sesión |
| management_reports | reviewers update reports by company | UPDATE | USING empresa + revisores; WITH CHECK empresa |
| report_evidence | read evidence through company reports | SELECT | EXISTS informe de empresa |
| report_evidence | insert evidence through company reports | INSERT | WITH CHECK EXISTS informe de empresa |
| report_reviews | review reports by company | SELECT | EXISTS informe de empresa |
| report_reviews | insert reviews by reviewer roles | INSERT | WITH CHECK revisores; no filtro explícito de empresa/informe/revisor |
| notifications | read own notifications | SELECT | empresa AND (destinatario propio OR superadmin/direccion) |
| notifications | system users create notifications | INSERT | WITH CHECK empresa |
| meeting_events | Internal users can read meeting events | SELECT | empresa |
| meeting_events | Internal leaders can create meeting events | INSERT | WITH CHECK empresa + revisores |
| meeting_events | Internal leaders can update meeting events | UPDATE | USING y WITH CHECK empresa + revisores |
| meeting_responses | Internal users can read meeting responses | SELECT | EXISTS evento de empresa |
| meeting_responses | Internal leaders can manage meeting responses | ALL | USING y WITH CHECK EXISTS evento de empresa + revisores |

Roles PostgreSQL: las cinco políticas de meetings aplican a authenticated; las otras 16 declaran public. Esto último no elimina los predicados de sesión ni concede por sí solo acceso anónimo a filas.

**Ausencias relevantes comprobadas:** `users update own profile`, `read assignments by company`, `manage assignments by catalog roles`, `read operational fronts by company`. No hay política de escritura de cargos, perfiles, frentes ni asignaciones. El rol administrativo puede operar fuera de esas restricciones; esto no se trasladará al resolver.

## 5. Privilegios, helpers e integridad

- `has_table_privilege` devuelve SELECT/INSERT/UPDATE/DELETE para authenticated en todas las once tablas públicas; anon tiene SELECT. RLS sigue filtrando filas y denegando operaciones sin política aplicable. `has_schema_privilege('authenticated','public','USAGE')` es true.
- Los tres helpers actuales coinciden con SQL local: SECURITY DEFINER, STABLE, search_path=public, consulta a user_profiles por `auth_user_id=auth.uid()` e `is_active=true`, LIMIT 1. Anon y authenticated tienen EXECUTE. `current_profile` devuelve la fila del perfil completo; los otros dos devuelven empresa y rol.
- Unique de cargo: `(company_id, external_key)`. No prueba correspondencia con JSON.
- Unique de perfil: auth_user_id y `(company_id,email)`. Hay FK a Auth, empresa y cargo; no FK compuesta para imponer misma empresa del cargo.
- Asignaciones: unique `(user_profile_id, position_id, operational_front_id)` con semántica normal de NULL. No hay índice de único principal ni check de orden de fechas. Los índices adicionales son de consulta, no imponen esas invariantes.
- Los FK de informes, evidencias, revisiones, notificaciones y asignaciones comprueban existencia del UUID, no autorización ni coincidencia de tenant entre todas las referencias.
- Cero triggers públicos de usuario; no se encontró un control adicional por trigger que corrigiera esas brechas o actualizara updated_at automáticamente.

## 6. Storage: diferencia importante frente al repositorio

Bucket `conecta-evidencias`, `public=false`, cero objetos al momento de revisión.

| Política | Acción | Predicado |
| --- | --- | --- |
| Conecta lee evidencias autenticadas | SELECT | USING bucket_id = 'conecta-evidencias' |
| Conecta sube evidencias autenticadas | INSERT | WITH CHECK bucket_id = 'conecta-evidencias' |
| Conecta actualiza evidencias propias | UPDATE | USING y WITH CHECK bucket_id = 'conecta-evidencias' |
| Conecta elimina evidencias propias | DELETE | USING bucket_id = 'conecta-evidencias' |

Las cuatro aplican a authenticated, que dispone de SELECT/INSERT/UPDATE/DELETE en storage.objects. Las palabras “propias” de sus nombres **no están implementadas en el predicado**. No comprueban owner, perfil activo, empresa, informe o membresía.

**Hallazgo ALTO de configuración comprobada:** un bucket privado no equivale a archivos aislados por usuario. Antes de cargar evidencias o usarlo como conocimiento deben aprobarse políticas por objeto/recurso. No se modificaron ni se probó borrar/subir archivos. Con cero objetos no se acredita filtración o pérdida de información.

## 7. Consultas base reproducibles

Se agruparon resultados como JSON en el SQL Editor para evitar truncamiento/paginación. Estas son las bases de lectura, sin DDL ni DML:

```sql
select tablename, policyname, permissive, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

select c.relname, c.relkind, c.relrowsecurity, c.relforcerowsecurity,
       has_table_privilege('anon', c.oid, 'SELECT') anon_select,
       has_table_privilege('authenticated', c.oid, 'SELECT') auth_select,
       has_table_privilege('authenticated', c.oid, 'INSERT') auth_insert,
       has_table_privilege('authenticated', c.oid, 'UPDATE') auth_update,
       has_table_privilege('authenticated', c.oid, 'DELETE') auth_delete
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind in ('r','p','v','m');

select to_regclass('supabase_migrations.schema_migrations');
select id, public from storage.buckets;
select count(*) from storage.objects where bucket_id='conecta-evidencias';
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies where schemaname='storage';

select p.external_key, p.title, parent.external_key as parent_key,
       cardinality(p.responsibilities) responsibility_count,
       jsonb_array_length(p.activities) activity_count,
       md5(p.purpose) purpose_hash
from public.positions p
left join public.positions parent on parent.id=p.reports_to_position_id
order by p.external_key;
```

También se consultaron pg_constraint, information_schema.columns, pg_indexes, pg_trigger y pg_get_functiondef para las funciones current_*. Los conteos y checks de integridad se realizaron por agregación; no se consultaron contraseñas, correos, documentos personales ni contenido de objetos.

## 8. Conclusión y siguiente decisión

Se levantó el bloqueo de acceso para esta auditoría mediante el dashboard autorizado. El descubrimiento ya puede distinguir esquema local, esquema desplegado y datos presentes. La [arquitectura principal](../agent-context-architecture.md) incorpora las diferencias.

Antes de implementar el resolver: aprobar reconciliación de cargos y contenido; precisar acceso por recurso, especialmente evidencias; preparar pruebas de RLS con usuarios/fixtures en un entorno apropiado. La auditoría administrativa no reemplaza esas pruebas y no autoriza ejecutar migraciones por sí sola.

# MV-F3-02 — Memoria Viva · Tenant Integrity + RLS

## 1. Executive Result

**MV-G3-02 = PARTIAL. Cierre completo: NOT CLOSABLE.**
**SQL_RUNTIME_VALIDATION = NOT EXECUTED.**

Se entrega una migración candidata transaccional, no aplicada: diez claves UNIQUE compuestas adicionales, treinta FK tenant-aware y 65 políticas RLS para las trece tablas Core. Se retiran grants sobre esas tablas para evitar habilitar acceso funcional antes de autorización por recurso y auditoría.

Pruebas de repositorio: **29 PASS / 0 FAIL**, lint **exit 0**, build **exit 0**. Se preparó una suite PostgreSQL adversarial con dos tenants, simulación de sesiones y rol privilegiado; **no fue ejecutada**. Los tests estáticos no sustituyen PostgreSQL ni permiten PASS completo.

## 2. Entry Gate

MV-G3-01 = PASS STRUCTURAL / STATIC. 0005 no fue aplicada. MV-G3A continúa pendiente.

Fuentes de autoridad leídas: [contrato MV-F2-01](mv-f2-01-memoria-viva-architecture-contract.md), [decisiones MV-G2-01](mv-g2-01-architecture-gate-decision.md), [Core MV-F3-01](mv-f3-01-core-data-model.md) y [0005](../supabase/canonical/migrations/0005_conecta_memory_core.sql).

Se preservan D1–D8: root existente, identidad estable, responsabilidad cargo/persona separada, contexto sin permisos, Storage bloqueado. F3-02 implementa solo frontera tenant candidata, no lifecycle, autoridad institucional ni auditoría.

## 3. Baseline

Initial branch: `main`, seguimiento `main...origin/main`.
Initial HEAD: `70cbb5322c9b9920bf5bd97dc0865b2aa1dc325f`.

Ejecutados antes de modificar: git status -sb; git branch --show-current; git rev-parse HEAD; git log -5 --oneline.

```text
70cbb53 cambio foto eventos conecta
1637132 Refine Conecta access and AI workspace and prepare Pymes pilot
7e73682 cambio method foto
07d0f6c Document agent context domain and refine accounting task presentation
2c73cb2 Add PYMES client portfolios and clarify profile role labels
```

Diez modificaciones preexistentes:

```text
 M docs/product-architecture/09-pilot-readiness-roadmap.md
 M src/app/api/agent/context/route.ts
 M src/app/mapa-vivo/mi-agente/page.tsx
 M src/components/ExecutiveRoleProfile.module.css
 M src/components/ExecutiveRoleProfile.tsx
 M src/components/OrgExperience.tsx
 M src/components/agent/AgentWorkspace.tsx
 M src/lib/conecta/access-policy.ts
 M src/lib/conecta/agent.ts
 M src/lib/conecta/nivelar.ts
```

Catorce entradas no registradas preexistentes:

```text
?? docs/arquitectura-institucional-cargos-v2.md
?? docs/gate-v2-02a-correcciones.md
?? docs/mv-f2-01-memoria-viva-architecture-contract.md
?? docs/mv-f3-01-core-data-model.md
?? docs/mv-g2-01-architecture-gate-decision.md
?? scripts/extract-institutional-source.ps1
?? src/app/api/nivelar/daily-probe/
?? src/components/InstitutionalRoleProfile.tsx
?? src/data/sdx-institutional-source.json
?? src/lib/conecta/agent/institutional-context.ts
?? src/lib/conecta/institutional-profile.ts
?? supabase/canonical/migrations/0005_conecta_memory_core.sql
?? tests/institutional-profile.test.mjs
?? tests/memory-core-schema.test.mjs
```

Se tomaron hashes de 19 archivos: B0–0005, las tres fuentes documentales, test Core y diez modificados tracked. No se limpió/restauró/incorporó trabajo preexistente. Ninguna modificación de código de esas entradas corresponde a F3-02.

## 4. Files Changed

Cuatro archivos nuevos:

1. [0006_conecta_memory_tenant_integrity_rls.sql](../supabase/canonical/migrations/0006_conecta_memory_tenant_integrity_rls.sql).
2. [memory-tenant-schema.test.mjs](../tests/memory-tenant-schema.test.mjs): ocho pruebas estáticas.
3. [memory-tenant.runtime.sql](../supabase/canonical/tests/memory-tenant.runtime.sql): suite preparada, fuera del directorio de migraciones, sin ejecución.
4. Este informe.

No se editó ningún archivo preexistente, incluida 0005. Se continúa la cadena ordinal canónica autorizada; no se crea historial alternativo ni se ejecuta CLI desde CONECTA. El build genera sus artefactos locales habituales, no un deploy.

## 5. 0005 Runtime Validation

**0005 runtime executed: NO. 0005 result: NOT EXECUTED.**

La comprobación acotada de capacidades no proporcionó psql en PATH ni evidencia de runtime aislado autorizado. Las consultas de procesos/listeners no acreditan por sí solas disponibilidad ni aislamiento; no se tomaron como aprobación de laboratorio. Continúan los antecedentes de fallo de binding y recuperación Docker. No se inició Docker/WSL ni se consultaron sus recursos para reabrir gates anteriores. No se instaló infraestructura.

La orden permite continuar la elaboración candidata en este caso y exige dejar MV-G3-02 sin cierre completo.

Validación futura obligatoria: base Supabase aislada limpia, identidad y exposición loopback demostradas, B0→B1→B2→B3→0005, comprobación de ejecución/catalogo y casos estructurales; después 0006 y suite adversarial. La suite preparada incluye también casos de 0005, pero eso no significa que ya se ejecutó o que una prueba posterior sustituya el registro de aplicación de cada migración.

## 6. Tenant Model

La pertenencia se deriva exclusivamente de auth.uid() → user_profiles.auth_user_id → company_id. Se exige perfil activo y companies.status = active.

El company_id de la fila es dato contrastado con esa pertenencia. No se confía en un company_id de payload/JWT personalizado, Cargo Cero, RACI, título o access_role. No hay privilegio especial tenant para superadmin de aplicación.

El modelo existente tiene auth_user_id UNIQUE y company_id NOT NULL en user_profiles: para una identidad Auth no nula existe como máximo un perfil organizacional en este esquema. Perfiles sin vínculo Auth no resuelven sesión. No se introduce multitenancy por persona ni selección arbitraria de empresa.

## 7. Existing Tenant Keys

Únicos destinos legacy afectados por DDL candidato: meeting_events, user_profiles y positions. Cada uno ya tiene PK UUID y company_id obligatorio; añadir UNIQUE(company_id,id) no requiere reparar duplicados si se cumple el esquema conocido, porque id ya es globalmente único.

companies conserva su PK id, suficiente como destino de company_id; no se altera.

No se cambian columnas, semántica funcional, datos ni políticas legacy. Si el entorno real no corresponde a esas precondiciones, **STOP**. No se ha observado una incompatibilidad de datos reales porque no se accedió a una base.

## 8. Composite Keys

Diez nuevas UNIQUE, con diez índices implícitos:

| Tabla | Columnas | Constraint |
|---|---|---|
| `meeting_events` | `company_id, id` | `meeting_events_memory_tenant_key` |
| `user_profiles` | `company_id, id` | `user_profiles_memory_tenant_key` |
| `positions` | `company_id, id` | `positions_memory_tenant_key` |
| `minute_revisions` | `company_id, minute_id, id` | `memory_target_1_tenant_key` |
| `minute_participants` | `company_id, minute_id, id` | `memory_target_2_tenant_key` |
| `minute_agenda_items` | `company_id, minute_id, id` | `memory_target_3_tenant_key` |
| `minute_findings` | `company_id, minute_id, id` | `memory_target_4_tenant_key` |
| `minute_agenda_item_versions` | `company_id, revision_id, agenda_item_id` | `memory_target_5_tenant_key` |
| `minute_decisions` | `company_id, minute_id, id` | `memory_target_6_tenant_key` |
| `minute_decision_versions` | `company_id, revision_id, decision_id` | `memory_target_7_tenant_key` |

Se reutilizan además las trece UNIQUE(company_id,id) de 0005. Las claves que incluyen minute_id/revision_id conservan pertenencia al mismo agregado/revisión, no solo a la empresa.

No se eliminan índices o constraints de 0005. No se añaden índices explícitos especulativos: los anteriores índices por referencia UUID siguen siendo útiles para filtrar el padre/ítem; medir antes de reemplazarlos. Las nuevas UNIQUE proporcionan claves destino válidas para las FK.

## 9. Composite Foreign Keys

Treinta nuevas FK validadas al aplicar, además de las 43 originales. Las trece FK directas a companies no requieren ampliación. Se conservan las FK originales; ninguna se sustituye por un trigger.

| Constraint nueva | Origen | Destino |
|---|---|---|
| `mm_event_tenant_fk` | `meeting_minutes (company_id, meeting_event_id)` | `meeting_events (company_id, id)` |
| `mm_creator_tenant_fk` | `meeting_minutes (company_id, created_by_profile_id)` | `user_profiles (company_id, id)` |
| `mr_minute_tenant_fk` | `minute_revisions (company_id, minute_id)` | `meeting_minutes (company_id, id)` |
| `mr_creator_tenant_fk` | `minute_revisions (company_id, created_by_profile_id)` | `user_profiles (company_id, id)` |
| `mp_minute_tenant_fk` | `minute_participants (company_id, minute_id)` | `meeting_minutes (company_id, id)` |
| `ma_minute_tenant_fk` | `minute_agenda_items (company_id, minute_id)` | `meeting_minutes (company_id, id)` |
| `mf_minute_tenant_fk` | `minute_findings (company_id, minute_id)` | `meeting_minutes (company_id, id)` |
| `md_minute_tenant_fk` | `minute_decisions (company_id, minute_id)` | `meeting_minutes (company_id, id)` |
| `mpv_revision_tenant_fk` | `minute_participant_versions (company_id, minute_id, revision_id)` | `minute_revisions (company_id, minute_id, id)` |
| `mpv_identity_tenant_fk` | `minute_participant_versions (company_id, minute_id, participant_id)` | `minute_participants (company_id, minute_id, id)` |
| `mpv_profile_tenant_fk` | `minute_participant_versions (company_id, profile_id)` | `user_profiles (company_id, id)` |
| `mpv_position_tenant_fk` | `minute_participant_versions (company_id, position_id)` | `positions (company_id, id)` |
| `mpv_confirmer_tenant_fk` | `minute_participant_versions (company_id, attendance_confirmed_by_profile_id)` | `user_profiles (company_id, id)` |
| `mav_revision_tenant_fk` | `minute_agenda_item_versions (company_id, minute_id, revision_id)` | `minute_revisions (company_id, minute_id, id)` |
| `mav_identity_tenant_fk` | `minute_agenda_item_versions (company_id, minute_id, agenda_item_id)` | `minute_agenda_items (company_id, minute_id, id)` |
| `mfv_revision_tenant_fk` | `minute_finding_versions (company_id, minute_id, revision_id)` | `minute_revisions (company_id, minute_id, id)` |
| `mfv_identity_tenant_fk` | `minute_finding_versions (company_id, minute_id, finding_id)` | `minute_findings (company_id, minute_id, id)` |
| `mfv_agenda_tenant_fk` | `minute_finding_versions (company_id, revision_id, agenda_item_id)` | `minute_agenda_item_versions (company_id, revision_id, agenda_item_id)` |
| `mdv_revision_tenant_fk` | `minute_decision_versions (company_id, minute_id, revision_id)` | `minute_revisions (company_id, minute_id, id)` |
| `mdv_identity_tenant_fk` | `minute_decision_versions (company_id, minute_id, decision_id)` | `minute_decisions (company_id, minute_id, id)` |
| `mdv_agenda_tenant_fk` | `minute_decision_versions (company_id, revision_id, agenda_item_id)` | `minute_agenda_item_versions (company_id, revision_id, agenda_item_id)` |
| `mc_revision_tenant_fk` | `minute_commitments (company_id, minute_id, origin_revision_id)` | `minute_revisions (company_id, minute_id, id)` |
| `mc_decision_tenant_fk` | `minute_commitments (company_id, origin_revision_id, origin_decision_id)` | `minute_decision_versions (company_id, revision_id, decision_id)` |
| `mc_position_tenant_fk` | `minute_commitments (company_id, responsible_position_id)` | `positions (company_id, id)` |
| `mc_profile_tenant_fk` | `minute_commitments (company_id, responsible_profile_id)` | `user_profiles (company_id, id)` |
| `mk_revision_tenant_fk` | `minute_risks (company_id, minute_id, origin_revision_id)` | `minute_revisions (company_id, minute_id, id)` |
| `mk_position_tenant_fk` | `minute_risks (company_id, owner_position_id)` | `positions (company_id, id)` |
| `mk_profile_tenant_fk` | `minute_risks (company_id, owner_profile_id)` | `user_profiles (company_id, id)` |
| `ms_revision_tenant_fk` | `minute_milestones (company_id, minute_id, origin_revision_id)` | `minute_revisions (company_id, minute_id, id)` |
| `ms_verifier_tenant_fk` | `minute_milestones (company_id, verified_by_profile_id)` | `user_profiles (company_id, id)` |

Todas usan MATCH SIMPLE, ON UPDATE RESTRICT, ON DELETE RESTRICT. NULL en la referencia opcional significa ausencia; company_id y padres obligatorios siguen NOT NULL. Un responsable sin persona continúa permitido.

Las referencias compuestas internas incorporan company y la identidad de agregado/revisión previamente comprobada. No se crean relaciones polimórficas ni se pierde el anclaje.

0006 usa BEGIN/COMMIT, no DML, no NOT VALID, no deshabilitación de triggers ni reparaciones. Si una fila existente viola una FK, la aplicación falla y la transacción se revierte; se debe registrar constraint/fila con evidencia saneada y detenerse. No se acepta ignorar errores o modificar datos para continuar. Aplicación a un entorno con datos exige contraste autorizado previo; no se presume consistencia remota.

## 10. RLS Model

Por tabla:

- `memory_tenant_guard`: AS RESTRICTIVE FOR ALL TO authenticated, con USING y WITH CHECK.
- `memory_tenant_select`, `memory_tenant_insert`, `memory_tenant_update`, `memory_tenant_delete`: AS PERMISSIVE para su operación, TO authenticated.

Total: **65 políticas declaradas**, cero aplicadas. Todas usan la misma pertenencia efectiva con perfil/empresa activos. Se reafirma ENABLE ROW LEVEL SECURITY en las trece tablas.

La guarda restrictiva se combina por AND; evita que una futura política permisiva amplíe la frontera hacia otro tenant por OR. Las cuatro políticas por operación son **solo el estrato tenant**. F3-03 debe reemplazar/endurecer esas políticas permisivas antes de habilitar grants; añadir otra política por recurso sin retirar la permisiva tenant no bastaría para cumplir D3 dentro de la empresa.

No hay USING(true) ni WITH CHECK(true), ni políticas temporales permisivas. Los grants se mantienen cerrados (§16). Sin ese cierre, una política tenant-only no sería autorización por recurso suficiente.

Semántica de composición contrastada con [PostgreSQL CREATE POLICY](https://www.postgresql.org/docs/current/sql-createpolicy.html).

## 11. SELECT Policy

USING exige que la fila corresponda a la empresa del perfil de sesión activo y empresa activa. La lectura de otra empresa debe filtrarse, normalmente sin excepción SQL.

La prueba futura verifica positivamente que la fila propia existe y se lee, que la ajena existe bajo el fixture privilegiado y no aparece bajo la sesión, y que row_security_active es true. Un resultado vacío aislado no demuestra nada.

No se habilita aún lectura de actas por pertenencia general: los grants de aplicación están retirados hasta incorporar autorización por recurso.

## 12. INSERT Policy

WITH CHECK contrasta el tenant propuesto contra la sesión; declarar company B desde A debe producir 42501 por RLS una vez habilitados **solo para la prueba** los grants de diagnóstico.

Crear company A con un ID válido de evento/perfil/cargo B supera la pertenencia de la fila, pero debe fallar con 23503 por FK tenant-aware. Son defensas distintas. No se atribuye a RLS un rechazo causado solo por FK o ACL.

created_by_profile_id tenant-correcto todavía no demuestra que sea el actor de sesión. Esa validación de autoría corresponde a F3-03; no se implementa aquí.

## 13. UPDATE Policy

USING filtra la fila anterior y WITH CHECK valida la nueva. Una sesión A no puede mover su fila a B; la suite espera 42501. Intentar actualizar una fila B invisible desde A debe afectar cero filas, con comprobación privilegiada posterior de que B sigue intacta.

Evaluación de inmutabilidad: no existe operación legítima de transferencia tenant en el Core. Para roles sujetos a RLS, la pertenencia anterior/nueva impide dicha transferencia; FK RESTRICT preserva las relaciones referenciadas. No se añade un trigger de inmutabilidad absoluta ni una máquina de estados.

No se promete inmutabilidad frente a propietario/superusuario que pueda alterar restricciones, concederse permisos o reconstruir registros. Las FK sí siguen aplicándose a DML privilegiada normal.

## 14. DELETE Policy

USING mantiene tenant boundary; no concede autoridad institucional de borrado. Los grants de aplicación siguen revocados. DELETE de una fila ajena será filtrado; DELETE de un padre referenciado debe fallar por RESTRICT.

La suite prueba eliminación de una hoja ficticia propia solo bajo grants diagnósticos reversibles. Eso no autoriza borrar memoria institucional aprobada ni define retención. Ningún borrado de datos reales se ejecutó.

## 15. Session Identity

Expresión de cada política: EXISTS sobre public.user_profiles p JOIN public.companies c, con p.auth_user_id = (SELECT auth.uid()), p.is_active = true, c.status = active y p.company_id = tabla.company_id.

Referencias SQL calificadas; no nueva función privilegiada. Las consultas a perfiles/empresas están sujetas a sus políticas legacy y requieren sus permisos SELECT cuando se habilite acceso futuro. La ausencia de esos permisos debe fallar cerrada, no remediarse con políticas true.

La suite simula identidades mediante SET LOCAL ROLE authenticated y claims de sesión generados para fixtures. Es prueba RLS en PostgreSQL, no prueba de login/JWT HTTP real; ni siquiera esa simulación fue ejecutada aquí. En operación, el contexto de sesión deberá proceder del gateway verificado, nunca de SQL arbitrario del cliente.

## 16. Grants

El canon 0001–0005 no declara GRANT/REVOKE sobre Core que fije acceso efectivo; los defaults de la plataforma pueden variar. No se consultó catálogo remoto.

0006 declara, por cada tabla Core:

`REVOKE ALL PRIVILEGES ON TABLE ... FROM PUBLIC, anon, authenticated, service_role`.

Trece revocaciones; ningún GRANT habilitante. Solo afecta tablas Core, no tablas legacy ni roles globales.

| Actor | Postura candidata después de aplicar 0006 sobre el canon limpio |
|---|---|
| anon | Sin grants Core ni policies habilitantes |
| authenticated | Sin grants Core; policies tenant presentes pero acceso funcional bloqueado |
| service_role | Grants Core retirados; BYPASSRLS no concede por sí solo privilegio de tabla |
| table owner / superuser | Privilegios propios; no protegidos como usuario normal por este cierre |
| Roles adicionales/herencias/grants de columna | Estado no supuesto; revisión efectiva pendiente en catálogo real |

GRANT habilita la operación; RLS restringe filas; autorización de negocio restringirá actor/recurso/transición. No son intercambiables.

La suite verifica ausencia de privilegios efectivos de tabla y columna para anon/authenticated/service_role; si encuentra una herencia o grant inesperado, se detiene. Luego concede DML solo dentro de su transacción desechable y termina ROLLBACK. Nunca trasladar esos grants de prueba a la migración.

## 17. Service Role / BYPASSRLS

RLS no protege generalmente contra superusuarios, table owner sin FORCE RLS, roles BYPASSRLS o service_role con ese atributo. La suite verifica explícitamente rolbypassrls y row_security_active en vez de inferirlo por nombre.

Revisión local acotada: [admin.ts](../src/lib/supabase/admin.ts) construye cliente con SUPABASE_SERVICE_ROLE_KEY; la [ruta pública de token](../src/app/api/meeting-events/[token]/route.ts) lo usa para convocatorias. No se leen valores de secretos ni se modifica esa ruta. No tiene acceso funcional a Core añadido por esta intervención.

[server.ts](../src/lib/supabase/server.ts) usa llave pública y cookies. No se crea cliente privilegiado nuevo.

Riesgo: reutilizar el cliente admin para Memoria Viva eludiría RLS si se concediesen privilegios. La revocación propuesta evita grants heredados estándar del Core, pero no es protección contra el propietario. Las futuras operaciones deben demostrar su frontera bajo MV-G3A.

## 18. Security Definer Review

Revisión limitada a funciones declaradas en el canon y superficies que podrían utilizarse en este dominio:

| Función existente | Evidencia / uso | Límite |
|---|---|---|
| public.current_profile() | B0; devuelve perfil activo por auth.uid() | SECURITY DEFINER legado, sin comprobación propia de company activa |
| public.current_company_id() | B0; usado por políticas legacy de perfiles/empresas que consultan las nuevas policies | El filtro nuevo vuelve a exigir auth.uid(), perfil activo y empresa activa; no se usa el helper como autorización suficiente |
| public.current_access_role() | B0; rol del perfil activo | No se usa para autoridad de acta ni para tenant nuevo |

Ninguna función revisada escribe/consulta directamente las tablas Core recién definidas. Las tres tienen search_path = public; no se certifica ese legado como endurecimiento óptimo ni se modifica fuera del alcance. Debe revisarse su ownership/EXECUTE/search_path efectivo en el entorno de validación; no se presupone estado remoto.

**Funciones nuevas en 0006: 0. SECURITY DEFINER nuevas: 0.** La suite solo declara tres helpers SECURITY INVOKER en pg_temp, con search_path pg_catalog y rollback; no son infraestructura del producto.

## 19. Adversarial Matrix

Todo resultado SQL siguiente está **PREPARED / NOT EXECUTED**.

| Caso | Sesión / precondición | Evidencia esperada / capa |
|---|---|---|
| ACL cerrada | authenticated, sin grants diagnósticos | has_table_privilege false y 42501: ACL, no RLS |
| A lee A, B lee B | authenticated + grants diagnósticos | Una fila propia por cada una de las 13 tablas |
| A no lee B, B no lee A | Fixtures equivalentes existentes | Filtrado RLS; row_security_active true |
| A INSERT company B y viceversa | Todas las 13 tablas | 42501 WITH CHECK antes de constraints |
| A UPDATE company A→B y viceversa | Todas las 13 tablas | 42501 por nueva fila fuera de tenant |
| UPDATE/DELETE de hoja ajena | A/B | Row count 0 por RLS, contenido ajeno intacto |
| INSERT/UPDATE/DELETE propios | Riesgo ficticio hoja | Éxito con grants diagnósticos; sin afirmar autoridad funcional |
| Evento B referenciado desde A | Evento B sin otra acta | 23503 FK; no confundir con unicidad de evento |
| Perfil B / cargo B desde A | ID válido | 23503 FK; prueba simétrica B→A |
| Empresa equivocada en todas las entidades internas | service_role, fila B trasladada a A manteniendo referencias B | 23503 en las 13 tablas, aun con bypass de RLS |
| Perfil inactivo | authenticated A | Sin filas visibles |
| Empresa inactiva | authenticated A | Sin filas visibles |
| Sesión ausente | authenticated sin sub | Sin filas visibles |
| Service role lee A+B | Grants diagnósticos; BYPASSRLS confirmado | Dos filas por tabla; row_security_active false |
| Core A–G | Fixtures y constraints 0005 | Duplicados 23505, CHECK 23514, huérfanos/RESTRICT 23503, cargo sin persona aceptado |

Se registra SQLSTATE y nombre de constraint en rechazos. La suite verifica treinta FK tenant validadas en catálogo. Su cobertura conductual es mínima, no una prueba exhaustiva de cada combinación de los treinta enlaces; la revisión estática cubre cada arista. No basta un SELECT vacío ni un error de privilegios para declarar RLS correcto.

## 20. Cross-Tenant Results

**Cross-tenant tests executed: 0 en PostgreSQL.**
**Cross-tenant tests result: NOT EXECUTED.**

No se declara que FK/RLS hayan rechazado realmente datos. Lo demostrado es que la candidata contiene los controles y pasa comprobaciones de texto/estructura. Resultado del gate: PARTIAL; PASS depende de evidencia real futura.

## 21. Static Tests

`node --test tests/memory-core-schema.test.mjs tests/memory-tenant-schema.test.mjs tests/agent-context.test.mjs tests/institutional-profile.test.mjs`.

**29 PASS / 0 FAIL**: ocho tests F3-02 + diez Core + siete agente + cuatro perfil institucional.

Los nuevos tests comprueban: cobertura de las treinta aristas, claves destino exactas, RLS en las trece tablas, cinco policies por tabla, identidad/actividad en todas las policies, USING/WITH CHECK por operación, cierre de grants, ausencia de DML/lifecycle/auditoría/functions en migración y opt-in/rollback/roles separados en suite SQL. No se usa un simulador como sustituto de PostgreSQL.

## 22. Runtime Tests

Archivo preparado: [memory-tenant.runtime.sql](../supabase/canonical/tests/memory-tenant.runtime.sql).

Requiere cadena 0001–0006 aplicada correctamente en base Supabase nueva, identidad/loopback del laboratorio autorizados y sesión propietaria con privilegios para simular roles. **No ejecutado.**

El archivo exige variable psql conecta_disposable con valor MV-F3-02, ON_ERROR_STOP, límites de espera, Core vacío, RLS/policies esperadas y grants cerrados. Ese opt-in no demuestra aislamiento: el gate externo del laboratorio sigue siendo obligatorio. No contiene creación de infraestructura, conexión, contraseña ni destino remoto.

Fixtures son datos sintéticos A/B con IDs deterministas y correos example.invalid, dentro de BEGIN/ROLLBACK. No son seeds de la migración ni datos empresariales. Cualquier colisión o condición inesperada aborta; no se limpia para continuar. Helpers y grants diagnósticos son temporales/transaccionales. En error, ON_ERROR_STOP termina el cliente de script y la transacción sin commit debe revertirse; no reutilizar una sesión interactiva con transacción fallida.

0005/0006 tienen sus transacciones propias: aplicar cada archivo con stop-on-error y registrar exit/catalogo, sin envolverlos en un runner que ignore COMMIT internos. La suite revierte sus fixtures/grants, no las migraciones previamente aplicadas.

Antes de cerrar el gate también registrar PK/UNIQUE/FK/CHECK efectivos, orden de aplicación, versiones PostgreSQL/Supabase y evidencia saneada de los resultados. No certificar validación de permisos remotos a partir de una base local.

## 23. Lint

`npm run lint`: **exit 0**, sin errores/advertencias reportados. No supresiones ni correcciones de deuda ajena.

## 24. Build

`npm run build`: **exit 0**. Next.js 16.2.6, compilación + TypeScript satisfactorios, 14 páginas estáticas, optimización finalizada. Ninguna ruta nueva.

El comando soportado cargó .env.local automáticamente según su salida; no se inspeccionaron ni imprimieron valores. No se ejecutó deploy ni se afirma validación de infraestructura por compilar.

## 25. Residual Risks

- 0005/0006/suite aún sin ejecución PostgreSQL: sintaxis, comportamiento y catálogo efectivos pendientes.
- Candidata tenant-only no cumple autorización por recurso por sí sola; grants deben permanecer cerrados hasta F3-03/04/MV-G3A.
- Mantener políticas permisivas tenant junto con nuevas de negocio produciría OR excesivamente amplio dentro de la empresa; se exige reemplazarlas/endurecerlas.
- Owners/superusuarios/privilegios heredados y grants de columna requieren contraste; RLS no es protección absoluta.
- Perfil/empresa activos se consultan con snapshot transaccional; no se define aquí revocación instantánea de transacciones ya abiertas.
- No se exige que autor/verificador sea sesión actual ni se valida asignación vigente persona–cargo en este slice.
- FK nuevas podrían rechazar inconsistencias si se aplicase a datos de otro entorno: STOP, nunca reparación automática.
- Tenancy inmutable para usuarios normales no implica resistencia a administradores que alteren esquema/datos.
- MV-ISSUE-01/02, externos, quórum, retención, generación de tipos y Storage siguen pendientes sin soluciones supuestas.

## 26. Deferred Authorization

MV-F3-03 resolverá permisos por recurso, actor de sesión, segregación, lifecycle y cierre de las policies tenant permisivas antes de abrir grants. No se modificó access-policy, ni se crearon permisos/roles de negocio, estados, UI, APIs o Server Actions.

Las decisiones D1–D8 no se rediseñaron. La prueba de pertenencia es requisito necesario, no permiso para aprobar, cerrar, anular o leer toda la memoria.

## 27. Deferred Audit

MV-F3-04 y MV-G3A siguen pendientes. No audit tables/triggers/outbox ni report_reviews reutilizado. No operaciones funcionales antes de auditoría atómica y autorización verificadas.

## 28. MV-G3-02 Evidence Matrix

| Requisito de PASS | Evidencia actual | Estado |
|---|---|---|
| 0005 ejecuta correctamente | Solo pruebas estáticas previas/actuales | PENDING RUNTIME |
| 0006 ejecuta correctamente | Archivo transaccional + static tests | PENDING RUNTIME |
| FK tenant-aware funcionan | 30 declaradas; claves destino comprobadas estáticamente | PENDING RUNTIME |
| RLS usuario A/B | 65 policies y suite preparada | PENDING RUNTIME |
| SELECT cross-tenant | Casos para 13 tablas y ambas sesiones preparados | PENDING RUNTIME |
| INSERT cross-tenant | SQLSTATE 42501 esperado, no observado | PENDING RUNTIME |
| UPDATE cross-tenant | USING/WITH CHECK y suite preparada | PENDING RUNTIME |
| Referencias cross-tenant | 23503 esperado; prueba BYPASS separada | PENDING RUNTIME |
| Grants revisados | Canon sin grants explícitos; revocaciones candidatas + preflight | STATIC / EFFECTIVE PENDING |
| Bypass privilegiado documentado | §17; experimento separado preparado | DOCUMENTED / RUNTIME PENDING |
| Cero lifecycle adelantado | Sin estados/transiciones/triggers | PASS SCOPE |
| Cero autorización funcional adelantada | Sin código/permisos y grants cerrados | PASS SCOPE |
| Cero auditoría adelantada | Sin implementación audit | PASS SCOPE |
| Lint | exit 0 | PASS |
| Build | exit 0 | PASS |

**MV-G3-02 = PARTIAL. MV-G3-02 = NOT CLOSABLE sin PostgreSQL real.**
No se declara PASS por tests estáticos verdes. MV-G3A no está aprobado.

## 29. Scope Closure

```text
Initial branch: main
Initial HEAD: 70cbb5322c9b9920bf5bd97dc0865b2aa1dc325f
Final HEAD: 70cbb5322c9b9920bf5bd97dc0865b2aa1dc325f

Files created: 4
Files modified: 0 preexistentes

0005 runtime executed: NO
0005 result: NOT EXECUTED
0006 created: YES (candidata)
0006 runtime executed: NO
0006 result: STATIC CHECKS PASS / RUNTIME NOT EXECUTED

Tables affected: 16 declaradas / 0 aplicadas (13 Core + 3 legacy)
Existing tables altered: 3 legacy reciben UNIQUE en candidata; 0 cambios reales
Composite keys added: 10 declaradas / 0 aplicadas
Composite FKs added: 30 declaradas / 0 aplicadas
RLS enabled: 13 reafirmaciones declaradas / 0 ejecutadas
Policies created: 65 declaradas / 0 aplicadas
Grants changed: 13 REVOKE declarados / 0 ejecutados; 0 GRANT funcionales
Functions created: 0 persistentes (3 pg_temp solo en suite no ejecutada)
Security Definer functions: 0 nuevas

Cross-tenant tests executed: 0 en PostgreSQL
Cross-tenant tests result: NOT EXECUTED

Database mutations: 0
Remote mutations: 0
Storage changes: 0
Application changes: 0
Authorization changes: 0 de negocio; 65 policies tenant candidatas
Lifecycle changes: 0
Audit changes: 0
Dependencies installed: 0

Tests: 29 PASS / 0 FAIL
Lint: exit 0
Build: exit 0
SQL_RUNTIME_VALIDATION: NOT EXECUTED

Commits: 0
Pushes: 0
Deployments: 0
MV-G3-02: PARTIAL — NOT CLOSABLE
```

Verificación final: git status -sb y git rev-parse HEAD; preservación por hashes de los 19 archivos controlados. Mismo HEAD; trabajo preexistente preservado. Únicas nuevas rutas de esta orden:

```text
docs/mv-f3-02-tenant-integrity-rls.md
supabase/canonical/migrations/0006_conecta_memory_tenant_integrity_rls.sql
supabase/canonical/tests/memory-tenant.runtime.sql
tests/memory-tenant-schema.test.mjs
```

**STOP. No iniciar MV-F3-03. Esperar autorización del Director.**

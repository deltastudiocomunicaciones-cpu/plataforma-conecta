# MV-F3-01 — Memoria Viva · Core Data Model

## 1. Executive Result

**MV-G3-01 = PASS — validación estructural estática; migración NO ejecutada.**

Se materializó la fundación en un archivo SQL reproducible candidato: 13 tablas físicas para nueve conceptos, 107 columnas, 13 PK, 28 UNIQUE adicionales, 43 FK, 17 CHECK y 24 índices explícitos. Son declaraciones en un archivo, no objetos creados en una base.

**SQL_RUNTIME_VALIDATION = NOT EXECUTED.** No se certifica sintaxis mediante un servidor PostgreSQL, aislamiento completo, aplicación remota ni funcionamiento del dominio. La orden permite validación estática cuando no existe runtime seguro. Tests: 21/21; lint y build: exit 0. Ninguna escritura funcional se habilita; MV-G3A sigue pendiente. No se autoriza F3-02.

## 2. Entry Gate

Fuentes leídas íntegramente: [contrato MV-F2-01](mv-f2-01-memoria-viva-architecture-contract.md) y [decisión MV-G2-01](mv-g2-01-architecture-gate-decision.md). MV-G2 = CLOSED / APPROVED. D1–D8 prevalecen sobre alternativas abiertas. La orden independiente MV-F3-01 autoriza exclusivamente estructura; no modifica los documentos fuente.

## 3. Baseline

Initial branch: `main` (`main...origin/main`).
Initial HEAD: `70cbb5322c9b9920bf5bd97dc0865b2aa1dc325f`.

Se ejecutaron antes de modificar: `git status -sb`, `git branch --show-current`, `git rev-parse HEAD`, `git log -5 --oneline`.

Últimos cinco commits:

```text
70cbb53 cambio foto eventos conecta
1637132 Refine Conecta access and AI workspace and prepare Pymes pilot
7e73682 cambio method foto
07d0f6c Document agent context domain and refine accounting task presentation
2c73cb2 Add PYMES client portfolios and clarify profile role labels
```

Diez modificaciones preexistentes, excluidas de esta intervención:

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

Once entradas no registradas preexistentes (una representa un directorio):

```text
?? docs/arquitectura-institucional-cargos-v2.md
?? docs/gate-v2-02a-correcciones.md
?? docs/mv-f2-01-memoria-viva-architecture-contract.md
?? docs/mv-g2-01-architecture-gate-decision.md
?? scripts/extract-institutional-source.ps1
?? src/app/api/nivelar/daily-probe/
?? src/components/InstitutionalRoleProfile.tsx
?? src/data/sdx-institutional-source.json
?? src/lib/conecta/agent/institutional-context.ts
?? src/lib/conecta/institutional-profile.ts
?? tests/institutional-profile.test.mjs
```

No reset/clean/restore/stash; no cambios ajenos incorporados. La inspección se limitó a fuentes de autoridad, esquema, convenciones y mecanismos de validación pertinentes.

## 4. Files Changed

Solo tres archivos nuevos:

- [0005_conecta_memory_core.sql](../supabase/canonical/migrations/0005_conecta_memory_core.sql).
- [memory-core-schema.test.mjs](../tests/memory-core-schema.test.mjs).
- Este informe.

Ningún archivo preexistente fue editado. El build produce sus artefactos locales habituales; no son implementación ni despliegue. `database.types.ts`, `schema.sql`, B0–B3 y código de aplicación permanecen sin cambios.

## 5. Existing Schema Conventions

Evidencia: [schema.sql](../supabase/schema.sql), [0001](../supabase/canonical/migrations/0001_conecta_local_baseline.sql), [0003 meetings](../supabase/canonical/migrations/0003_conecta_meetings.sql), [0004 Nivelar](../supabase/canonical/migrations/0004_conecta_nivelar.sql).

Convenciones observadas: tablas públicas en snake_case plural, nombres por dominio (`meeting_events`, `report_reviews`, `nivelar_employee_links`), UUID con `gen_random_uuid()`, `timestamptz default now()`, FK explícitas, CHECK y RLS habilitado. No se encontró trigger compartido de timestamps en estas definiciones.

La cadena `supabase/canonical/migrations/0001…0004` se identifica en sus cabeceras como canon local candidato con versión ordinal, no historial remoto. La autorización previa F1-05B aprobó esa cadena; el contrato actual la referencia. Se continúa en **ese mismo directorio** con ordinal 0005, sin duplicar en `supabase/migrations` ni mezclar scripts históricos.

No se usa CLI para inventar un nuevo historial timestamp ni se ejecuta Supabase desde CONECTA: prevalecen el mecanismo ordinal comprobado y la restricción operacional del laboratorio sobre la recomendación genérica de la skill de generar nombres mediante CLI. Esto no afirma que el repositorio tenga un pipeline remoto de migraciones verificado.

Reproducción futura: base aislada autorizada con requisitos Supabase/Auth del canon, B0→B1→B2→B3→0005, en orden y una vez por base. 0005 usa BEGIN/COMMIT, CREATE TABLE sin IF NOT EXISTS y ninguna DML: falla ante colisiones en lugar de aceptar un esquema incompatible. Reproducible no significa reejecutable sobre objetos ya existentes. No se ejecutó esa secuencia.

## 6. Conceptual → Physical Mapping

| Concepto | Tabla física | Motivo |
|---|---|---|
| MemoryMeeting | `meeting_events` existente | Única raíz de evento; cero tabla nueva equivalente |
| MemoryMinute | `meeting_minutes` | Identidad lógica por evento |
| MemoryMinuteRevision | `minute_revisions` | Contenido general y número por acta |
| MemoryParticipant | `minute_participants` + `minute_participant_versions` | Identidad de participación documentada y snapshot por revisión |
| MemoryAgendaItem | `minute_agenda_items` + `minute_agenda_item_versions` | Ítem estable, orden/contenido versionados |
| MemoryFinding | `minute_findings` + `minute_finding_versions` | Hallazgo estable y contenido por revisión |
| MemoryDecision | `minute_decisions` + `minute_decision_versions` | Decisión estable y contenido por revisión |
| MemoryCommitment | `minute_commitments` | Compromiso con origen y responsabilidad propios |
| MemoryRisk | `minute_risks` | Ocurrencia documentada de riesgo |
| MemoryMilestone | `minute_milestones` | Hito definido, constatación de logro separada |

No se adopta automáticamente `memory_` ni `mv_`: `meeting_` enlaza con el dominio existente; `minute_` distingue acta de convocatoria y de informes. No hubo colisión de nombres en el esquema inspeccionado. Las cuatro tablas adicionales son versiones, no duplicados de personas, cargos o reuniones.

## 7. Aggregate Root

Raíz organizacional: `meeting_events.id`. Raíz del agregado documental: `meeting_minutes.id` con FK obligatoria al evento. Todos los hijos tienen camino obligatorio por FK hasta esa raíz. Empresas, perfiles y cargos reutilizan sus tablas actuales; no se crean identidades Auth.

No se altera `meeting_events`, ni sus respuestas, tokens o endpoints. El soporte operativo de reunión sin invitación sigue pendiente de evolución deliberada del `token_hash NOT NULL` legado: esta fundación no genera tokens ficticios ni habilita creación de eventos internos. La posibilidad conceptual D1 permanece; no es requisito para adjuntar estructura a eventos ya existentes ni obliga a otra raíz.

## 8. Logical Minute Model

`meeting_minutes`: id, company_id, created_at, meeting_event_id, created_by_profile_id. `mm_event_key UNIQUE(meeting_event_id)` impide dos actas por el mismo UUID de evento incluso si alguien suministra company_id distinto. Es más fuerte que unicidad solo por tenant; no reemplaza la futura comprobación de pertenencia.

FK a evento, empresa y creador con ON DELETE RESTRICT. Autor FK significa existencia, no autoría de sesión ni autorización. Ningún status ni campo de aprobación se introduce prematuramente.

## 9. Revision Model

`minute_revisions`: número entero positivo y UNIQUE(minute_id, revision_number); FK obligatoria al acta, autor existente, título no vacío, contexto y tiempos de celebración opcionales. `held_ended_at` requiere inicio y no puede precederlo. `meeting_timezone` admite una referencia textual no vacía, sin default universal; validación IANA/configuración organizacional corresponde a operación posterior.

Única fuente para **latest**: máximo revision_number del acta. Latest no significa approved/vigente. No hay current_revision_id, is_current ni supersedes_revision_id; no se necesita otra cadena paralela a la numeración lineal. No se impone continuidad sin huecos. Selección de versión aprobada, una revisión editable activa, transiciones, numeración concurrente e inmutabilidad se completarán en F3-03/04.

Cada revisión representa un snapshot completo: ausencia de un ítem significa que no pertenece a esa revisión, no borrado del histórico ni herencia implícita. Ítems tienen UUID estable en tabla de identidad; una fila por (revision_id, item_id) guarda su versión. FK compuestas por minute_id impiden ligar identidad y revisión de actas distintas. No hay copia automática ni operación de actualización implementada.

La estructura **permite conservar** revisiones; no bloquea todavía UPDATE/DELETE de un propietario privilegiado. No se declara probada inmutabilidad de contenido aprobado.

## 10. Participant Model

Participación documentada se ancla al acta y, por ella, al evento; no se habilita aún registro de asistentes previo al acta. `minute_participants` es identidad de ocurrencia, no identidad humana. Su versión separa perfil, cargo y denominaciones históricas.

Modelo inicial interno: profile_id obligatorio, position_id opcional. Externos quedan diferidos hasta política explícita; no se inventa tabla de personas externas ni identidad por token. Ampliación futura requerirá diseño y migración aditiva deliberada.

invited, eligible y attended son booleanos anulables: NULL = no establecido, false = negativo explícito. Sin default derivado de RSVP. Modalidad reutiliza los valores existentes presencial/virtual/hibrida, sin acreditar conexión. Registrar attended exige fecha y perfil confirmante; una triple NULL significa no confirmado. El CHECK comprueba completitud, no autoridad del confirmante. No hay quórum ni vínculo automático a meeting_responses.

## 11. Agenda Model

Identidad estable `minute_agenda_items.id`; título, contexto y ordinal en versiones. Ordinal NOT NULL > 0 y UNIQUE(revision_id, ordinal). Puede haber huecos; no dos posiciones iguales en una revisión. FKs de versión e identidad usan minute_id. No UI ni ordenación interactiva.

## 12. Finding Model

Identidad y contenido separados. description obligatoria no vacía, context opcional, agenda_item_id opcional. La FK (revision_id, agenda_item_id) apunta a la versión de agenda, no a cualquier tema del evento: conserva el contexto concreto. Sin taxonomía analítica ni JSON global.

## 13. Decision Model

Identidad estable y versiones con decision_text, context/razón opcional y agenda de la misma revisión. Se registra qué se decidió, sin campos que otorguen autoridad. No se convierte decisions_required ni contenido Cargo Cero en decisión aprobada. La ratificación y sustitución pertenecen a lifecycle posterior.

## 14. Commitment Model

Acción no vacía, expected_result opcional, due_date opcional, origen obligatorio (minute_id, origin_revision_id), decisión de esa revisión opcional. Cargo responsable obligatorio; persona opcional.

Se conservan cargo y persona del acuerdo mediante IDs y snapshots de denominación: responsible_position_title obligatorio; nombre de perfil presente solo cuando hay persona identificada. Un cargo sin persona permite ambos campos de persona NULL. No se consulta automáticamente el ocupante actual ni se actualizan snapshots.

No hay status/closed_at ni propagación desde acta: workflow, reasignaciones y eventos se incorporarán en F3-03/04/05. Los campos actuales representan atribución original; no deben reutilizarse como asignación actual mutable cuando se habilite seguimiento. Inmutabilidad y auditabilidad aún pendientes.

## 15. Risk Model

Riesgo con identidad, tenant, descripción, contexto, origen en revisión y owner_position_id/owner_profile_id opcionales. No se construye catálogo empresarial ni taxonomía. No hay cierre automático, escala de severidad ni workflow. Cambios de ownership histórico deberán contar con reglas y auditoría antes de operación.

## 16. Milestone Model

Descripción y origen obligatorios; target_date opcional. Logro es un hecho distinto: achieved_at permanece NULL mientras no se registra constatación. Si se registra, requiere verified_by_profile_id y verification_note no vacía; los tres deben estar presentes o ausentes juntos.

El CHECK no acredita permiso, verdad ni cumplimiento. No existe trigger desde Nivelar, acta, fecha objetivo o compromiso. La autoridad y correcciones del hecho se resolverán en F3-03/04.

## 17. Tenant Foundation

Las 13 tablas declaran company_id NOT NULL con FK companies(id), más UNIQUE(company_id,id) como clave candidata para F3-02. **No se implementa integridad tenant-aware completa.**

Actualmente puede persistir una combinación company A + referencia válida de B mediante rol privilegiado: las FK comprueban existencia y algunas relaciones de agregado, no la igualdad de empresas. Tampoco verifican company/perfil activos. Ninguna prueba aquí afirma cross-tenant rejection. No exponer estas tablas como operación funcional.

## 18. Foreign Keys

43 FK declaradas; todas ON DELETE RESTRICT y sin ON UPDATE CASCADE:

| Familia | Relación estructural actual | Endurecimiento obligatorio F3-02 |
|---|---|---|
| Todas las tablas | company_id→companies.id (13) | Empresa activa, inmutabilidad y políticas |
| Acta | evento y creador | Tenant común con meeting_events y perfil |
| Revisión | acta y creador | Tenant común con ambos |
| Identidades de participante/agenda/hallazgo/decisión | minute_id→acta (4) | Tenant común |
| Cuatro tablas de versiones | (minute_id,revision_id)→revisión; (minute_id,item_id)→identidad (8) | Incorporar company_id en ambas relaciones |
| Participante versionado | perfil, cargo y confirmante (3) | Tenant, identidad estable y asignación válida |
| Hallazgo/decisión versionados | (revision_id,agenda_item_id)→agenda versionada (2) | Tenant común en enlace opcional |
| Compromiso/riesgo/hito | (minute_id,origin_revision_id)→revisión (3) | Tenant común |
| Compromiso | decisión versionada, cargo y persona (3) | Tenant, asignación/vigencia, origen preservado |
| Riesgo | owner cargo y persona (2) | Tenant y relación institucional validada |
| Hito | perfil verificador | Tenant y actor autorizado |

Las referencias opcionales usan NULL para ausencia, sin identificadores polimórficos. Las FK de agregado implementan consistencia estructural necesaria para el Core, no anticipan el gate completo de F3-02. Las tablas existentes necesitarán claves tenant-aware cuando se endurezcan sus referencias, previa revisión de datos.

RESTRICT evita borrado en cascada de estos hijos al borrar un evento/empresa/perfil/cargo referenciado. No constituye política completa de retención ni impide borrar hojas mediante privilegio administrativo.

## 19. Structural Constraints

Inventario: **101 constraints PK/UNIQUE/FK/CHECK** (13 + 28 + 43 + 17), sin contar NOT NULL.

- 13 PK UUID y 13 UNIQUE(company_id,id).
- 1 UNIQUE(event_id) del acta.
- Revisión: UNIQUE(minute_id,revision_number) y UNIQUE(minute_id,id).
- Cuatro identidades y tres entidades de seguimiento: UNIQUE(minute_id,id).
- Cuatro versiones: UNIQUE(revision_id,item_id); agenda añade UNIQUE(revision_id,ordinal).
- CHECK: numeración/ordinal positivos; textos esenciales no vacíos; intervalo real coherente; zona no vacía si existe; modalidad existente; completitud de asistencia, snapshot de responsable y constatación de hito.
- FK detalladas en §18; obligatoriedad de padres impide huérfanos estructurales.

No se restringe due_date/target_date contra created_at: registrar compromisos históricos puede ser legítimo. No se añaden reglas de autorización como CHECK ni comparaciones entre tablas mediante funciones ocultas.

## 20. Enums

**Cero enums nuevos.** El workflow no es necesario para la identidad estructural. No se reutiliza report_status. Booleanos anulables representan hechos aún no determinados; el CHECK de modalidad adopta vocabulario ya presente, sin nuevo workflow.

created_at usa timestamptz/now() existente. No se añade updated_at engañoso con default que parezca actualizarse automáticamente; no existe trigger compartido demostrado. Mutación/versionado y auditoría definirán su mantenimiento en slices posteriores. No se crea sistema transversal de timestamps.

## 21. Indexes

13 índices PK y 28 UNIQUE implícitos; **24 índices explícitos**. Sin optimización especulativa.

| Índice | Tabla / columnas | Justificación |
|---|---|---|
| `mm_creator_idx` | `meeting_minutes (created_by_profile_id)` | Lookup de FK; sin índice UNIQUE con este prefijo completo |
| `mr_creator_idx` | `minute_revisions (created_by_profile_id)` | Lookup de FK; sin índice UNIQUE con este prefijo completo |
| `mpv_revision_idx` | `minute_participant_versions (minute_id, revision_id)` | Lookup de FK; sin índice UNIQUE con este prefijo completo |
| `mpv_identity_idx` | `minute_participant_versions (minute_id, participant_id)` | Lookup de FK; sin índice UNIQUE con este prefijo completo |
| `mpv_profile_idx` | `minute_participant_versions (profile_id)` | Lookup de FK; sin índice UNIQUE con este prefijo completo |
| `mpv_position_idx` | `minute_participant_versions (position_id)` | Lookup de FK; sin índice UNIQUE con este prefijo completo |
| `mpv_confirmer_idx` | `minute_participant_versions (attendance_confirmed_by_profile_id)` | Lookup de FK; sin índice UNIQUE con este prefijo completo |
| `mav_revision_idx` | `minute_agenda_item_versions (minute_id, revision_id)` | Lookup de FK; sin índice UNIQUE con este prefijo completo |
| `mav_identity_idx` | `minute_agenda_item_versions (minute_id, agenda_item_id)` | Lookup de FK; sin índice UNIQUE con este prefijo completo |
| `mfv_revision_idx` | `minute_finding_versions (minute_id, revision_id)` | Lookup de FK; sin índice UNIQUE con este prefijo completo |
| `mfv_identity_idx` | `minute_finding_versions (minute_id, finding_id)` | Lookup de FK; sin índice UNIQUE con este prefijo completo |
| `mfv_agenda_idx` | `minute_finding_versions (revision_id, agenda_item_id)` | Lookup de FK; sin índice UNIQUE con este prefijo completo |
| `mdv_revision_idx` | `minute_decision_versions (minute_id, revision_id)` | Lookup de FK; sin índice UNIQUE con este prefijo completo |
| `mdv_identity_idx` | `minute_decision_versions (minute_id, decision_id)` | Lookup de FK; sin índice UNIQUE con este prefijo completo |
| `mdv_agenda_idx` | `minute_decision_versions (revision_id, agenda_item_id)` | Lookup de FK; sin índice UNIQUE con este prefijo completo |
| `mc_origin_idx` | `minute_commitments (minute_id, origin_revision_id)` | Lookup de FK; sin índice UNIQUE con este prefijo completo |
| `mc_decision_idx` | `minute_commitments (origin_revision_id, origin_decision_id)` | Lookup de FK; sin índice UNIQUE con este prefijo completo |
| `mc_position_idx` | `minute_commitments (responsible_position_id)` | Lookup de FK; sin índice UNIQUE con este prefijo completo |
| `mc_profile_idx` | `minute_commitments (responsible_profile_id)` | Lookup de FK; sin índice UNIQUE con este prefijo completo |
| `mk_origin_idx` | `minute_risks (minute_id, origin_revision_id)` | Lookup de FK; sin índice UNIQUE con este prefijo completo |
| `mk_position_idx` | `minute_risks (owner_position_id)` | Lookup de FK; sin índice UNIQUE con este prefijo completo |
| `mk_profile_idx` | `minute_risks (owner_profile_id)` | Lookup de FK; sin índice UNIQUE con este prefijo completo |
| `ms_origin_idx` | `minute_milestones (minute_id, origin_revision_id)` | Lookup de FK; sin índice UNIQUE con este prefijo completo |
| `ms_verifier_idx` | `minute_milestones (verified_by_profile_id)` | Lookup de FK; sin índice UNIQUE con este prefijo completo |

Los índices UNIQUE existentes cubren búsquedas por company_id, minute_id y orden de revisión/agenda. No se añaden índices separados redundantes por esas columnas. En F3-02 se revisarán prefijos al ampliar FK con tenant.

## 22. Process Identity Decision

Inspección acotada: positions.processes es text[], operational_fronts tiene identidad de frente y el perfil institucional usa códigos documentales. No se demostró catálogo durable transversal ya aprobado.

Forma mínima propuesta: identidad institucional compartida por empresa + namespace/contexto + external_key, con versiones separadas referenciables por Cargo Cero, Informes y Memoria Viva. Falta cerrar gobernanza del namespace, equivalencias de códigos y fuente/versión autoritativa; no se presume que códigos de plantillas distintas identifiquen el mismo proceso.

**MV-ISSUE-02 — Institutional Process Identity: OPEN / NON-BLOCKING FOR CORE / BLOCKING FOR PROCESS LINKAGE.** Se difiere toda relación de proceso; no hay memory_processes, FK a texto ni catálogo exclusivo. Se podrá añadir posteriormente una relación tipada mediante migración aditiva, sin sustituir UUID ni destruir Core. Se aplica la excepción explícita de §20 de la orden: no es necesario decidir esta identidad para construir el resto.

MV-ISSUE-01 continúa abierto y bloquea MV-F3-07, no esta fundación.

## 23. Evidence Boundary

No MemoryEvidenceLink, metadata binaria, rutas de objetos, buckets, URLs, uploads ni Storage. La superficie futura será enlace tipado tenant-aware a identidades/versiones del Core bajo MV-F3-09; no se crea ahora. Storage permanece bloqueado hasta gate específico y MV-F3-10.

## 24. Audit Boundary

Las **13 tablas** requerirán auditoría de creación/mutación/eliminación permitida y preservación histórica. created_at/created_by no sustituyen audit log. No motor, tabla de auditoría, trigger, report_reviews reutilizado ni eventos implementados. F3-04 deberá hacer mutación+auditoría atómicas antes de MV-G3A.

## 25. Authorization Boundary

Cero cambios a access-policy, roles, endpoints, Server Actions o UI. FK de actor no demuestra actor de sesión. No se implementan CREATE/EDIT/SUBMIT/REVIEW/APPROVE/CLOSE/VOID ni se confiere autoridad por Cargo Cero, texto, tenant o superadmin. F3-03 y MV-G3A son obligatorios antes de escritura funcional.

## 26. RLS Posture

Patrón comprobado: B0, meetings y Nivelar habilitan RLS. 0005 declara ENABLE ROW LEVEL SECURITY en las 13 tablas nuevas, dentro de la misma transacción; **cero políticas y cero grants nuevos**. No modifica políticas existentes.

**RLS ENABLED (declarado) ≠ RLS POLICY IMPLEMENTED.** Si se aplica, las operaciones de filas de roles sujetos a RLS quedan sin política habilitante. No demuestra seguridad integral: propietarios/BYPASSRLS/service_role requieren tratamiento separado, los grants remotos son desconocidos y no deben exponerse escrituras privilegiadas. F3-02 verificará privilegios, políticas y pertenencia. No se ejecutó ALTER TABLE en ninguna base.

Referencia técnica consultada: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security). La postura es defensiva, no autorización funcional.

## 27. SQL Validation

**SQL_RUNTIME_VALIDATION = NOT EXECUTED.**

No se dispone de runtime local seguro demostrado: el laboratorio sigue con antecedente de bloqueo por publicación externa/recuperación Docker; no se inició ni consultó el motor para eludir ese gate. psql no se encontró en PATH. No se instalaron herramientas, se consultó remoto ni se ejecutó SQL.

Revisión estática: dependencias y orden de tablas, nombres/longitud, tipos de extremos FK, claves candidatas, ámbito permitido, RLS declarado, ausencia de SQL destructivo y constraints de estructura. Se consultó [PostgreSQL constraints](https://www.postgresql.org/docs/current/ddl-constraints.html) para semántica de NULL, FK y UNIQUE. No se afirma que las comprobaciones de texto sean un parser PostgreSQL.

Precondiciones futuras: esquema canónico base comprobado, nombres nuevos libres, runner transaccional autorizado y entorno aislado. No aplicar 0005 directamente a un remoto cuyo historial/esquema no haya sido contrastado.

## 28. Tests

Ejecutado:

```text
node --test tests/memory-core-schema.test.mjs tests/agent-context.test.mjs tests/institutional-profile.test.mjs
exit 0 — 21 aprobados / 0 fallidos
```

10 tests estáticos nuevos y 11 existentes (7 agente, 4 perfil institucional). No se modificaron tests existentes. No se simula un motor de constraints ni se presenta una prueba de texto como rechazo real de PostgreSQL.

| Caso exigido | Evidencia estática obtenida | Prueba SQL futura no ejecutada |
|---|---|---|
| A: una acta/evento | FK obligatoria + UNIQUE evento | Insertar segunda acta para el mismo evento: rechazo |
| B: revisión de una acta | Un padre obligatorio por FK | Padre inexistente: rechazo; padre válido: aceptación |
| C: número único | UNIQUE(minute_id,revision_number), >0 | Duplicado o cero: rechazo; otro número: aceptación |
| D: ordinal válido | NOT NULL, >0, UNIQUE por revisión | Cero/duplicado rechazados; orden válido aceptado |
| E: cargo sin persona | Cargo obligatorio, persona y snapshot NULL permitidos | Cargo existente + perfil NULL aceptado |
| F: no huérfanos | Grafo de FK obligatorias alcanza evento; RESTRICT | Hijos sin padre/borrado de padre referenciado rechazados |
| G: fundación tenant | company_id explícito + claves candidatas | Catálogo debe confirmar estructura; cross-tenant rejection NO reclamado |

Además: referencias de versiones al mismo agregado, relación agenda de la misma revisión, tipos/keys destino existentes, aislamiento de alcance del archivo e identificadores <=63 bytes.

## 29. Lint

`npm run lint`: **exit 0**, sin errores ni advertencias reportados. Sin regresión atribuible al slice; no supresiones ni cambios de configuración.

## 30. Build

`npm run build`: **exit 0**. Next.js 16.2.6: compilación y TypeScript satisfactorios, 14 páginas estáticas generadas, finalización de optimización. Ninguna ruta nueva.

El comando soportado cargó automáticamente .env.local según su salida; no se imprimieron ni inspeccionaron valores. No se ejecutó deploy ni se certificó conexión/estado de infraestructura. No hubo fallo que corregir.

## 31. Residual Risks

- Sintaxis/constraints aún sin ejecución PostgreSQL: debe verificarse en entorno aislado antes de aplicar.
- No igualdad tenant en todas las FK, ni company/perfil activos, ni acceso por recurso implementados.
- Versiones separadas preservan capacidad histórica, pero falta protección frente a mutación privilegiada.
- Identidad de participante estable no garantiza por sí sola que versiones posteriores mantengan la misma persona: regla de operación pendiente.
- Secuencia latest no implica versión aprobada. Concurrencia, revisión editable única y snapshots completos son trabajo posterior.
- Reasignaciones, retención/anonimización y corrección de hechos aún sin reglas operativas.
- Tipos TypeScript actuales no incluyen las tablas nuevas: **TYPE_REGENERATION_REQUIRED** antes de integraciones consumidoras. Se difiere generación hasta schema aplicado en laboratorio autorizado, sin afirmar sincronización remota ni editar manualmente tipos.
- Reunión sin invitación, externos, quórum, procesos y mapeo Cargo Cero mantienen los límites descritos.
- La cadena candidata no acredita historial remoto ni disponibilidad del laboratorio.

## 32. Deferred Work

MV-F3-02: endurecimiento de todas las relaciones §18, grants/RLS, actividad, adversariales dos tenants y contraste autorizado.
MV-F3-03: lifecycle, segregación, autorización, inmutabilidad, identidad/constataciones y quórum.
MV-F3-04: audit append-only atómico, concurrencia e idempotencia.
MV-G3A: verificación conjunta antes de operación funcional.
MV-F3-05/06: operaciones/UI solo después del gate.
MV-F3-07: MV-ISSUE-01 y referencias institucionales; MV-ISSUE-02 antes de enlace de procesos.
MV-F3-08/09/10: informes durables, metadata y Storage con gate independiente.

Ninguno de esos trabajos está autorizado por este cierre.

## 33. MV-G3-01 Evidence Matrix

PASS de estructura en archivo y validación estática conforme excepción de runtime de la orden; no PASS de ejecución SQL ni de MV-G3A.

| Criterio | Evidencia | Estado |
|---|---|---|
| meeting_events continúa root | mm_event_fk | PASS estático |
| No segunda tabla meeting | Inventario cerrado 13 tablas | PASS |
| Máximo una acta lógica/evento | mm_event_key | PASS estático |
| Acta/revisión separadas | meeting_minutes / minute_revisions | PASS |
| Revisiones preservan historia | Identidades + snapshots independientes; sin overwrite automático | PASS estructural; protección lifecycle pendiente |
| company_id coherente como fundación | 13 NOT NULL/FK/UNIQUE; límites explícitos | PASS fundación; no aislamiento completo |
| Persona/cargo separados | FK distintas | PASS |
| Compromiso cargo sin persona | NOT NULL posición; perfil NULL | PASS estático |
| RSVP no es asistencia | Sin dependencia meeting_responses | PASS |
| Orden agenda | ordinal y UNIQUE | PASS estático |
| Findings estructurados | Identidad + versiones | PASS |
| Decisions estructuradas | Identidad + versiones | PASS |
| Commitments estructurados | Tabla, origen, responsable | PASS |
| Risks estructurados | Tabla de ocurrencias | PASS |
| Milestones estructurados | Definición/constatación separadas | PASS |
| No Storage | Ausente en migración/cambios | PASS |
| No auditoría | Sin motor/triggers | PASS |
| No autorización modificada | Solo tres archivos nuevos | PASS |
| No operación funcional habilitada | Sin aplicación/policies; SQL no aplicado | PASS |
| No adelanto F3-02/03/04 | Sin políticas, workflow, auditoría; preparación estructural acotada | PASS |
| Migración reproducible | Cadena ordinal, dependencias explícitas, transacción | PASS revisión estática; runtime pendiente |
| No datos destruidos | Cero ejecución, sin DML destructiva | PASS |
| Lint sin regresión | exit 0 | PASS |
| Build sin regresión | exit 0 | PASS |

**MV-G3-01 = PASS**, limitado a SCHEMA FOUNDATION no aplicada. No autoriza F3-02 automáticamente.

## 34. Scope Closure

```text
Initial branch: main
Initial HEAD: 70cbb5322c9b9920bf5bd97dc0865b2aa1dc325f
Final HEAD: 70cbb5322c9b9920bf5bd97dc0865b2aa1dc325f

Files created: 3 (migración, test estático, informe)
Files modified: 0 preexistentes
Migration files created: 1
Existing tables altered: 0
New tables: 13 declaradas / 0 aplicadas
New enums: 0
New constraints: 101 PK/UNIQUE/FK/CHECK declaradas, sin contar NOT NULL
New indexes: 24 explícitos declarados (+41 implícitos PK/UNIQUE)

Database mutations: 0
Remote database mutations: 0
Migrations executed: 0
RLS enabled: 13 declaraciones / 0 cambios ejecutados
RLS policies created: 0
Storage changes: 0
Application code changes: 0
Authorization changes: 0
Audit implementation: 0
Dependencies installed: 0

Tests executed: 21
Tests result: 21 PASS / 0 FAIL (10 estáticos Core + 11 existentes)
Lint: npm run lint — exit 0
Build: npm run build — exit 0
SQL_RUNTIME_VALIDATION: NOT EXECUTED
TYPE_REGENERATION_REQUIRED: YES

Commits: 0
Pushes: 0
Deployments: 0
MV-G3-01: PASS (estructura estática, no aplicada)
Residual blockers: sin bloqueo de cierre estructural;
runtime SQL / MV-G3A / enlaces institucionales / Storage siguen pendientes
```

Verificación final: git status -sb y git rev-parse HEAD. Mismo HEAD; diez modificaciones y once entradas no registradas preexistentes preservadas. Únicas entradas nuevas de esta orden:

```text
?? docs/mv-f3-01-core-data-model.md
?? supabase/canonical/migrations/0005_conecta_memory_core.sql
?? tests/memory-core-schema.test.mjs
```

**STOP. No iniciar MV-F3-02. Esperar nueva autorización del Director del proyecto.**


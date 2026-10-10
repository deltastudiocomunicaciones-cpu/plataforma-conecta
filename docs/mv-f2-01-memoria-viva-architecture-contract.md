# MV-F2-01 — Memoria Viva Architecture Contract

Fecha: 2026-10-03, America/Bogota. Programa CONECTA. Fase F2. Gate MV-G2.
Modo: READ-ONLY / DESIGN ONLY / NO IMPLEMENTATION. Única escritura autorizada: este informe.

## 1. Executive Decision

**Arquitectura candidata: EXTEND de la cadena meeting_events y NEW de memoria estructurada, sin duplicar empresa, persona autenticada, cargo ni autorización. MV-G2 queda condicionado a las decisiones de producto de la sección 23; F3 no está autorizado.**

Memoria Viva conserva qué ocurrió, contexto, participantes, razones, decisiones, responsables, evidencia y evolución posterior. No se implementará como otra pantalla de CRUD de actas ni como un repositorio de archivos. Una reunión tendrá identidad persistente en `meeting_events`; la convocatoria es su faceta de invitación. La celebración y el acta son hechos distintos, con estados independientes. RSVP no acredita identidad ni asistencia efectiva.

Las conclusiones CONFIRMED_CURRENT de este informe significan presencia comprobada en el árbol de trabajo local, incluidos cambios sin commit. No significan que estén desplegadas, que las migraciones hayan sido ejecutadas o que RLS remoto coincida. No se consultó infraestructura remota. El diagnóstico de 18/09 se utilizó como antecedente, no como sustituto del delta.

## 2. Current Baseline Delta

Antes de inspeccionar se ejecutaron `git status -sb`, `git branch --show-current`, `git rev-parse HEAD` y `git log -5 --oneline`.

- Rama: `main`, seguimiento `origin/main`.
- Initial HEAD: `70cbb5322c9b9920bf5bd97dc0865b2aa1dc325f`.
- Últimos commits: `70cbb53`, `1637132`, `7e73682`, `07d0f6c`, `2c73cb2`.
- Diez archivos modificados y nueve entradas no registradas preexistían. Se preservan; no forman parte de MV-F2-01.

Modificados preexistentes: `docs/product-architecture/09-pilot-readiness-roadmap.md`; `src/app/api/agent/context/route.ts`; `src/app/mapa-vivo/mi-agente/page.tsx`; `src/components/ExecutiveRoleProfile.module.css`; `src/components/ExecutiveRoleProfile.tsx`; `src/components/OrgExperience.tsx`; `src/components/agent/AgentWorkspace.tsx`; `src/lib/conecta/access-policy.ts`; `src/lib/conecta/agent.ts`; `src/lib/conecta/nivelar.ts`.

No registrados preexistentes: `docs/arquitectura-institucional-cargos-v2.md`; `docs/gate-v2-02a-correcciones.md`; `scripts/extract-institutional-source.ps1`; `src/app/api/nivelar/daily-probe/`; `src/components/InstitutionalRoleProfile.tsx`; `src/data/sdx-institutional-source.json`; `src/lib/conecta/agent/institutional-context.ts`; `src/lib/conecta/institutional-profile.ts`; `tests/institutional-profile.test.mjs`.

### Evidencias locales utilizadas

Los identificadores E permiten rastrear cada decisión sin repetir una auditoría general. Los números de línea corresponden al árbol observado y pueden cambiar después.

| ID | Evidencia |
|---|---|
| E1 | [schema.sql](../supabase/schema.sql): companies 38; positions 46; user_profiles 72; operational_fronts 87; assignments 99; reports 116; evidence 140; reviews 150; helpers/RLS 195–338 |
| E2 | [meeting SQL](../supabase/20260826_meeting_events.sql): eventos 5; respuestas 35; restricciones y RLS; [B2 candidato](../supabase/canonical/migrations/0003_conecta_meetings.sql) |
| E3 | [API interna meetings](../src/app/api/meeting-events/route.ts): roles 5, identidad 28, GET 57, POST 101; [API token](../src/app/api/meeting-events/[token]/route.ts): findMeeting 18, POST 57; [helpers](../src/lib/conecta/meetings.ts) |
| E4 | [reports.ts](../src/lib/conecta/reports.ts): create/list; [OrgExperience](../src/components/OrgExperience.tsx): WeeklyReport 76, localStorage 629/1386, nombres de archivos 1186, reviewWeeklyReport 1190, creación local 1240–1273 |
| E5 | [access-policy](../src/lib/conecta/access-policy.ts): permisos y seis roles; [server Supabase](../src/lib/supabase/server.ts); [auth](../src/lib/conecta/auth.ts) |
| E6 | [resolver agente](../src/lib/conecta/agent/context.ts): getUser, perfil activo, empresa activa, cargo filtrado por company; [API](../src/app/api/agent/context/route.ts); [enriquecimiento](../src/lib/conecta/agent/institutional-context.ts): comparación de IDs 8–10 |
| E7 | [InstitutionalProfile](../src/lib/conecta/institutional-profile.ts): Evidence/Process, cargoCero, getInstitutionalProfile; [documento V2](arquitectura-institucional-cargos-v2.md); [gate V2-02A](gate-v2-02a-correcciones.md) |
| E8 | [Nivelar SQL](../supabase/migrations/20260902_nivelar_integration.sql); [adaptador](../src/lib/conecta/nivelar.ts): normalización 146 en adelante; [daily-probe](../src/app/api/nivelar/daily-probe/route.ts): permiso 100, primera muestra 132 |
| E9 | [seguridad histórica](product-architecture/06-security-review.md): SEC-02/03/04/05/06/11/12; [auditoría 16/09](audits/agent-context-supabase-20260916.md), solo antecedente remoto |
| E10 | [asignaciones/RLS](../supabase/migrations/20260813_responsible_assignment_read_policies.sql); [B0](../supabase/canonical/migrations/0001_conecta_local_baseline.sql); [B3](../supabase/canonical/migrations/0004_conecta_nivelar.sql) |
| E11 | [database.types.ts](../src/lib/supabase/database.types.ts): perfiles 46, cargos 76, informes 186, evidencia 236, reviews 258, meetings 308/385, Functions 553 |
| E12 | [Rocket.Chat API](../src/app/api/rocket-chat/route.ts): excepción local y payload cliente; [adaptador](../src/lib/conecta/rocket-chat.ts) |

### Respuestas DELTA A–J

| Pregunta | Estado | Hallazgo actual y consecuencia |
|---|---|---|
| A. Entidad de reunión | PARTIAL | `meeting_events` representa el evento convocado, no celebración/acta formal. Su identidad UUID es reutilizable. E2/E3 |
| B. Origen Memoria Viva | CONFIRMED_CURRENT | Evento tenant-aware, creator, fecha, temas y RSVP permiten extender una cadena única. Capacidad futura, no acta ya implementada. E2/E3 |
| C. Identidad de persona | CONFIRMED_CURRENT | `user_profiles.id` es identidad organizacional persistente; `auth_user_id` enlaza cuenta Auth opcional y única. No usar email/nombre/documento como PK. E1/E11 |
| D. Identidad de cargo | CONFIRMED_CURRENT | `positions.id` UUID y `(company_id,external_key)` único. Slug de catálogo y UUID no son intercambiables. E1/E7 |
| E. Persona–cargo | CONFIRMED_CURRENT | `user_profiles.position_id` más `user_position_assignments` con frente, tipo y fechas. FKs simples no prueban coherencia tenant ni historial inmutable. E1/E10 |
| F. Área/proceso | PARTIAL | `area`, `business_unit`, `processes[]` son textos; `operational_fronts` sí tiene UUID tenant; V2 incorpora códigos de procesos, no catálogo DB. No existe identidad formal de área/proceso encontrada en estas superficies. E1/E7 |
| G. Informes | PARTIAL | Modelo SQL, estado, revisiones, evidencia y helper existen; flujo UI principal persiste localmente y usa otro vocabulario. Reutilizar semántica/vínculos, no afirmar pipeline durable. E1/E4 |
| H. Evidencia durable | PARTIAL | `report_evidence` define metadata persistible ligada a informe; UI conserva URL y etiquetas de archivos. Registros reales/durabilidad operativa UNKNOWN. E1/E4/E11 |
| I. Auditoría durable | NOT_FOUND | Búsqueda acotada en SQL, tipos y operaciones: no audit log de negocio general. `report_reviews` y `nivelar_sync_runs` no lo sustituyen. E1/E8/E10/E11 |
| J. Lifecycle | PARTIAL | Convocatoria draft/open/closed/cancelled; informes y UI tienen estados diferentes; no máquina de acta encontrada. Respetar su independencia. E1–E4 |

Storage remoto permisivo y falta de triggers registrada en septiembre: HISTORICAL_ONLY; estado remoto actual UNKNOWN. No se reejecutó esa auditoría. Delta real adicional: V2 institucional y daily-probe aparecen actualmente en archivos locales sin commit (E7/E8); no se conserva la afirmación histórica de que Nivelar carece de ruta de consulta.

## 3. Reusable Foundations

| Necesidad | Existente / evidencia | Decisión |
|---|---|---|
| Empresa | companies, E1 | REUSE; company_id inmutable |
| Persona | user_profiles + Supabase Auth, E1/E5 | REUSE; perfil organizacional, no nueva tabla de usuarios |
| Cargo | positions, E1 | REUSE; UUID tenant, external_key como mapeo |
| Área/proceso | textos, operational_fronts, procesos V2, E1/E7 | EXTEND contexto organizacional; identidad formal durable requiere capacidad nueva acotada, no duplicar fronts |
| Convocatoria | meeting_events/token, E2/E3 | EXTEND; separar invitación de celebración |
| Reunión | mismo meeting_events, E2 | EXTEND; no segunda raíz meeting |
| Acta | no entidad en SQL/tipos revisados, E1/E2/E11 | NEW |
| Participante | meeting_responses declarativo, E2/E3 | NEW participación efectiva; REUSE enlace de procedencia RSVP, no duplicar personas |
| Decisión | textos decisions_required/UI, E1/E4 | NEW decisión estructurada |
| Compromiso | next_actions/pending_tasks/texto, E1/E4 | NEW compromiso trazable |
| Riesgo | textos e institucional risks, E1/E7 | NEW ocurrencia del riesgo; REUSE referencia de catálogo cuando exista |
| Hito | no identidad persistente encontrada, E1/E11 | NEW |
| Evidencia metadata | report_evidence / Evidence V2, E1/E7 | EXTEND hacia contrato compartido; no reutilizar tabla ligada obligatoriamente a informe como almacén de actas |
| Archivo | Storage solo histórico; UI no realiza subida, E4/E9 | BLOCKED hasta gate independiente |
| Auditoría | reviews/sync runs especializados, E1/E8 | NEW_CAPABILITY_REQUIRED, transversal; no audit paralelo por activo |
| Autorización | access_role/access-policy/contexto sesión, E5/E6 | EXTEND permisos existentes; no nuevos roles ni motor paralelo |

No se afirmará NEW por desconocer datos remotos: significa capacidad no encontrada en el contrato local inspeccionado, pendiente de contraste antes de implementar.

## 4. Meeting / Convocation Integration

Cadena candidata: **meeting_events (evento organizacional) → convocatoria opcional → RSVP declarado → celebración registrada → acta y revisiones → seguimiento**. `MemoryMeeting` es el nombre conceptual del evento extendido, no una tabla nueva.

- Un evento mantiene una identidad a través de cambios de agenda/horario; reuniones recurrentes diferentes son eventos diferentes, no sobrescrituras de la misma sesión.
- Mantener `draft/open/closed/cancelled` como estado de convocatoria. `closed` no acredita celebración, quórum ni aprobación de acta.
- Añadir conceptualmente resultado de celebración (no celebrada/celebrada/cancelada) y tiempos reales con zona horaria explícita. Hoy event_date/start_time no fijan zona.
- Reunión sin invitación pública: extensión interna del evento, sin publicar ni inventar un token compartible. El `token_hash NOT NULL` actual requiere evolución deliberada o separación de la capacidad de invitación; no crear un segundo meeting para eludirlo.
- Un evento tiene 0..1 acta lógica en el alcance inicial; el acta tiene revisiones, no actas independientes para cada corrección. Producto debe aprobar esta cardinalidad.
- RSVP → participante es una vinculación revisada, no conversión automática por nombre/cargo. La asistencia real se confirma separadamente por actor autorizado. `virtual` es respuesta/modalidad, no prueba de conexión efectiva.
- El endpoint público sigue mostrando únicamente la proyección de convocatoria. El token no otorga VIEW de actas, participantes internos, decisiones o evidencias.

E3 ya deriva creator/company del perfil al crear convocatorias, pero combina validación Bearer y cliente de cookies. Memoria Viva debe usar una identidad autenticada inequívoca por petición y rechazar contradicciones, sin replicar esa ambigüedad.

## 5. Organizational Identity Model

Empresa = companies.id; persona organizacional = user_profiles.id; identidad de autenticación = auth.users.id mediante auth_user_id; cargo = positions.id. Auth puede desvincularse sin reemplazar la identidad histórica del perfil. El modelo actual no demuestra una persona global multitenant ni múltiples empresas por auth_user_id; no se añade esa capacidad incidentalmente.

Las asignaciones laborales se reutilizan, validando empresa, vigencia y cargo. No bastan `responsible_name`, el objeto V2 `person.positionId`, ni un nombre RSVP. Para personas externas se propone un participante invitado con etiqueta contextual mínima y condición de identidad no verificada, sin convertirlo en usuario paralelo ni permitirle autenticarse o aprobar. Alcance externo pendiente de producto.

Compromiso candidato:

- `responsible_profile_id`: persona asignada al acuerdo, si ya existe persona identificada.
- `responsible_position_id`: cargo accountable del compromiso.
- Referencia opcional a asignación vigente validada en ese momento; snapshot mínimo de denominación/persona/cargo y fecha del acuerdo.
- Perfil y cargo deben pertenecer al mismo tenant; si se afirman como vínculo laboral, debe comprobarse la asignación vigente. Delegación fuera de esa asignación exige regla de negocio explícita.
- Exigir al menos un responsable; permitir cargo sin ocupante para no inventar persona. El piloto propone exigir cargo y persona resuelta antes de activar la ejecución, salvo excepción aprobada.
- Cambios posteriores crean eventos de reasignación con intervalos, razón, actor y anterior/nuevo responsable. No sobrescribir la atribución original.
- «Cargo actual de la persona» se consulta desde perfil/asignaciones actuales y se etiqueta como tal; no cambia «cargo al acordar» ni «cargo accountable actual del compromiso».

Área/proceso: un frente operativo no equivale automáticamente a proceso. Proponer una referencia institucional versionada con company + cargo/plantilla + versión + código de proceso; códigos M01 deben estar namespaced, no ser globales. Para integridad durable hará falta un registro institucional mínimo reutilizable por cargos e informes. No crear un segundo catálogo cuando exista uno aprobado fuera de las superficies inspeccionadas. Hasta resolverlo, conservar snapshot con procedencia y no afirmar FK a texto/JSON.

## 6. Conceptual Domain Model

Reglas comunes, aplicables a TODOS los conceptos siguientes: identidad estable opaca; company_id obligatorio e inmutable; empresa del padre idéntica; propiedad institucional de la empresa, custodia operativa delegada, no propiedad privada del creador; actor de escritura derivado de sesión; auditoría durable. Los nombres siguientes NO autorizan nombres de tablas.

| Concepto | Propósito, identidad y cardinalidad | Persona/cargo; ownership operativo | Lifecycle y auditoría | Reutilización / capacidad nueva |
|---|---|---|---|---|
| MemoryMeeting | Evento organizacional; mismo UUID meeting_events; company 1:N eventos | creator autenticado; custodio de reunión identificado y cargo contextual | Invitación existente + resultado de celebración separado; cambios de horario/contexto/custodio auditados | EXTEND E2/E3; no nueva raíz |
| MemoryMinute | Registro del contexto/desarrollo y acuerdos; ID propio; evento 0..1 acta lógica, 1:N revisiones | autor, revisor y aprobador perfiles del tenant; cargo contextual snapshot | DRAFT→SUBMITTED→IN_REVIEW→APPROVED→CLOSED / VOID; versión aprobada inmutable | NEW; E1/E11 no contienen acta |
| MemoryParticipant | Quién participó realmente y cómo; ID de ocurrencia; evento 1:N, snapshot en revisión de acta | perfil y cargo separados, ambos opcionales solo para invitado identificado como tal; custodio confirma | Registrado/confirmado/corregido; corrección con razón, sin convertir RSVP en prueba | NEW participación; RSVP opcional de E2 |
| MemoryAgendaItem | Tema ordenado y contexto discutido; ID estable por acta y contenido versionado; acta 1:N | presentador perfil/cargo opcional validado; autor/custodio edita | Planeado/tratado/pospuesto; congelado con revisión | EXTEND semántica topics[], NEW identidad de tema |
| MemoryFinding | Observación sustentada, no decisión; acta 1:N, tema opcional del mismo acta | registrador de sesión; fuente/observador opcional diferenciado | Borrador/registrado/corregido mediante revisión o enmienda | NEW; no confundir texto risks E4 |
| MemoryDecision | Qué se decidió, por qué, alternativas/contexto y vigencia; acta 1:N; tema/hallazgo opcionales | quien registra no necesariamente autoridad decisora; decisores perfiles/cargos verificados | Propuesta/ratificada/sustituida/anulada; contenido ratificado no se sobrescribe | NEW; decisions_required es solicitud, no decisión |
| MemoryCommitment | Acción acordada, resultado esperado y fecha; acta 1:N; decisión opcional, siempre mismo tenant/reunión | responsable persona/cargo conforme sección 5; accountable valida cierre | Propuesto/abierto/en curso/bloqueado/cerrado/cancelado; overdue derivado; reasignaciones/eventos | NEW; no reutilizar assignment laboral como tarea |
| MemoryRisk | Riesgo identificado en el evento, impacto/contexto/control propuesto; acta 1:N | owner perfil/cargo validado; referencia opcional a riesgo institucional versionado | Identificado/en tratamiento/cerrado; cierre motivado, no automático por acta cerrada | NEW ocurrencia; E7 aporta catálogo/contexto |
| MemoryMilestone | Resultado o punto de control fechado; acta 1:N; vínculo opcional a compromiso | accountable perfil/cargo; verificador autorizado | Planeado/alcanzado/cancelado; logro requiere constatación y razón | NEW; no confundir fecha de reunión con hito |
| MemoryEvidenceLink | Relación tipada entre metadata de evidencia y un registro del dominio; cada enlace tiene ID/tenant | agregado por actor autenticado; propietario no arbitrario | Vigente/retirado con motivo; enlaces usados en versión aprobada permanecen históricos | NEW relación; EXTEND contrato metadata E1/E7; binario BLOCKED |

Todos los hijos llegan a meeting_events mediante evento/acta; no se permite un hijo huérfano ni un vínculo a una revisión de otra reunión. Compromisos y riesgos conservan su origen aprobado y tienen seguimiento aparte: cerrar acta no cierra sus obligaciones.

## 7. Entity Relationships

```text
companies 1 ─ N meeting_events (= MemoryMeeting)
meeting_events 1 ─ N meeting_responses (RSVP, no asistencia probada)
meeting_events 1 ─ N MemoryParticipant
meeting_events 1 ─ 0..1 MemoryMinute (identidad lógica)
MemoryMinute 1 ─ N revisiones (solo una revisión activa)
revisión 1 ─ N versiones de agenda/hallazgo/decisión y snapshots de participantes
MemoryMinute 1 ─ N compromisos/riesgos/hitos (origen en revisión determinada)
compromiso/riesgo 1 ─ N eventos de seguimiento/reasignación
metadata de evidencia 1 ─ N MemoryEvidenceLink ─ 1 destino tipado
user_profiles N ─ N positions mediante user_position_assignments
```

Los IDs estables de ítems sobreviven a revisiones; el contenido aprobado se referencia por revisión, no por «última fila». No crear N actas para simular versiones. No usar un `entity_type/entity_id` sin integridad: relaciones tipadas o exclusividad verificable de destinos, definida en F3.

## 8. Minute Lifecycle

Máquina candidata, independiente de report_status. Todo comando valida expected_version; conflicto concurrente no sobrescribe ni duplica auditoría. Cada transición es atómica con su evento; si falla auditoría, falla la transición.

| Transición | Actor candidato | Precondición | Efecto / mutabilidad / auditoría |
|---|---|---|---|
| creación→DRAFT | CREATE y custodio autorizado | evento mismo tenant, sin otra acta lógica | crea revisión editable; acta creada |
| DRAFT→SUBMITTED | autor/custodio con SUBMIT | celebración acreditada, contexto/participantes y acuerdos consistentes, responsables válidos | congela versión enviada; enviada, actor/fecha/version |
| SUBMITTED→IN_REVIEW | revisor designado con REVIEW | acceso al recurso, versión enviada vigente | toma revisión; contenido no editable; inicio revisión |
| IN_REVIEW→DRAFT | revisor con REVIEW | devolución motivada | nueva revisión editable; conserva versión enviada y observaciones; devuelta |
| IN_REVIEW→APPROVED | aprobador con APPROVE | revisión completada, identidad/tenant activo, no conflicto, segregación propuesta autor≠aprobador | congela contenido aprobado; aprobada con versión y razón |
| APPROVED→CLOSED | custodio autorizado con CLOSE | formalización terminada; seguimiento asignado | cierre documental, no cierre automático de compromisos; cerrada |
| DRAFT/SUBMITTED/IN_REVIEW→VOID | custodio con VOID según rol | motivo obligatorio y alcance autorizado | conserva todas las revisiones; anulada |
| APPROVED/CLOSED→VOID | aprobador/dirección con VOID | justificación reforzada, referencia de sustitución si aplica | invalida sin borrar ni cancelar automáticamente compromisos; anulada |

No hay retorno silencioso APPROVED/CLOSED→DRAFT. Enmienda posterior genera revisión sucesora con su propio circuito; la versión aprobada anterior sigue accesible y el encabezado distingue acta vigente de revisión pendiente. VOID terminal; una sustitución es explícita. Si producto no aprueba enmiendas en piloto, se bloquean, no se sobrescribe contenido.

Quórum: expected_guests/quorum_percent actuales sirven como parámetros, pero falta regla de elegibilidad y acreditación. No usar conteo RSVP para aprobar actas. No imponer arbitrariamente que todos los compromisos estén cerrados para cerrar el documento.

## 9. Authorization Delta

Reutilizar E5 y sus seis roles. Proponer capacidades conceptuales `memory:create/edit/submit/review/approve/close/void/view` dentro del mismo catálogo, no implementarlas. La capacidad de rol es necesaria pero insuficiente: requiere tenant activo, relación con recurso, estado y responsabilidad designada.

| Rol actual | Capacidades candidatas, siempre scoped | Decisión pendiente |
|---|---|---|
| superadmin | VIEW y administración; CREATE/EDIT/SUBMIT si designado | No aprobación de negocio automática por privilegio técnico; delegación expresa para REVIEW/APPROVE/CLOSE/VOID |
| direccion | VIEW autorizado, REVIEW/APPROVE/CLOSE/VOID | CREATE/EDIT/SUBMIT no heredarlos de informes (hoy no create:report); decidir |
| gerencia | CREATE/EDIT/SUBMIT; REVIEW/APPROVE/CLOSE/VOID si designado | equipo/frente, segregación y suplencias |
| responsable | VIEW propio/autorizado; CREATE/EDIT/SUBMIT como redactor designado | posibilidad de redactar acta; seguimiento de sus compromisos, no aprobación |
| cultura_conecta | VIEW, CREATE/EDIT/SUBMIT y REVIEW donde designado | no APPROVE por defecto; acompañamiento no equivale a autoridad decisora |
| lector | VIEW de recursos explícitamente compartidos | ninguna escritura, ni por conocer un UUID |

EDIT solo borradores propios/delegados; SUBMIT solo versión vigente; APPROVE no deriva de título de cargo, texto RACI ni `permissions` cliente. VOID de aprobado requiere autoridad reforzada; no confundir cancelación de convocatoria con anulación documental. VIEW no equivale a leer todas las actas del tenant. Participación tampoco implica necesariamente acceso a anexos sensibles.

Servidor resuelve actor/tenant/rol desde sesión verificada, perfil y empresa activos; payload puede proponer responsable pero no suplantar autor/revisor/aprobador. Los responsables seleccionados son objetivos autorizados y se validan; nunca se presume que deban ser el actor. Una sola identidad por request. RLS y restricciones DB sostienen la misma regla incluso con llamadas directas; no depender solo del endpoint.

## 10. Tenant Boundary

company_id obligatorio e inmutable en entidades nuevas, revisiones, enlaces y auditoría. Reutilizar companies, no tenant nuevo. El contexto llega del perfil activo vinculado a Auth y empresa activa (patrón E6). Un UUID suministrado no prueba acceso. No admitir referencias cross-company aunque ambos registros sean legibles para un rol administrativo.

Lectura por relación: custodio, participante autorizado, responsable de seguimiento, revisor/aprobador designado o alcance de dirección aprobado. Respuestas públicas de RSVP no heredan permisos. DTOs mínimos, sin datos personales del perfil no necesarios; caches por identidad/tenant y respuestas privadas. No persistir actas en la clave localStorage de informes.

Cambios de tenant/perfil activo deben afectar operaciones y lecturas aunque persista una sesión. Los helpers SQL actuales no comprueban estado de company; no copiarlos como garantía suficiente. La habilitación RLS no basta si una política existente amplia se combina por OR con otra restrictiva.

## 11. Referential Integrity Strategy

Diseño candidato, no SQL ejecutable:

1. Para cada entidad referenciada, unicidad candidata `(company_id,id)` y FK compuesta desde el hijo. También para perfiles, cargos, meeting_events, informes y metadata compartida cuando entren en este dominio.
2. Acta→evento y revisión→acta validan empresa; ítem→revisión incluye identidad de acta. Vínculos decisión/compromiso/tema incluyen contexto del padre para impedir cruce entre actas del mismo tenant.
3. Un par responsable perfil/cargo tenant-correcto no demuestra asignación: verificar su relación y vigencia al acordar/delegar, registrando snapshot/evento. Operación transaccional y control de concurrencia.
4. Identidades actor por sesión; no dar al cliente escrituras libres sobre campos de aprobación/auditoría. Restringir mutaciones directas que evadan transiciones; mecanismo transaccional servidor/DB se seleccionará en F3 con permisos mínimos.
5. Relaciones opcionales explícitas: NULL significa ausencia, no evita validar company de las relaciones presentes. Enlaces tipados, sin IDs polimórficos sin FK.
6. No cascada destructiva de empresa/cargo/perfil sobre memoria aprobada. Retención, baja lógica y eventual anonimización requieren política; eliminar Auth no debe borrar actor histórico. Restringir borrado de referencias o conservar identificador/snapshot histórico gobernado.

Pruebas futuras: Company A + perfil/cargo/evento B rechazados en DB; vínculo entre dos actas A rechazado cuando no corresponde; autor falso rechazado; lector escribiendo rechazado; suspensión de empresa/perfil denegada; edición de revisión aprobada denegada; actualización concurrente detectada. Los datos existentes deben verificarse antes de añadir restricciones; no se asume que ya sean consistentes.

## 12. Audit Requirements

**NEW_CAPABILITY_REQUIRED.** No se encontró infraestructura general durable en el delta local. Reviews registran una decisión de informe, sync_runs una ejecución Nivelar, console/logs de infraestructura no son auditoría de negocio. E1/E8/E11.

Contrato transversal mínimo: event_id, company_id, identidad de agregado/revisión, operación, actor de sesión, cargo contextual cuando aplique, timestamp servidor, razón, cambio mínimo anterior/nuevo, correlation/idempotency key y versión. Registro append-only, escritura exclusiva por operación autorizada y lectura restringida. No copiar secretos ni payloads completos. Retención y acceso administrativo pendientes de producto/seguridad.

Eventos: acta creada/enviada/inicio revisión/devuelta/aprobada/cerrada/anulada; enmienda creada; decisión registrada/modificada/sustituida; compromiso creado/modificado/cerrado/cancelado; responsable cambiado; riesgo registrado/modificado/cerrado; hito alcanzado; participante corregido; evidencia vinculada/retirada. El intento denegado puede ir a logging de seguridad mínimo, no se presenta como hecho de dominio confirmado.

Auditoría y mutación atómicas. Idempotencia evita duplicar acuerdos ante retry. No activar escrituras reales de actas sin auditoría; no dejarla como mejora posterior de una UI ya operativa.

## 13. Evidence Model

Tres capas distintas:

- **Metadata:** identidad, tenant, clase de fuente, título, procedencia, fecha del hecho y registro, autoría declarada/verificada diferenciada, referencia/versionado y clasificación. Digest solo si existe un objeto legítimamente disponible; no inventarlo.
- **Relationship:** MemoryEvidenceLink liga esa metadata a un acta/decisión/compromiso/riesgo/hito concreto, con propósito y actor. Una evidencia puede apoyar varios registros del mismo tenant, sin ampliar automáticamente su audiencia.
- **Binary/object:** archivo físico, bucket/key, acceso firmado y validación de contenido. **BLOCKED** hasta gate Storage; esta orden no diseña su implementación.

`report_evidence.file_url` es una referencia, no prueba de disponibilidad, integridad ni autorización. `evidenceFiles` de UI son etiquetas, no archivos subidos. Evidence V2 es un contrato descriptivo, no persistencia. Reutilizar fuentes válidas por referencia autorizada y metadata común; no crear un informe ficticio para poder adjuntar evidencia a un acta. URLs externas no deben incorporar tokens ni descargarse automáticamente (evitar exfiltración/SSRF).

No certificar cumplimiento por presencia de un link. Acceso al vínculo no concede acceso al objeto; cada lectura verifica permisos del destino. Las versiones aprobadas conservan qué evidencia fue considerada entonces, incluso si el proveedor deja de estar disponible.

## 14. Cargo Cero Integration

Reutilizar InstitutionalProfile 2.0 y procesos/entregables/riesgos como contexto documental. Guardar procedencia, versión de documento y claves namespaced; distinguir propuesta institucional de cargo aprobado. Una reunión puede revisar un proceso, una decisión referir un entregable y un riesgo referir R01 sin afirmar equivalencia automática entre plantilla y hecho.

Colisión actual: `getInstitutionalProfile` usa slugs de catálogo; `resolveAgentContext` devuelve UUID `positions.id`; `enrichInstitutionalContext` compara igualdad literal entre ambos. No se demostró correspondencia. Proponer mapeo explícito `(company_id,external_key)` a plantilla aprobada, nunca por nombre aproximado; permanece UNKNOWN el resultado en sesiones reales. La ficha `person.positionId` no sustituye `user_profiles.id`.

No copiar TODO Cargo Cero al acta ni convertir GTO APPROVED en aprobación de acta. V2-02A documenta validación autenticada pendiente; no declarar integración operativa por existencia del adaptador.

## 15. Reports Integration

`management_reports` es un informe periódico de cargo; `MemoryMinute` es registro de evento. Un informe puede ser insumo de varias reuniones, y un acta puede referir varios informes: vínculos N:M tenant-aware a versiones/snapshots identificados, no duplicación de contenido mutable.

Reutilizar prioridad, vocabulario de revisión y cargos/frentes; no reutilizar report_status como enum de acta ni report_reviews como auditoría general. `decisions_required` no es decisión aprobada. `next_actions` no es compromiso con identidad. No migrar localStorage incidentalmente; un reporte local sin identidad durable no puede ser FK de acta. El enlace se habilita tras cerrar persistencia/autorización del flujo de informes y aprobar tratamiento de históricos.

## 16. Agent Integration Surface

Reutilizar resolución servidor E6, mínima proyección por empresa/cargo y `private, no-store`. Future surface: consultar actas autorizadas y seguimiento del cargo. El agente no obtiene permisos por el documento ni por texto de acta; contenido es dato, no instrucción ejecutable. No ampliar `permissions: []` del piloto.

IA generativa, transcripción, grabación, búsquedas semánticas, embeddings y herramientas de escritura quedan FUTURE SURFACE fuera de F2/F3 propuesto. Rocket.Chat es igualmente superficie futura de distribución de eventos autorizados, no evidencia de aprobación ni fuente canónica. Su endpoint actual E12 no se reutiliza como autoridad de negocio; notificaciones fuera de alcance.

## 17. Nivelar Integration Surface

Reutilizar solo identidad validada de employee_links y referencias a resúmenes autorizados, con fecha/procedencia/calidad. E8 añade normalización y daily-probe actual; el uso de primera muestra del proveedor no constituye mapeo tenant/persona demostrado ni ingesta durable. No consumir ese endpoint como fuente probatoria automática del acta.

access-policy incluye hoy view:nivelar-evidence para superadmin/direccion/gerencia; RLS SQL de resúmenes usa otro conjunto más titular. Esa divergencia requiere resolución antes de enlazar datos, no ampliación silenciosa. No guardar raw_payload en actas ni usar documento de identidad como clave pública.

**La evidencia digital es insumo de contexto y trazabilidad; no constituye por sí sola calificación de productividad, desempeño o cumplimiento del funcionario.** Un acuerdo debe registrar interpretación humana y contexto; una métrica no cierra automáticamente un compromiso ni acredita asistencia.

## 18. Semantic Collision Analysis

| Colisión | Separación contractual |
|---|---|
| meeting_event / convocatoria / reunión celebrada | Una raíz, facetas y hechos distintos |
| RSVP / asistencia / identidad | Declaración, participación efectiva y perfil autenticado separados |
| owner_label / propietario autorizado | Etiqueta vs perfil/cargo y capacidad de custodia |
| position UUID / slug / código SDX | Identidad DB vs clave externa vs plantilla documental |
| persona / ocupación actual / cargo al acuerdo | Snapshot histórico y asignaciones actuales diferenciados |
| operational_front / área / proceso M01 | Frente real reutilizable; áreas textuales y procesos documentales no equivalentes |
| informe / acta | Periodo de gestión vs evento organizacional |
| aprobado de informe / GTO / acta | Ciclos y autoridades independientes |
| closed convocatoria / CLOSED acta / compromiso cerrado | No se propagan automáticamente |
| decisiones requeridas / decisiones tomadas | Solicitud vs acuerdo ratificado con razones |
| assignment laboral / compromiso | Ocupación de cargo vs acción acordada |
| risks de plantilla / riesgo ocurrido | Definición institucional vs ocurrencia contextual |
| evidencia requerida / registrada / binario | Requisito, metadata/relación y objeto separados |
| review / audit / sync log | Juicio de negocio, historial de mutaciones y ejecución técnica |
| permisos del agente / texto RACI / access_role | Contexto no concede autorización |

## 19. New Capabilities Required

Acta y revisiones inmutables; participación efectiva; ítems estructurados; seguimiento y reasignación histórica; referencia institucional durable/versionada; metadata/enlaces de evidencia; auditoría transversal; comandos transaccionales con concurrencia/idempotencia; reglas tenant-aware y permisos por recurso. No se requieren nuevos usuarios, empresas, cargos, roles o sistema Auth.

La referencia institucional deberá extender el modelo compartido, no crear un catálogo exclusivo de Memoria Viva. El inventario local no ofrece hoy historial completo de ocupación inmutable; las asignaciones existentes se reutilizan y se extienden en lo estrictamente necesario para preservar historia.

## 20. Explicit Non-Reuse Decisions

- No localStorage de informes para actas: SEC-06, E4.
- No nombres RSVP como persona verificada: E2/E3.
- No report_reviews como aprobación de acta ni auditoría general: FK obligatoria report_id y política insuficiente, E1.
- No tablas de informes para disfrazar decisiones/compromisos: campos textuales sin identidad, E1/E4.
- No permiso de dirección/administrador como acceso universal cross-tenant: E5 y frontera propuesta.
- No copiar políticas de lectura de toda company a Memoria Viva: SEC-02, E1/E10.
- No Storage ni URLs públicas por inferencia de seguridad: SEC-05, E9.
- No texto RACI/plantilla V2 como autorización ejecutable: E7.
- No primera muestra Nivelar como evidencia individual: E8.
- No Rocket.Chat como ledger ni fuente de actor: E12.

## 21. Risks

| Riesgo histórico revalidado en alcance | Prevención del diseño |
|---|---|
| SEC-02: SELECT tenant amplio sigue declarado en SQL local | Scope por recurso, proyección mínima, pruebas lector/responsable |
| SEC-03: INSERT reviews solo comprueba rol | Actor de sesión + tenant/recurso + transición atómica, no copiar política |
| SEC-04: FKs simples y autorías manipulables | FKs compuestas, vínculos mismo agregado y actor derivado |
| SEC-05: Storage remoto solo histórico | Bloqueo expreso, gate de políticas antes de binarios |
| SEC-06: UI conserva localStorage | Persistencia servidor autorizada; nada de memoria institucional como cache compartida |
| SEC-11: auditoría general no encontrada | Auditoría atómica desde primera escritura, restauración futura probada |
| SEC-12: helpers no comprueban company activa | Invariante compartida servidor/DB y pruebas de suspensión |

Otros riesgos: ampliación accidental de proyección pública al extender meeting_events; cambios preexistentes no desplegados; falta de mapeo UUID/slug; ambigüedad zona horaria; borrados cascada del legado; roles compartidos no implican mismo alcance; backup Docker no acredita recuperación de Supabase remoto/Storage. No se certifica piloto ni seguridad productiva con esta revisión estática.

## 22. Unknowns

Estado DB/RLS/grants/Storage remoto: UNKNOWN. Datos y asignaciones cross-tenant actuales: UNKNOWN. Catálogo institucional durable fuera del repo: UNKNOWN. Mapeo real UUID de cargo a slug en sesión: UNKNOWN. Ocupaciones históricas completas: UNKNOWN. Retención, excepciones, delegación, confidencialidad y quorum: pendientes de producto. Estado desplegado de daily-probe/V2 y sesiones legítimas: UNKNOWN. Identidad de participantes externos y acceso a actas: no definido. No se inferirá ninguno a partir de nombre, rol UI o evidencia histórica.

## 23. Decisions Required From Product

Antes de cerrar MV-G2, aceptar o ajustar:

1. Una acta lógica por evento y enmiendas versionadas; alcance de reuniones sin invitación pública.
2. Custodio, revisor, aprobador y suplencias; segregación autor/aprobador; delegación de superadmin; capacidades de dirección para redactar.
3. Audiencia de lectura por equipo/recurso, actas restringidas y tratamiento de invitados externos.
4. Cierre documental independiente del seguimiento; responsable cargo/persona y excepciones de cargo vacante.
5. Catálogo organizacional de procesos: dueño institucional, namespace, versionado y relación con operational_fronts.
6. Zona horaria, constatación de celebración/asistencia y regla de quórum.
7. Correcciones posteriores, VOID, retención, baja lógica y anonimización sin pérdida de trazabilidad.
8. Habilitación de vínculos de informes solo con identidad durable; aprobación del contrato metadata sin habilitar Storage.

Son decisiones de negocio explícitas, no motivos para inventar una implementación. Se entregan propuestas concretas en secciones 4–13 para revisión.

## 24. Proposed Implementation Slices

Solo propuesta. F3 sigue bloqueada por MV-G2 y autorización independiente. Mantener el orden solicitado con una precisión: ninguna escritura funcional se habilita hasta terminar integridad, autorización y auditoría.

| Slice | Alcance futuro | Evidencia de aceptación requerida |
|---|---|---|
| MV-F3-01 Core data model | Evolucionar meeting_events; acta/revisiones/ítems; referencias existentes | No duplicación de identidades; cardinalidades, versiones y retención verificadas; no exposición de escrituras |
| MV-F3-02 Tenant integrity + RLS | FKs tenant/aggregate-aware, empresa/perfil activo, grants mínimos | Matriz adversarial dos tenants/roles y llamadas directas DB; sin datos cruzados |
| MV-F3-03 Lifecycle + authorization | Transiciones y permisos dentro de access-policy | Estados inválidos, actor falsificado y autoaprobación no autorizada denegados |
| MV-F3-04 Audit | Infraestructura transversal y eventos atómicos | Fallo de auditoría revierte operación; append-only, concurrencia e idempotencia probadas |
| MV-F3-05 Server domain operations | Comandos transaccionales y DTOs | Sesión única, límites de entrada, errores saneados, conflicto de versión, token público sin acceso a memoria |
| MV-F3-06 Minimal UI | Evento→acta→seguimiento; sin archivos ni IA | Flujo por roles reales, sin localStorage institucional; accesibilidad y estados vacíos |
| MV-F3-07 Cargo Cero linkage | Mapeo UUID/external_key/plantilla y referencias versionadas | Cargo desconocido no se aproxima por nombre; versión y pertenencia preservadas |
| MV-F3-08 Reports linkage | Vínculos a informes durables | Sin FK a ID local; no mezcla de lifecycle; permisos de ambos recursos |
| MV-F3-09 Evidence metadata | Contrato metadata y enlaces tipados | Relaciones tenant-aware, retiro histórico y sin URLs secretas; no binarias |
| MV-F3-10 Storage | SOLO después de gate de seguridad separado | Políticas actuales comprobadas, pruebas acceso cruzado/retención/integridad antes de archivos |

Resolver diseño de identidad de procesos en F3-01; su proyección Cargo Cero en F3-07. Si evidencia es obligatoria para aprobar actas, adelantar F3-09 antes de F3-06 sin adelantar Storage. No generar actas con IA, grabar, transcribir, firmar electrónicamente, notificar ni construir analytics/dashboards/búsqueda semántica en estos slices.

## 25. Gate MV-G2 Evidence

| Criterio | Evidencia del contrato | Estado |
|---|---|---|
| No duplicar empresa | companies; §§3/10 | Definido |
| No duplicar persona | user_profiles/Auth; §§3/5 | Definido; invitados requieren decisión |
| No duplicar cargo | positions; §§3/5 | Definido |
| Convocatoria→reunión→acta | una raíz, facetas separadas; §4 | Propuesto; cardinalidad por aprobar |
| Tenant boundary | company inmutable, sesión, perfil/empresa activos; §10 | Definido |
| Integridad cross-tenant | FK compuestas y mismo agregado; §11 | Definida como diseño, no implementada |
| Lifecycle | §8 | Propuesto; aprobación producto pendiente |
| Authorization delta | §9 | Propuesto; delegaciones/scopes pendientes |
| Auditoría | §12 | NEW transversal y atómica, definida |
| Metadata separada de Storage | §13 | Definido |
| Storage bloqueado | §§13/24 | Bloqueo explícito |
| Vínculo Cargo Cero | §14 | Definido; mapeo actual UNKNOWN |
| Colisiones semánticas | §18 | Identificadas |
| Unknowns explícitos | §22 | Registrados |
| Slices verificables | §24 | Propuestos |

**Dictamen: contrato arquitectónico candidato entregado; MV-G2 no se declara cerrado unilateralmente. No autoriza F3 ni afirma controles implementados.**

### Cierre de alcance

- Files created by task: `docs/mv-f2-01-memoria-viva-architecture-contract.md`.
- Files modified by task: ninguno preexistente.
- Database mutations: 0.
- Migrations executed: 0.
- Dependencies installed: 0.
- Commits: 0.
- Pushes: 0.
- Deployments: 0.
- Initial HEAD: `70cbb5322c9b9920bf5bd97dc0865b2aa1dc325f`.
- Final HEAD: `70cbb5322c9b9920bf5bd97dc0865b2aa1dc325f` (idéntico al inicial).

Se ejecutaron al cierre `git status -sb` y `git rev-parse HEAD`. El estado sigue en `main...origin/main`, con las diez modificaciones y nueve entradas no registradas del baseline, más únicamente `?? docs/mv-f2-01-memoria-viva-architecture-contract.md`. No se restauró ni corrigió trabajo preexistente.

No se ejecutaron tests/build: es un informe sin cambios de implementación. La verificación corresponde a trazabilidad de fuentes, alcance del documento y estado Git, no a validación dinámica ni aprobación de seguridad.

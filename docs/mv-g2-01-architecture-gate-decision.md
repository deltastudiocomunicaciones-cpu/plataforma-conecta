# MV-G2-01 — Memoria Viva Architecture Gate Decision

## 1. Gate Identification

- Programa: CONECTA. Activo: Memoria Viva.
- Gate: MV-G2 — Architecture Contract. Orden: MV-G2-01.
- Fecha de decisión: 2026-10-03.
- Modo: DOCUMENTATION / GOVERNANCE ONLY.
- Fuente de autoridad: resoluciones explícitas de Producto en la orden MV-G2-01.
- Dictamen: **MV-G2 = CLOSED / APPROVED**.
- Implementación F3: **NO AUTORIZADA**. Este cierre acredita decisiones arquitectónicas, no controles implementados ni aptitud productiva.

## 2. Source Contract

Contrato leído íntegramente: [MV-F2-01 — Memoria Viva Architecture Contract](mv-f2-01-memoria-viva-architecture-contract.md). Las referencias § de este documento apuntan a sus secciones numeradas.

SHA-256 del contrato fuente: `48D2C33288CB053942A8E492105E55EB9B9CABDC7E9C5D49A571CDA579886766`.

El contrato original se conserva sin cambios. Esta decisión resuelve sus preguntas de Producto (§23), ratifica sus límites y registra la secuencia obligatoria posterior. Las propuestas de actores y condiciones del contrato se concretan mediante D1–D8; no se convierten en permisos ejecutables. No se repitió la auditoría del repositorio ni se verificó infraestructura remota.

## 3. Baseline

Comprobaciones iniciales: `git status -sb`, `git branch --show-current`, `git rev-parse HEAD`, `git log -5 --oneline` (lecturas con `--no-optional-locks` cuando corresponde).

- Rama: `main`; seguimiento mostrado: `main...origin/main`.
- HEAD inicial: `70cbb5322c9b9920bf5bd97dc0865b2aa1dc325f`.

Últimos cinco commits observados:

```text
70cbb53 cambio foto eventos conecta
1637132 Refine Conecta access and AI workspace and prepare Pymes pilot
7e73682 cambio method foto
07d0f6c Document agent context domain and refine accounting task presentation
2c73cb2 Add PYMES client portfolios and clarify profile role labels
```

Modificaciones preexistentes, ajenas a esta orden:

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

Entradas no registradas preexistentes; la entrada terminada en `/` representa el directorio tal como lo muestra Git:

```text
?? docs/arquitectura-institucional-cargos-v2.md
?? docs/gate-v2-02a-correcciones.md
?? docs/mv-f2-01-memoria-viva-architecture-contract.md
?? scripts/extract-institutional-source.ps1
?? src/app/api/nivelar/daily-probe/
?? src/components/InstitutionalRoleProfile.tsx
?? src/data/sdx-institutional-source.json
?? src/lib/conecta/agent/institutional-context.ts
?? src/lib/conecta/institutional-profile.ts
?? tests/institutional-profile.test.mjs
```

Respecto del baseline inicial de MV-F2-01: misma rama, HEAD y diez modificaciones; se agrega como preexistente el contrato MV-F2-01, producido por aquella orden. El estado coincide con su cierre documentado. No se limpió, restauró ni incorporó trabajo preexistente.

## 4. Product Decisions

| Decisión | Resolución de Producto | Consecuencia de gobierno |
|---|---|---|
| D1 | APROBADO | Identidad lógica única del acta y revisiones |
| D2 | APROBADO CON REGLA | Designación institucional y segregación |
| D3 | APROBADO | Lectura por recurso, no por mera pertenencia |
| D4 | APROBADO | Seguimiento independiente y atribución histórica |
| D5 | APROBADO | Referencia compartida y versionada de procesos |
| D6 | APROBADO | Hechos temporales/asistencia separados |
| D7 | APROBADO | Enmiendas y VOID sin pérdida de historia |
| D8 | APROBADO CON GATE | Metadata conceptual; Storage bloqueado |

Estas resoluciones cierran las decisiones de Producto pendientes; no acreditan implementación, pruebas, RLS remoto ni ejecución de migraciones.

## 5. Decision D1

**APROBADO.** Cada `meeting_event` admite como máximo una acta lógica en el alcance inicial. Las correcciones y enmiendas conservan esa identidad mediante revisiones versionadas. Se permiten conceptualmente reuniones internas sin invitación pública; su evolución técnica se resolverá en F3.

`meeting_events` permanece como raíz del evento organizacional. No se crea otra raíz meeting. Convocatoria, RSVP, celebración, acta y seguimiento son hechos/facetas distintos. Referencias: §4, §6–8, §23 D1.

## 6. Decision D2

**APROBADO CON REGLA.** Puede redactar un responsable, gerencia, Cultura Conecta u otro actor institucional expresamente designado y autorizado. Aprueba una autoridad institucional designada.

Regla: **AUTHOR != APPROVER**. No hay excepción de autoaprobación vigente. Una eventual excepción futura exige decisión de negocio explícita, documentada, autorizada y auditada.

SUPERADMIN es privilegio técnico; no concede automáticamente REVIEW, APPROVE, CLOSE ni VOID. Cada autoridad de negocio requiere designación válida. No se infiere desde título de cargo, RACI, payload cliente, privilegio técnico ni Cargo Cero. Las capacidades candidatas de §9 quedan sujetas a estas condiciones, no habilitadas por este documento. Referencias: §8–9, §23 D2.

## 7. Decision D3

**APROBADO.** Autorización por recurso considerando tenant, estado, custodio, participación autorizada, responsabilidad de seguimiento, revisor/aprobador designado y alcance institucional autorizado. Pertenecer a una empresa no permite leer todas sus actas.

Dirección puede tener una proyección amplia solo cuando lo autorice la política organizacional. Responsables acceden por relaciones autorizadas. Invitación, token, RSVP o conocimiento del UUID no otorgan al invitado externo acceso al acta. El endpoint público de convocatoria no se extiende accidentalmente a Memoria Viva; participación tampoco concede acceso irrestricto a anexos sensibles. Referencias: §4, §9–10, §23 D3.

## 8. Decision D4

**APROBADO.** CLOSED documental no cierra compromisos ni riesgos ni acredita hitos. Un compromiso puede continuar activo después del cierre del acta.

Responsabilidad conceptual: `responsible_position_id` para accountability institucional, más `responsible_profile_id` cuando exista persona identificada. Un cargo vacante puede recibir responsabilidad institucional sin inventar una persona. Antes de activar ejecución sobre una persona debe existir identidad válida; de lo contrario queda explícitamente pendiente de asignación. No se sobrescribe la atribución histórica al cambiar el ocupante.

La decisión concreta la alternativa de cargo vacante planteada en §5; no exige fabricar una identidad para cumplir la propuesta inicial del piloto. Referencias: §5–8, §23 D4.

## 9. Decision D5

**APROBADO.** `operational_fronts` no se reinterpreta como catálogo de procesos. `area`, `business_unit` y `processes[]` no son por sí solos identidad durable.

La referencia institucional de procesos será durable, versionada y compartida por Cargo Cero, Memoria Viva, Informes y futuras superficies. Los códigos tendrán namespace de organización/contexto y versión. No se crea un catálogo exclusivo de Memoria Viva. El diseño concreto reutilizable se resolverá en F3 mediante autorización independiente. Referencias: §5–6, §18–20, §23 D5.

## 10. Decision D6

**APROBADO.** `America/Bogota` es configuración inicial posible del piloto, nunca supuesto universal. La arquitectura permitirá configuración por organización.

Se distinguen evento programado, evento celebrado, RSVP, asistencia efectiva y modalidad. RSVP no acredita asistencia; modalidad virtual no acredita conexión. Un actor autorizado registra/confirma la asistencia como hecho separado.

Cuando aplique, el quórum usa participantes elegibles y asistencia confirmada. `expected_guests` y `quorum_percent` son parámetros, no una definición de elegibilidad. Las reglas específicas siguen pendientes; no se inventan aquí. Referencias: §4, §6, §8, §23 D6.

## 11. Decision D7

**APROBADO.** APPROVED/CLOSED no regresa silenciosamente a DRAFT. Una corrección produce revisión/enmienda sucesora y preserva la versión aprobada.

VOID exige actor autorizado, motivo, auditoría, autoridad reforzada para APPROVED/CLOSED y referencia de sustitución cuando corresponda. No elimina historia ni cierra automáticamente compromisos/riesgos. No se permite hard delete de memoria institucional aprobada. Retención, anonimización y baja lógica se diseñarán posteriormente preservando trazabilidad. Referencias: §7–8, §11–12, §23 D7.

## 12. Decision D8

**APROBADO CON GATE.** Informes solo se vinculan mediante identidad durable autorizada. No hay FK hacia IDs de localStorage; `management_reports` no se convierte en actas, `report_status` no es su lifecycle y `report_reviews` no es auditoría transversal.

Evidence Metadata + Evidence Relationship quedan aprobadas conceptualmente. **Evidence Binary/Object Storage: BLOCKED** hasta gate de seguridad independiente. No se autorizan uploads, buckets, políticas Storage, URLs públicas ni implementación de signed URLs. Referencias: §12–13, §15, §23 D8, §24.

## 13. Ratified Principles

> La evidencia digital es insumo de contexto y trazabilidad; no constituye por sí sola calificación de productividad, desempeño o cumplimiento del funcionario.

Se ratifican identidad institucional reutilizada, trazabilidad histórica, separación entre contexto y autoridad, y tenant como frontera obligatoria. No se duplican empresa, persona, cargo, Auth ni raíz meeting. Referencias: §3–5, §10–11, §14–17.

## 14. Nivelar Boundary

Nivelar no acredita automáticamente asistencia. Una métrica no constituye decisión institucional, no cierra compromisos ni prueba cumplimiento por sí sola. La interpretación requiere contexto y actor humano autorizado. No se transforma evidencia operativa en evaluación automática del funcionario. No se modifica Nivelar. Referencia: §17.

## 15. Cargo Cero Boundary

Cargo Cero proporciona contexto institucional, no autorización ejecutable. Textos RACI, responsabilidades, autoridad, procesos, riesgos y entregables no conceden permisos. La autorización efectiva deriva del modelo de seguridad de CONECTA y de relaciones verificadas con el recurso. Su enlace futuro debe resolver identidad y versión sin convertir documentos en política de acceso. Referencias: §9, §14, §16.

## 16. MV-ISSUE-01 Position Identity Mapping

**OPEN / NON-BLOCKING FOR F3-01**  
**BLOCKING FOR MV-F3-07**

Colisión potencial documentada: `getInstitutionalProfile` utiliza slug/external key frente a `positions.id` UUID en `resolveAgentContext`.

Resolución futura: mapeo explícito verificable, preferentemente `company_id` + `positions.id` + `external_key` + versión institucional cuando aplique. No se acepta nombre aproximado, fuzzy matching, texto del cargo ni slug asumido equivalente a UUID. MV-F3-07 deberá demostrar correspondencia, aislamiento y rechazo de identidades ambiguas. No se corrige ahora. Referencias: §14, §18, §22.

## 17. F3 Governance Rule

**MV-G2 CLOSED no habilita escritura funcional.** Secuencia futura obligatoria:

| Orden | Slice / gate |
|---|---|
| 1 | MV-F3-01 — Core Data Model |
| 2 | MV-F3-02 — Tenant Integrity + RLS |
| 3 | MV-F3-03 — Lifecycle + Authorization |
| 4 | MV-F3-04 — Audit |
| 5 | **MV-G3A — Integrity / Authorization / Audit Gate** |
| 6 | MV-F3-05 — Server Domain Operations |
| 7 | MV-F3-06 — Minimal UI |
| 8 | MV-F3-07 — Cargo Cero Linkage |
| 9 | MV-F3-08 — Reports Linkage |
| 10 | MV-F3-09 — Evidence Metadata |
| 11 | MV-F3-10 — Storage, solo después de gate de seguridad específico |

**NO habilitar escrituras funcionales reales de Memoria Viva antes de aprobar MV-G3A.** El modelo estructural puede prepararse antes bajo una orden futura; la operación real no. Esta orden tampoco autoriza esa preparación. La secuencia aquí ratificada concreta el plan candidato de §24; no autoriza adelantar slices ni omitir gates.

## 18. MV-G3A Definition

Gate registrado conceptualmente, **PENDIENTE / NO IMPLEMENTADO NI VALIDADO POR ESTA ORDEN**. Criterios mínimos futuros:

- [ ] Tenant boundary implementado.
- [ ] FKs tenant-aware implementadas.
- [ ] Relaciones dentro del mismo agregado protegidas.
- [ ] Company activa validada.
- [ ] Perfil activo validado.
- [ ] Actor derivado de sesión.
- [ ] Payload no puede falsificar autor/aprobador.
- [ ] Lifecycle implementado.
- [ ] Transiciones inválidas rechazadas.
- [ ] Authorization delta implementado.
- [ ] Acceso por recurso implementado.
- [ ] Auditoría append-only implementada.
- [ ] Mutación + auditoría atómicas.
- [ ] Idempotencia implementada.
- [ ] Concurrencia/version conflict controlado.
- [ ] Dos tenants probados adversarialmente.
- [ ] Roles adversariales probados.
- [ ] No escritura funcional expuesta antes del Gate.

Su cierre exigirá evidencia técnica y pruebas bajo autorización posterior; aprobar MV-G2 no satisface ninguna casilla. Referencias: §8–12, §21, §24–25.

## 19. Residual Unknowns

Clasificación de pendientes, sin sustituir desconocimiento por supuestos:

| Unknown | Clasificación | Resolución / bloqueo futuro |
|---|---|---|
| RLS/grants remotos actuales | SECURITY_GATE_REQUIRED | MV-F3-02 y MV-G3A; contraste autorizado del entorno objetivo antes de habilitar operación allí |
| Storage remoto actual | SECURITY_GATE_REQUIRED | Gate independiente previo a MV-F3-10; no inferir buckets, políticas ni disponibilidad |
| Consistencia actual de datos cross-tenant | BLOCKING_LATER_SLICE | MV-F3-02 antes de aplicar restricciones sobre datos existentes; diagnóstico autorizado, sin asumir reparación |
| Mapeo real UUID/external_key de Cargo Cero | BLOCKING_LATER_SLICE | MV-ISSUE-01 antes de MV-F3-07 |
| Ocupaciones históricas completas | BLOCKING_LATER_SLICE | MV-F3-05 antes de operaciones/importaciones que atribuyan personas históricas; conservar desconocidos explícitos y no sobrescribir atribución |
| Política final de retención/anonimización | BLOCKING_LATER_SLICE | Gate específico antes de activar retención/anonimización/baja lógica; no habilitar hard delete mientras tanto |
| Reglas específicas de quórum/elegibilidad | BLOCKING_LATER_SLICE | MV-F3-03 antes de habilitar cálculo/validación de quórum; no sustituir por RSVP |
| Identidad/acceso definitivo de participantes externos | BLOCKING_LATER_SLICE | MV-F3-03 y verificación en MV-G3A antes de exposición funcional MV-F3-05/06; token público no concede acceso |
| Forma técnica exacta de referencia compartida de procesos | NON_BLOCKING | Diseño reutilizable en MV-F3-01; D5 ya resuelve el límite arquitectónico, no la implementación |
| Versiones institucionales históricas y disponibilidad efectiva de Cargo Cero V2 | BLOCKING_LATER_SLICE | MV-F3-07: confirmar fuente/versionado antes del enlace; no presumir despliegue |
| Persistencia/autorización efectiva de informes frente a representación local | BLOCKING_LATER_SLICE | MV-F3-08: comprobar identidad durable y tenant antes de crear enlaces |
| Disponibilidad, autorización y significado de evidencia Nivelar | BLOCKING_LATER_SLICE | MV-F3-09 o gate específico de integración antes de consumirla; no evaluar funcionarios ni atribuir asistencia automáticamente |

No se identifica un unknown **BLOCKING_F3_01** para preparar el modelo conceptual bajo futura autorización. Esto no certifica datos, despliegues ni seguridad remotos. Los pendientes de §22 se mantienen en sus fronteras de verificación; no bloquean artificialmente MV-G2. Cualquier nueva contradicción material exige decisión explícita, no una resolución supuesta.

## 20. Gate Evidence Matrix

Estados de esta matriz son documentales; «aprobado» no significa implementado.

| Decision / Requirement | Product Resolution | Architecture Contract Reference | Status | Blocks | Next Verification |
|---|---|---|---|---|---|
| D1 | Una acta lógica; revisiones; event root reutilizado | §4, §6–8, §23 | APPROVED | Duplicación de raíz/acta | MV-F3-01 cardinalidad e identidad |
| D2 | Designación; AUTHOR != APPROVER; superadmin técnico | §8–9, §23 | APPROVED WITH RULE | Autoaprobación y autoridad inferida | MV-F3-03 + MV-G3A |
| D3 | Acceso por recurso | §9–10, §23 | APPROVED | Lectura universal por tenant/token | MV-F3-02/03 + MV-G3A |
| D4 | Cierre separado; cargo/persona; historia | §5–8, §23 | APPROVED | Cierre derivado y atribución inventada | MV-F3-01/03/05 |
| D5 | Proceso compartido, durable, versionado | §5–6, §18–20, §23 | APPROVED | Catálogo exclusivo/reuso semántico falso | MV-F3-01 |
| D6 | Tiempo configurable; asistencia separada | §4, §6, §8, §23 | APPROVED | RSVP como asistencia; quórum supuesto | MV-F3-01/03 |
| D7 | Enmiendas; VOID autorizado/auditado | §8, §11–12, §23 | APPROVED | Sobrescritura/hard delete aprobados | MV-F3-03/04 + MV-G3A |
| D8 | Metadata/relación; informes durables; Storage separado | §12–13, §15, §23–24 | APPROVED WITH GATE | Binarios y enlaces a localStorage | MV-F3-08/09; gate previo a 10 |
| MV-ISSUE-01 | Mapeo explícito UUID/external_key | §14, §18, §22 | OPEN | MV-F3-07, no MV-F3-01 | Evidencia de correspondencia por tenant/versión |
| Storage | Sin autorización de binarios | §13, §21–24 | BLOCKED | MV-F3-10 | Gate de seguridad específico |
| Audit | Append-only; atomicidad; identidad; idempotencia | §8, §12, §21, §24 | REQUIRED / NOT VERIFIED | Escrituras funcionales antes de MV-G3A | MV-F3-04 + pruebas MV-G3A |
| Tenant Integrity | Tenant y agregado protegidos; empresa/perfil activos | §10–11, §21 | REQUIRED / NOT VERIFIED | Escrituras funcionales antes de MV-G3A | MV-F3-02 y adversariales dos tenants |
| Authorization | Sesión; recurso; lifecycle; segregación | §8–10, §21 | REQUIRED / NOT VERIFIED | Escrituras funcionales antes de MV-G3A | MV-F3-03 y adversariales de roles |
| Cargo Cero | Contexto, no permisos | §14, §16, §18 | RATIFIED / LINKAGE PENDING | Enlace ambiguo MV-F3-07 | Cierre MV-ISSUE-01 y límites de acceso |
| Nivelar | Contexto/trazabilidad, no evaluación automática | §17 | RATIFIED | Inferencias automáticas de cumplimiento | Gate autorizado de integración / MV-F3-09 |
| Reports | Identidad durable; lifecycle y auditoría separados | §12, §15 | RATIFIED / LINKAGE PENDING | MV-F3-08 sin identidad autorizada | Persistencia, tenant y enlaces tipados |

## 21. Final Gate Decision

**MV-G2 = CLOSED / APPROVED**

D1–D8 se incorporan como resoluciones de las decisiones pendientes del contrato. No se identificó contradicción arquitectónica material nueva ni error factual que requiera modificarlo. La responsabilidad vacante de D4 y la segregación/designación de D2 concretan alternativas abiertas del contrato; no eliminan sus controles.

Los unknowns tienen slice/gate de resolución; Storage continúa bloqueado; MV-G3A precede operaciones funcionales; no se duplican empresa, persona, cargo, Auth ni meeting root. F3 no fue implementado. El cierre no acredita seguridad operacional, pruebas ni estado remoto.

## 22. Next Authorized Action

**NEXT CANDIDATE: MV-F3-01 — Core Data Model**

**MV-F3-01 IS NOT AUTHORIZED BY THIS ORDER.**

Se requiere orden independiente posterior del Director del proyecto. Después de este documento y dictamen: STOP. No iniciar implementación, migraciones ni SQL ejecutable.

## 23. Scope Closure

```text
Files created by task: 1 — docs/mv-g2-01-architecture-gate-decision.md
Files modified by task: 0
Database mutations: 0
Migrations executed: 0
SQL executed: 0
RLS changes: 0
Storage changes: 0
Application code changes: 0
Dependencies installed: 0
Tests executed: 0
Build executed: 0
Commits: 0
Pushes: 0
Deployments: 0

Initial HEAD: 70cbb5322c9b9920bf5bd97dc0865b2aa1dc325f
Final HEAD: 70cbb5322c9b9920bf5bd97dc0865b2aa1dc325f
```

Verificación final: `git status -sb` y `git rev-parse HEAD`. Frente al baseline de §3, la única entrada nueva atribuible a la tarea es `?? docs/mv-g2-01-architecture-gate-decision.md`; permanecen las diez modificaciones y diez entradas no registradas preexistentes. El SHA-256 del contrato fuente permanece igual al de §2. No se modificaron archivos preexistentes.

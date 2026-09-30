# Conecta — diagnóstico ejecutivo y plano de producto

Fecha: 18 de septiembre de 2026. Base: checkout local `main`, HEAD `1637132`, incluido trabajo sin commit. Auditoría de código y documentación; no certificación de producción.

**Dictamen: no habilitar todavía un piloto externo con datos reales ni comercializar Conecta como SaaS multiempresa.** Existe una base aprovechable de experiencia de producto, autenticación, contexto organizacional y convocatorias. No hace falta reconstruir todo: hace falta completar la persistencia, corregir autorización y convertir la empresa en una frontera transversal verificable.

Conecta convierte la estructura formal de una organización en responsabilidad, seguimiento y decisión. Hoy esa promesa está representada de forma desigual: el mapa se nutre de un catálogo local; las identidades y asignaciones se consultan en Supabase; los informes y sus revisiones persisten en el navegador; las convocatorias sí tienen endpoints y escrituras de base de datos; el agente tiene contexto real de lectura, pero no conversación conectada a un modelo.

## Qué existe y qué falta

| Capacidad | Diagnóstico | Evidencia primaria |
| --- | --- | --- |
| Acceso y recuperación | Implementados en código con Supabase Auth; configuración de invitaciones y redirects pendiente de revalidación | [auth.ts](../../src/lib/conecta/auth.ts), [ConectaAccess](../../src/components/ConectaAccess.tsx) |
| Mapa y fichas | Interfaz implementada, contenido estático específico de Grupo A&C; no editor persistente general | [OrgExperience](../../src/components/OrgExperience.tsx), [catálogo](../../src/data/grupo-ac-org.json) |
| Informes, revisiones, evidencias | Parciales: flujo visible y tablas, pero persistencia UI local y archivos no subidos | OrgExperience líneas 624–629, 1182–1288, 1383–1388; [reports.ts](../../src/lib/conecta/reports.ts) |
| Convocatorias y respuestas | Implementadas en código con base de datos, token aleatorio y hash; falta endurecimiento y prueba integral | [API interna](../../src/app/api/meeting-events/route.ts), [API pública por token](../../src/app/api/meeting-events/[token]/route.ts) |
| Rocket.Chat | Transporte real implementado; configuración global, autorización insuficiente por recurso y tenant | [endpoint](../../src/app/api/rocket-chat/route.ts), [adaptador](../../src/lib/conecta/rocket-chat.ts) |
| Nivelar | Preparación parcial; adaptador y SQL sin ejecución de sincronización conectada a la app | [adaptador](../../src/lib/conecta/nivelar.ts), [status](../../src/app/api/nivelar/status/route.ts) |
| Agente contextual | Resolver real, privado y sin capacidades ejecutables; conversación proyectada | [resolver](../../src/lib/conecta/agent/context.ts), [conversación](../../src/components/agent/AgentConversation.tsx) |
| Multiempresa | `company_id` es una base, no una garantía integral de aislamiento | [esquema](../../supabase/schema.sql), [evaluación](05-multitenancy-readiness.md) |

## Bloqueos principales

1. **SEC-01/02:** datos identificativos en catálogo importado por un componente cliente y lecturas SQL demasiado amplias dentro de una empresa. Ocultar campos en pantalla no los protege.
2. **SEC-03/04:** inserción de revisiones sin comprobación de tenant del informe; referencias entre tablas sin integridad compuesta por empresa. Debe probarse la matriz de acceso con usuarios de dos tenants.
3. **SEC-05:** auditoría histórica registra Storage privado con políticas que solo filtran bucket. Revalidar y corregir antes de subir cualquier evidencia.
4. **SEC-06/07:** informes locales sin separación por usuario/tenant y avisos Rocket.Chat no vinculados a una transacción persistida ni a autorización de negocio.
5. **G-01/09:** drift entre SQL, tipos y estado remoto documentado; no hay una cadena reproducible de provisión y pruebas de aislamiento.

Detalle y condiciones de cada hallazgo: [seguridad](06-security-review.md). No se ha demostrado explotación ni incidente; la prioridad se basa en el código y en evidencia histórica identificada como tal.

## Propuesta

Evolucionar a un **monolito modular Next.js + Supabase/PostgreSQL**, con organización/tenant, membresías y autorización central en servidor, RLS coherente e integridad de datos por tenant. Mantener cargos, personas y cuentas separados. Persistir informes y revisiones en transacciones, evidencias en Storage privado, y publicar notificaciones mediante outbox. Agregar integraciones y configuración por tenant, auditoría y observabilidad. El agente debe consumir el mismo modelo de permisos y comenzar solo con lectura. No se justifica introducir microservicios por anticipado.

El piloto queda condicionado a los criterios de salida de [roadmap](09-pilot-readiness-roadmap.md), no a una fecha inventada. Facturación, autoservicio avanzado y ejecución agéntica pueden seguir después, con alcance explícito.

## Alcance y límites de evidencia

- Primera orden de inspección del repositorio: `git status -sb`. Se preservaron dos imágenes modificadas, la página de Mi agente modificada y archivos no rastreados de contexto, pruebas y documentación.
- Se leyeron fuentes, SQL, tipos y documentación; se contaron campos sensibles sin copiar sus valores. No se leyeron valores de `.env.local`, ni se expusieron credenciales, contactos o registros personales en estos documentos.
- El [contraste histórico de Supabase](../audits/agent-context-supabase-20260916.md) informa 11 tablas desplegadas, ausencia de Nivelar, 21 políticas y un bucket privado vacío el 16/09. Se cita como antecedente, **no como verificación remota del 18/09**.
- No se consultó hoy la base de datos remota, Vercel ni GitHub remoto. No se comprobaron grants actuales, backups, credenciales, cuotas, despliegue ni flujos con usuarios reales.
- Validación local: 7/7 pruebas existentes de contexto aprobadas; TypeScript sin errores con `--noEmit --incremental false`. Son controles limitados, no pruebas de RLS. ESLint: 8 errores y 1 advertencia existentes, detallados en el inventario.
- No se ejecutaron build, migraciones, seeds, envíos, commit, push ni despliegue. El único entregable nuevo es esta carpeta documental.
- Verificación documental final: 11 archivos, 8 diagramas Mermaid, enlaces locales existentes y bloques de código balanceados. No se renderizaron los diagramas. El estado Git final conserva los cambios previos y añade únicamente `docs/product-architecture/`.

## Índice de entrega

| Documento | Contenido |
| --- | --- |
| [01 — Inventario](01-system-inventory.md) | Rutas, componentes, APIs, SQL, dependencias, variables y pruebas |
| [02 — AS-IS](02-as-is-architecture.md) | Capas actuales, flujos, límites y Mermaid |
| [03 — Mapa funcional](03-functional-map.md) | Usuarios, entradas, procesos, salidas, permisos, persistencia y estado |
| [04 — Datos y permisos](04-data-and-permissions.md) | Modelo, RLS, roles y diferencias documentadas |
| [05 — Multiempresa](05-multitenancy-readiness.md) | Preparación de aislamiento y operación por cliente |
| [06 — Seguridad](06-security-review.md) | Hallazgos, severidad, evidencia y criterios de cierre |
| [07 — TO-BE](07-to-be-architecture.md) | Arquitectura SaaS modular propuesta |
| [08 — Brechas](08-gap-analysis.md) | Prioridad, impacto, riesgo, dependencia y esfuerzo |
| [09 — Roadmap](09-pilot-readiness-roadmap.md) | Secuencia y puertas de aceptación |
| [10 — Preguntas](10-open-questions.md) | Decisiones pendientes, responsables sugeridos y verificación |

## Convención común

**Implementado:** lógica conectada en código; no implica despliegue verificado. **Parcialmente implementado:** piezas reales sin flujo completo. **Simulado:** estado local, valores estáticos o demostración sin backend operativo equivalente. **Proyectado:** contrato, intención o diseño sin ejecución. **Deuda técnica:** restricción de mantenibilidad, seguridad u operación; puede coexistir con cualquiera de los anteriores. Una ausencia significa «no encontrada en el alcance inspeccionado», nunca una afirmación sobre toda la infraestructura externa.

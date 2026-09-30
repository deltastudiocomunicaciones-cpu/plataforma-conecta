# Inventario real del sistema

Base, taxonomía y límites: [resumen](00-executive-summary.md). Las líneas referidas corresponden al checkout auditado, incluido código sin commit.

## Rutas App Router

| Ruta | Archivo | Función y protección real |
| --- | --- | --- |
| `/` | [page](../../src/app/page.tsx) | Landing pública; `ConectaLanding` |
| `/acceso` | [page](../../src/app/acceso/page.tsx) | Login, recuperación y nueva contraseña mediante `ConectaAccess` |
| `/mapa-vivo` | [page](../../src/app/mapa-vivo/page.tsx) | Consulta SSR de usuario/perfil/asignaciones; gate cliente completa validación; renderiza catálogo local |
| `/mapa-vivo/mi-agente` | [page](../../src/app/mapa-vivo/mi-agente/page.tsx) | Resolver con sesión, perfil activo y empresa activa; redirección si no hay contexto; layout/loading/error propios |
| `/convocatorias` | [page](../../src/app/convocatorias/page.tsx) | Página sin gate servidor; APIs internas sí exigen sesión y rol |
| `/convocatorias/responder` | [page](../../src/app/convocatorias/responder/page.tsx) | Pública, token en query; estado inicial de demostración, consulta y POST al endpoint por token |
| `/dev/perfil` | [page](../../src/app/dev/perfil/page.tsx) y [review](../../src/app/dev/perfil/review.tsx) | Preview; `notFound()` fuera de development |
| `/dev/agente` | [page](../../src/app/dev/agente/page.tsx) | Preview; `notFound()` fuera de development |

`src/app/layout.tsx` y `globals.css` centralizan shell y estilos. [middleware.ts](../../middleware.ts): renueva/valida sesión, pero **no es un gate de autorización** y continúa si falta configuración pública.

## APIs propias

| Endpoint y métodos | Archivo | Entradas / salida | Persistencia y control |
| --- | --- | --- | --- |
| `/api/agent/context` GET | [route](../../src/app/api/agent/context/route.ts) | Sin identidad suministrada por cliente; contexto o estado explícito | Sesión SSR, selección mínima, empresa activa; `private, no-store`; 401/403/503 |
| `/api/meeting-events` GET, POST | [route](../../src/app/api/meeting-events/route.ts) | GET últimos 12 eventos y respuestas; POST logística y token retornado una vez | Perfil activo y rol permitido; company tomado del perfil; Supabase con RLS |
| `/api/meeting-events/[token]` GET, POST | [route](../../src/app/api/meeting-events/[token]/route.ts) | GET proyección pública; POST nombre/cargo/respuesta/requerimientos | Cliente admin; hash, estado open y expiración; honeypot, enum y truncado parcial |
| `/api/rocket-chat` POST | [route](../../src/app/api/rocket-chat/route.ts) | Payload y destinos elegidos por cliente; estado de envío | Valida usuario salvo excepción local; sin perfil/tenant/permisos de recurso |
| `/api/nivelar/status` GET | [route](../../src/app/api/nivelar/status/route.ts) | Booleanos de configuración | Pública, no ejecuta sincronización ni prueba conexión |

Además existe acceso directo a Supabase Data API mediante clientes browser/server. La ausencia de una ruta `/api/reports` no impide acceso a tablas si grants y RLS lo permiten. No se encontraron Server Actions ni Edge Functions propias.

## Componentes y módulos

| Grupo | Archivos concretos | Estado / dependencia |
| --- | --- | --- |
| Entrada y marca | [ConectaLanding](../../src/components/ConectaLanding.tsx), [ShowcaseCarousel](../../src/components/ShowcaseCarousel.tsx), [ConectaNavigation](../../src/components/ConectaNavigation.tsx) | UI real, marca y contenido fijos; activos `public/brand`, `public/fotos`, `public/method` |
| Sesión | [ConectaAccess](../../src/components/ConectaAccess.tsx), [MapaVivoAuthGate](../../src/components/MapaVivoAuthGate.tsx), [MapExit](../../src/components/MapExit.tsx) | Supabase Auth y perfil; logout no elimina los informes de localStorage |
| Experiencia operativa | [OrgExperience](../../src/components/OrgExperience.tsx) | 3.012 líneas: mapa, permisos visuales, dashboard, formularios, revisión, alertas e impresión |
| Fichas | [ExecutiveRoleProfile](../../src/components/ExecutiveRoleProfile.tsx), [CSS](../../src/components/ExecutiveRoleProfile.module.css), [FunctionalResponsibilities](../../src/components/FunctionalResponsibilities.tsx), [AssignedCompanies](../../src/components/AssignedCompanies.tsx) | Catálogos JSON y props; sin CRUD de catálogo conectado |
| Agente | [AiAgentSpace](../../src/components/AiAgentSpace.tsx), [AgentWorkspace](../../src/components/agent/AgentWorkspace.tsx), [AgentConversation](../../src/components/agent/AgentConversation.tsx) | Entrada y contexto implementados; servicio de conversación no inyectado |
| Reuniones | [MeetingRsvp](../../src/components/MeetingRsvp.tsx) | Planeación, lista y creación conectadas a APIs; no sistema completo de actas/compromisos |

## Bibliotecas y funciones

| Archivo | Funciones relevantes y conexión |
| --- | --- |
| [auth.ts](../../src/lib/conecta/auth.ts) | `hasSupabasePublicConfig`, `signInWithPassword`, `requestPasswordReset`, `updateCurrentUserPassword`, `signOut` |
| [access-policy.ts](../../src/lib/conecta/access-policy.ts) | `accessRolePermissions`, `canAccess`; tabla declarativa sin consumidores de ejecución encontrados; diferente de matriz UI |
| [reports.ts](../../src/lib/conecta/reports.ts) | `createManagementReport`, `listReportsForPosition`; exports sin invocadores encontrados en `src` |
| [notifications.ts](../../src/lib/conecta/notifications.ts) | `createNotification`, `listMyNotifications`; exports sin invocadores encontrados |
| [meetings.ts](../../src/lib/conecta/meetings.ts) | `createMeetingToken` (24 bytes aleatorios), `hashMeetingToken` (SHA-256), `parseTopics`, `toPublicMeeting` |
| [rocket-chat.ts](../../src/lib/conecta/rocket-chat.ts) | Construye payload, resuelve webhook global, `sendRocketChatAlert`; sin cola/reintentos durables |
| [nivelar.ts](../../src/lib/conecta/nivelar.ts) | Construye URL, `fetchNivelarEmployees`, `fetchNivelarDailySummaries`, `extractNivelarCategories`; sin invocadores de sincronización encontrados |
| [agent/context.ts](../../src/lib/conecta/agent/context.ts) | `resolveAgentContext`; conectado a página y GET privado |
| [agent.ts](../../src/lib/conecta/agent.ts) | Contratos `AgentContext`, capacidades de presentación y `AgentConversationService`; sin runtime LLM |
| [functional-profile.ts](../../src/lib/conecta/functional-profile.ts), [company-portfolio.ts](../../src/lib/conecta/company-portfolio.ts) | `getFunctionalProfile`, `getCompanyPortfolio`, `getReferenceDays`; fuentes JSON específicas |
| [print-current-map.ts](../../src/lib/print-current-map.ts) | `printCurrentMap`; exportación visual, no exportación integral de tenant |
| [browser.ts](../../src/lib/supabase/browser.ts), [server.ts](../../src/lib/supabase/server.ts), [admin.ts](../../src/lib/supabase/admin.ts) | Tres clientes Supabase; admin utilizado por RSVP público; sin guard `server-only` en admin |

## SQL y datos

14 tablas definidas localmente: 9 núcleo, 2 convocatorias, 3 Nivelar. Catálogo completo y matriz RLS: [datos y permisos](04-data-and-permissions.md).

| Archivo | Función y limitación |
| --- | --- |
| [schema.sql](../../supabase/schema.sql) | Tipos, nueve tablas, índices, RLS y tres funciones `current_*`; no baseline versionado por herramienta |
| [20260812_operational_assignments.sql](../../supabase/migrations/20260812_operational_assignments.sql) | Frentes/asignaciones y columnas de informes; solapa definiciones del schema |
| [20260813_responsible_assignment_read_policies.sql](../../supabase/migrations/20260813_responsible_assignment_read_policies.sql) | Agrega lecturas propias/asignadas; no elimina todas las lecturas amplias |
| [20260902_nivelar_integration.sql](../../supabase/migrations/20260902_nivelar_integration.sql) | Tres tablas, índices y RLS para Nivelar |
| [20260909_restrict_profile_self_update.sql](../../supabase/migrations/20260909_restrict_profile_self_update.sql) | Elimina política de actualización propia del perfil |
| [20260826_meeting_events.sql](../../supabase/20260826_meeting_events.sql) | Dos tablas y cinco políticas; fuera de `migrations/` |
| `supabase/seeds/20260812_daniel_transversal_case.sql`, `supabase/seeds/20260909_pymes_access.sql` | Preparación de casos/asignaciones internos, no alta SaaS general; no ejecutados |
| [auditoría 09/09](../../supabase/audits/20260909_pymes_access.sql), [preflight 17/09](../../supabase/audits/20260917_pymes_preflight.sql) | Consultas de comprobación operativa; no sustituyen suite de autorización |
| [database.types.ts](../../src/lib/supabase/database.types.ts) | Doce tablas tipadas, omite meetings, incluye Nivelar; `Relationships: []`, funciones como `Record<string, never>` |

No se encontraron políticas Storage, triggers de negocio, vistas propias, migración de auditoría general ni configuración CLI `supabase/config.toml` en los archivos inventariados. El antecedente remoto sí registra Storage: es drift, no prueba de inexistencia del servicio.

## Fuentes estáticas y simulación

- [grupo-ac-org.json](../../src/data/grupo-ac-org.json): 54 nodos; campos de cargo, jerarquía, nombres, fotos, documento y teléfono. Tres nodos contienen documento y tres teléfono no vacíos distintos del marcador de pendiente. Se omiten todos los valores personales. No es una base separada por tenant.
- [pymes-functional-profiles.json](../../src/data/pymes-functional-profiles.json) y [pymes-company-assignments.json](../../src/data/pymes-company-assignments.json): responsabilidades y clientes atendidos; no representan membresías SaaS. [importador](../../scripts/import_pymes_profiles.py): carga de contenido local, no onboarding transaccional.
- OrgExperience líneas 624–629/1385: informes en clave global `conecta-weekly-reports`; revisión, indicadores y alertas derivados de ese estado. `nivelarPilotMembers` es contenido estático; no datos leídos del proveedor.
- `/convocatorias/responder` inicializa `demoMeeting`. No confundir pantalla inicial con evento consultado.
- [cuentas de prueba](../pymes-test-accounts.json): archivo rastreado con datos de cuentas; se inspeccionaron solo nombres de campos, sin encontrar campo de contraseña entre ellos. No se considera secret scan completo.
- `public/profiles/` contiene fotografías servibles como activos públicos. `tmp/` y `output/` contienen fuentes/artefactos de trabajo; no son módulos productivos. No se revisó íntegramente su contenido sensible ni la historia de Git.

## Variables referenciadas, sin valores

| Nombre | Ámbito / consumidores |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Pública; middleware, clientes y comprobación de configuración |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Pública; prioridad sobre publishable mediante `??`; seguridad depende de RLS/grants |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Pública; alternativa anterior |
| `SUPABASE_SERVICE_ROLE_KEY` | Privada; `admin.ts`; no se encontró referencia desde componente cliente |
| `ROCKET_CHAT_WEBHOOK_URL` | Privada; webhook global/default |
| `ROCKET_CHAT_WEBHOOK_DIRECTION_URL` | Privada; destino dirección global |
| `ROCKET_CHAT_WEBHOOK_TREASURY_URL` | Privada; destino tesorería global |
| `NIVELAR_API_TOKEN` | Privada; adaptador servidor y booleano de status; pasa a URL del proveedor |
| `NIVELAR_API_BASE_URL` | Privada; override de URL del proveedor |
| `NODE_ENV` | Runtime; restringe previews de desarrollo |

`.env.example` y `.env.local` existen, `.gitignore:34` ignora `.env*`; `git ls-files` no los reportó rastreados. No se inspeccionaron valores ni historia de secretos. No se encontró configuración de secretos por organización.

## Dependencias y operación

[package.json](../../package.json) declara Next 16.2.6, React/React DOM 19.2.4, Supabase SSR ^0.12.4, Supabase JS ^2.106.2 y lucide-react ^1.16.0. Desarrollo: TypeScript ^5, ESLint ^9, Tailwind/PostCSS ^4 y tipos Node/React. [lockfile](../../package-lock.json) fija, entre otros, Supabase JS 2.112.2, SSR 0.12.4, TypeScript 5.9.3, ESLint 9.39.4 y Tailwind 4.3.1. No se realizó análisis de CVE ni `npm audit`; estas versiones no se declaran seguras por estar fijadas.

Scripts: `dev`, `build`, `start`, `lint`; no script test. [next.config.ts](../../next.config.ts) está vacío de opciones. No se encontró `vercel.json`, pipeline `.github/workflows`, infraestructura como código, instrumentation, Sentry/OpenTelemetry, health check con dependencias ni runbook de recuperación en el alcance. Git tiene upstream `origin/main`; Vercel/GitHub son parte del contexto conocido, no despliegues verificados hoy.

## Verificación ejecutada

| Control | Resultado y alcance |
| --- | --- |
| `git status -sb` inicial | `main...origin/main`; cambios preexistentes preservados |
| `node --test tests/agent-context.test.mjs` | 7 aprobadas, 0 fallidas; pruebas unitarias del resolver con cliente simulado |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false` | Exit 0; sin escrituras de compilación |
| ESLint dirigido a `src`, middleware y next.config | Exit 1: 8 errores y 1 advertencia. Seis `no-explicit-any` en APIs/helpers meetings, dos `set-state-in-effect` en RSVP y una `exhaustive-deps`. No se aplicó `--fix` |
| Build / browser / RLS / E2E | No ejecutados; no se reconstruyó el proyecto ni se ejercieron flujos que envían mensajes |

La deuda dominante no es estética: contratos inconsistentes, autorización duplicada, persistencia local, datos estáticos sensibles, tipado desalineado y operación no reproducible. Véase [brechas](08-gap-analysis.md).

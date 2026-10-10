# MV-F3-02R — PostgreSQL Runtime Verification

Fecha: 2026-10-03. Orden: verificación controlada, sin recuperación de infraestructura.

## 1. Executive Result

**MV-G3-02 = PARTIAL / BLOCKED BY RUNTIME.**

No se encontró un PostgreSQL activo cuya identidad, carácter desechable y aislamiento pudieran demostrarse. No se inició Docker ni WSL, no se creó una base y no se ejecutó SQL. Las comprobaciones estáticas y de aplicación aprobaron, pero no sustituyen la evidencia de catálogo, RLS, FK y ACL en PostgreSQL.

## 2. Runtime Identity

La consulta de WSL dentro del sandbox mostró una vista sin distribuciones y la consulta de listeners devolvió acceso denegado. Se repitieron exclusivamente consultas de lectura fuera del sandbox, con autorización, sin solicitar elevación administrativa.

La consulta en el host mostró `docker-desktop`, estado `Stopped`, versión de distribución WSL `2`. No se observaron procesos `Docker Desktop`, `com.docker.backend` o `postgres`. `psql` y `postgres` no fueron resolubles mediante `Get-Command`; esto no demuestra su ausencia absoluta del equipo.

Se comprobó la existencia de:

- `C:\Users\juans\AppData\Local\Programs\DockerDesktop\Docker Desktop.exe`
- `C:\Users\juans\AppData\Local\Programs\DockerDesktop\resources\bin\docker.exe`
- `C:\Users\juans\AppData\Local\ConectaLab\tooling\node_modules\.bin\supabase.cmd`

La existencia de ejecutables no acredita un motor o una base disponibles. No se ejecutaron comandos Supabase ni se recuperó Docker.

## 3. Isolation Evidence

La enumeración de listeners del host no mostró `5432` ni puertos `55430–55449`. Los listeners de otras aplicaciones no fueron atribuidos al laboratorio.

| Condición previa a SQL | Resultado |
|---|---|
| LAB_IDENTITY VERIFIED | No demostrada para una base activa |
| DISPOSABLE YES | No demostrado |
| PRODUCTION NO | No establecido para un destino de conexión; no hubo conexión |
| REAL_DATA NO | No verificado mediante catálogo |
| REMOTE_CONECTA NO | No se accedió a infraestructura remota |
| Loopback 127.0.0.1 / ::1 | No verificable para PostgreSQL: sin listener del laboratorio |

Se detuvo la ruta de ejecución SQL antes de crear fixtures o conceder permisos.

## 4. Versions

- PostgreSQL: no observado; ninguna conexión ni consulta de versión.
- Distribución `docker-desktop`: WSL 2, detenida, verificada en el host.
- Docker Desktop: instalación presente. La consulta de `VersionInfo` no entregó una versión; no se presenta la versión histórica como una comprobación nueva.
- Supabase CLI: binario local presente; no ejecutado en esta orden. El antecedente aprobado es 2.117.0.
- Build de aplicación: Next.js 16.2.6, informado por el build ejecutado.

## 5. Canonical Application

| Elemento | Resultado en esta intervención |
|---|---|
| B0 | NOT EXECUTED |
| B1 | NOT EXECUTED |
| B2 | NOT EXECUTED |
| B3 | NOT EXECUTED |
| 0005 | NOT EXECUTED |
| 0006 | NOT EXECUTED |

No hubo aplicación parcial ni error SQL: el bloqueo ocurrió antes de disponer de runtime seguro. No se copiaron candidatos ni se modificaron migraciones.

## 6. 0005 Runtime Result

No ejecutada. No se acreditan mediante PostgreSQL las 13 tablas del core ni sus restricciones. Los tests del modelo son evidencia estática exclusivamente.

## 7. 0006 Runtime Result

No ejecutada. La creación efectiva de restricciones compuestas, políticas y revocaciones permanece sin verificar en runtime.

## 8. Catalog Evidence

No se consultó el catálogo. Tablas, PK, UNIQUE, FK, CHECK, RLS y políticas observadas: **NOT OBSERVED**, no cero objetos. No se infiere el contenido de los discos o de LAB-1 a partir del estado detenido de Docker.

## 9. Structural Tests

Comando ejecutado:

```text
node --test tests/memory-core-schema.test.mjs tests/memory-tenant-schema.test.mjs tests/agent-context.test.mjs tests/institutional-profile.test.mjs
```

Resultado: exit 0, **29 aprobados / 0 fallidos**: 10 core, 8 tenant, 7 agent-context y 4 institutional-profile.

`npm run lint`: exit 0, sin errores reportados.

`npm run build`: exit 0. Compilación, TypeScript y generación de 14 páginas completados. No se inició un servidor de desarrollo ni se publicó la aplicación.

## 10. Tenant A/B Fixtures

No creados. La suite `supabase/canonical/tests/memory-tenant.runtime.sql` permanece preparada y sin ejecutar. Fixtures creados por esta orden: 0. Fixtures preexistentes en bases: no observados.

## 11. RLS Results

Cross-tenant SELECT, INSERT y UPDATE: NOT EXECUTED. Casos de perfil inactivo, empresa inactiva y sesión ausente: NOT EXECUTED. No se atribuye eficacia runtime a políticas por superar tests de texto.

## 12. Composite FK Results

Cross-tenant FK: NOT EXECUTED. Tampoco se comprobaron en PostgreSQL SQLSTATE, nulabilidad, restricciones de pertenencia ni protección ante roles privilegiados.

## 13. ACL Results

ACL efectivas no observadas. No se concedieron permisos diagnósticos ni funcionales. La comprobación de denegación por ACL debe distinguirse de la comprobación de RLS cuando exista un runtime autorizado.

## 14. Privileged Role Results

Privileged bypass: NOT EXECUTED. No se usaron credenciales ni sesiones privilegiadas. La suite pendiente separa el bypass de RLS de la integridad impuesta por FK; ninguna de ambas fue demostrada aquí.

## 15. Rollback Verification

No se abrió una transacción SQL. Diagnostic grants rolled back: NOT APPLICABLE, porque no se concedieron grants. No se puede presentar un rollback como exitoso sin haberlo ejecutado.

Mutaciones de base fuera del laboratorio: 0 realizadas por esta orden. Mutaciones remotas: 0 realizadas. No se ejecutaron seeds, migraciones, generación de tipos ni consultas de datos.

## 16. Residual Risks

- Falta demostrar la aplicación desde cero y el catálogo real de 0005/0006.
- Falta demostrar RLS A/B, restricciones compuestas, ACL y rollback real.
- Recuperar Docker puede reactivar recursos persistentes de LAB-1. Esta orden no autoriza esa recuperación ni certifica su estado interno.
- El antecedente de publicación externa exige comprobar bindings efectivos antes de conectar al laboratorio; una política de red estática no basta.
- Tests y build correctos no cierran el gate de base de datos.

Siguiente autorización necesaria: un gate independiente para recuperar y contener el runtime local, preservar los recursos existentes y demostrar una base desechable con publicación loopback. Solo después podrá reanudarse esta verificación. No se ejecutó ninguna de estas acciones.

## 17. MV-G3-02 Final Evidence Matrix

| Evidencia | Estado |
|---|---|
| Tests estáticos y de aplicación | PASS: 29/29 |
| Lint | PASS: exit 0 |
| Build | PASS: exit 0 |
| Runtime available | NO: no PostgreSQL activo identificado |
| Runtime isolated | NOT VERIFIED |
| Loopback verified | NOT VERIFIED para PostgreSQL |
| PostgreSQL version | NOT OBSERVED |
| B0 / B1 / B2 / B3 / 0005 / 0006 | NOT EXECUTED |
| Core tables / PK / UNIQUE / FK / CHECK observed | NOT OBSERVED |
| RLS / Policies observed | NOT OBSERVED |
| Cross-tenant SELECT / INSERT / UPDATE / FK | NOT EXECUTED |
| Inactive profile / company / missing session | NOT EXECUTED |
| Privileged bypass | NOT EXECUTED |
| Diagnostic grants rolled back | NOT APPLICABLE; no grants |
| Fixtures remaining | 0 creados aquí; preexistentes no observados |
| Database mutations outside lab | 0 realizadas |
| Remote mutations | 0 realizadas |
| MV-G3-02 FINAL | PARTIAL / BLOCKED BY RUNTIME |

## 18. Scope Closure

Initial branch: `main` (`main...origin/main`). Initial HEAD: `70cbb5322c9b9920bf5bd97dc0865b2aa1dc325f`.

Final HEAD comprobado: `70cbb5322c9b9920bf5bd97dc0865b2aa1dc325f`. No commit, push, deploy ni cambio de rama.

Estado inicial preexistente: 10 archivos registrados modificados y 18 entradas no registradas en `git status -sb`, incluidas las migraciones 0005/0006, la suite runtime y los tests/documentación de fases anteriores. Ese trabajo no se atribuye a esta verificación.

Files created: únicamente `docs/mv-f3-02r-runtime-verification.md`. Files modified: ningún archivo fuente, SQL ni configuración preexistente. El build produce sus artefactos locales normales, sin constituir implementación adicional.

El estado Git final conserva las 10 modificaciones y las 18 entradas no registradas preexistentes; la única entrada adicional es este informe. Los tres hashes SHA-256 finales coinciden exactamente con los iniciales:

| Archivo | SHA-256 |
|---|---|
| `supabase/canonical/migrations/0005_conecta_memory_core.sql` | `7152166ED0E3AD3EC97B4175470AC3A6457A09543E54EA50D52A63C971C06BB4` |
| `supabase/canonical/migrations/0006_conecta_memory_tenant_integrity_rls.sql` | `67482ADB22C1DB6F84DD71821C27E2690BF2638B0C3661B486592B3957D9BB5A` |
| `supabase/canonical/tests/memory-tenant.runtime.sql` | `E18F4A6149D2BE00C0AC84BACEF4FB0AABE3AF3C7F582F27EA46DAC69F22A23B` |

**STOP. No avanzar a MV-F3-03 ni recuperar infraestructura bajo esta orden.**

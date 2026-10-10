# INT-V1-01 — Integración institucional incremental

Fecha: 9 de octubre de 2026. Entorno local. Baseline: `main...origin/main`, HEAD `e48b7101ef669d2c951846c659fbc5bb707198e8`, con cambios tracked y untracked preexistentes preservados. Esta integración no habilita permisos ni declara la plataforma lista para producción.

## Relaciones completadas en aplicación

- Mapa Vivo, Convocatorias, Memoria Viva y Mi Agente comparten `InstitutionalConnections`, una superficie de navegación hacia las rutas y anclas existentes. No crea registros, eventos, actas ni vínculos de recursos por navegar.
- La navegación principal incorpora Convocatorias y Mi Agente. La API `meeting_events`, tokens, RSVP y acciones de convocatoria se conservan sin cambios.
- El resolver de Mi Agente lee `positions.external_key`, columna ya utilizada por Mapa Vivo. Sigue resolviendo el cargo por UUID y empresa desde la sesión; no modifica identidad, autenticación o autorización.
- El enriquecimiento exige que `user.position_id === role.id` y selecciona exactamente una plantilla por `external_key`. Un identificador desconocido o vacío no recibe un perfil por nombre. El UUID del cargo y los permisos originales se conservan; el ID del catálogo continúa dentro del perfil institucional como referencia documental.
- GPY-001 y Cargo Cero reutilizan el contrato y componente institucional existentes. El catálogo funcional, controles, resultados y cartera PYMES se preservan.
- El panel Nivelar del mapa identifica explícitamente sus constantes como demostración y reemplaza el conteo ambiguo «Vinculados» por «Listos en el piloto». No consulta ni atribuye registros live a tarjetas gerenciales.

## Fuentes y límites

| Módulo | Fuente actual | Integración segura | Dependencia pendiente |
|---|---|---|---|
| Cargos / perfiles | Catálogo local y perfil de sesión | Lectura y correspondencia explícita por clave externa | Publicación y versionado institucional de cada fuente |
| Convocatorias | Servicio y API existentes sobre meeting_events | Navegación desde otros módulos | RSVP no acredita asistencia ni acta |
| Memoria Viva | Datos demostrativos en memoria React | Navegación y exposición del estado real | 0005/0006 no ejecutadas; gates runtime, lifecycle y autorización por recurso |
| Compromisos | Ejemplos de Memoria Viva y seguimiento local existente | Acceso a las superficies actuales | Persistencia, atribución histórica y ejecución requieren los gates correspondientes |
| Informes / dashboard | localStorage del mapa | Referencias de lectura y seguimiento local | No vincular IDs locales a actas; lectura/escritura compartida por recurso sin validar |
| Evidencias | Referencias locales y requisitos documentales | Lectura, sin producción ficticia | D8: Storage bloqueado; no uploads ni URLs firmadas |
| Nivelar | Endpoints reales existentes y piloto UI independiente | Contexto doctrinal y procedencia explícita | Matching persona/cargo, alcance y contrato de procedencia de NIV-CON-01 |
| Mi Agente | Contexto de sesión y plantilla institucional correspondiente | Lectura de fuentes del cargo asignado | Sin LLM, herramientas ejecutables, RAG ni observaciones Nivelar autorizadas |

## Preservación de D1–D8

`meeting_events` conserva la raíz. Navegar a Memoria Viva no genera actas ni revisiones. No se deriva autoridad de cargo, RACI, perfil institucional o privilegio técnico. La lectura por recurso, la segregación AUTHOR != APPROVER y el lifecycle no se sustituyen por enlaces de UI. No se cierra un compromiso por cerrar un acta. No se inventan identidad de proceso, asistencia, quórum, responsabilidad personal ni evidencia validada. No se ejecutan 0005/0006 ni se habilitan escrituras sobre sus tablas.

## Validación y siguiente revisión

La verificación técnica comprende tests de correspondencia exacta y rechazo de identidades inconsistentes, navegación a rutas/anclas existentes, conservación institucional y tests estáticos de los contratos Memoria Viva, además de lint y build. Los tests de SQL son estáticos, no pruebas de PostgreSQL.

La revisión de rutas sin sesión no acredita flujos autenticados ni lectura remota por recurso. La revisión visual y los flujos con una sesión legítima deben quedar identificados por separado en la entrega. No se usaron credenciales personales ni se crearon convocatorias o registros para probar este incremento.

Resultados: 36/36 tests PASS, lint exit 0, build exit 0 y git diff --check exit 0. En localhost: /memoria-viva y /convocatorias responden 200 con el recorrido compartido; /mapa-vivo y /mapa-vivo/mi-agente responden 200 con la superficie de acceso sin sesión; /api/agent/context responde 401 sin sesión. No se ejercitaron acciones de escritura. El navegador integrado agotó el tiempo de espera en dos intentos: no hay validación visual ni captura de pantalla de este incremento. Los errores de resolución de ruta de Next.js dentro del sandbox Windows se superaron ejecutando build y servidor fuera de ese aislamiento, sin modificar configuración del proyecto.

Siguiente revisión propuesta: validar con el Director el recorrido entre módulos y la correspondencia UUID/external_key con una sesión legítima. Mantener separadas las autorizaciones posteriores de persistencia de Memoria Viva, informes compartidos y matching Nivelar. No commit, push, deploy ni modificaciones remotas.

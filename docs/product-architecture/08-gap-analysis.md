# Gap analysis

Las prioridades son puertas de producto, no un cronograma. Esfuerzo relativo: **S** cambio acotado en una capa; **M** varias piezas de un módulo y pruebas; **L** varios módulos/datos con migración; **XL** capacidad transversal con operación y adopción. No representan días ni compromisos comerciales. Responsables son funciones sugeridas, no personas asignadas.

## Críticas antes del piloto externo

| ID | Brecha y evidencia | Impacto / riesgo | Dependencias | Esfuerzo | Criterio de cierre |
| --- | --- | --- | --- | --- | --- |
| G-01 | Baseline no reproducible y drift SQL/tipos/remoto; [01](01-system-inventory.md), [histórico](../audits/agent-context-supabase-20260916.md) | Alta nueva diverge; política insegura reaparece; rollback incierto | Inventario actual de metadata sin PII y decisión de fuente de verdad | L | Baseline probado desde cero en entorno aislado, equivalente a objetivo aprobado; tipos derivados coherentes |
| G-02 | Catálogo sensible en bundle y fotografías públicas; SEC-01/02 | Exposición intra/intercliente pese a UI | Clasificación de datos, G-01 | M | DTO por permiso y bundle/demo sin datos privados; verificación sin sesión y lector |
| G-03 | RLS de revisiones, roles amplios, autoría/FK de tenant; SEC-02/03/04/12 | Alteración ajena, acceso laboral excesivo y suspensión incompleta | Matriz de permisos producto, G-01 | L | Pruebas CRUD/IDOR con dos tenants, todos los roles, perfil/tenant inactivos |
| G-04 | Informes y revisiones locales; [OrgExperience](../../src/components/OrgExperience.tsx) | Pérdida, mezcla de sesiones, sin registro compartido ni auditoría | G-03; contrato de informe/estados | L | Crear→enviar→revisar visible en otro dispositivo, actor y tenant correctos, transacción y deduplicación |
| G-05 | Evidencias sin bytes y Storage histórico amplio; SEC-05 | Pérdida o lectura/borrado ajeno | G-03/04; políticas de archivos | L | Subida/descarga/reemplazo/borrado autorizados, trazabilidad y recuperación; o módulo deshabilitado explícitamente en piloto |
| G-06 | Rocket.Chat global y payload no autorizado; SEC-07 | Avisos falsos, datos al canal de otro cliente | G-03/04; configuración de conexión | M | Evento persistido autorizado, destino tenant, sin excepción local ni secretos en errores; o integración deshabilitada |
| G-07 | RSVP sin antiabuso, entrada débil, identidad declarada; SEC-08/09/13 | Spam, suplantación, 500 evitables y contrato Auth ambiguo | Definir RSVP anónimo/identificado y política de invitación | M | Límites, idempotencia, revocación, validación; pruebas cookies/Bearer; o no habilitar módulo |
| G-08 | Marca/catálogos cliente fijos y falta alta segura; [05](05-multitenancy-readiness.md) | Mostrar datos A&C al piloto; alta manual irrepetible | Definición tenant vs compañía legal; G-02/03 | L | Organización piloto sintética y luego real creadas por procedimiento auditado, contenido propio, roles mínimos, sin editar código por registro |
| G-09 | Solo 7 unitarias simuladas; sin RLS/E2E/CI; lint falla | No detectar regresiones de aislamiento | G-01/03/04 | L | Suite negativa positiva de tenant/rol y flujo principal, lint/tipos/unitarias verdes, checks bloqueantes |
| G-10 | Recuperación, auditoría y observabilidad no acreditadas; SEC-11 | Incidentes sin diagnóstico ni recuperación demostrable | Alcance piloto, SLO/RPO/RTO, G-04 | L | Log durable mínimo, monitoreo, responsable de incidentes, restauración aislada y rollback ensayados |
| G-11 | Secrets/config remota y activación no revalidados | Uso de redirects errados, destinatarios de prueba, permisos imprevistos | Acceso de lectura a configuración, inventario sin valores secretos | M | Checklist de ambiente verificable, redirects probados, conexiones separadas, límites y rotación definidos |

Un módulo excluido debe estar realmente deshabilitado y fuera de la oferta del piloto. No basta esconder un botón si la Data API o el endpoint siguen habilitados. G-02/03 y el aislamiento no se difieren por aceptar un piloto pequeño.

## Necesarias para salida comercial

| ID | Brecha y evidencia AS-IS | Impacto / riesgo | Dependencias | Esfuerzo | Criterio de cierre |
| --- | --- | --- | --- | --- | --- |
| G-12 | Cuenta limitada a company única, invitaciones no modeladas; [schema:72–84](../../supabase/schema.sql) | No soportar consultores/múltiples organizaciones ni revocación granular | G-03/08 y decisión de membresías | L | Cuenta con dos membresías, cambio tenant, invitación uso único, revocación y auditoría. Adelantar al piloto si lo requiere |
| G-13 | Configuración/branding/versiones sin módulo; [01](01-system-inventory.md) | Cada cliente exige fork/deploy y errores operativos | G-08/12 | L | Alta repetible, configuración validada y publicada por tenant, demo sintética y defaults |
| G-14 | Entitlements, contrato, cuotas y medición ausentes | No controlar oferta, consumo y soporte | Tenant definido y G-10 | M | Plan contractual trazable, módulos/cuotas aplicados servidor y contadores auditables; cobro manual aceptable al inicio |
| G-15 | Exportación/baja/retención sin workflow; [05](05-multitenancy-readiness.md) | No cumplir promesas de portabilidad o eliminación | Inventario de datos/objetos/terceros, política contractual | L | Export con manifiesto, baja verificable y política explícita de copias/backups |
| G-16 | Notificación sin outbox/reintentos/preferencias; [rocket-chat](../../src/lib/conecta/rocket-chat.ts) | Pérdida o duplicación de avisos; operación manual | G-04/06/10 | M | Outbox, idempotencia, reintentos, cola de fallos y métricas; adelantar al piloto si avisos son parte del flujo comprometido |
| G-17 | Catálogo de permisos duplicado, componentes grandes, tipos incompletos | Cambios caros, autorización diverge | G-01/03/04 | L | Servicios/contratos compartidos, tipos alineados, separación de módulos y criterios de lint cumplidos |
| G-18 | Operación de soporte, seguridad de dependencias y release no formalizadas | Clientes sin SLA operativo, regresiones y accesos de soporte excesivos | G-09/10/11 | M | Proceso release/rollback, secret scan y dependencias, accesos soporte auditados, responsabilidades y runbooks |

## Posteriores al piloto

| ID | Brecha y evidencia | Impacto / riesgo | Dependencias | Esfuerzo | Criterio de cierre |
| --- | --- | --- | --- | --- | --- |
| G-19 | Actas/compromisos/decisiones son textos, sin entidades; [03](03-functional-map.md) | Seguimiento no estructurado | G-04/07 y validación de usuarios | L | Responsable, fecha, estado, vínculos y eventos auditables; mover antes si están en alcance contractual |
| G-20 | KPI/alertas derivados sin mediciones versionadas | No análisis histórico confiable | Informes persistidos y definiciones de negocio | L | Métrica con definición/fuente/periodo, cálculo reproducible, alertas deduplicadas |
| G-21 | Nivelar preparado, sin sync real; SEC-10 | Señales de desempeño no verificables; tratamiento laboral sensible | Acuerdo proveedor/finalidad, permisos, conexión tenant, G-10/16 | L | Sync idempotente acotado, metadatos de origen, errores redactados y prueba de acceso; deshabilitado hasta entonces |
| G-22 | Conversación del agente sin servicio; [AgentConversation](../../src/components/agent/AgentConversation.tsx) | No asistencia real pese a expectativa de capacidad | G-02/03, contenido publicado, proveedor/costes/retención | M | Conversación de lectura trazable, sin herramientas implícitas, fuentes/limitaciones claras y métricas |

## Evolución futura

| ID | Brecha / punto de partida | Impacto / riesgo | Dependencias | Esfuerzo | Criterio de cierre |
| --- | --- | --- | --- | --- | --- |
| G-23 | RAG, herramientas y memoria de agente proyectados | Amplificación de fugas y acciones indebidas si se anticipan | G-05/10/22, ACL documental y evaluaciones | XL | Retrieval filtrado, pruebas de inyección/aislamiento, acción confirmada/autorizada/auditada y presupuesto |
| G-24 | Autoservicio comercial, cobro automático, SSO/SCIM no implementados | Complejidad sin demanda validada | G-12/14/18 y requisitos reales del mercado | L | Requisitos medidos, contratos de proveedor y pruebas de lifecycle |
| G-25 | Escalamiento avanzado/regiones o servicios separados sin evidencia de necesidad | Coste y fragmentación prematura | SLO/telemetría y mediciones de carga | XL | Cuello de botella demostrado, decisión coste/beneficio y prueba de capacidad/recuperación |

## Camino crítico

Reconciliación G-01 → permisos/integridad G-03 → persistencia G-04 → aislamiento y alta G-08 → validación G-09 → operación G-10 → salida controlada. G-02 y G-11 acompañan desde el inicio. El piloto no puede cerrar si quedan incógnitas sobre separación de datos; sí puede recortar capacidades futuras con deshabilitación verificable y acuerdo de alcance.

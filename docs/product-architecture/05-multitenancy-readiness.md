# Preparación multiempresa

**Resultado: preparación parcial a nivel de columnas, insuficiente como frontera de producto y operación.** Una segunda fila en `companies` no produce un segundo cliente aislado. El modelo de cuenta, los catálogos, los archivos, las integraciones y la configuración siguen restringiendo esa promesa.

| Dimensión | Evidencia actual | Riesgo o límite | Condición de cierre |
| --- | --- | --- | --- |
| Identificador tenant | `company_id` en núcleo/meetings/Nivelar; no `tenant_id`/`organization_id` encontrados | Nombre distinto no es problema; uso no uniforme sí | Adoptar semántica contractual única; tenant obligatorio o derivación inequívoca en cada recurso |
| Aislamiento de filas | RLS por company, excepciones por asignación, review INSERT solo por rol | Acceso horizontal y escrituras cruzadas potenciales | Matriz dos tenants, todos los roles y CRUD; grants mínimos y policies completas |
| Integridad entre tablas | FK simples en [schema](../../supabase/schema.sql) | Company de fila y company de referencias pueden diferir | FK compuestas/controles equivalentes más autorización de recurso |
| Membresía | `user_profiles.auth_user_id` único global, company único por perfil | Una cuenta no participa en varias organizaciones | Separar identidad global, persona del tenant y membresías; selección de tenant validada |
| Múltiples cargos | `user_position_assignments`, tipo/fechas/principalidad | Lecturas activas sin fechas; agente solo cargo principal; no unique principal | Asignaciones vigentes; contexto de cargo explícito y autorizado; política de delegación |
| Invitaciones | Login/reset; documentación de preparación manual Pymes | Sin lifecycle SaaS de invitación/aceptación/revocación | Invitación expirable, uso único, tenant y rol fijados por servidor, auditoría |
| Configuración | Marca, textos y catálogos en código/JSON | Alta cliente exige editar y desplegar | Configuración persistida con defaults, validación, publicación y versiones |
| Branding | `public/brand`, componentes landing/navegación | Marca A&C acoplada al producto | Theme/logo tenant; dominios y permisos de administración definidos |
| Contenido organizacional | Catálogo importado por cliente, 54 nodos | Datos de una empresa enviados independientemente del tenant de sesión | Fuente BD autoritativa y DTO mínimo según permiso; demo sintética separada |
| Informes | localStorage global sin tenant/usuario | Mezcla entre sesiones y ausencia de durabilidad compartida | BD transaccional, idempotencia, historial y eliminación de datos locales tras transición aprobada |
| Almacenamiento | UI guarda nombres; SQL de evidencia; Storage histórico sin tenant | Bucket privado no aísla clientes | Objeto ligado a tenant/informe, RLS, URL temporal autorizada, límites/escaneo y retención |
| Auditoría | Sin audit log general en [inventario](01-system-inventory.md) | Imposible reconstruir confiablemente quién cambió qué | Log append-only con tenant, actor, acción, recurso, resultado, correlación y redacción |
| Integraciones | Webhooks y token Nivelar globales | Mensajes o datos de cliente externo podrían ir al destino interno | Conexión por tenant y proveedor, credencial referenciada, scopes, desactivación y trazabilidad |
| Secretos por organización | Env de proceso; sin almacén/modelo tenant | No onboarding, rotación ni revocación aislados | Secret manager; referencias sin material secreto en cliente/tablas públicas/logs |
| Suspensión | Company status existe; helpers SQL solo perfil activo | Suspender empresa no niega uniformemente operaciones | Tenant activo en autorización/RLS y jobs; proceso explícito de revocación |
| Exportación | Impresión visual y formulario; sin export tenant | No portabilidad integral | Exportación consistente de recursos/archivos con manifiesto, autorización y auditoría |
| Eliminación | Cascadas parciales SQL | No cubre Auth, Storage, mensajes externos, datos locales o backups | Flujo de baja con retención aprobada, inventario de copias, verificación y auditoría |
| Operación/billing | Sin planes, entitlements ni consumo | No límites por cliente ni gestión comercial | Plan/entitlement separado de rol; cuotas por tenant y ciclo contractual |

Referencias específicas: [schema:38–171,195–338](../../supabase/schema.sql); [asignaciones de lectura](../../supabase/migrations/20260813_responsible_assignment_read_policies.sql); [resolver agente](../../src/lib/conecta/agent/context.ts); [OrgExperience](../../src/components/OrgExperience.tsx); [webhooks](../../src/lib/conecta/rocket-chat.ts); [Nivelar](../../src/lib/conecta/nivelar.ts); [Storage histórico:122–135](../audits/agent-context-supabase-20260916.md).

## Qué significa una organización

Propuesta a confirmar: un tenant es el cliente contratante y propietario de los datos. Puede tener unidades, compañías legales y clientes atendidos. `business_unit` y la cartera Pymes no deben utilizarse como frontera de aislamiento ni convertirse automáticamente en organizaciones. Mantener `company_id` puede ser viable si se redefine inequívocamente como tenant; añadir otro UUID sin reglas tampoco corrige aislamiento.

Personas pertenecen al contexto laboral de una organización; cuentas Auth son identidades globales; membresías vinculan cuenta y tenant; asignaciones vinculan persona/membresía a cargo/frente durante una vigencia. Un usuario sin cuenta puede figurar como persona organizacional sin adquirir acceso.

## Alternativas de operación para el piloto

| Alternativa | Beneficio | Coste y límite |
| --- | --- | --- |
| BD compartida con tenant/RLS | Menos duplicación y camino SaaS directo | Exige cerrar y probar todas las fronteras antes de datos externos |
| Proyecto Supabase y despliegue dedicado al piloto | Reduce alcance de un fallo entre clientes durante transición | Duplica configuración, releases y recuperación; no corrige datos estáticos, permisos dentro del cliente ni persistencia local |

Recomendación: diseñar el producto para tenant explícito compartido; considerar entorno dedicado de piloto solo si lo exige el contrato o la transición de aislamiento. No presentarlo como solución automática a las brechas. Decisión condicionada a sensibilidad, volumen, residencia y soporte, todavía desconocidos.

## Pruebas mínimas de aceptación

Preparar datos sintéticos A/B y usuarios lector/responsable/líder en cada tenant; una cuenta con dos membresías; un perfil inactivo y tenant suspendido. Probar acceso vía UI, Route Handlers, Data API y Storage. Negar IDs del otro tenant, reasignación de FK, modificación de autor, revisión ajena, descarga/borrado ajeno, token vencido y selección de tenant sin membresía. Verificar invitación repetida, cambio de tenant en la misma sesión/navegador, contexto del agente, colas y destinos de notificación. Ninguna prueba debe usar service role para simular permisos de usuario.

Estas pruebas se proponen para un entorno aislado, no se ejecutaron contra datos reales. Criterios y dependencias: [roadmap](09-pilot-readiness-roadmap.md).

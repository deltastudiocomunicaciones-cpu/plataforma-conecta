# Preguntas abiertas y decisiones pendientes

Estas preguntas no bloquearon la auditoría documental. Sí condicionan la implementación y la oferta comercial. Las respuestas deben adjuntar evidencia o decisión, no credenciales ni datos personales.

## Decisiones de producto y dominio

| Pregunta | Responsable sugerido | Qué bloquea / supuesto provisional |
| --- | --- | --- |
| ¿El contratante es una organización, un grupo de compañías legales o cada compañía por separado? | Producto + cliente piloto | Frontera tenant. Propuesta provisional: contratante es tenant, compañías/unidades y clientes atendidos son entidades subordinadas |
| ¿Qué módulos se prometen exactamente al piloto? ¿Informes/evidencias/revisiones son obligatorios? | Producto + patrocinador cliente | Gate de persistencia y archivos. Se asume gestión de informes como núcleo; no se promete Nivelar ni LLM activo |
| ¿Una persona/cuenta puede pertenecer a varios tenants y con cargos simultáneos? | Producto + responsables organizacionales | Membresías y contexto. AS-IS admite múltiples asignaciones dentro de company, no múltiples perfiles por cuenta |
| ¿Gerencia ve subárbol, área, frente, clientes asignados o toda empresa? ¿Qué puede cultura? | Producto + seguridad + cliente | Política por recurso y reconciliación de matrices UI/SQL |
| ¿Quién ve documentos, teléfonos, datos de desempeño y requerimientos RSVP? | Responsable de datos + cliente | DTO, tablas sensibles, Storage y minimización |
| ¿Cargo, ocupante y ficha funcional requieren versiones/aprobación y vigencia? | Producto + gestión organizacional | Fuente autoritativa e historial; evitar confundir persona con cargo |
| ¿Los informes locales son datos de prueba o registros que deben preservarse? | Producto + usuarios responsables | Migración/importación; no borrar ni copiar automáticamente desde navegadores |
| ¿RSVP prueba identidad o solo intención de un poseedor de enlace? ¿Puede editar su respuesta? | Cliente + producto | Invitados, deduplicación y política de autenticación |
| ¿Cuál es el estado permitido de un informe y quién puede cambiarlo? | Producto + líderes operativos | Máquina de estados; reconciliar `ajuste` UI con `ajuste_solicitado` SQL |
| ¿Se requieren actas, compromisos, indicadores medidos y decisiones para cerrar el piloto? | Producto | Adelantar G-19/20 si son parte contractual; hoy no son dominios completos |

## Verificación técnica pendiente

| Pregunta / evidencia necesaria | Responsable sugerido | Método seguro propuesto |
| --- | --- | --- |
| ¿Qué proyecto/ambiente corresponde a producción y qué release está desplegado? | Operación | Identificar sin publicar IDs privados; contrastar metadata de release/commit, no inferir desde rama local |
| ¿Siguen vigentes las 21 políticas/11 tablas y el bucket descritos el 16/09? | Administrador Supabase + seguridad | SELECT de metadata y grants; políticas completas; sin filas personales ni secretos. Revalidar Storage y esquema/migraciones |
| ¿Existen cambios remotos fuera de SQL versionado? | Datos + desarrollo | Comparación de estructura, funciones, índices, constraints, triggers y grants contra baseline propuesto |
| ¿Site URL, redirects de recuperación/aceptación y plantillas Auth ya son correctos? | Operación | Inspección de configuración sin claves y prueba con destinatarios de ensayo autorizados; antecedente en guía Pymes |
| ¿Hay rate limiting, WAF, headers o logs configurados fuera del repositorio? | Operación + seguridad | Revisar configuración de plataforma y registrar alcance/limitaciones sin presumir cobertura |
| ¿Backups cubren DB, objetos y configuración? ¿Última restauración probada? | Operación | Evidencia de política/retención y simulacro aislado; acordar RPO/RTO, no inventarlos |
| ¿Repositorio y previews son privados? ¿Hubo secretos o PII publicados históricamente? | Propietario GitHub + seguridad | Revisar visibilidad/accesos e historia con secret scan que reporte ubicaciones, no valores; tratar rotación aparte |
| ¿Qué consumidores externos necesitan Bearer sin cookies? | Desarrollo + integraciones | Especificar contrato y probar identidades discrepantes sin tocar cuentas reales |
| ¿Qué propósito y aprobación tienen las fotos y datos personales del catálogo? | Responsable de datos | Inventario de categorías y clasificación; no reproducir sus valores en informes |

## Integraciones, agente y comercialización

| Pregunta | Responsable sugerido | Decisión necesaria |
| --- | --- | --- |
| ¿Cada tenant aporta Rocket.Chat/Nivelar propios o se ofrece servicio compartido? | Producto + integraciones | Conexiones, secretos, aislamiento, límites y offboarding |
| ¿Nivelar soporta credencial fuera de URL, filtros por empresa/empleado y límites de API? | Responsable proveedor + backend | Contrato técnico verificado antes de implementar sync; no asumir comportamiento desde adaptador |
| ¿Qué métricas laborales se necesitan, con qué finalidad y retención? | Cliente + responsable de datos | Minimización, scopes, titulares/líderes autorizados y tratamiento de payload original |
| ¿Proveedor/modelo del agente, región, retención, coste y acciones permitidas? | Producto + seguridad + operaciones | Comenzar lectura; retrieval/herramientas tienen puertas separadas. No hay integración LLM elegida en código |
| ¿Es aceptable un piloto dedicado o se exige aislamiento compartido desde el comienzo? | Arquitectura + cliente | Decisión documentada con coste operativo, datos y contrato; no sustituye corregir fallos internos |
| ¿Cuántos usuarios, organizaciones, archivos, reportes y picos se esperan? | Producto + cliente | Capacidad y cuotas; no dimensionar con cifras inventadas |
| ¿Qué soporte, disponibilidad, RPO/RTO y mecanismo de salida se ofrecen? | Operación + comercial | SLO y recuperación probados; exportación, eliminación y responsabilidades |
| ¿Facturación manual inicial o cobro automático? ¿Unidad de precio/consumo? | Comercial + producto | Entitlements y medición primero; no seleccionar proveedor de pagos sin requisito |
| ¿Quién aprueba cambios de autorización y quién autoriza la salida? | Propietario de producto + seguridad | Matriz de responsabilidades y gates claros; administrador tenant no equivale a operador plataforma |

## Evidencia histórica que necesita actualización

[Auditoría Supabase 16/09](../audits/agent-context-supabase-20260916.md), [arquitectura contextual](../agent-context-architecture.md), [guía Pymes](../guia-presentacion-pymes.md) y [primera prueba 17/09](../primera-prueba-pymes-20260917.md) ayudan a reconstruir antecedentes. Sus afirmaciones de despliegue/configuración no se convierten en observaciones nuevas por citarlas. Deben contrastarse antes de ejecutar una migración o prometer readiness.

## Alcance de una siguiente autorización

La auditoría y estos once documentos están terminados sin cambios productivos. Una continuación puede autorizar, por ejemplo, la fase de estabilización y pruebas en entorno aislado con un alcance definido. Corregir RLS, migrar datos, enviar invitaciones, conectar un proveedor, publicar o desplegar son acciones posteriores: este plano no las ejecuta ni las da por aprobadas.

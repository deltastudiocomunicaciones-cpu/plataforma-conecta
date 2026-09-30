# Primera integración del agente — preparación del contexto

Estado: contexto implementado; proveedor de generación pendiente. No se ha ejecutado una consulta real de IA.

## Implementado

- Resolver compartido por la página privada y GET `/api/agent/context`.
- Identidad obtenida por `auth.getUser()`, perfil activo y empresa activa.
- Consulta del cargo limitada por `position_id` y `company_id` del perfil autenticado.
- Sin clave administrativa, sin credenciales del proveedor, sin fallback al JSON organizacional.
- Estados: `unauthenticated` (401), `forbidden` (403), `missing_position`, `incomplete_position`, `ready` y `unavailable` (503).
- Respuestas con `Cache-Control: private, no-store`. El contexto no incluye correo, teléfono ni documento de identidad.
- `ready` significa solamente propósito y responsabilidades presentes; no acredita que estén actualizados ni que el agente esté conectado.

## Validación

`node --test tests/agent-context.test.mjs`: siete pruebas del resolver con cliente simulado. Verifican rechazo sin sesión, empresa inaccesible/inactiva, filtros por identidad y cargo, columnas mínimas, ficha incompleta y errores de consulta. No sustituyen las pruebas RLS con sesiones reales.

## Pendientes para una consulta real

1. Elegir proveedor, modelo y configurar su clave privada en el servidor, nunca en el chat ni como NEXT_PUBLIC.
2. Restablecer acceso de lectura al proyecto Supabase o verificar con una sesión autorizada `/api/agent/context`. El conector administrativo rechazó la consulta de esta sesión por falta de permisos; no se alteraron políticas para sortearlo.
3. Comprobar y publicar el contenido funcional de Pymes en Supabase si sigue vacío. La auditoría del 16 de septiembre registró esa carencia; no es una lectura actual.
4. Implementar transporte de generación, límites de uso, registro persistente privado y manejo de errores del proveedor seleccionado.
5. Probar una pregunta sobre responsabilidades desde una cuenta piloto; verificar su fuente y probar aislamiento entre cuentas. Esta primera capacidad será consultiva, sin herramientas que escriban datos.

El trabajo queda local. No se hicieron cambios remotos ni push en esta fase.

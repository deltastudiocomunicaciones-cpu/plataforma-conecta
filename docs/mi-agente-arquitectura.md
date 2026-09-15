# Mi agente — primera capa de producto

## Implementación y ruta

Ruta privada: `/mapa-vivo/mi-agente` (Next.js App Router).

La card `AiAgentSpace`, ya utilizada en la ficha ejecutiva y en el tablero del responsable, ofrece «Abrir mi agente». Ambas entradas llevan al espacio personal del usuario autenticado, aunque la ficha consultada corresponda a otra persona. No se acepta un identificador de cargo desde la URL.

El workspace incorpora saludo, identidad laboral, cuatro capacidades en preparación, sugerencias con estado vacío, referencias del cargo y conversación no configurada. No hay llamadas a proveedores LLM, respuestas simuladas, métricas inventadas, almacenamiento local de conversaciones ni ejecución de herramientas.

## Archivos creados

- `src/app/mapa-vivo/mi-agente/page.tsx`: validación de identidad y consulta del cargo en servidor.
- `src/app/mapa-vivo/mi-agente/layout.tsx`: shell y navegación institucional compartidos.
- `src/app/mapa-vivo/mi-agente/loading.tsx`: carga de sesión/contexto.
- `src/app/mapa-vivo/mi-agente/error.tsx`: error recuperable, reintento y regreso al mapa.
- `src/components/ConectaNavigation.tsx`: navegación extraída del mapa para compartirla.
- `src/components/agent/AgentWorkspace.tsx`: workspace, tarjetas de capacidades y sugerencias.
- `src/components/agent/AgentConversation.tsx`: conversación y contrato de interacción.
- `src/lib/conecta/agent.ts`: proyección tipada del contexto, catálogo de capacidades previstas y contratos de mensajes/sugerencias/servicio.
- `docs/mi-agente-arquitectura.md`: este documento.

## Archivos modificados

- `src/components/AiAgentSpace.tsx`: gateway, indicadores semánticos y enlace.
- `src/components/OrgExperience.tsx`: reutiliza la navegación extraída.
- `src/app/globals.css`: estilos acotados a `.agent-*`, con variables y controles actuales.

El cambio previo en `docs/verificacion-acceso-pymes-20260909.md` pertenece al estado inicial del espacio de trabajo y no se modificó.

## Reutilización y componentes nuevos

Se reutilizan `AiAgentSpace`, `MapExit`, `createSupabaseServerClient`, `Database`, `accessRolePermissions`, Next Link/Image, Lucide, el layout raíz, el shell `org-shell`, el header institucional, `session-strip`, `export-button`, `eyebrow` y las variables visuales de Conecta. La ficha ejecutiva consume la card actualizada sin cambios adicionales.

Los componentes nuevos son `ConectaNavigation`, `AgentWorkspace`, `AgentCapabilityCard`, `AgentSuggestions` y `AgentConversation`, además de los límites de ruta para carga/error.

## Decisiones arquitectónicas

1. Se verifica la identidad con el cliente SSR existente y `auth.getUser()`, seguido de un perfil activo asociado al usuario. La consulta del cargo se limita al `position_id` del perfil y a su empresa; utiliza la sesión y las políticas RLS existentes, nunca la clave administrativa.
2. `AgentContext` deriva sus campos mediante `Pick` de los tipos de tablas existentes. No duplica entidades ni incorpora teléfono, documento, nombre del ocupante del catálogo u otros datos personales innecesarios.
3. El cargo del agente procede de Supabase. No se usa el catálogo JSON local como sustituto cuando faltan datos: se muestra la ausencia del cargo o un error de lectura.
4. Las referencias de procesos/documentos de la ficha no equivalen a fuentes RAG autorizadas. Se etiquetan como referencias; conocimiento sigue «Por configurar».
5. No existe una tabla de proyectos en el esquema tipado revisado. Los frentes operativos existentes no se renombran como proyectos. Las sugerencias reciben una colección tipada y, actualmente, muestran un estado vacío neutral. La conexión de asignaciones operativas queda pendiente.
6. Las cuatro capacidades son un catálogo de interfaz, todas «En preparación». Seleccionarlas muestra una explicación accesible; no produce contenido de IA.
7. `AgentConversation` acepta un servicio opcional. Su ausencia determina el estado no configurado y deshabilita el formulario. Con un servicio existen listo, enviando y error, prevención de doble envío, cancelación al desmontar, reintento y conservación del borrador si falla. Los mensajes viven exclusivamente en memoria React.
8. El servicio futuro recibe texto y señal de cancelación; no recibe permisos ni instrucciones ejecutables. El backend deberá resolver nuevamente usuario, empresa, cargo y acceso. El contexto frontend y las listas textuales de autoridad nunca son autorizaciones ejecutables.
9. Secuencia obligatoria para futuras herramientas: LLM propone → plataforma autoriza de forma determinística → usuario confirma cuando corresponda → sistema ejecuta → Conecta registra. Esta fase no añade endpoints de ejecución.
10. La página usa dos columnas en escritorio, una bajo 980 px y tarjetas en una columna bajo 640 px. Hay etiquetas de formulario, estados anunciados, navegación por teclado y foco visible.

## Deuda técnica y datos faltantes

- El mapa concentra layout, reglas de vista, datos locales y lógica operativa en `OrgExperience`. Se extrajo únicamente su navegación para mantener pequeño el alcance.
- Hay dos representaciones del cargo: catálogo JSON/external_key en el mapa y UUID/tabla `positions` en Supabase. Pueden divergir. Es necesario definir y sincronizar la fuente autoritativa antes de utilizar contexto para generación o decisiones.
- La carga de perfiles/asignaciones está repetida entre página y gate del mapa. El agente usa el cliente SSR común, pero no hace una refactorización transversal de esos flujos.
- Las políticas originales incluyen lecturas por empresa y existen migraciones posteriores de alcance por responsable. Debe auditarse la política efectivamente desplegada antes de agregar documentos/herramientas; esta iteración no modifica RLS ni amplía acceso.
- `accessRolePermissions` describe permisos actuales de la plataforma, no permisos de herramientas agénticas. Su proyección en el contexto es descriptiva.
- Faltan configuración/disponibilidad del agente, catálogo de herramientas habilitadas, fuentes con ACL y citas, proyectos asociados, proveedor de sugerencias y servicio conversacional.
- Faltan políticas específicas de retención/memoria, confirmaciones, auditoría y métricas reales del agente.
- No hay script ni suite de tests configurados en `package.json`.
- Lint global tiene problemas anteriores en reuniones y convocatorias.

## Validación ejecutada

- `npx tsc --noEmit`: aprobado.
- `npm run build`: aprobado; incluye `/mapa-vivo/mi-agente` como ruta dinámica renderizada en servidor.
- `npm run lint`: falla por ocho errores y una advertencia en archivos ajenos al cambio: rutas API de meeting-events, convocatorias/responder, MeetingRsvp y lib/conecta/meetings.
- ESLint dirigido a todos los archivos TS/TSX creados o modificados: aprobado.
- No se ejecutó un comando de tests inexistente ni se instaló otro framework.
- Navegador sobre producción local: se observó el estado de carga con navegación Conecta y la redirección de `/mapa-vivo/mi-agente` a `/acceso` sin sesión. No se expuso contexto privado.
- Limitación: no había sesión autenticada en el navegador de verificación. No se verificaron visualmente la home autenticada ni sus tamaños móviles, ni se ejecutaron pruebas reales de consultas por distintos roles o del transporte conversacional aún inexistente. Los estilos responsive y estados del componente fueron revisados en código; esto no sustituye esas pruebas.

## Siguiente fase concreta

1. Unificar el origen del cargo y probar aislamiento entre usuarios/empresas y asignaciones transversales con RLS.
2. Implementar un endpoint de contexto que componga cargo, asignaciones activas y fuentes realmente autorizadas, con estados diferenciados de vacío/error/no configurado.
3. Añadir configuración del agente y habilitación de capacidades desde backend; mantener los controles deshabilitados mientras no exista capacidad autorizada.
4. Conectar una primera capacidad de solo lectura (búsqueda institucional con citas) mediante un adaptador de `AgentConversationService`, sin herramientas ejecutoras inicialmente.
5. Verificar en navegador con cuentas de prueba: identidad correcta, cargo ausente, errores, móvil/escritorio y ausencia de filtraciones entre roles. Agregar pruebas de contrato y autorización antes de habilitar generación.
6. Incorporar después acciones con permisos determinísticos, confirmación, idempotencia y trazabilidad.

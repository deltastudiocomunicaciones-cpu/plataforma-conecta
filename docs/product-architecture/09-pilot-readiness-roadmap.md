# Roadmap de preparación del piloto

Secuencia sin fechas inventadas. Cada fase termina con evidencia revisable; la siguiente implementación requiere autorización del usuario. Responsables sugeridos por función. Las pruebas se diseñan desde la primera fase y la observabilidad mínima opera antes de la salida; los pasos 7 y 9 consolidan esos trabajos.

| Fase | Trabajo propuesto | Responsable sugerido | Entrada / dependencia | Evidencia de salida |
| --- | --- | --- | --- | --- |
| **1. Estabilización** | Congelar alcance piloto, registrar trabajo sin commit, contrastar metadata remota con SQL/tipos, construir baseline reproducible sin reejecutar ciegamente schema; cerrar lint y drift | Arquitectura + desarrollo | Diagnóstico y autorización de implementación | Inventario reconciliado, entorno aislado reproducible, tipos/lint/unitarias verdes; alcance de módulos firmado |
| **2. Seguridad** | Retirar PII de bundle, cerrar RLS/revisiones/autoría, validar entradas, revisar Storage y Rocket.Chat, definir revocación y logging mínimo | Seguridad + backend | Matriz de permisos aprobada; fase 1 | Pruebas de denegación por rol/recurso, perfil/empresa inactivos; controles SEC críticos cerrados o módulo deshabilitado |
| **3. Aislamiento multiempresa** | Definir tenant, integridad compuesta, membresía necesaria para piloto, persistencia real del flujo principal, almacenamiento y jobs con scope | Backend + datos | Fases 1–2; decisiones de dominio | Tenants sintéticos A/B sin acceso cruzado vía UI/API/Data API/Storage; segundo dispositivo ve informe persistido |
| **4. Parametrización** | Sacar catálogo/marca/config del cliente interno; organización y catálogos propios; conexiones tenant y capacidades contratadas | Producto + frontend/backend | Tenant y permisos estables | Piloto configurado sin editar código por dato de negocio; configuración validada/versionada; destinos externos separados |
| **5. Entorno de demostración** | Sembrar datos sintéticos, destinos de mensajes de prueba, credenciales separadas, límites y reset controlado | QA + operación | Fases 1–4 | Demo sin datos A&C/cliente ni acceso productivo, módulos simulados etiquetados o retirados, recorrido reproducible |
| **6. Onboarding del cliente piloto** | Confirmar alcance, inventario de datos, administradores/roles, invitaciones, importación de personas/cargos y contenido funcional; contrato de soporte/retención | Producto + administrador cliente + operación | Demo validada; controles de aislamiento y configuración | Alta trazable, invitaciones/recuperación probadas con destinatarios autorizados, catálogo reconciliado y aceptación de alcance |
| **7. Pruebas** | Ejecutar matriz integral positiva/negativa, concurrencia/idempotencia, archivos, fallos de proveedor, restauración y UAT | QA + seguridad + cliente | Datos sintéticos y configuración equivalente; integración habilitada | Informe de pruebas con resultados, fallos cerrados y riesgos aceptados explícitos; ninguna prueba de aislamiento crítica pendiente |
| **8. Salida controlada** | Habilitar cohorte y módulos acordados; verificar release/config; soporte activo, kill switches, rollback y comunicación de incidente | Operación + producto | Gate de piloto aprobado y prueba de recuperación | Release identificado, checklist aprobado, monitoreo activo, ensayo de primer flujo y responsable de guardia |
| **9. Observabilidad** | Consolidar SLO, señales por tenant, alertas, revisión de permisos y costes, cola de fallos y runbooks | Operación + arquitectura | Instrumentación mínima ya activa desde fases 2–8 | Tablero y alertas comprobados, tiempos/umbrales acordados y revisión de incidentes; datos sensibles ausentes de logs |
| **10. Escalamiento** | Medir uso real, consultas/índices, límites por tenant y workers; decidir autoservicio, billing/SSO y extracción de servicios solo con evidencia | Arquitectura + producto | Telemetría y aprendizaje del piloto | Capacidad/coste y recuperación medidos, backlog comercial priorizado y decisión de arquitectura registrada |

## Gate obligatorio antes de datos externos

- Ningún dato identificativo interno queda en bundles o demo. Fotografías y documentos tienen clasificación y tratamiento acordados.
- Empresa y actor se resuelven desde identidad/membresía válidas; tenant suspendido/perfil inactivo no puede operar por caminos secundarios.
- Dos tenants no se leen ni alteran mutuamente: informes, revisiones, referencias, archivos, contexto del agente, integraciones y exportaciones.
- El flujo incluido en la oferta persiste en servidor. Si informes son el núcleo del piloto, localStorage no es aceptable como fuente de verdad.
- Invitaciones, acceso, recuperación y cierre de sesión funcionan en el dominio destino; el cliente no depende de cuentas compartidas ni enlaces localhost.
- Módulos no listos están deshabilitados también en backend. Agente sin LLM se presenta únicamente como contexto, Nivelar como no activado.
- Auditoría mínima, alertas de fallo, backup/restauración y rollback tienen evidencia, responsables y parámetros acordados.
- El cliente aprueba alcance y responsables; el propietario del producto aprueba salida. Esa aprobación será sobre cambios concretos y pruebas, no sobre este documento como licencia para implementar.

## Matriz mínima de pruebas pendientes

| Caso | Comprobación exigida | Nivel |
| --- | --- | --- |
| Sin sesión / JWT inválido / perfil inactivo / tenant suspendido | Denegar recursos privados y efectos externos; respuesta estable sin datos | Integración API/RLS |
| Lector, responsable y líder del mismo tenant | Solo recursos y columnas permitidos; autor de informe/revisión derivado de sesión | RLS + contratos |
| Tenant A con IDs de B | SELECT/INSERT/UPDATE/DELETE fallan para cada recurso y cada FK; no enumeración sensible | RLS real, no mocks |
| Asignación múltiple, temporal, vencida y duplicada principal | Selección y permisos respetan vigencia/principalidad; no cargo cruzado | Dominio + BD |
| Informe completo | Crear, enviar, revisar, pedir ajuste, reenviar y aprobar; histórico y actor consistentes | E2E + transacción |
| Petición duplicada/concurrente | Un resultado de negocio y una secuencia auditada; notificaciones deduplicadas | Integración |
| Cambio de cuenta/tenant en navegador | Sin informes, catálogos o archivos residuales accesibles al siguiente usuario | E2E |
| Evidencias | Límites/tipos, upload, descarga, URL vencida, reemplazo y borrado ajeno denegados | Storage con usuarios ordinarios |
| RSVP | Token válido/inválido/vencido/revocado, duplicados, payloads malformados, límites y privacidad de metadatos | API + abuso controlado |
| Cookies/Bearer | Identidad única coherente en validación y consultas; discrepancias rechazadas | API |
| Fallo Rocket.Chat/Nivelar | Commit no perdido, reintento durable/estado claro, tenant/destino correctos y logs sin secretos | Integración con proveedor simulado |
| Agente | Contexto propio, sin PII innecesaria, perfil/cargo faltante, errores BD; sin capacidades no autorizadas | Unitarias + integración + E2E |
| Restauración y baja/exportación | Restaurar DB/objetos/config en entorno aislado; export coherente sin otros tenants; alcance de borrado trazable | Operación |

Los 7 tests existentes del resolver cubren parte de la última familia con mocks. TypeScript aprobado y lint fallido no reemplazan esta matriz. Resultado actual detallado: [inventario](01-system-inventory.md).

## Estrategia de transición propuesta

1. Reconciliar y aprobar las fuentes; conservar copia controlada del catálogo antes de importar contenido a BD, sin publicar PII.
2. Desplegar estructura aditiva y leer mediante contratos nuevos en un ambiente aislado; mapear claves externas a IDs con validaciones y registro de discrepancias.
3. Migrar solo datos autorizados. Los informes de cada navegador no son un registro maestro recuperable automáticamente; decidir si son pruebas desechables o requieren importación explícita.
4. Cambiar el flujo a persistencia servidor y retirar fallback local; pruebas de comparación y reversión antes de clientes.
5. Habilitar por tenant/módulo con configuración y kill switch; rollback no debe perder transacciones nuevas ni borrar datos del cliente.

No se ejecutó ninguna de estas acciones. El próximo paso autorizado debe ser una fase acotada; los criterios de aceptación evitan una reescritura global sin pruebas.

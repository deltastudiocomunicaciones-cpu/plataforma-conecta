# Arquitectura Backend Plataforma Conecta

## Proposito

Plataforma Conecta debe convertir el organigrama en un sistema vivo: cada cargo tiene responsable, perfil, informes, evidencias, revisiones, alertas y decisiones asociadas.

La primera version de backend se apoya en Supabase para:

- Autenticacion con correo corporativo y clave personal.
- Roles y permisos por tipo de usuario.
- Cargos y relaciones jerarquicas.
- Informes de gestion por cargo.
- Evidencias documentales.
- Revisiones, aprobaciones, observaciones y escalamiento.
- Notificaciones internas.

## Capas del sistema

### 1. Capa publica

La landing de Cultura Conecta funciona como vitrina comercial. Explica servicios, espacios, experiencias, metodo y acceso privado.

Ruta actual:

- `/`

### 2. Capa de acceso

Pantalla donde el usuario ingresa con correo corporativo y clave personal. Hoy funciona como demo; cuando Supabase quede configurado, validara identidad real.

Ruta actual:

- `/acceso`

### 3. Capa operativa privada

Contiene el Mapa Vivo de Desempeno, perfiles de cargo, informes, historial, dashboard, alertas y vista por rol.

Ruta actual:

- `/mapa-vivo`

## Roles iniciales

- `superadmin`: administra todo el sistema.
- `direccion`: consulta todo, revisa, aprueba y escala.
- `gerencia`: consulta su equipo, revisa y aprueba informes de su area.
- `responsable`: consulta su cargo y registra informes.
- `cultura_conecta`: acompana implementacion, metodo, adopcion y calidad del sistema.
- `lector`: acceso limitado de consulta.

## Flujo de informe de gestion

1. Responsable ingresa a la plataforma.
2. Abre su cargo o area asignada.
3. Registra informe de gestion.
4. Adjunta evidencias o soportes.
5. El sistema crea una notificacion al destinatario.
6. Gerencia o Direccion revisa.
7. Puede aprobar, observar, solicitar ajuste o escalar.
8. El historial alimenta el dashboard directivo.

## Tablas principales

- `companies`: empresas activas en la plataforma.
- `positions`: cargos, areas, responsables y perfil del cargo.
- `user_profiles`: usuarios internos conectados a Supabase Auth.
- `management_reports`: informes de gestion.
- `report_evidence`: soportes y archivos asociados a informes.
- `report_reviews`: decisiones de revision.
- `notifications`: alertas internas por informe, cargo o usuario.
- `operational_fronts`: frentes reales de gestion que permiten clasificar informes por la experiencia viva del cargo.
- `user_position_assignments`: asignaciones operativas que conectan un usuario con uno o varios cargos/frentes sin duplicar su identidad.
- `nivelar_employee_links`: vinculo seguro entre empleados Nivelar y perfiles/cargos Conecta por cedula, correo y cargo.
- `nivelar_daily_summaries`: resumen diario recibido desde Nivelar para lectura de conexion, productividad, improductividad, neutralidad e inactividad.
- `nivelar_sync_runs`: bitacora tecnica de sincronizaciones Nivelar, alcance consultado, registros recibidos y errores.

## Nodos transversales

El caso Daniel Andres Fernandez confirma que algunos cargos no se explican con una sola linea formal del organigrama. En estos casos, el frontend conserva la arquitectura formal, pero el backend reconoce asignaciones operativas.

Un nodo transversal es un usuario que pertenece a una estructura principal, pero sostiene varios frentes de trabajo. Ejemplo:

- Gestion de activos.
- Compras y servicios.
- Archivo documental.
- Rentas y mantenimiento.
- Apoyo operativo especial.

La lectura correcta no es duplicar usuarios ni deformar el organigrama. La lectura correcta es crear asignaciones por frente para que cada informe tenga contexto, destinatario, evidencia y decision asociada.

## Integracion Nivelar

Nivelar funciona como fuente de datos operativos. Conecta conserva la experiencia principal del funcionario y recibe los datos por backend, sin obligar al usuario a saltar entre plataformas.

La logica de integracion es:

- Nivelar mide actividad, conexion, productividad, improductividad, tiempos sin clasificar e inactividad.
- Conecta vincula esos datos con usuario, cargo, gerencia, frente operativo, informe de gestion, evidencia y decision.
- El funcionario consulta su propio ritmo desde Conecta.
- Gerencia y Direccion consultan lecturas consolidadas segun alcance autorizado.

Para el piloto Pymes se prepara un paquete inicial de siete usuarios. La sincronizacion real debe activarse solo cuando exista token oficial, alcance aprobado, usuarios vinculados por cedula/correo y tratamiento de datos validado por la organizacion.

## Proxima fase tecnica

1. Crear proyecto Supabase.
2. Cargar variables en `.env.local`.
3. Ejecutar `supabase/schema.sql`.
4. Crear usuarios de prueba.
5. Migrar el JSON del organigrama a tabla `positions`.
6. Conectar `/acceso` con `signInWithPassword`.
7. Proteger `/mapa-vivo` para usuarios autenticados.
8. Conectar formulario de informe con `management_reports`.
9. Crear notificaciones automaticas al guardar informe.
10. Conectar dashboard con reportes reales.
11. Sembrar `operational_fronts` y `user_position_assignments` para cargos transversales.

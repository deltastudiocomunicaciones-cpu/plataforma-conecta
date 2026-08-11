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


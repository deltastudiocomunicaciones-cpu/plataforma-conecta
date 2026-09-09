# Revisión de preparación Pymes — 9 de septiembre de 2026

Estado: preparación incompleta. No se ha confirmado ninguna cuenta real ni realizado pruebas simultáneas.

## Equipo esperado
José Fernando Palacios (Gerencia Pymes); Jhonatan Alvarez; Yuranny Córdoba; Julio Medina; Anderson Osorio; Estiven Sanchez; Diana Bernal.

## Hallazgos del código
- El ingreso requiere cuenta Supabase Auth, perfil activo y asociación al cargo.
- El listado del piloto Nivelar es una constante de la interfaz: no acredita cuentas habilitadas.
- Los informes y revisiones aún usan estado React y localStorage. No se comparten entre móviles y Dirección.
- Las convocatorias tienen API con almacenamiento Supabase. Crear requiere superadmin, dirección, gerencia o cultura_conecta; responsable no puede crear. No ampliar permisos para una prueba.
- La exportación del mapa usa una ventana nueva e impresión del navegador. Falta probar Guardar PDF/Compartir en Android e iPhone.

## Comprobación pendiente con sesión autorizada
Ejecutar supabase/audits/20260909_pymes_access.sql. Revisar nombre, correo, cargo, rol, estado activo y cuenta Auth; el resultado estructural no sustituye un inicio de sesión real.

## Ensayo requerido
1. Cada integrante ingresa con su propia cuenta en su móvil; Dirección en otro dispositivo.
2. Cada cuenta muestra su cargo y alcance correctos; recargar mantiene la sesión.
3. Enviar dos informes ficticios desde móviles distintos: ambos deben persistir tras recargar y aparecer en Dirección; requisito pendiente de implementación.
4. Crear convocatoria de prueba desde un rol autorizado y responder desde móviles; confirmar recuento. No enviar comunicaciones externas sin autorización expresa.
5. Descargar PDF en móvil y comprobar contenido, centrado y controles.
6. Mantener las siete sesiones y Dirección abiertas durante las operaciones; registrar errores y tiempos observados, sin prometer capacidad antes del ensayo.

Fecha de presentación pendiente de confirmar: jueves 10 o jueves 17 de septiembre.

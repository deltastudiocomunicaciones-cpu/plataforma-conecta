# Primera prueba de acceso Pymes — 17 de septiembre de 2026

Este paquete prepara siete accesos: José Fernando Palacios como gerencia; Jhonatan Alvarez, Yuranny Córdoba, Julio Medina, Anderson Osorio, Estiven Sanchez y Diana Bernal como responsables. Los correos están en ambos SQL: revisarlos antes de ejecutar. No se conceden roles de administrador.

## Orden de ejecución

1. En el SQL Editor del proyecto Supabase correcto, ejecutar `supabase/audits/20260917_pymes_preflight.sql`. Es solo lectura; encuentra cuentas Auth por correo incluso si todavía no están vinculadas. El identificador de empresa esperado es `4fc5d223-4ae6-4011-af66-627957d2d80a`.
2. Para `CREAR_O_INVITAR_EN_AUTH`, crear o invitar a la persona desde Authentication → Users. Para `PENDIENTE_CONFIRMACION`, la persona debe completar su confirmación. No crear registros manuales en `auth.users`, no compartir contraseñas. Verificar Site URL y redirecciones de producción antes de invitar: los documentos del 9 de septiembre registraron redirecciones a localhost. Ese registro histórico no acredita el estado actual.
3. Resolver cualquier estado `REVISAR_*` o `FALTA_CARGO` antes de continuar. El SQL de vinculación exige que las siete cuentas estén confirmadas y habilitadas.
4. Ejecutar completo `supabase/seeds/20260909_pymes_access.sql`. Vincula las cuentas Auth a sus cargos. Puede repetirse; se detiene ante conflictos de empresa, cuenta, correo, cargo, rol o estado. Ante error, la transacción no aplica parcialmente los accesos. No modifica RLS ni crea contraseñas.
5. Repetir el preflight. Los siete registros deben mostrar `VINCULADO_PROBAR_LOGIN_Y_PERMISOS`. Este estado verifica estructura, no sustituye una prueba de permisos.

## Primera prueba con dos personas

- Probar primero con el gerente y un responsable, cada uno desde su propia sesión o dispositivo.
- Iniciar sesión, verificar nombre y cargo, cerrar sesión e ingresar otra vez.
- Abrir responsabilidades, subactividades y tareas; comprobar viñetas, lectura móvil y navegación por teclado.
- Comprobar que cada sesión solo permite las acciones y datos que corresponden a su rol. No aprobar el piloto si un responsable obtiene permisos de gerencia o administración.
- Registrar persona, fecha, dispositivo, resultado y error si lo hay, sin contraseñas ni tokens.

## Alcance actual

Los informes semanales todavía se guardan en localStorage del navegador. Esta primera prueba puede validar acceso y navegación, pero no colaboración, persistencia compartida ni revisión de informes entre dispositivos. La presentación piloto de Nivelar tampoco equivale a una conexión real.

Los SQL se entregan para ejecución por el administrador; no se ejecutaron contra Supabase durante esta preparación. La activación de las cuentas se confirma con el preflight y las pruebas de inicio de sesión, no con documentación histórica.

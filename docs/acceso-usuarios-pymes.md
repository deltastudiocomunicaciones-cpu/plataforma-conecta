# Acceso de usuarios Pymes

Estado actualizado: siete correos reales guardados en Supabase; Anderson y Jhonatan invitados y vinculados. Cuatro invitaciones pendientes por límite de envío (2 correos/hora). José Fernando pendiente de invitación. El seed general no se ejecutó.

## Relaciones necesarias

| Tabla | Función | Relación |
| --- | --- | --- |
| `companies` | Empresa del usuario | Empresa activa del piloto |
| `positions` | Cargo dentro del organigrama | `company_id` y `external_key` |
| `auth.users` | Identidad e inicio de sesión | Cuenta individual con correo confirmado |
| `user_profiles` | Nombre, rol, cargo y habilitación | `auth_user_id`, `company_id`, `position_id` |
| `user_position_assignments` | Cargos/frentes adicionales | Opcional para este acceso; el cargo principal está en `user_profiles` |

## Usuarios preparados

| Nombre | Correo confirmado | Cargo | Rol |
| --- | --- | --- | --- |
| José Fernando Palacios | fernandopalacios145@hotmail.com | gerencia-09 | gerencia |
| Jhonatan Alvarez | sadipymes1@gmail.com | unidad-pymes-01 | responsable |
| Yuranny Córdoba | sadi.pymes2@gmail.com | unidad-pymes-02 | responsable |
| Julio Medina | sadi.juliomedina@gmail.com | unidad-pymes-04 | responsable |
| Anderson Osorio | sadi.andersonosorio@gmail.com | unidad-pymes-05 | responsable |
| Estiven Sanchez | sanchez.estivenortiz@gmail.com | unidad-pymes-06 | responsable |
| Diana Bernal | diana.j.bernal.g@gmail.com | unidad-pymes-07 | responsable |

## Aplicación

1. Confirmar los siete correos y la empresa `4fc5d223-4ae6-4011-af66-627957d2d80a` en el proyecto `dttljewnvuwhizldnhld`.
2. Ejecutar la auditoría `supabase/audits/20260909_pymes_access.sql` con una sesión administrativa. No ejecutar de nuevo el esquema completo sobre una base existente.
3. Comprobar que existen los cargos y las cuentas individuales en Auth. Resolver confirmaciones o bloqueos mediante el flujo de administración de cuentas.
4. Ejecutar `supabase/seeds/20260909_pymes_access.sql`. Inserta perfiles faltantes y vincula los existentes que aún no tengan cuenta Auth. Se puede repetir; los perfiles coincidentes se conservan. Cualquier conflicto cancela todas las inserciones. Si el editor mantiene una transacción fallida abierta, ejecutar `rollback;` antes de volver a intentarlo.
5. Repetir la auditoría y probar cada inicio de sesión desde `/acceso`, verificando cargo y alcance con una sesión por usuario.

El SQL no crea cuentas Auth ni envía invitaciones. No se almacenan contraseñas en estos archivos. El entorno local solo dispone de claves públicas de Supabase: no permite administrar cuentas o ejecutar este SQL.

## Pendiente antes del piloto

Se retiró la política `users update own profile` en Supabase y en el esquema local para impedir cambios propios de rol, empresa y cargo. Las políticas de lectura por empresa tampoco acreditan aislamiento por cargo. Esta preparación de perfiles no certifica la seguridad de los permisos ni sustituye las pruebas del piloto descritas en `preparacion-piloto-pymes.md`.



Las cinco invitaciones pendientes no están en una cola automática. Deben enviarse al liberarse el cupo, hasta dos por hora, y después vincularse a los perfiles.

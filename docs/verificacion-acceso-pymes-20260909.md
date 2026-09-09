# Verificación directa en Supabase — 9 de septiembre de 2026

Proyecto: `dttljewnvuwhizldnhld` (plataforma-conecta).

- Los siete cargos y los siete perfiles con los correos del listado preparado existen.
- Ninguno de esos siete correos tiene cuenta en Auth. Todavía no pueden iniciar sesión con ellos.
- Existe además `gerenciapymes@grupoayc.com` con cuenta Auth y perfil Gerencia Pymes, sin cargo principal. No se modificó.
- Se aplicó `20260909_restrict_profile_self_update.sql` desde SQL Editor: se retiró la política `users update own profile`.
- La consulta posterior confirmó RLS activo y cero políticas UPDATE/ALL en `user_profiles`. Esto cierra la edición directa propia; no certifica todos los permisos de la aplicación.
- Se actualizó el seed para permitir vincular los perfiles existentes cuyo `auth_user_id` esté vacío. No se ejecutó: requiere las cuentas Auth primero.

Pendiente: acordar el alta mediante invitaciones por correo, completar la activación de cuentas, vincular perfiles y probar los accesos. No se enviaron correos ni se crearon credenciales.

Esta comprobación actualiza el diagnóstico anterior basado únicamente en archivos locales.

## Avance con correos reales

Se actualizaron seis perfiles con los correos personales proporcionados por el usuario. Supabase confirmó envío de invitaciones a `sadi.andersonosorio@gmail.com` y `sadipymes1@gmail.com`; ambas cuentas quedaron vinculadas a sus perfiles y cargos. No se ha verificado recepción ni inicio de sesión.

Julio y Yuranny no completaron el alta al intentar invitar. La pantalla Rate Limits muestra 2 correos por hora. Quedan pendientes Julio, Yuranny, Estiven y Diana. José Fernando proporcionó `fernandopalacio145@hotmail`, incompleto; no se inventó la terminación ni se envió invitación.

Fotos incorporadas localmente: `public/profiles/jose-fernando-palacios.png` y `public/profiles/estiven-sanchez.png`, con referencias en el JSON del organigrama. No desplegadas. Verificados archivo y asociación a cada cargo. Lint del componente modificado pasó; lint global reporta ocho errores preexistentes en el módulo de convocatorias.

José Fernando confirmó fernandopalacios145@hotmail.com; correo actualizado y verificado en Supabase, rol gerencia conservado. Los siete correos están confirmados. Quedan cinco invitaciones sin programación automática.

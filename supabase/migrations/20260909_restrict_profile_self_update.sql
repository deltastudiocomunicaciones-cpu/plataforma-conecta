-- Cierra la edición propia de columnas de autorización.
-- La aplicación actual no ofrece edición de perfiles; la administración
-- conserva acceso mediante SQL administrativo / service_role.
begin;
drop policy if exists "users update own profile" on public.user_profiles;
commit;

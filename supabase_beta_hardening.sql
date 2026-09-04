-- ==============================================================================
-- FUERZAFIT BETA — HARDENING SUPABASE (aplicar DESPUÉS del supabase_schema.sql)
-- Objetivo: cerrar fugas multi-tenant detectadas en auditoría beta:
--   1) classes: SELECT abierto a cualquier gym (using true)
--   2) attendance: INSERT abierto a cualquiera (with check true) — permite forjar ingresos
--   3) DNI único por gimnasio (llave del acceso diario)
-- Copiá y pegá este archivo completo en Supabase > SQL Editor y hacé clic en "Run".
-- Es idempotente: podés correrlo varias veces sin romper datos.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. CLASES: lectura acotada al propio gimnasio (miembros/staff) + catálogo anónimo
-- ------------------------------------------------------------------------------
drop policy if exists "Ver clases del propio gimnasio" on public.classes;

-- Miembros y staff autenticados: solo clases de su gimnasio (o superadmin)
create policy "Ver clases del propio gimnasio"
  on public.classes for select to authenticated
  using (
    gym_id = public.get_current_user_gym_id() or
    public.is_superadmin()
  );

-- Anónimos (landing pública): solo clases de gimnasios activos (para catálogo)
create policy "Anónimos ven clases de gimnasios activos"
  on public.classes for select to anon
  using (
    exists (
      select 1 from public.gyms g
      where g.id = public.classes.gym_id
        and g.status = 'active'
    )
  );

-- ------------------------------------------------------------------------------
-- 2. ASISTENCIAS: INSERT solo autenticado y del propio gimnasio
--    (el check-in lo registra recepción/staff o el propio socio logueado)
-- ------------------------------------------------------------------------------
drop policy if exists "Permitir registrar asistencia en el propio gimnasio" on public.attendance;

create policy "Registrar asistencia en el propio gimnasio"
  on public.attendance for insert to authenticated
  with check (
    gym_id = public.get_current_user_gym_id() or
    public.is_gym_staff(gym_id) or
    public.is_superadmin()
  );

-- ------------------------------------------------------------------------------
-- 3. DNI único por gimnasio (el acceso diario es por DNI)
--    Si hay duplicados existentes, este índice falla: limpiá duplicados primero con:
--    select gym_id, dni, count(*) from public.profiles
--    where dni is not null and dni <> '' group by gym_id, dni having count(*) > 1;
-- ------------------------------------------------------------------------------
create unique index if not exists idx_profiles_gym_dni_unique
  on public.profiles (gym_id, dni)
  where dni is not null and dni <> '';

-- Índice para búsquedas rápidas por DNI en recepción
create index if not exists idx_profiles_dni on public.profiles (dni);

-- ------------------------------------------------------------------------------
-- 4. Verificación rápida post-deploy (correr y revisar que no devuelva filas)
--    Socios con DNI duplicado dentro del mismo gym:
-- ------------------------------------------------------------------------------
-- select gym_id, dni, count(*) as duplicados
-- from public.profiles
-- where dni is not null and dni <> ''
-- group by gym_id, dni having count(*) > 1;

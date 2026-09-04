-- ==============================================================================
-- FUERZAFIT BETA — AUTO-ALTA DE GIMNASIOS (correr DESPUÉS de supabase_beta_hardening.sql)
-- Permite que un dueño recién registrado cree su propio gimnasio + sede + plan
-- desde la app (?app=admin > Crear cuenta), sin service_role en el frontend.
-- Es idempotente: podés correrlo varias veces.
-- ==============================================================================

-- 1. El dueño autenticado puede crear su gimnasio (quedando como owner)
drop policy if exists "Usuarios autenticados pueden crear su gimnasio" on public.gyms;
create policy "Usuarios autenticados pueden crear su gimnasio"
  on public.gyms for insert to authenticated
  with check (owner_user_id = auth.uid());

-- El dueño puede actualizar su propio gimnasio (nombre, logo, contacto)
drop policy if exists "Dueños actualizan su gimnasio" on public.gyms;
create policy "Dueños actualizan su gimnasio"
  on public.gyms for update to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

-- El dueño puede LEER su gimnasio (sin esto el insert+select del alta falla:
-- el perfil aún apunta al gym anterior y el SELECT de retorno es denegado)
drop policy if exists "Dueños ven su propio gimnasio" on public.gyms;
create policy "Dueños ven su propio gimnasio"
  on public.gyms for select to authenticated
  using (owner_user_id = auth.uid());

-- 2. El dueño puede crear la sede inicial y planes iniciales de su gimnasio
drop policy if exists "Dueños crean sedes de su gimnasio" on public.branches;
create policy "Dueños crean sedes de su gimnasio"
  on public.branches for insert to authenticated
  with check (
    exists (
      select 1 from public.gyms g
      where g.id = gym_id and g.owner_user_id = auth.uid()
    )
  );

drop policy if exists "Dueños crean planes de su gimnasio" on public.plans;
create policy "Dueños crean planes de su gimnasio"
  on public.plans for insert to authenticated
  with check (
    exists (
      select 1 from public.gyms g
      where g.id = gym_id and g.owner_user_id = auth.uid()
    )
  );

-- 3. El dueño puede leer su perfil aunque el trigger lo haya asignado a otro gym
--    (ya cubierto por "Usuarios ven perfiles..." vía auth.uid() = id, sin cambios)

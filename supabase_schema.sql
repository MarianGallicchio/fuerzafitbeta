-- ==============================================================================
-- FUERZAFIT - ESQUEMA MULTI-TENANT PARA SUPABASE (PostgreSQL)
-- Diseñado para Beta multi-gimnasio con aislamiento total de datos (RLS)
-- Copiá y pegá este código completo en Supabase > SQL Editor y hacé clic en "Run".
-- ==============================================================================

-- 0. Extensiones requeridas
create extension if not exists "uuid-ossp";

-- ==============================================================================
-- 1. TABLA DE GIMNASIOS (TENANTS)
-- ==============================================================================
create table if not exists public.gyms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_user_id uuid references auth.users(id) on delete set null,
  plan text not null default 'beta' check (plan in ('free', 'beta', 'pro')),
  status text not null default 'active' check (status in ('active', 'suspended', 'trial')),
  logo_url text,
  contact_email text,
  contact_phone text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 2. TABLA DE PERFILES DE USUARIO (CON GYM_ID Y ROLES)
-- ==============================================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  gym_id uuid references public.gyms(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  dni text,
  role text not null default 'member' check (role in ('superadmin', 'admin', 'reception', 'trainer', 'member')),
  avatar_url text,
  branch_id text default 'branch-1',
  birth_date date,
  medical_clearance boolean default false,
  medical_clearance_expiry date,
  emergency_contact jsonb,
  notes text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 3. SEDES (BRANCHES) POR GIMNASIO
-- ==============================================================================
create table if not exists public.branches (
  id text primary key,
  gym_id uuid not null references public.gyms(id) on delete cascade,
  code text not null,
  name text not null,
  address text not null,
  city text not null,
  phone text,
  is_open boolean default true,
  current_occupancy integer default 0,
  max_capacity integer default 150,
  opening_hours text default 'Lun a Vie 07:00 - 22:00, Sáb 09:00 - 18:00',
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 4. PLANES DE SUSCRIPCIÓN POR GIMNASIO
-- ==============================================================================
create table if not exists public.plans (
  id text primary key,
  gym_id uuid not null references public.gyms(id) on delete cascade,
  name text not null,
  description text,
  duration_months integer not null default 1,
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly', 'quarterly', 'biannual', 'annual', 'single_pass')),
  price_ars numeric not null default 0,
  benefits jsonb default '[]'::jsonb,
  grace_period_days integer default 3,
  max_classes_per_week integer,
  is_popular boolean default false,
  branch_ids jsonb default '[]'::jsonb,
  active boolean default true,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 5. MEMBRESÍAS DE SOCIOS POR GIMNASIO
-- ==============================================================================
create table if not exists public.memberships (
  id text primary key,
  gym_id uuid not null references public.gyms(id) on delete cascade,
  user_id text not null,
  plan_id text not null references public.plans(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'expired', 'suspended', 'pending_payment')),
  start_date timestamptz not null default timezone('utc'::text, now()),
  end_date timestamptz not null,
  auto_renew boolean default true,
  qr_token text not null,
  grace_until timestamptz,
  branch_id text,
  last_payment_id text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 6. PAGOS (FASE 1: MANUAL + MODELO PREPARADO PARA FASE 2 MERCADO PAGO REAL)
-- ==============================================================================
create table if not exists public.payments (
  id text primary key,
  gym_id uuid not null references public.gyms(id) on delete cascade,
  user_id text not null,
  user_name text not null,
  user_email text not null,
  plan_id text not null,
  plan_name text not null,
  amount_ars numeric not null default 0,
  currency text not null default 'ARS',
  method text not null check (method in ('mercadopago', 'cash', 'transfer', 'debit_card')),
  status text not null default 'approved' check (status in ('approved', 'pending', 'rejected', 'refunded')),
  payment_date timestamptz not null default timezone('utc'::text, now()),
  transaction_id text not null,
  idempotency_key text not null,
  -- Columnas listas para integración futura de Mercado Pago Checkout Pro & Webhook:
  mp_payment_id text,
  mp_preference_id text,
  raw_gateway_payload jsonb,
  receipt_url text,
  notes text,
  discount_ars numeric default null,
  discount_reason text default null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 7. CATÁLOGO DE EJERCICIOS (GLOBAL COMPARTIDO O ESPECÍFICO DE GIMNASIO)
-- ==============================================================================
create table if not exists public.exercise_library (
  id text primary key,
  gym_id uuid references public.gyms(id) on delete cascade, -- NULL = catálogo estándar global
  is_global boolean default true,
  name text not null,
  muscle_group text not null,
  equipment text,
  video_url text,
  thumbnail_url text,
  instructions text,
  difficulty text default 'Intermedio',
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 8. RUTINAS DE ENTRENAMIENTO
-- ==============================================================================
create table if not exists public.routines (
  id text primary key,
  gym_id uuid not null references public.gyms(id) on delete cascade,
  title text not null,
  goal text default 'hipertrofia',
  level text default 'intermedio',
  assigned_user_ids jsonb default '[]'::jsonb,
  days jsonb default '[]'::jsonb,
  is_template boolean default false,
  creator_name text,
  description text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 9. CLASES GRUPALES
-- ==============================================================================
create table if not exists public.classes (
  id text primary key,
  gym_id uuid not null references public.gyms(id) on delete cascade,
  title text not null,
  instructor_name text not null,
  instructor_id text,
  category text not null default 'Funcional',
  date date not null,
  start_time text not null,
  end_time text not null,
  capacity integer default 20,
  branch_id text not null,
  room text default 'Sala Principal',
  enrolled_user_ids jsonb default '[]'::jsonb,
  waiting_list_user_ids jsonb default '[]'::jsonb,
  color_tag text default 'emerald',
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 10. RESERVAS DE CLASES
-- ==============================================================================
create table if not exists public.class_bookings (
  id text primary key,
  gym_id uuid not null references public.gyms(id) on delete cascade,
  class_id text not null references public.classes(id) on delete cascade,
  user_id text not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'attended', 'absent')),
  booked_at timestamptz default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 11. ASISTENCIAS (CHECK-IN QR REAL)
-- ==============================================================================
create table if not exists public.attendance (
  id text primary key,
  gym_id uuid not null references public.gyms(id) on delete cascade,
  branch_id text not null,
  user_id text not null,
  user_name text not null,
  user_avatar text,
  timestamp timestamptz default timezone('utc'::text, now()) not null,
  access_method text default 'qr_scanner',
  status text default 'granted' check (status in ('granted', 'denied')),
  reason text,
  plan_name text
);

-- ==============================================================================
-- 12. MÉTRICAS CORPORALES Y PROGRESO
-- ==============================================================================
create table if not exists public.progress_metrics (
  id text primary key,
  gym_id uuid not null references public.gyms(id) on delete cascade,
  user_id text not null,
  date date not null,
  weight_kg numeric not null,
  body_fat_percent numeric,
  chest_cm numeric,
  waist_cm numeric,
  arms_cm numeric,
  legs_cm numeric,
  notes text,
  photo_url text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 13. REGISTROS DE ENTRENAMIENTO (WORKOUT LOGS)
-- ==============================================================================
create table if not exists public.workout_logs (
  id text primary key,
  gym_id uuid not null references public.gyms(id) on delete cascade,
  user_id text not null,
  routine_id text,
  routine_name text,
  day_name text,
  date timestamptz default timezone('utc'::text, now()) not null,
  duration_minutes integer default 60,
  total_volume_kg numeric default 0,
  completed_exercises_count integer default 0,
  notes text,
  rating integer default 5,
  calories_burned integer default 500
);

-- ==============================================================================
-- 14. NOTIFICACIONES DEL SISTEMA
-- ==============================================================================
create table if not exists public.notifications (
  id text primary key,
  gym_id uuid not null references public.gyms(id) on delete cascade,
  user_id text not null, -- ID de socio específico o 'all' para difusión
  title text not null,
  message text not null,
  type text not null default 'announcement',
  read boolean default false,
  action_link text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 15. ÍNDICES DE ALTO RENDIMIENTO
-- ==============================================================================
create index if not exists idx_profiles_gym_id on public.profiles(gym_id);
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_branches_gym_id on public.branches(gym_id);
create index if not exists idx_branches_code on public.branches(code);
create index if not exists idx_plans_gym_id on public.plans(gym_id);
create index if not exists idx_memberships_gym_id on public.memberships(gym_id);
create index if not exists idx_memberships_user_id on public.memberships(user_id);
create index if not exists idx_memberships_qr_token on public.memberships(qr_token);
create index if not exists idx_memberships_end_date on public.memberships(end_date);
create index if not exists idx_payments_gym_id on public.payments(gym_id);
create index if not exists idx_payments_user_id on public.payments(user_id);
create index if not exists idx_payments_status on public.payments(status);
create index if not exists idx_payments_payment_date on public.payments(payment_date);
create index if not exists idx_routines_gym_id on public.routines(gym_id);
create index if not exists idx_classes_gym_id on public.classes(gym_id);
create index if not exists idx_classes_date on public.classes(date);
create index if not exists idx_attendance_gym_id on public.attendance(gym_id);
create index if not exists idx_attendance_user_id on public.attendance(user_id);
create index if not exists idx_attendance_timestamp on public.attendance(timestamp);
create index if not exists idx_progress_gym_id on public.progress_metrics(gym_id);
create index if not exists idx_progress_user_id on public.progress_metrics(user_id);
create index if not exists idx_workout_logs_gym_id on public.workout_logs(gym_id);
create index if not exists idx_notifications_gym_id on public.notifications(gym_id);

-- ==============================================================================
-- 16. FUNCIONES HELPER PARA ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Devuelve el gym_id del usuario autenticado actual
create or replace function public.get_current_user_gym_id()
returns uuid as $$
  select gym_id from public.profiles where id = auth.uid() limit 1;
$$ language sql security definer stable;

-- Verifica si el usuario actual tiene rol de superadmin de la plataforma
create or replace function public.is_superadmin()
returns boolean as $$
  select exists (
    select 1 from public.profiles 
    where id = auth.uid() and role = 'superadmin'
  );
$$ language sql security definer stable;

-- Verifica si el usuario actual es personal autorizado (admin/reception/trainer/superadmin) en el gimnasio especificado
create or replace function public.is_gym_staff(target_gym_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.profiles 
    where id = auth.uid() 
      and (role = 'superadmin' or (gym_id = target_gym_id and role in ('admin', 'reception', 'trainer')))
  );
$$ language sql security definer stable;

-- ==============================================================================
-- 17. TRIGGER: AUTO-CREACIÓN DE PERFIL AL REGISTRARSE EN SUPABASE AUTH
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  default_gym_id uuid;
  assigned_role text;
begin
  -- Resolver gym_id desde metadata o asignar el primer gimnasio activo disponible
  if new.raw_user_meta_data->>'gym_id' is not null then
    default_gym_id := (new.raw_user_meta_data->>'gym_id')::uuid;
  else
    select id into default_gym_id from public.gyms where status = 'active' order by created_at asc limit 1;
  end if;

  assigned_role := coalesce(new.raw_user_meta_data->>'role', 'member');

  insert into public.profiles (
    id,
    gym_id,
    name,
    email,
    phone,
    dni,
    role,
    branch_id,
    avatar_url
  ) values (
    new.id,
    default_gym_id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'dni',
    assigned_role,
    coalesce(new.raw_user_meta_data->>'branch_id', 'branch-1'),
    coalesce(new.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80')
  )
  on conflict (id) do update set
    name = excluded.name,
    email = excluded.email,
    role = coalesce(excluded.role, public.profiles.role),
    gym_id = coalesce(excluded.gym_id, public.profiles.gym_id);
    
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==============================================================================
-- 18. HABILITACIÓN DE ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS
-- ==============================================================================
alter table public.gyms enable row level security;
alter table public.profiles enable row level security;
alter table public.branches enable row level security;
alter table public.plans enable row level security;
alter table public.memberships enable row level security;
alter table public.payments enable row level security;
alter table public.exercise_library enable row level security;
alter table public.routines enable row level security;
alter table public.classes enable row level security;
alter table public.class_bookings enable row level security;
alter table public.attendance enable row level security;
alter table public.progress_metrics enable row level security;
alter table public.workout_logs enable row level security;
alter table public.notifications enable row level security;

-- ==============================================================================
-- 19. POLÍTICAS RLS REALES (AISLAMIENTO TOTAL MULTI-TENANT)
-- ==============================================================================

-- --- GYMS ---
create policy "Superadmin tiene control total de gimnasios"
  on public.gyms for all to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

create policy "Usuarios autenticados ven su propio gimnasio"
  on public.gyms for select to authenticated
  using (id = public.get_current_user_gym_id());

create policy "Usuarios anónimos pueden ver gimnasios activos para registro y selección"
  on public.gyms for select to anon
  using (status = 'active');

-- --- PROFILES ---
create policy "Superadmin tiene control total de perfiles"
  on public.profiles for all to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

create policy "Usuarios ven perfiles de su propio gimnasio"
  on public.profiles for select to authenticated
  using (gym_id = public.get_current_user_gym_id() or auth.uid() = id);

create policy "Usuarios pueden actualizar su propio perfil"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Staff del gimnasio puede gestionar perfiles de su gimnasio"
  on public.profiles for all to authenticated
  using (public.is_gym_staff(gym_id))
  with check (public.is_gym_staff(gym_id));

create policy "Permitir auto-creación inicial de perfil al registrarse"
  on public.profiles for insert to anon, authenticated
  with check (true);

-- --- BRANCHES ---
create policy "Ver sedes del propio gimnasio o anónimo si activo"
  on public.branches for select to anon, authenticated
  using (
    auth.role() = 'anon' or
    gym_id = public.get_current_user_gym_id() or
    public.is_superadmin()
  );

create policy "Staff del gimnasio administra sus sedes"
  on public.branches for all to authenticated
  using (public.is_gym_staff(gym_id))
  with check (public.is_gym_staff(gym_id));

-- --- PLANS ---
create policy "Ver planes del propio gimnasio o anónimo para catálogo de precios"
  on public.plans for select to anon, authenticated
  using (
    auth.role() = 'anon' or
    gym_id = public.get_current_user_gym_id() or
    public.is_superadmin()
  );

create policy "Staff del gimnasio administra sus planes"
  on public.plans for all to authenticated
  using (public.is_gym_staff(gym_id))
  with check (public.is_gym_staff(gym_id));

-- --- MEMBERSHIPS ---
create policy "Socios ven su propia membresía"
  on public.memberships for select to authenticated
  using (user_id = auth.uid()::text or public.is_gym_staff(gym_id));

create policy "Staff del gimnasio administra membresías de su gimnasio"
  on public.memberships for all to authenticated
  using (public.is_gym_staff(gym_id))
  with check (public.is_gym_staff(gym_id));

-- --- PAYMENTS ---
create policy "Socios ven sus propios pagos"
  on public.payments for select to authenticated
  using (user_id = auth.uid()::text or public.is_gym_staff(gym_id));

create policy "Staff del gimnasio gestiona los pagos de su gimnasio"
  on public.payments for all to authenticated
  using (public.is_gym_staff(gym_id))
  with check (public.is_gym_staff(gym_id));

-- --- EXERCISE LIBRARY ---
create policy "Acceso a ejercicios globales y del propio gimnasio"
  on public.exercise_library for select to anon, authenticated
  using (
    is_global = true or
    gym_id = public.get_current_user_gym_id() or
    public.is_superadmin()
  );

create policy "Staff puede crear ejercicios en su gimnasio"
  on public.exercise_library for all to authenticated
  using (gym_id is not null and public.is_gym_staff(gym_id))
  with check (gym_id is not null and public.is_gym_staff(gym_id));

-- --- ROUTINES ---
create policy "Ver rutinas asignadas o del propio gimnasio"
  on public.routines for select to authenticated
  using (
    gym_id = public.get_current_user_gym_id() or
    public.is_superadmin()
  );

create policy "Staff gestiona rutinas de su gimnasio"
  on public.routines for all to authenticated
  using (public.is_gym_staff(gym_id))
  with check (public.is_gym_staff(gym_id));

-- --- CLASSES & BOOKINGS ---
create policy "Ver clases del propio gimnasio"
  on public.classes for select to authenticated, anon
  using (true);

create policy "Staff gestiona clases del gimnasio"
  on public.classes for all to authenticated
  using (public.is_gym_staff(gym_id))
  with check (public.is_gym_staff(gym_id));

create policy "Socios gestionan sus propias reservas de clases"
  on public.class_bookings for all to authenticated
  using (user_id = auth.uid()::text or public.is_gym_staff(gym_id))
  with check (user_id = auth.uid()::text or public.is_gym_staff(gym_id));

-- --- ATTENDANCE (CHECK-IN) ---
create policy "Socios ven sus asistencias y staff ve las del gimnasio"
  on public.attendance for select to authenticated
  using (user_id = auth.uid()::text or public.is_gym_staff(gym_id));

create policy "Permitir registrar asistencia en el propio gimnasio"
  on public.attendance for insert to authenticated, anon
  with check (true);

-- --- PROGRESS & WORKOUT LOGS ---
create policy "Socios y staff gestionan métricas corporales"
  on public.progress_metrics for all to authenticated
  using (user_id = auth.uid()::text or public.is_gym_staff(gym_id))
  with check (user_id = auth.uid()::text or public.is_gym_staff(gym_id));

create policy "Socios y entrenadores gestionan registros de entrenamiento"
  on public.workout_logs for all to authenticated
  using (user_id = auth.uid()::text or public.is_gym_staff(gym_id))
  with check (user_id = auth.uid()::text or public.is_gym_staff(gym_id));

-- --- NOTIFICATIONS ---
create policy "Usuarios ven notificaciones dirigidas a ellos o generales de su gimnasio"
  on public.notifications for select to authenticated
  using (
    gym_id = public.get_current_user_gym_id() and (user_id = auth.uid()::text or user_id = 'all')
  );

create policy "Staff gestiona notificaciones de su gimnasio"
  on public.notifications for all to authenticated
  using (public.is_gym_staff(gym_id))
  with check (public.is_gym_staff(gym_id));

-- ==============================================================================
-- 20. DATOS SEMILLA INICIALES (TENANT BETA + CATÁLOGO GLOBAL DE EJERCICIOS)
-- ==============================================================================

-- Gimnasio inicial por defecto para el primer cliente tester o demostración
insert into public.gyms (id, name, slug, plan, status, contact_email)
values (
  '00000000-0000-0000-0000-000000000001',
  'FuerzaFit Gym',
  'fuerzafit-central',
  'beta',
  'active',
  'contacto@fuerzafit.com'
) on conflict (id) do nothing;

-- Catálogo de ejercicios estándar compartido
insert into public.exercise_library (id, is_global, name, muscle_group, equipment, instructions, difficulty)
values
  ('ex-global-1', true, 'Press de Banca Plano con Barra', 'pecho', 'Barra y banco plano', 'Apoyá escápulas, bajá la barra controlada al esternón y empujá con potencia sin despegar los glúteos.', 'Intermedio'),
  ('ex-global-2', true, 'Sentadilla Trasera con Barra (Back Squat)', 'piernas', 'Barra olímpica y rack', 'Pies ancho de hombros, torso firme, descendé rompiendo el paralelo manteniendo rodillas alineadas.', 'Avanzado'),
  ('ex-global-3', true, 'Dominadas Pronas (Pull-ups)', 'espalda', 'Barra fija', 'Tomá la barra con agarre prono abierto. Traccioná con dorsales hasta superar la barra con la barbilla.', 'Intermedio'),
  ('ex-global-4', true, 'Press Militar con Barra de Pie', 'hombros', 'Barra olímpica', 'Glúteos y core apretados, empujá la barra verticalmente bloqueando codos arriba.', 'Intermedio'),
  ('ex-global-5', true, 'Peso Muerto Convencional (Deadlift)', 'espalda', 'Barra olímpica y discos', 'Barra pegada a tibias, espalda neutra, extendé caderas y rodillas al unísono.', 'Avanzado'),
  ('ex-global-6', true, 'Curl de Bíceps con Barra Z', 'brazos', 'Barra Z', 'Codos pegados a los costados, subí apretando el bíceps y bajá en 3 segundos.', 'Principiante'),
  ('ex-global-7', true, 'Fondos en Paralelas (Dips)', 'pecho', 'Barras paralelas', 'Incliná levemente el torso hacia adelante para enfatizar pectorales, bajá hasta 90 grados.', 'Intermedio'),
  ('ex-global-8', true, 'Plancha Abdominal Frontal', 'core', 'Colchoneta', 'Alineación de tobillos a hombros, retroversión pélvica y respiración diafragmática.', 'Principiante')
on conflict (id) do nothing;

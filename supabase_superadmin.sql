-- ==============================================================================
-- FUERZAFIT - ZONA MAESTRA (SuperAdmin) — Supabase SQL
-- Ejecutar DESPUÉS de supabase_schema.sql + supabase_beta_hardening.sql
-- Crea capa B2B para dueños de gimnasios (tenants), facturación y soporte.
-- Requiere: profiles.role = 'superadmin' para acceso.
-- ==============================================================================

-- 0. Extensión gyms para licencias y módulos
alter table public.gyms add column if not exists status_detail text default 'active'
  check (status_detail in ('trial','active','past_due','suspended','frozen','churned','blocked'));
alter table public.gyms add column if not exists trial_ends_at timestamptz;
alter table public.gyms add column if not exists mrr_price_ars numeric default 49000;
alter table public.gyms add column if not exists setup_fee_ars numeric default 79000;
alter table public.gyms add column if not exists enabled_modules jsonb default '["access","routines","classes"]'::jsonb;
alter table public.gyms add column if not exists owner_email text;
alter table public.gyms add column if not exists suspended_reason text;
alter table public.gyms add column if not exists frozen_until timestamptz;
alter table public.gyms add column if not exists notes_superadmin text;

-- 1. Subscripción B2B por tenant
create table if not exists public.tenant_subscriptions (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade unique,
  plan_tier text not null default 'starter' check (plan_tier in ('starter','pro','enterprise')),
  billing_cycle text not null default 'monthly',
  status text not null default 'trialing' check (status in ('trialing','active','past_due','canceled','paused')),
  current_period_start timestamptz default now(),
  current_period_end timestamptz default (now() + interval '30 days'),
  trial_ends_at timestamptz,
  cancel_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_tenant_subs_gym on public.tenant_subscriptions(gym_id);
create index if not exists idx_tenant_subs_status on public.tenant_subscriptions(status);

-- 2. Facturación B2B (Setup + MRR) — separada de payments de socios
create table if not exists public.tenant_invoices (
  id text primary key, -- INV-2026-0001
  gym_id uuid not null references public.gyms(id) on delete cascade,
  type text not null check (type in ('setup_fee','subscription','overage')),
  amount_ars numeric not null,
  discount_ars numeric default 0,
  status text not null default 'pending' check (status in ('draft','pending','paid','overdue','void')),
  due_date date not null,
  paid_at timestamptz,
  mp_preference_id text,
  mp_payment_id text,
  pdf_url text,
  notes text,
  created_at timestamptz default now()
);
create index if not exists idx_invoices_gym on public.tenant_invoices(gym_id);
create index if not exists idx_invoices_status on public.tenant_invoices(status);
create index if not exists idx_invoices_due on public.tenant_invoices(due_date);

-- 3. Tickets Soporte
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid references public.gyms(id) on delete set null,
  owner_user_id uuid,
  subject text not null,
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  status text not null default 'open' check (status in ('open','pending','resolved','closed')),
  messages jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  resolved_at timestamptz
);
create index if not exists idx_tickets_gym on public.support_tickets(gym_id);
create index if not exists idx_tickets_status on public.support_tickets(status);

-- 4. Auditoría
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid,
  actor_id uuid,
  action text not null,
  payload jsonb,
  ip text,
  created_at timestamptz default now()
);
create index if not exists idx_audit_gym on public.audit_logs(gym_id);
create index if not exists idx_audit_actor on public.audit_logs(actor_id);

-- 5. Logs de errores
create table if not exists public.error_logs (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid,
  service text,
  level text,
  message text,
  meta jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_error_gym on public.error_logs(gym_id);

-- 6. Métricas diarias por tenant
create table if not exists public.tenant_metrics_daily (
  gym_id uuid not null references public.gyms(id) on delete cascade,
  day date not null,
  active_members int default 0,
  new_members int default 0,
  mrr_ars numeric default 0,
  occupancy_peak int default 0,
  primary key (gym_id, day)
);

-- 7. Feature Flags globales + overrides por tenant
create table if not exists public.feature_flags (
  key text primary key,
  name text not null,
  description text,
  enabled_global boolean not null default true,
  requires_plan text
);
insert into public.feature_flags (key, name, description, enabled_global, requires_plan) values
  ('access_qr','Control Acceso QR/Molinete','DNI + QR en recepcion', true, 'starter'),
  ('routines','Rutinas por bloques','Constructor de rutinas', true, 'starter'),
  ('classes','Clases con cupo','Reserva y lista espera', true, 'starter'),
  ('store','Tienda interna','Venta de productos', false, 'pro'),
  ('mercadopago_b2c','Cobro socios MP','Checkout socios', true, 'starter'),
  ('analytics','Reportes avanzados','Retencion y MRR', false, 'pro')
on conflict (key) do nothing;

create table if not exists public.tenant_feature_overrides (
  gym_id uuid not null references public.gyms(id) on delete cascade,
  flag_key text not null references public.feature_flags(key) on delete cascade,
  enabled boolean not null,
  primary key (gym_id, flag_key)
);

-- 8. Avisos globales
create table if not exists public.global_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience text not null default 'all_admins' check (audience in ('all_admins','all_gyms','all')),
  channel text not null default 'in_app' check (channel in ('in_app','email','both')),
  created_at timestamptz default now(),
  sent_at timestamptz
);

-- 9. Sesiones de impersonación
create table if not exists public.impersonation_sessions (
  id uuid primary key default gen_random_uuid(),
  superadmin_id uuid not null,
  gym_id uuid not null references public.gyms(id) on delete cascade,
  gym_admin_id uuid,
  token_hash text not null,
  expires_at timestamptz not null default (now() + interval '5 minutes'),
  created_at timestamptz default now()
);
create index if not exists idx_impersonation_gym on public.impersonation_sessions(gym_id);

-- 10. RLS - solo superadmin
alter table public.tenant_subscriptions enable row level security;
alter table public.tenant_invoices enable row level security;
alter table public.support_tickets enable row level security;
alter table public.audit_logs enable row level security;
alter table public.error_logs enable row level security;
alter table public.tenant_metrics_daily enable row level security;
alter table public.feature_flags enable row level security;
alter table public.tenant_feature_overrides enable row level security;
alter table public.global_announcements enable row level security;
alter table public.impersonation_sessions enable row level security;

drop policy if exists "superadmin all tenant_subscriptions" on public.tenant_subscriptions;
create policy "superadmin all tenant_subscriptions" on public.tenant_subscriptions for all to authenticated using (public.is_superadmin()) with check (public.is_superadmin());
drop policy if exists "superadmin all tenant_invoices" on public.tenant_invoices;
create policy "superadmin all tenant_invoices" on public.tenant_invoices for all to authenticated using (public.is_superadmin()) with check (public.is_superadmin());
drop policy if exists "superadmin all support_tickets" on public.support_tickets;
create policy "superadmin all support_tickets" on public.support_tickets for all to authenticated using (public.is_superadmin()) with check (public.is_superadmin());
drop policy if exists "superadmin all audit_logs" on public.audit_logs;
create policy "superadmin all audit_logs" on public.audit_logs for all to authenticated using (public.is_superadmin()) with check (public.is_superadmin());
drop policy if exists "superadmin all error_logs" on public.error_logs;
create policy "superadmin all error_logs" on public.error_logs for all to authenticated using (public.is_superadmin()) with check (public.is_superadmin());
drop policy if exists "superadmin all tenant_metrics" on public.tenant_metrics_daily;
create policy "superadmin all tenant_metrics" on public.tenant_metrics_daily for all to authenticated using (public.is_superadmin()) with check (public.is_superadmin());
drop policy if exists "superadmin all feature_flags" on public.feature_flags;
create policy "superadmin all feature_flags" on public.feature_flags for all to authenticated using (public.is_superadmin()) with check (public.is_superadmin());
drop policy if exists "superadmin all overrides" on public.tenant_feature_overrides;
create policy "superadmin all tenant_feature_overrides" on public.tenant_feature_overrides for all to authenticated using (public.is_superadmin()) with check (public.is_superadmin());
drop policy if exists "superadmin all announcements" on public.global_announcements;
create policy "superadmin all global_announcements" on public.global_announcements for all to authenticated using (public.is_superadmin()) with check (public.is_superadmin());
drop policy if exists "superadmin all impersonation" on public.impersonation_sessions;
create policy "superadmin all impersonation_sessions" on public.impersonation_sessions for all to authenticated using (public.is_superadmin()) with check (public.is_superadmin());

-- Lectura pública de feature_flags para gyms (solo enabled_global)
drop policy if exists "authenticated read feature_flags" on public.feature_flags;
create policy "authenticated read feature_flags" on public.feature_flags for select to authenticated using (true);

-- 11. Trigger para auditar cambios de status en gyms
create or replace function public.log_gym_status_change() returns trigger as $$
begin
  if old.status_detail is distinct from new.status_detail then
    insert into public.audit_logs (gym_id, action, payload) values (new.id, 'gym.status_change', jsonb_build_object('from', old.status_detail, 'to', new.status_detail));
  end if;
  return new;
end; $$ language plpgsql security definer;
drop trigger if exists trg_gym_status on public.gyms;
create trigger trg_gym_status after update on public.gyms for each row execute function public.log_gym_status_change();

-- 12. Seed superadmin demo (cambiar email)
-- insert into public.profiles (id, gym_id, name, email, role) values (gen_random_uuid(), null, 'Maestro', 'maestro@fuerzafit.com', 'superadmin') on conflict do nothing;

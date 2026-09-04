-- ==============================================================================
-- FUERZAFIT - MIGRACIÓN DESCUENTO 1ª CUOTA Y PROMOS
-- Ejecutar en Supabase > SQL Editor DESPUÉS de supabase_schema.sql
-- Añade soporte de descuento auditado a la tabla payments
-- ==============================================================================

-- 1. Columnas nuevas en payments (idempotente)
alter table public.payments add column if not exists discount_ars numeric default null;
alter table public.payments add column if not exists discount_reason text default null;

-- 2. Índice para reportes de descuentos
create index if not exists idx_payments_discount on public.payments(discount_ars) where discount_ars is not null;

-- 3. Comentarios para documentación
comment on column public.payments.discount_ars is 'Monto descontado sobre tarifa lista (ARS). amount_ars es el neto cobrado. Ej: tarifa 35000, discount 7000 => neto 28000';
comment on column public.payments.discount_reason is 'Motivo: Primera cuota / Bienvenida, Promo / Referido, Plan familiar, etc. (ver DISCOUNT_REASONS)';

-- 4. Validación: descuento nunca supera tarifa
-- (check constraint suave: discount_ars < amount_ars + discount_ars es tautología, mejor validar en app)
-- Se deja chequeo de no-negativo
do $$ begin
  alter table public.payments add constraint chk_discount_nonneg check (discount_ars is null or discount_ars >= 0);
exception when duplicate_object then null; end $$;

-- 5. Vista helper para reportes financieros con bruto/neto
create or replace view public.payments_with_gross as
select
  id, gym_id, user_id, user_name, plan_name, amount_ars,
  coalesce(discount_ars,0) as discount_ars,
  amount_ars + coalesce(discount_ars,0) as gross_ars,
  discount_reason, method, status, payment_date, transaction_id
from public.payments;

-- Ejemplo de uso:
-- select sum(amount_ars) as neto, sum(discount_ars) as descuentos, sum(amount_ars+coalesce(discount_ars,0)) as bruto
-- from public.payments where gym_id = '...' and status='approved';

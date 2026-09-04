# FuerzaFit — Guía Beta para el gimnasio

Versión lista para entregar a un gimnasio real con Supabase. Mismo código, **tres accesos separados** para que no se mezclen datos ni cuentas.

## 1. Los 3 links (mismo deploy, sin costo extra)

| Acceso | Link | Quién entra |
|---|---|---|
| Maestro (SuperAdmin) | `https://TU-DOMINIO/maestro` (`/superadmin` alias) | superadmin |
| Dueño / Staff | `https://TU-DOMINIO/admin` (`/?app=admin` legacy) | admin, reception, trainer |
| Socios | `https://TU-DOMINIO/socio` (`/?app=socio` legacy) | member |

- Si una cuenta de socio intenta entrar por `/admin` (o al revés), ve una pantalla de bloqueo con botón al acceso correcto. No se mezcla la sesión.
- El login de cada link está bloqueado a su rol (no hay pestaña para cruzar).
- La Zona Maestra (`/maestro`) solo acepta `profiles.role='superadmin'` (guard `is_superadmin()`).

Compat: también sirven `?admin=1`, `?socio=1`, `?app=maestro`. Sin parámetro (`full`) = landing.

## 2. Flujo de acceso: DNI diario + QR solo alta

1. **Alta** (recepción → Socios → Nuevo socio): **DNI obligatorio y único**. Al crear se genera el QR de alta + credenciales.
2. **Ingreso diario**: recepción escribe el **DNI** en Accesos → Validar DNI. Valida cuota activa, gracia, suspensión y sede.
3. **QR**: solo credencial del **primer día** del socio nuevo. El socio la ve en su app junto a su DNI grande.
4. El historial muestra `· DNI` o `· QR alta` según el método.

## 3. Puesta en marcha con Supabase (15 min)

1. Crear proyecto en Supabase.
2. **SQL Editor → Run** con `supabase_schema.sql` (crea tablas + RLS + seed).
3. **SQL Editor → Run** con `supabase_beta_hardening.sql` (cierra lecturas/escrituras cruzadas + DNI único).
4. **SQL Editor → Run** con `supabase_superadmin.sql` (Zona Maestra: `tenant_subscriptions`, `tenant_invoices`, `feature_flags`, etc.) y `supabase_migration_discount.sql` si venís de versión anterior.
5. **Authentication → Sign In / Providers → Email**: activar Email + OTP. Desactivar "Confirm email" si querés alta inmediata en mostrador.
6. Crear tu superadmin: `update profiles set role='superadmin' where email='tu@email'` o insert seed del SQL.
7. Copiar `.env.example` a `.env` y completar:
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - `VITE_DEMO_MODE="false"` (obligatorio en beta)
   - `VITE_APP_MODE="full"` (los links hacen el resto)
   - `GEMINI_API_KEY` (opcional; sin clave hay respuestas de respaldo)
8. `npm install` → `npm run dev` (local) o `npm run build` + `npm start` (prod).

## 4. Alta del gimnasio beta

- Opción A (recomendada): en `?app=admin` → **Crear cuenta de gimnasio** (registra tenant + sede + plan inicial + dueño admin).
- Opción B: insertar el gym en Supabase y registrar al dueño con ese `gym_id`.

## 5. Qué cambió en esta pasada beta (resumen técnico)

- **Seguridad**: eliminadas contraseñas universales (`admin123`, `123456`, login vacío) y OTP universales en beta real; quedan solo con `VITE_DEMO_MODE=true` y sin Supabase.
- **Sin mezcla de datos**: al cambiar de gimnasio se limpian las colecciones del tenant anterior; `refreshGymData` reemplaza (no fusiona); alta de socio ya no auto-loguea como el socio; quitados los saltos admin↔socio con 1 click (solo demo local).
- **Acceso**: nuevo `validateDniAccess` con la misma regla que el QR (vencimiento, gracia, suspensión, sede, anti-duplicado 2 min); `AdminAccessControlView` reescrito DNI-primero con QR de alta secundario y corrección del simulador (usaba token falso → siempre NOT_FOUND; mostraba `success/reason` inexistentes y `branchName` inexistente).
- **Persistencia**: `createGroupClass` ahora inserta en Supabase (antes hacía update y se perdía); `attendance` siempre guarda `gymId`.
- **Credencial socio**: DNI grande + QR chico de alta, sin "token dinámico" falso.
- **DNI obligatorio y único** en alta de socios + índice único `(gym_id, dni)` en Supabase.
- **Zona Maestra** (`/maestro`): nueva capa SuperAdmin con `src/components/maestro/*`, `supabase_superadmin.sql`, y `server.ts` endpoints `/api/superadmin/*`. Dashboard MRR, listado en vivo con ficha detalle, facturación global, logs y soporte.

## 6. Checklist antes de entregar

- [ ] `VITE_DEMO_MODE=false` en el deploy.
- [ ] Corridos `supabase_schema.sql` + `supabase_beta_hardening.sql`.
- [ ] Probado `?app=admin` (alta socio con DNI, cobro, acceso por DNI, suspensión).
- [ ] Probado `?app=socio` (rutina, reserva de clase, credencial).
- [ ] Probado bloqueo cruzado (socio en link admin y viceversa).
- [ ] Cargados planes y precios reales del gym.
- [ ] WhatsApp de recordatorio con número real del gym.

## 7. Pendiente conocido (fase 2, no bloquea beta)

- Mercado Pago real (Checkout Pro + webhooks): hoy el pago online es simulado/auditable y el manual queda `pending` hasta aprobación.
- QR con token rotativo real anti-captura.
- Turnos con cupo por sede y lista de espera automática ya existen; falta notificación push.

# FuerzaFit — Ecosistema 3 Apps para Gimnasios 💪

Todo comparte la **misma base Supabase** (PostgreSQL + RLS por `gym_id`), pero son 3 aplicaciones para 3 tipos de usuario.

```
┌──────────────────────────┐
│   SUPABASE (PostgreSQL)  │
│   Auth + Tablas RLS      │
└─────────────┬────────────┘
              │
   ┌──────────┼──────────┐
   ▼          ▼          ▼
Panel Web   Kiosco    App Móvil
Admin      Molinete    Socios
```

## 1. Panel Web Admin (`/` + `/admin` + `/maestro`)

**Ubicación:** `src/` (Vite + React + TypeScript + Tailwind) — este repo, pestaña `web`.

**Accesos:**
| Acceso | URL | Quién entra |
|---|---|---|
| Maestro | `/maestro` (`/superadmin`) | `superadmin` |
| Dueño/Staff | `/admin` | `admin`, `reception`, `trainer` |
| Socios (web) | `/socio` | `member` |
| **Kiosco** | `/kiosco` (`?app=kiosk`) | público (valida DNI) |
| Landing | `/` | público |

**Correr:**
```bash
npm install
npm run dev
# http://localhost:3000/
# http://localhost:3000/admin
# http://localhost:3000/kiosco  ← tablet molinete, teclado táctil DNI
# http://localhost:3000/socio
# http://localhost:3000/maestro
```

**Kiosco:** Pantalla completa, teclado numérico táctil, valida `validateDniAccess(dni, branchId, 'dni_kiosk')`, sonido `success/warning/error`, auto-reset 4s, `attendance.access_method='dni_kiosk'`. Para recepción: `?app=kiosk` en tablet montada.

## 2. App Móvil Socios (`/mobile` — Flutter)

**Ubicación:** `mobile/` (Flutter 3.16+, Riverpod, Supabase Flutter).

**Solo `role=member`.** No hay paneles admin.

**Módulos:** Auth, Dashboard (membresía + DNI grande + renovar MP/WhatsApp), Rutina Interactiva (timer descanso +30s/sonido), Clases (cupos realtime), Carnet Digital (DNI + QR alta), Pagos y Progreso.

**Correr:**
```bash
cd mobile
# editar lib/config/supabase_config.dart con tu URL y anon key (misma que web)
flutter pub get
flutter run
flutter build apk --release
```

## 3. Base de Datos (Supabase)

**Misma base para las 3 apps.** RLS por `gym_id`.

**Orden de ejecución en SQL Editor:**
1. `supabase_schema.sql` — tablas base (`profiles`, `memberships`, `attendance`, `routines`, `classes`, etc.)
2. `supabase_beta_hardening.sql` — cierra fugas + índice único `(gym_id, dni)`
3. `supabase_migration_discount.sql` — `discount_ars` para promos
4. `supabase_superadmin.sql` — Zona Maestra (`tenant_subscriptions`, `tenant_invoices`, `feature_flags`, etc.)

**RLS clave (ya en `supabase_schema.sql` y prompt 3):**
- `profiles`: admin lee/edita su `gym_id`; socio solo su perfil.
- `memberships`/`payments`: socio solo lee suyos; recepción/admin de su `gym_id` crean/actualizan.
- `attendance`: recepción/kiosco insertan con `access_method` (`manual_checkin`, `dni_kiosk`, `qr_scanner`, `turnstile`).
- `routines`/`classes`: entrenador/admin crean; socio solo lee asignadas o de su `branch_id`.

Sin Supabase, las 3 apps corren en **modo demo** local (mock).

## Prompts para separar en repos independientes

Si querés clonar cada app en repo aparte, usá los 3 prompts de `PROMPTS_SEPARACION.md` (incluidos en este repo).

## Deploy

- **Web+Kiosco:** `npm run build` + `npm start` (Railway/Render, `PORT` automático). Vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_DEMO_MODE=false`.
- **Mobile:** `flutter build apk` → Play Store / TestFlight / APK directo.

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Web dev puerto 3000 |
| `npm run build` | Build cliente + servidor |
| `npm start` | Prod desde `dist/` |
| `npm run lint` | `tsc --noEmit` |

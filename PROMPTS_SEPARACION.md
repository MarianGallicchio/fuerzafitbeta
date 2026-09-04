# Prompts listos para separar FuerzaFit en 3 repos independientes

Si querés clonar cada parte en repo aparte (Cursor / VS Code / AI Studio / Claude), copiá estos prompts tal cual.

---

## 🟢 PROMPT 1: App Móvil Socios (Flutter)

```
Actúa como un desarrollador senior especialista en Flutter y Supabase. 
Voy a construir la aplicación móvil oficial para SOCIOS de una cadena de gimnasios llamada "FuerzaFit" (iOS y Android).

REGLAS DE NEGOCIO DEL GIMNASIO:
1. Exclusiva para el rol "member" (socios/alumnos). No hay paneles de administración acá.
2. IMPORTANTE: El acceso diario físico al molinete del gimnasio es por DNI en una pantalla táctil, NO por escaneo diario de QR. El código QR del carnet digital es solo para el alta inicial en recepción.
3. Backend: Supabase (PostgreSQL + Supabase Auth). La base ya tiene las tablas: profiles, memberships, routines, classes, class_bookings, payments, progress_metrics, attendance.
4. Identidad visual: Dark theme atlético premium (fondo #090D16, tarjetas #1E293B, acento verde esmeralda #10B981, tipografía limpia).

MÓDULOS REQUERIDOS:
1. Auth: Login y recuperación de clave con Supabase Auth.
2. Dashboard: Estado de membresía (Activa, En Gracia, Vencida), días restantes, banner destacado con su DNI para entrar al molinete y botón para renovar cuota por Mercado Pago / WhatsApp.
3. Rutina Interactiva: Lista de ejercicios por día, registro de peso/repeticiones, y un temporizador de descanso activo entre series (+30s, saltar, alerta sonora al terminar).
4. Clases Grupales: Ver grilla, cupos restantes en tiempo real, reservar lugar y cancelar reservas.
5. Carnet Digital: Tarjeta visual con DNI grande, botón "Copiar DNI" y QR oficial de alta.
6. Historial de Pagos y Progreso Físico (peso kg, % grasa, medidas).

Genera la estructura limpia con Provider/Riverpod, modelos fuertemente tipados, servicios resilientes a fallos de red y dependencias de pubspec.yaml.
```

---

## 🟢 PROMPT 2: Panel Web Admin y Recepción (React + Vite)

```
Actúa como un arquitecto Full Stack experto en React, TypeScript, Tailwind CSS y Supabase.
Estoy desarrollando el panel de administración central y recepción de "FuerzaFit" para LATAM.

ROLES Y ARQUITECTURA:
- Administrador / Recepcionista / Entrenador (con multi-inquilino gym_id).
- Modo Kiosco/Molinete integrado: vista ligera táctil para tablets montadas sobre molinete (?app=kiosk) que valida acceso por DNI con teclado virtual y emite señales de apertura/rechazo sonoras y visuales.
- Métodos de acceso en attendance: 'manual_checkin' (DNI en mostrador), 'dni_kiosk' (tótem molinete), 'qr_scanner' (alta de socio) y 'turnstile' (apertura manual de emergencia).

VISTAS PRINCIPALES:
1. Dashboard de métricas: socios activos, ingresos del mes en ARS, accesos del día, retención y alertas de vencimiento en período de gracia.
2. Control de Acceso: validación en tiempo real por DNI, apertura de emergencia, historial de ingresos y exportación a CSV.
3. Gestión de Socios: alta rápida con asignación de plan, generación automática de DNI/QR token y registro de cobro inicial.
4. Caja y Pagos: cobros en efectivo, transferencia y links de pago de Mercado Pago Checkout Pro.
5. Rutinas y Clases Grupales: creador de rutinas para asignar a socios y grilla de horarios.

Todo debe estar conectado al cliente de Supabase respetando las políticas RLS y manteniendo persistencia en tiempo real.
```

---

## 🟢 PROMPT 3: Base de Datos y Seguridad (Supabase SQL)

```
Actúa como un DBA especialista en PostgreSQL y Supabase RLS.
Tengo una plataforma SaaS multi-gimnasio llamada FuerzaFit donde cada gimnasio tiene un gym_id (UUID).

Necesito auditar y generar las políticas de Row Level Security (RLS) para:
1. profiles: los administradores leen y editan los perfiles de su gym_id. Los socios (role = 'member') solo pueden leer su propio perfil.
2. memberships y payments: los socios solo leen sus propias cuotas y pagos; recepción y administradores de su gym_id pueden crear y actualizar.
3. attendance: recepción y el molinete (kiosco) pueden insertar registros de acceso indicando access_method ('manual_checkin', 'dni_kiosk', 'turnstile', 'qr_scanner').
4. routines y classes: los entrenadores y administradores crean; los socios solo leen las asignadas a ellos o las clases de su branch_id.

Devuelve el script SQL listo para ejecutar en el SQL Editor de Supabase con funciones de trigger automáticas para created_at y actualización de estado.
```

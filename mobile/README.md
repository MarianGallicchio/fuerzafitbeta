# FuerzaFit Mobile — App Socios (Flutter)

App exclusiva para `role = member`. No hay paneles admin acá.

**Stack:** Flutter + Supabase (misma base que web) + Riverpod + GoRouter. Dark theme #090D16 / #1E293B / #10B981.

## Módulos
1. Auth (Supabase Auth)
2. Dashboard: membresía (Activa/Gracia/Vencida), días restantes, DNI grande + botón Renovar (MP/WhatsApp)
3. Rutina Interactiva: por día, registro peso/reps, timer descanso +30s/saltar/sonido
4. Clases: grilla, cupos en tiempo real, reservar/cancelar
5. Carnet Digital: DNI grande + Copiar DNI + QR de alta (solo alta inicial)
6. Pagos y Progreso

## Config
Editar `lib/config/supabase_config.dart` con tu URL y anon key (misma que web).
```
flutter pub get
flutter run
flutter build apk --release
```

## Supabase
Usa las mismas tablas: `profiles`, `memberships`, `routines`, `classes`, `payments`, `progress_metrics`, `attendance` (con `access_method` dni_kiosk/manual_checkin).

// FuerzaFit Beta — Separación Admin / Socios por link.
// Mismo código, dos accesos que no mezclan datos ni roles:
//
//  - Panel dueño/staff:  https://tu-dominio.com/?app=admin   (o /?app=admin)
//  - App socios:         https://tu-dominio.com/?app=socio   (o /?app=socio)
//  - Modo completo (dev): sin parámetro o ?app=full
//
// También se puede fijar por build con VITE_APP_MODE=admin|socio|full.
// El modo solo controla QUÉ roles pueden iniciar sesión en esa URL.
// El aislamiento real de datos lo hace Supabase RLS por gym_id.

export type AppMode = 'full' | 'admin' | 'member' | 'kiosk';

const VALID_MODES: AppMode[] = ['full', 'admin', 'member', 'kiosk'];

function normalizeMode(raw: string | null | undefined): AppMode | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (v === 'admin' || v === 'owner' || v === 'staff' || v === 'dueno' || v === 'dueño') return 'admin';
  if (v === 'socio' || v === 'socios' || v === 'member' || v === 'members' || v === 'atleta') return 'member';
  if (v === 'kiosco' || v === 'kiosk' || v === 'molinete' || v === 'totem') return 'kiosk';
  if (v === 'full' || v === 'all' || v === 'completo') return 'full';
  return null;
}

export function getAppMode(): AppMode {
  // 1. Path dedicado tiene máxima prioridad: /admin, /socio y /kiosco son páginas distintas
  // Soporta tanto local (/admin) como GitHub Pages (/FuerzaFit/admin) y subrutas (/admin/login)
  try {
    const path = window.location.pathname.toLowerCase();
    // busca segmento /admin, /socio o /kiosco en cualquier posición (para base /FuerzaFit/)
    if (/(^|\/)(admin|panel|dueno|dueño|staff)(\/|$|\?|#)/.test(path)) return 'admin';
    if (/(^|\/)(socio|socios|member|members|atleta|login|ingreso)(\/|$|\?|#)/.test(path)) return 'member';
    if (/(^|\/)(kiosco|kiosk|molinete|totem)(\/|$|\?|#)/.test(path)) return 'kiosk';
  } catch {}
  // 2. Query param (compatibilidad con links antiguos ?app=admin)
  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery =
      normalizeMode(params.get('app')) ||
      normalizeMode(params.get('mode')) ||
      // compat: ?admin=1  /  ?socio=1 / ?kiosco=1
      (params.has('admin') ? ('admin' as AppMode) : null) ||
      (params.has('socio') || params.has('member') ? ('member' as AppMode) : null) ||
      (params.has('kiosco') || params.has('kiosk') || params.has('molinete') ? ('kiosk' as AppMode) : null);
    if (fromQuery && VALID_MODES.includes(fromQuery)) return fromQuery;
  } catch {
    // SSR / entorno sin window — caer a env
  }

  // 3. Variable de entorno (para builds separadas admin-dist / socio-dist)
  const fromEnv = normalizeMode(
    (import.meta as any)?.env?.VITE_APP_MODE as string | undefined
  );
  if (fromEnv && VALID_MODES.includes(fromEnv)) return fromEnv;

  return 'full';
}

export const isDemoModeEnabled = (): boolean => {
  // Solo en desarrollo local o con flag explícito se permiten atajos demo
  // (login 1-click, OTP 123456, switchUser). En beta con Supabase real: false.
  const flag = (import.meta as any)?.env?.VITE_DEMO_MODE as string | undefined;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return (import.meta as any)?.env?.DEV === true;
};

export interface AppModeConfig {
  mode: AppMode;
  badge: string;
  title: string;
  subtitle: string;
  allowedRoles: string[];
  loginHint: string;
}

export function getAppModeConfig(mode: AppMode): AppModeConfig {
  if (mode === 'admin') {
    return {
      mode,
      badge: 'Acceso Dueño / Staff · Beta',
      title: 'Panel del Gimnasio',
      subtitle: 'Gestión de socios, caja, accesos por DNI, rutinas y reportes.',
      allowedRoles: ['admin', 'reception', 'trainer', 'superadmin'],
      loginHint: 'Ingresá con tu cuenta de dueño o staff. Las cuentas de socio no pueden entrar por este link.'
    };
  }
  if (mode === 'member') {
    return {
      mode,
      badge: 'App Socios · Beta',
      title: 'Mi Entrenamiento',
      subtitle: 'Tu rutina, clases, progreso y credencial con DNI.',
      allowedRoles: ['member'],
      loginHint: 'Ingresá con tu cuenta de socio. El ingreso diario al gym es con tu DNI en recepción.'
    };
  }
  if (mode === 'kiosk') {
    return {
      mode,
      badge: 'Terminal Molinete / Tótem · DNI',
      title: 'Control de Acceso',
      subtitle: 'Terminal de autoservicio para ingreso de socios por DNI.',
      allowedRoles: ['superadmin', 'admin', 'reception', 'trainer', 'member'],
      loginHint: 'Terminal pública de ingreso por DNI para molinete o tótem.'
    };
  }
  return {
    mode,
    badge: 'Beta',
    title: 'FuerzaFit',
    subtitle: 'Gestión integral para gimnasios.',
    allowedRoles: ['superadmin', 'admin', 'reception', 'trainer', 'member'],
    loginHint: ''
  };
}

export function isRoleAllowedInMode(role: string | undefined, mode: AppMode): boolean {
  if (mode === 'full') return true;
  const cfg = getAppModeConfig(mode);
  return !!role && cfg.allowedRoles.includes(role);
}

function getBasePrefix(): string {
  try {
    const p = window.location.pathname.toLowerCase();
    if (p.startsWith('/fuerzafit/') || p === '/fuerzafit') return '/FuerzaFit';
  } catch {}
  return '';
}

export function buildModeUrl(mode: Exclude<AppMode, 'full'>): string {
  // Usa rutas limpias /admin, /socio y /kiosco respetando base /FuerzaFit/ en Pages
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('app');
    url.searchParams.delete('mode');
    url.searchParams.delete('kiosco');
    url.searchParams.delete('kiosk');
    url.searchParams.delete('molinete');
    url.hash = '';
    const base = getBasePrefix();
    const seg = mode === 'admin' ? '/admin' : mode === 'member' ? '/socio' : '/kiosco';
    url.pathname = `${base}${seg}`;
    return url.toString();
  } catch {
    return mode === 'admin' ? '/admin' : mode === 'member' ? '/socio' : '/kiosco';
  }
}

// Helper para navegación SPA sin reload (pushState)
export function navigateToMode(mode: Exclude<AppMode, 'full'>): void {
  try {
    const base = getBasePrefix();
    const seg = mode === 'admin' ? '/admin' : mode === 'member' ? '/socio' : '/kiosco';
    const target = `${base}${seg}`;
    if (window.location.pathname.toLowerCase() !== target.toLowerCase()) {
      window.history.pushState({}, '', target);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  } catch {
    window.location.href = buildModeUrl(mode);
  }
}

export function navigateToPath(path: string): void {
  try {
    const base = getBasePrefix();
    // si path es / o /admin /socio /kiosco y estamos en Pages, prefijar base
    let target = path;
    if (base && path.startsWith('/') && !path.toLowerCase().startsWith(base.toLowerCase())) {
      // solo prefijar para rutas internas conocidas
      if (['/admin','/socio','/kiosco','/kiosk','/','/login','/ingreso'].some(r => path === r || path.startsWith(r + '/') || path.startsWith(r + '?'))) {
        target = `${base}${path}`;
      }
    }
    if (window.location.pathname !== target) {
      window.history.pushState({}, '', target);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  } catch {
    window.location.href = path;
  }
}

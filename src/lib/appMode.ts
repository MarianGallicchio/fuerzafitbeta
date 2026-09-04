// FuerzaFit Beta — 3 apps compartiendo Supabase
//  - Maestro:    /maestro (/superadmin alias) — SuperAdmin
//  - Panel:      /admin — Dueño/Staff
//  - Socios:     /socio — Redirige a App Móvil (Flutter) — ver /mobile
//  - Full:       / — Landing

export type AppMode = 'full' | 'admin' | 'member' | 'superadmin';

const VALID_MODES: AppMode[] = ['full', 'admin', 'member', 'superadmin'];

function normalizeMode(raw: string | null | undefined): AppMode | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (v === 'superadmin' || v === 'maestro' || v === 'super_admin' || v === 'master') return 'superadmin';
  if (v === 'admin' || v === 'owner' || v === 'staff' || v === 'dueno' || v === 'dueño') return 'admin';
  if (v === 'socio' || v === 'socios' || v === 'member' || v === 'members' || v === 'atleta') return 'member';
  if (v === 'full' || v === 'all' || v === 'completo') return 'full';
  return null;
}

export function getAppMode(): AppMode {
  try {
    const path = window.location.pathname.toLowerCase();
    if (/(^|\/)(superadmin|super_admin|maestro|master)(\/|$|\?|#)/.test(path)) return 'superadmin';
    if (/(^|\/)(admin|panel|dueno|dueño|staff)(\/|$|\?|#)/.test(path)) return 'admin';
    if (/(^|\/)(socio|socios|member|members|atleta|login|ingreso)(\/|$|\?|#)/.test(path)) return 'member';
  } catch {}
  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery =
      normalizeMode(params.get('app')) ||
      normalizeMode(params.get('mode')) ||
      (params.has('admin') ? ('admin' as AppMode) : null) ||
      (params.has('socio') || params.has('member') ? ('member' as AppMode) : null) ||
      (params.has('maestro') || params.has('superadmin') ? ('superadmin' as AppMode) : null);
    if (fromQuery && VALID_MODES.includes(fromQuery)) return fromQuery;
  } catch {}
  const fromEnv = normalizeMode((import.meta as any)?.env?.VITE_APP_MODE as string | undefined);
  if (fromEnv && VALID_MODES.includes(fromEnv)) return fromEnv;
  return 'full';
}

export const isDemoModeEnabled = (): boolean => {
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
  if (mode === 'superadmin') {
    return {
      mode,
      badge: 'Zona Maestra · SuperAdmin',
      title: 'Maestro FuerzaFit',
      subtitle: 'Control total de tenants, facturación y soporte.',
      allowedRoles: ['superadmin'],
      loginHint: 'Solo cuentas SuperAdmin.'
    };
  }
  if (mode === 'admin') {
    return {
      mode,
      badge: 'Acceso Dueño / Staff · Beta',
      title: 'Panel del Gimnasio',
      subtitle: 'Gestión de socios, caja, accesos por DNI, rutinas y reportes.',
      allowedRoles: ['admin', 'reception', 'trainer', 'superadmin'],
      loginHint: 'Ingresá con tu cuenta de dueño o staff.'
    };
  }
  if (mode === 'member') {
    return {
      mode,
      badge: 'App Socios · Beta',
      title: 'Mi Entrenamiento',
      subtitle: 'Tu rutina, clases, progreso y credencial con DNI. Ahora también en App Móvil.',
      allowedRoles: ['member'],
      loginHint: 'Ingresá con tu cuenta de socio. Recomendado: usar la App Móvil Flutter.'
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
  if (mode === 'superadmin') return role === 'superadmin';
  const cfg = getAppModeConfig(mode);
  return !!role && cfg.allowedRoles.includes(role);
}

function getBasePrefix(): string {
  try {
    const p = window.location.pathname.toLowerCase();
    if (p.startsWith('/fuerzafit/') || p === '/fuerzafit' || p.startsWith('/fuerzafitbeta/') || p === '/fuerzafitbeta') {
      const seg = p.split('/')[1];
      return `/${seg}`;
    }
  } catch {}
  return '';
}

export function buildModeUrl(mode: Exclude<AppMode, 'full'>): string {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('app');
    url.searchParams.delete('mode');
    url.hash = '';
    const base = getBasePrefix();
    const seg = mode === 'admin' ? '/admin' : mode === 'member' ? '/socio' : '/maestro';
    url.pathname = `${base}${seg}`;
    return url.toString();
  } catch {
    return mode === 'admin' ? '/admin' : mode === 'member' ? '/socio' : '/maestro';
  }
}

export function navigateToMode(mode: Exclude<AppMode, 'full'>): void {
  try {
    const base = getBasePrefix();
    const seg = mode === 'admin' ? '/admin' : mode === 'member' ? '/socio' : '/maestro';
    const target = `${base}${seg}`;
    if (window.location.pathname.toLowerCase() !== target.toLowerCase()) {
      window.history.pushState({}, '', target);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  } catch {
    window.location.href = buildModeUrl(mode as any);
  }
}

export function navigateToPath(path: string): void {
  try {
    const base = getBasePrefix();
    let target = path;
    if (base && path.startsWith('/') && !path.toLowerCase().startsWith(base.toLowerCase())) {
      if (['/admin','/socio','/maestro','/superadmin','/','/login','/ingreso'].some(r => path === r || path.startsWith(r + '/') || path.startsWith(r + '?'))) {
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

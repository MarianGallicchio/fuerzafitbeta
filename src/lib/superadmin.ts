import { User } from '../types';

export const isSuperAdmin = (user: User | null | undefined): boolean =>
  !!user && user.role === 'superadmin';

export const SUPERADMIN_ONLY = 'Solo SuperAdmin (Maestro) puede acceder a esta zona.';

export const TENANT_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  trial: { label: 'Prueba', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
  active: { label: 'Activo', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  past_due: { label: 'Mora', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  suspended: { label: 'Suspendido', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  frozen: { label: 'Congelado', color: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
  churned: { label: 'Baja', color: 'bg-slate-800 text-slate-500' },
  blocked: { label: 'Bloqueado', color: 'bg-rose-900/30 text-rose-300 border-rose-700' },
};

export const PLAN_TIER_LABEL: Record<string, string> = {
  starter: 'Starter · $49k/mes',
  pro: 'Pro · $79k/mes',
  enterprise: 'Enterprise · $129k/mes',
};

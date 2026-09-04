import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { isSuperAdmin } from '../../lib/superadmin';
import { LogOut, Crown, Building2, CreditCard, LifeBuoy, Activity, Settings, Megaphone, ShieldAlert, LayoutDashboard, Zap } from 'lucide-react';
import { MaestroDashboard } from '../maestro/MaestroDashboard';
import { MaestroTenantsView } from '../maestro/MaestroTenantsView';
import { MaestroBillingView } from '../maestro/MaestroBillingView';
import { MaestroSupportView } from '../maestro/MaestroSupportView';
import { MaestroOpsView } from '../maestro/MaestroOpsView';
import { MaestroFlagsView } from '../maestro/MaestroFlagsView';
import { MaestroAnnouncementsView } from '../maestro/MaestroAnnouncementsView';
import { MaestroAutomationsView } from '../maestro/MaestroAutomationsView';

type Tab = 'dashboard' | 'tenants' | 'billing' | 'support' | 'ops' | 'flags' | 'announcements' | 'automations';

export const SuperAdminLayout: React.FC = () => {
  const { currentUser, logout } = useGym();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [masterInput, setMasterInput] = useState('');
  const [masterError, setMasterError] = useState('');
  const [unlocked, setUnlocked] = useState(() => {
    try { return sessionStorage.getItem('fuerzafit_maestro_unlocked') === '1'; } catch { return false; }
  });

  // Página totalmente distinta: noindex + estilo aislado
  React.useEffect(() => {
    document.title = 'FuerzaFit — Zona Maestra (Privado)';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow, noarchive';
    document.head.appendChild(meta);
    return () => { try { document.head.removeChild(meta); } catch {} };
  }, []);

  const MAESTRO_KEY = (import.meta as any).env?.VITE_MAESTRO_KEY || 'FuerzaMaestro2026!';

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (masterInput === MAESTRO_KEY) {
      try { sessionStorage.setItem('fuerzafit_maestro_unlocked', '1'); } catch {}
      setUnlocked(true);
      setMasterError('');
    } else {
      setMasterError('Clave maestra incorrecta. Solo dueño del software.');
    }
  };

  if (!isSuperAdmin(currentUser)) {
    return (
      <div className="min-h-screen bg-[#05070a] flex items-center justify-center p-6 text-slate-100">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-3xl p-8 text-center space-y-3 shadow-2xl">
          <ShieldAlert className="w-8 h-8 text-rose-400 mx-auto" />
          <h1 className="font-black text-white">Zona Maestra — Acceso denegado</h1>
          <p className="text-xs text-slate-400">Esta página es totalmente privada. Solo dueño del software o empleado autorizado.</p>
          <p className="text-[11px] text-slate-500">Tu rol actual: <span className="font-mono text-slate-300">{currentUser?.role || 'sin sesión'}</span></p>
          <p className="text-[11px] text-slate-500">Si sos el dueño, iniciá sesión como superadmin en <span className="font-mono">/maestro</span>.</p>
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[#05070a] text-slate-100 flex items-center justify-center p-6">
        <form onSubmit={handleUnlock} className="w-full max-w-sm bg-slate-900 border border-violet-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-violet-600 flex items-center justify-center font-black text-white">M</div>
            <h1 className="font-black text-white">Zona Maestra — Clave privada</h1>
            <p className="text-xs text-slate-400">Solo dueño del software. Ingresá la clave maestra (VITE_MAESTRO_KEY).</p>
          </div>
          <input
            type="password"
            value={masterInput}
            onChange={e=>setMasterInput(e.target.value)}
            placeholder="Clave maestra"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-violet-500 focus:outline-none"
            autoFocus
          />
          {masterError && <p className="text-xs text-rose-400">{masterError}</p>}
          <button type="submit" className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-black">Desbloquear</button>
          <p className="text-[11px] text-slate-500 text-center">Se guarda solo en esta sesión. No queda en el repo.</p>
        </form>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'tenants', label: 'Gimnasios', icon: <Building2 className="w-4 h-4" /> },
    { id: 'billing', label: 'Facturación', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'support', label: 'Soporte', icon: <LifeBuoy className="w-4 h-4" /> },
    { id: 'ops', label: 'Salud', icon: <Activity className="w-4 h-4" /> },
    { id: 'flags', label: 'Módulos', icon: <Settings className="w-4 h-4" /> },
    { id: 'announcements', label: 'Anuncios', icon: <Megaphone className="w-4 h-4" /> },
    { id: 'automations', label: 'Automatizaciones', icon: <Zap className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <aside className="w-64 shrink-0 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col">
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center font-black">M</div>
          <div>
            <p className="text-sm font-black">MAESTRO</p>
            <p className="text-[11px] text-violet-300">SuperAdmin FuerzaFit</p>
          </div>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left ${tab===t.id?'bg-violet-600 text-white':'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              {t.icon}<span>{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-800">
          <div className="text-xs mb-2"><p className="font-bold text-white truncate">{currentUser?.name}</p><p className="text-slate-400 truncate text-[11px]">{currentUser?.email}</p></div>
          <button onClick={() => logout()} className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold flex items-center justify-center gap-2"><LogOut className="w-4 h-4"/>Salir</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <span className="font-black">Zona Maestra</span>
            <span className="hidden sm:inline text-xs text-slate-400">— 4 pilares: tenants · monetización · soporte · sistema</span>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            {tabs.map(t => (
              <button key={t.id} onClick={()=>setTab(t.id)} className={`p-2 rounded-xl ${tab===t.id?'bg-violet-600 text-white':'bg-slate-800 text-slate-400'}`}>{t.icon}</button>
            ))}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.12),_transparent_60%)]">
          {tab==='dashboard' && <MaestroDashboard />}
          {tab==='tenants' && <MaestroTenantsView />}
          {tab==='billing' && <MaestroBillingView />}
          {tab==='support' && <MaestroSupportView />}
          {tab==='ops' && <MaestroOpsView />}
          {tab==='flags' && <MaestroFlagsView />}
          {tab==='announcements' && <MaestroAnnouncementsView />}
          {tab==='automations' && <MaestroAutomationsView />}
        </main>
      </div>
    </div>
  );
};

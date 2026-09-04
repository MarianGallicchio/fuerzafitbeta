import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { TENANT_STATUS_LABEL, PLAN_TIER_LABEL } from '../../lib/superadmin';
import { Search, Eye, Pause, PlayCircle, Ban, ShieldCheck, LogIn } from 'lucide-react';

export const SuperTenantsView: React.FC = () => {
  const { allGyms, users } = useGym();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const filtered = allGyms.filter(g => {
    const matchQ = !q || g.name.toLowerCase().includes(q.toLowerCase()) || g.slug.includes(q.toLowerCase());
    const matchF = filter==='all' || (g as any).status_detail===filter || g.status===filter;
    return matchQ && matchF;
  });

  const impersonate = (gymId: string) => {
    // Mock impersonación: guarda token efímero y recarga como ese gym
    localStorage.setItem('fuerzafit_impersonate_gym', gymId);
    alert(`Impersonando gimnasio ${gymId} — en prod esto crea impersonation_sessions (5min) y hace login como admin de ese gym. Recargá /admin para ver.`);
    window.location.href = '/admin';
  };

  const action = (gym: any, status: string) => {
    // Mock: en prod PATCH /superadmin/tenants/:id/status
    alert(`Mock: ${gym.name} → ${status}. En prod: PATCH /superadmin/tenants/${gym.id}/status + audit_logs + email + corte RLS.`);
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-black text-white text-lg">Gimnasios (Tenants)</h1>
          <p className="text-xs text-slate-400">Alta, suspensión, congelamiento, baja e impersonación. Licencia: trial/active/mora/bloqueado.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar gym o slug" className="pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white w-56" />
          </div>
          <select value={filter} onChange={e=>setFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white">
            <option value="all">Todos</option>
            <option value="trial">Prueba</option>
            <option value="active">Activo</option>
            <option value="past_due">Mora</option>
            <option value="suspended">Suspendido</option>
            <option value="frozen">Congelado</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="p-3">Gimnasio</th>
                <th className="p-3">Plan</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Socios</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map(g => {
                const status = (g as any).status_detail || g.status;
                const badge = TENANT_STATUS_LABEL[status] || TENANT_STATUS_LABEL.active;
                const members = users.filter(u => (u.gymId===g.id && u.role==='member')).length;
                return (
                  <tr key={g.id} className="hover:bg-slate-800/40">
                    <td className="p-3">
                      <p className="font-bold text-white">{g.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{g.slug} · {g.id.slice(0,8)}</p>
                    </td>
                    <td className="p-3 text-slate-300">{PLAN_TIER_LABEL[(g as any).plan] || g.plan}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${badge.color}`}>{badge.label}</span></td>
                    <td className="p-3 text-white font-bold">{members}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button onClick={()=>impersonate(g.id)} className="px-2.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold flex items-center gap-1"><LogIn className="w-3.5 h-3.5"/>Impersonar</button>
                        <button onClick={()=>action(g,'suspended')} className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20" title="Suspender"><Ban className="w-3.5 h-3.5"/></button>
                        <button onClick={()=>action(g,'frozen')} className="p-1.5 rounded-lg bg-slate-700 text-slate-300" title="Congelar"><Pause className="w-3.5 h-3.5"/></button>
                        <button onClick={()=>action(g,'active')} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400" title="Reactivar"><PlayCircle className="w-3.5 h-3.5"/></button>
                        <button className="p-1.5 rounded-lg bg-slate-800 text-slate-400" title="Ver detalle"><Eye className="w-3.5 h-3.5"/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length===0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">Sin gimnasios con ese filtro.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Impersonar crea sesión de 5 min auditada en `impersonation_sessions` y loguea IP.
        </div>
      </div>
    </div>
  );
};

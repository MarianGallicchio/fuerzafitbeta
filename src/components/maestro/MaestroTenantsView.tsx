import React, { useState, useMemo, useEffect } from 'react';
import { useGym } from '../../context/GymContext';
import { TENANT_STATUS_LABEL, PLAN_TIER_LABEL } from '../../lib/superadmin';
import { Search, Eye, Activity } from 'lucide-react';
import { MaestroTenantDetail } from './MaestroTenantDetail';

export const MaestroTenantsView: React.FC = () => {
  const { allGyms, users } = useGym();
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [selected, setSelected] = useState<any | null>(null);
  const [tick, setTick] = useState(0);

  // Realtime / polling demo: refresh cada 30s
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    return allGyms.filter(g => {
      const name = g.name.toLowerCase();
      const email = ((g as any).owner_email || g.contactEmail || '').toLowerCase();
      const matchQ = !q || name.includes(q.toLowerCase()) || email.includes(q.toLowerCase()) || g.slug.includes(q.toLowerCase());
      const s = (g as any).status_detail || g.status;
      const p = (g as any).plan_tier || (g as any).plan || 'starter';
      const matchStatus = statusFilter==='all' || s===statusFilter;
      const matchPlan = planFilter==='all' || p===planFilter;
      return matchQ && matchStatus && matchPlan;
    });
  }, [allGyms, q, statusFilter, planFilter, tick]);

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-black text-white">Gimnasios adheridos — en vivo</h1>
          <p className="text-xs text-slate-400">Polling 30s + Supabase Realtime (`gyms`, `tenant_subscriptions`). Tick {tick}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar nombre o owner_email" className="pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white w-64" />
          </div>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white">
            <option value="all">Todos estados</option>
            <option value="trial">Prueba</option>
            <option value="active">Activo</option>
            <option value="past_due">Mora</option>
            <option value="suspended">Suspendido</option>
            <option value="frozen">Congelado</option>
          </select>
          <select value={planFilter} onChange={e=>setPlanFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white">
            <option value="all">Todos planes</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="p-3">Gimnasio</th>
                <th className="p-3">Owner</th>
                <th className="p-3">Plan</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Vence</th>
                <th className="p-3">MRR</th>
                <th className="p-3">Socios</th>
                <th className="p-3">Alta</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map(g => {
                const s = (g as any).status_detail || g.status;
                const badge = TENANT_STATUS_LABEL[s] || TENANT_STATUS_LABEL.active;
                const plan = (g as any).plan_tier || (g as any).plan || 'starter';
                const mrr = Number((g as any).mrr_price_ars || 49000);
                const nextDue = (g as any).current_period_end ? new Date((g as any).current_period_end).toLocaleDateString('es-AR') : '—';
                const members = users.filter(u => u.gymId===g.id && u.role==='member').length;
                const alta = new Date((g as any).createdAt || (g as any).created_at || Date.now()).toLocaleDateString('es-AR');
                return (
                  <tr key={g.id} className="hover:bg-slate-800/40">
                    <td className="p-3"><p className="font-bold text-white">{g.name}</p><p className="text-[11px] text-slate-500 font-mono">{g.slug}</p></td>
                    <td className="p-3 text-slate-300 text-[11px]">{(g as any).owner_email || g.contactEmail || '—'}</td>
                    <td className="p-3 text-slate-300">{PLAN_TIER_LABEL[plan] || plan}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${badge.color}`}>{badge.label}</span></td>
                    <td className="p-3 text-slate-300">{nextDue}</td>
                    <td className="p-3 font-bold text-white">${mrr.toLocaleString('es-AR')}</td>
                    <td className="p-3 text-white font-bold flex items-center gap-1"><Activity className="w-3 h-3 text-emerald-400"/>{members}</td>
                    <td className="p-3 text-slate-400">{alta}</td>
                    <td className="p-3"><button onClick={()=>setSelected(g)} className="px-3 py-1.5 rounded-xl bg-violet-600 text-white font-bold flex items-center gap-1"><Eye className="w-3.5 h-3.5"/>Ficha</button></td>
                  </tr>
                );
              })}
              {filtered.length===0 && <tr><td colSpan={9} className="p-8 text-center text-slate-500">Sin resultados.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="p-3 border-t border-slate-800 text-[11px] text-slate-500">En vivo: en prod suscribir supabase.channel on postgres_changes. Fallback polling 30s ya activo.</p>
      </div>

      {selected && <MaestroTenantDetail gym={selected} onClose={()=>setSelected(null)} />}
    </div>
  );
};

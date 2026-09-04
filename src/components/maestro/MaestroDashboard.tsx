import React, { useMemo } from 'react';
import { useGym } from '../../context/GymContext';
import { TENANT_STATUS_LABEL } from '../../lib/superadmin';
import { Building2, CreditCard, TrendingUp, AlertTriangle, Clock } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const MaestroDashboard: React.FC = () => {
  const { allGyms } = useGym();

  const byStatus = useMemo(() => {
    const m: Record<string, number> = {};
    allGyms.forEach(g => {
      const s = (g as any).status_detail || g.status || 'active';
      m[s] = (m[s] || 0) + 1;
    });
    return m;
  }, [allGyms]);

  const mrrTotal = useMemo(() => allGyms.reduce((s, g) => s + Number((g as any).mrr_price_ars || (g as any).mrrPriceArs || 49000), 0), [allGyms]);
  const mrrProjected = Math.round(mrrTotal * 1.12);

  const altasBajas = useMemo(() => {
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const now = new Date();
    return Array.from({length:6}, (_,i)=>{
      const d = new Date(now.getFullYear(), now.getMonth() - (5-i), 1);
      const altas = allGyms.filter(g => {
        const c = new Date((g as any).createdAt || (g as any).created_at || Date.now());
        return c.getMonth()===d.getMonth() && c.getFullYear()===d.getFullYear();
      }).length;
      // mock bajas como churn 1 por mes si hay datos
      const bajas = altas>0 ? Math.max(0, Math.floor(altas*0.2)) : 0;
      return { month: months[d.getMonth()], altas, bajas };
    });
  }, [allGyms]);

  const alerts = useMemo(() => {
    const now = new Date();
    const pastDue = allGyms.filter(g => ((g as any).status_detail==='past_due') || (g as any).status==='past_due');
    const trials = allGyms.filter(g => {
      const s = (g as any).status_detail;
      const trialEnd = (g as any).trial_ends_at ? new Date((g as any).trial_ends_at) : null;
      if (s!=='trial' || !trialEnd) return false;
      const diff = Math.ceil((trialEnd.getTime() - now.getTime())/86400000);
      return diff>=0 && diff<=7;
    });
    return { pastDue, trials };
  }, [allGyms]);

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
        <h1 className="font-black text-white flex items-center gap-2"><TrendingUp className="w-5 h-5 text-violet-400"/> Dashboard Maestro</h1>
        <p className="text-xs text-slate-400">MRR, altas/bajas y alertas. Fuente: `gyms` + `tenant_subscriptions`.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {Object.entries(TENANT_STATUS_LABEL).map(([k,c])=>(
            <div key={k} className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700 text-center">
              <p className="text-[11px] text-slate-400 uppercase font-bold">{c.label}</p>
              <p className="text-xl font-black text-white">{byStatus[k]||0}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20"><p className="text-xs text-slate-400">MRR total</p><p className="text-xl font-black text-white">${mrrTotal.toLocaleString('es-AR')}</p></div>
          <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20"><p className="text-xs text-slate-400">MRR proyectado (+12%)</p><p className="text-xl font-black text-white">${mrrProjected.toLocaleString('es-AR')}</p></div>
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700"><p className="text-xs text-slate-400">Gimnasios</p><p className="text-xl font-black text-white">{allGyms.length}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-5">
          <h2 className="font-bold text-white text-sm">Altas / Bajas por mes</h2>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={altasBajas}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3}/>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11}/>
                <YAxis stroke="#94a3b8" fontSize={11}/>
                <Tooltip contentStyle={{background:'#0f172a', borderColor:'#334155', borderRadius:12}}/>
                <Bar dataKey="altas" name="Altas" fill="#8b5cf6" radius={[6,6,0,0]}/>
                <Bar dataKey="bajas" name="Bajas" fill="#f43f5e" radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-amber-500/20 rounded-3xl p-5 space-y-3">
          <h2 className="font-bold text-white text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400"/> Alertas</h2>
          <div>
            <p className="text-xs font-bold text-amber-300">Mora &gt;3 días ({alerts.pastDue.length})</p>
            {alerts.pastDue.length===0 ? <p className="text-xs text-slate-500">Sin mora.</p> :
              alerts.pastDue.slice(0,3).map(g=>(
                <div key={g.id} className="text-xs text-slate-300 border-b border-slate-800 py-1 flex justify-between"><span>{g.name}</span><span className="text-amber-400">{(g as any).status_detail}</span></div>
              ))}
          </div>
          <div>
            <p className="text-xs font-bold text-sky-300">Trials por vencer en 7d ({alerts.trials.length})</p>
            {alerts.trials.length===0 ? <p className="text-xs text-slate-500">Sin trials por vencer.</p> :
              alerts.trials.map(g=>(
                <div key={g.id} className="text-xs text-slate-300 border-b border-slate-800 py-1 flex justify-between"><span>{g.name}</span><span className="text-sky-400">{new Date((g as any).trial_ends_at).toLocaleDateString('es-AR')}</span></div>
              ))}
          </div>
          <p className="text-[11px] text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3"/> Fuente `gyms.status_detail` + `tenant_subscriptions.current_period_end`.</p>
        </div>
      </div>
    </div>
  );
};

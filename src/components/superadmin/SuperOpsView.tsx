import React from 'react';
import { Activity, AlertTriangle, Users, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const SuperOpsView: React.FC = () => {
  const data = [
    { gym: 'Palermo', socios: 142 },
    { gym: 'Central', socios: 98 },
    { gym: 'PowerHouse', socios: 67 },
    { gym: 'Norte', socios: 31 },
  ];
  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
        <h1 className="font-black text-white flex items-center gap-2"><Activity className="w-5 h-5 text-violet-400"/> Monitoreo en Tiempo Real</h1>
        <p className="text-xs text-slate-400">Socios activos por gym, concurrencia (15m) y logs. Fuente: `tenant_metrics_daily` + `attendance` Realtime.</p>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700"><p className="text-xs text-slate-400">Tenants activos</p><p className="text-xl font-black text-white">4</p></div>
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700"><p className="text-xs text-slate-400">Socios totales</p><p className="text-xl font-black text-emerald-400">338</p></div>
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20"><p className="text-xs text-slate-400">Errores hoy</p><p className="text-xl font-black text-rose-400">2</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
          <h2 className="font-bold text-white text-sm flex items-center gap-2"><Users className="w-4 h-4 text-violet-400"/>Socios activos por gym</h2>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3}/>
                <XAxis dataKey="gym" stroke="#94a3b8" fontSize={11}/>
                <YAxis stroke="#94a3b8" fontSize={11}/>
                <Tooltip contentStyle={{background:'#0f172a', borderColor:'#334155', borderRadius:12}}/>
                <Bar dataKey="socios" fill="#8b5cf6" radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
          <h2 className="font-bold text-white text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400"/> Logs recientes</h2>
          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700"><span className="text-slate-500">14:22</span> <span className="text-amber-300">[warn]</span> <span className="text-white">gym Central: Supabase rate limit OTP</span></div>
            <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/20"><span className="text-slate-500">13:05</span> <span className="text-rose-400">[error]</span> <span className="text-white">PowerHouse: MP webhook signature invalid</span></div>
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700"><span className="text-slate-500">11:40</span> <span className="text-emerald-400">[audit]</span> <span className="text-white">maestro@fuerzafit.com → tenant.frozen Gym Norte</span></div>
          </div>
          <p className="text-[11px] text-slate-500">Tablas `error_logs` y `audit_logs` con Realtime. Filtrar por `gym_id`.</p>
        </div>
      </div>
    </div>
  );
};

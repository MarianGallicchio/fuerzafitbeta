import React, { useState } from 'react';
import { Activity, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const MaestroOpsView: React.FC = () => {
  const [filterGym, setFilterGym] = useState('all');
  const data = [{gym:'Palermo', v:2},{gym:'Central', v:5},{gym:'PowerHouse', v:1},{gym:'Norte', v:0}];
  const errors = [
    { at:'14:22', gym:'Central', lvl:'warning', msg:'Supabase rate limit OTP' },
    { at:'13:05', gym:'PowerHouse', lvl:'error', msg:'MP webhook signature invalid' },
    { at:'11:40', gym:'Norte', lvl:'info', msg:'audit: maestro froze gym' },
  ];
  const audits = [
    { at:'14:21', actor:'maestro@fuerzafit.com', action:'tenant.suspend', gym:'Gym Norte', payload:'{to: suspended}' },
    { at:'13:00', actor:'maestro@fuerzafit.com', action:'invoice.mark-paid', gym:'Palermo', payload:'INV-2026-001' },
  ];
  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
        <h1 className="font-black text-white flex items-center gap-2"><Activity className="w-5 h-5 text-violet-400"/> Salud del sistema</h1>
        <p className="text-xs text-slate-400">Errores últimas 24h por tenant + audit trail. Tablas `error_logs` y `audit_logs` en vivo.</p>
        <div className="flex items-center gap-2 mt-3">
          <select value={filterGym} onChange={e=>setFilterGym(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white">
            <option value="all">Todos los gyms</option>
            <option value="Central">Central</option>
            <option value="Palermo">Palermo</option>
          </select>
          <span className="text-xs text-slate-500">Filtro por gym aplicado a ambos feeds.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
          <h2 className="font-bold text-white text-sm">Errores 24h por tenant</h2>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.filter(d=>filterGym==='all'||d.gym===filterGym)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3}/>
                <XAxis dataKey="gym" stroke="#94a3b8" fontSize={11}/>
                <YAxis stroke="#94a3b8" fontSize={11}/>
                <Tooltip contentStyle={{background:'#0f172a', borderColor:'#334155', borderRadius:12}}/>
                <Bar dataKey="v" fill="#f43f5e" radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
          <h2 className="font-bold text-white text-sm">Feed error_logs (vivo)</h2>
          <div className="space-y-2 text-xs font-mono max-h-64 overflow-y-auto">
            {errors.filter(e=>filterGym==='all'||e.gym===filterGym).map((e,i)=>(
              <div key={i} className={`p-2.5 rounded-xl border ${e.lvl==='error'?'bg-rose-950/30 border-rose-500/20 text-rose-300':'bg-slate-800/60 border-slate-700 text-slate-300'}`}>
                <span className="text-slate-500">{e.at}</span> <span className={e.lvl==='error'?'text-rose-400':'text-amber-300'}>[{e.lvl}]</span> <span className="text-white">{e.gym}: {e.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
        <h2 className="font-bold text-white text-sm">Audit trail</h2>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400"><tr><th className="p-2">Cuándo</th><th className="p-2">Quién</th><th className="p-2">Acción</th><th className="p-2">Gym</th><th className="p-2">Payload</th></tr></thead>
            <tbody className="divide-y divide-slate-800/60">
              {audits.map((a,i)=>(
                <tr key={i} className="hover:bg-slate-800/30"><td className="p-2 text-slate-400">{a.at}</td><td className="p-2 text-violet-300">{a.actor}</td><td className="p-2 font-mono text-white">{a.action}</td><td className="p-2 text-slate-300">{a.gym}</td><td className="p-2 font-mono text-slate-400">{a.payload}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

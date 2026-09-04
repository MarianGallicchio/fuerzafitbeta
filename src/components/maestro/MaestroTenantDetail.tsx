import React, { useState } from 'react';
import { TENANT_STATUS_LABEL } from '../../lib/superadmin';
import { X, Save, Pause, Ban, LogIn, CreditCard, ExternalLink } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const MaestroTenantDetail: React.FC<{ gym: any; onClose: () => void }> = ({ gym, onClose }) => {
  const [status, setStatus] = useState((gym as any).status_detail || gym.status);
  const [mrr, setMrr] = useState(Number((gym as any).mrr_price_ars || 49000));
  const [setup, setSetup] = useState(Number((gym as any).setup_fee_ars || 79000));
  const [modules, setModules] = useState<string[]>((gym as any).enabled_modules || ['access','routines','classes']);
  const [notes, setNotes] = useState((gym as any).notes_superadmin || '');
  const [frozenUntil, setFrozenUntil] = useState((gym as any).frozen_until ? (gym as any).frozen_until.slice(0,10) : '');
  const [suspendReason, setSuspendReason] = useState('');

  const toggleModule = (k: string) => setModules(m => m.includes(k) ? m.filter(x=>x!==k) : [...m, k]);

  const save = () => alert(`Mock: PATCH gyms/${gym.id} {status_detail:${status}, mrr:${mrr}, setup:${setup}, modules:${modules.join(',')}, notes, frozen_until, suspended_reason} + audit_logs`);
  const markPaid = () => alert(`Mock: POST /superadmin/invoices/:id/mark-paid`);
  const genLink = () => alert(`Mock: POST /superadmin/invoices -> mp_preference_id + link https://mpago.la/...`);
  const freeze = () => alert(`Mock: PATCH gyms/${gym.id} {frozen_until: ${frozenUntil}}`);
  const suspend = () => {
    if (!suspendReason.trim()) return alert('Motivo obligatorio para suspender');
    alert(`Mock: PATCH gyms/${gym.id} {status_detail: suspended, suspended_reason: ${suspendReason}}`);
  };
  const impersonate = () => {
    const token = `imp_${gym.id}_${Date.now()}`;
    localStorage.setItem('fuerzafit_impersonate_gym', gym.id);
    fetch('/api/superadmin/tenants/'+gym.id+'/impersonate', {method:'POST'}).catch(()=>{});
    alert(`Impersonación creada ${token} (5min) + audit_logs. Redirigiendo a /admin`);
    window.location.href = '/admin';
  };

  const metrics = [
    { day: '01/08', socios: 42, pico: 18 },
    { day: '08/08', socios: 58, pico: 22 },
    { day: '15/08', socios: 71, pico: 31 },
    { day: '22/08', socios: 84, pico: 29 },
    { day: '28/08', socios: 91, pico: 35 },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
          <div>
            <h2 className="font-black text-white">{gym.name} — Ficha Maestro</h2>
            <p className="text-xs text-slate-400">{gym.slug} · {gym.id}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400"><X className="w-4 h-4"/></button>
        </div>

        <div className="p-5 space-y-6">
          {/* Datos generales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300">Estado</label>
              <select value={status} onChange={e=>setStatus(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white">
                {Object.keys(TENANT_STATUS_LABEL).map(k=> <option key={k} value={k}>{TENANT_STATUS_LABEL[k].label}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs text-slate-400">MRR ARS</label><input type="number" value={mrr} onChange={e=>setMrr(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"/></div>
                <div><label className="text-xs text-slate-400">Setup ARS</label><input type="number" value={setup} onChange={e=>setSetup(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"/></div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300">Módulos habilitados</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {['access','routines','classes','store','analytics'].map(m=>(
                    <button key={m} onClick={()=>toggleModule(m)} className={`px-2.5 py-1 rounded-full text-xs font-bold border ${modules.includes(m)?'bg-emerald-500/15 text-emerald-400 border-emerald-500/30':'bg-slate-800 text-slate-400'}`}>{m}</button>
                  ))}
                </div>
              </div>
              <div><label className="text-xs text-slate-400">Notas superadmin</label><textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"/></div>
              <button onClick={save} className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black flex items-center justify-center gap-2"><Save className="w-4 h-4"/>Guardar cambios</button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700">
                <h3 className="text-xs font-bold text-white">Facturas de este gym</h3>
                <div className="mt-2 space-y-1.5 text-xs">
                  <div className="flex justify-between p-2 rounded-xl bg-slate-900 border border-slate-800"><span>INV-2026-014 · subscription · $49k</span><span className="text-amber-400">pending</span></div>
                  <div className="flex justify-between p-2 rounded-xl bg-slate-900 border border-slate-800"><span>INV-2026-001 · setup_fee · $79k</span><span className="text-emerald-400">paid</span></div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={markPaid} className="flex-1 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold">Marcar pagado</button>
                  <button onClick={genLink} className="flex-1 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-bold flex items-center justify-center gap-1"><ExternalLink className="w-3.5 h-3.5"/> Link MP</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700">
                  <label className="text-xs text-slate-400">Congelar hasta</label>
                  <input type="date" value={frozenUntil} onChange={e=>setFrozenUntil(e.target.value)} className="w-full mt-1 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"/>
                  <button onClick={freeze} className="w-full mt-2 py-1.5 rounded-xl bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1"><Pause className="w-3.5 h-3.5"/>Congelar</button>
                </div>
                <div className="p-3 rounded-2xl bg-rose-950/20 border border-rose-500/20">
                  <label className="text-xs text-rose-300">Suspender (motivo obligatorio)</label>
                  <input value={suspendReason} onChange={e=>setSuspendReason(e.target.value)} placeholder="Falta de pago 15d" className="w-full mt-1 px-2 py-1.5 rounded-lg bg-slate-900 border border-rose-500/30 text-xs text-white"/>
                  <button onClick={suspend} className="w-full mt-2 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center justify-center gap-1"><Ban className="w-3.5 h-3.5"/>Suspender</button>
                </div>
              </div>

              <button onClick={impersonate} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 text-white text-xs font-black flex items-center justify-center gap-2"><LogIn className="w-4 h-4"/>Ingresar como admin de este gimnasio (5 min)</button>
              <p className="text-[11px] text-slate-500">Crea `impersonation_sessions` + `audit_logs` con IP.</p>
            </div>
          </div>

          {/* Métricas */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4">
            <h3 className="text-xs font-bold text-white">Métricas — socios activos y pico ocupación</h3>
            <div className="h-48 mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3}/>
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11}/>
                  <YAxis stroke="#94a3b8" fontSize={11}/>
                  <Tooltip contentStyle={{background:'#0f172a', borderColor:'#334155', borderRadius:12}}/>
                  <Line type="monotone" dataKey="socios" stroke="#8b5cf6" strokeWidth={2} dot={false}/>
                  <Line type="monotone" dataKey="pico" stroke="#10b981" strokeWidth={2} dot={false}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-500">Fuente `tenant_metrics_daily`. En vivo vía Realtime o polling.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

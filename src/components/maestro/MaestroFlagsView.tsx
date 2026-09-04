import React from 'react';
import { Settings } from 'lucide-react';
const flags = [
  { key:'access_qr', name:'Acceso QR/Molinete', enabled:true, plan:'starter' },
  { key:'routines', name:'Rutinas por bloques', enabled:true, plan:'starter' },
  { key:'classes', name:'Clases con cupo', enabled:true, plan:'starter' },
  { key:'store', name:'Tienda interna', enabled:false, plan:'pro' },
  { key:'analytics', name:'Reportes avanzados', enabled:false, plan:'pro' },
];
export const MaestroFlagsView: React.FC = () => (
  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
    <h1 className="font-black text-white flex items-center gap-2"><Settings className="w-5 h-5 text-violet-400"/> Feature Flags</h1>
    <p className="text-xs text-slate-400">Global + overrides por tenant (`tenant_feature_overrides`). Sin deploy.</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
      {flags.map(f=>(
        <div key={f.key} className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 flex items-center justify-between">
          <div><p className="text-sm font-bold text-white">{f.name}</p><p className="text-[11px] text-slate-400 font-mono">{f.key} · requiere {f.plan}</p></div>
          <span className={`px-3 py-1 rounded-full text-xs font-black border ${f.enabled?'bg-emerald-500/15 text-emerald-400 border-emerald-500/30':'bg-slate-700 text-slate-400'}`}>{f.enabled?'ON':'OFF'}</span>
        </div>
      ))}
    </div>
  </div>
);

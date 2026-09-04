import React, { useState } from 'react';
import { Settings, Megaphone, ToggleLeft, Send } from 'lucide-react';

const flags = [
  { key: 'access_qr', name: 'Acceso QR/Molinete', enabled: true },
  { key: 'routines', name: 'Rutinas por bloques', enabled: true },
  { key: 'classes', name: 'Clases con cupo', enabled: true },
  { key: 'store', name: 'Tienda interna', enabled: false },
  { key: 'analytics', name: 'Reportes avanzados', enabled: false },
];

export const SuperConfigView: React.FC = () => {
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annAudience, setAnnAudience] = useState('all_admins');

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
        <h1 className="font-black text-white flex items-center gap-2"><Settings className="w-5 h-5 text-violet-400"/> Configuración Global</h1>
        <p className="text-xs text-slate-400">Activa/desactiva módulos sin deploy. Overrides por gym en `tenant_feature_overrides`.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {flags.map(f => (
            <div key={f.key} className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">{f.name}</p>
                <p className="text-[11px] text-slate-400 font-mono">{f.key}</p>
              </div>
              <button className={`px-3 py-1.5 rounded-full text-xs font-black border ${f.enabled?'bg-emerald-500/15 text-emerald-400 border-emerald-500/30':'bg-slate-700 text-slate-400'}`}>
                {f.enabled?'ON':'OFF'}
              </button>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-500 mt-2">En prod: `PUT /superadmin/features` → actualiza `feature_flags` y purga caché del gym.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
        <h2 className="font-bold text-white flex items-center gap-2"><Megaphone className="w-4 h-4 text-amber-400"/> Aviso global</h2>
        <input value={annTitle} onChange={e=>setAnnTitle(e.target.value)} placeholder="Título: Mantenimiento programado domingo 02:00" className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white" />
        <textarea value={annBody} onChange={e=>setAnnBody(e.target.value)} placeholder="Cuerpo del mensaje para todos los admins..." rows={3} className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white" />
        <div className="flex items-center gap-2">
          <select value={annAudience} onChange={e=>setAnnAudience(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white">
            <option value="all_admins">Todos los admins</option>
            <option value="all_gyms">Todos los gyms</option>
          </select>
          <button onClick={()=>alert(`Mock: POST /superadmin/announcements {title, body, audience: ${annAudience}} → Realtime + email`)} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-2">
            <Send className="w-4 h-4"/>Enviar aviso
          </button>
        </div>
        <p className="text-[11px] text-slate-500">Inserta en `global_announcements` y dispara `notifications` (ya existe `GymContext:2395`).</p>
      </div>
    </div>
  );
};

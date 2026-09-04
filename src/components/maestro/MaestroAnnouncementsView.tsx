import React, { useState } from 'react';
import { Megaphone, Send } from 'lucide-react';
export const MaestroAnnouncementsView: React.FC = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [aud, setAud] = useState('all_admins');
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
      <h1 className="font-black text-white flex items-center gap-2"><Megaphone className="w-4 h-4 text-amber-400"/> Anuncios globales</h1>
      <p className="text-xs text-slate-400">Crea `global_announcements` y dispara `notifications` a todos los admins/gyms.</p>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Título: Mantenimiento domingo 02:00" className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"/>
      <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Cuerpo..." rows={3} className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"/>
      <div className="flex gap-2">
        <select value={aud} onChange={e=>setAud(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white">
          <option value="all_admins">Todos los admins</option>
          <option value="all_gyms">Todos los gyms</option>
          <option value="all">Todos</option>
        </select>
        <button onClick={()=>alert(`Mock: POST /superadmin/announcements ${title} → ${aud}`)} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-2"><Send className="w-4 h-4"/>Enviar</button>
      </div>
    </div>
  );
};

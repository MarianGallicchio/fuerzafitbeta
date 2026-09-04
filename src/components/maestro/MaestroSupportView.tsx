import React from 'react';
import { LifeBuoy, MessageCircle } from 'lucide-react';

export const MaestroSupportView: React.FC = () => {
  const tickets = [
    { id:'TK-1021', gym:'FuerzaFit Palermo', subject:'No entra mail OTP', priority:'high', status:'open', at:'hace 2h' },
    { id:'TK-1020', gym:'Gym Central', subject:'Molinete no abre', priority:'critical', status:'pending', at:'hace 5h' },
  ];
  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
        <h1 className="font-black text-white flex items-center gap-2"><LifeBuoy className="w-5 h-5 text-violet-400"/> Soporte Maestro</h1>
        <p className="text-xs text-slate-400">Bandeja `support_tickets` filtrable por gimnasio, prioridad y estado. Responder hace append a `messages` jsonb.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
          <div className="p-3 border-b border-slate-800 text-xs font-bold text-slate-300">Tickets</div>
          <div className="divide-y divide-slate-800/60">
            {tickets.map(t=>(
              <div key={t.id} className="p-3 hover:bg-slate-800/50">
                <div className="flex justify-between"><span className="font-mono text-xs text-white">{t.id}</span><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${t.priority==='critical'?'bg-rose-500/20 text-rose-400':'bg-amber-500/20 text-amber-400'}`}>{t.priority}</span></div>
                <p className="text-xs font-bold text-white truncate">{t.subject}</p>
                <p className="text-[11px] text-slate-400">{t.gym} · {t.at} · {t.status}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col min-h-[360px]">
          <div className="flex-1 p-3 rounded-2xl bg-slate-800/60 border border-slate-700 text-xs"><p className="text-slate-400 text-[11px]">Palermo — hace 2h</p><p className="text-white">Hola, no nos llega el mail de OTP a socios con Outlook.</p></div>
          <div className="flex gap-2 pt-4 border-t border-slate-800 mt-4">
            <input placeholder="Responder..." className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"/>
            <button className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold flex items-center gap-1"><MessageCircle className="w-4 h-4"/>Enviar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

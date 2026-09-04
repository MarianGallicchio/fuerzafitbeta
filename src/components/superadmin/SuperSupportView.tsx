import React from 'react';
import { LifeBuoy, MessageCircle, Clock } from 'lucide-react';

export const SuperSupportView: React.FC = () => {
  const tickets = [
    { id: 'TK-1021', gym: 'FuerzaFit Palermo', subject: 'No entra mail de OTP', priority: 'high', status: 'open', at: 'hace 2h' },
    { id: 'TK-1020', gym: 'Gym Central', subject: 'Molinete no abre', priority: 'critical', status: 'pending', at: 'hace 5h' },
    { id: 'TK-1019', gym: 'PowerHouse', subject: 'Consulta precios', priority: 'low', status: 'resolved', at: 'ayer' },
  ];
  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
        <h1 className="font-black text-white flex items-center gap-2"><LifeBuoy className="w-5 h-5 text-violet-400"/> Soporte Maestro</h1>
        <p className="text-xs text-slate-400">Tickets por gym, con mensajes y auditoría. Realtime con Supabase.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Tickets</span>
            <span className="text-[11px] text-slate-500">{tickets.length} abiertos</span>
          </div>
          <div className="divide-y divide-slate-800/60">
            {tickets.map(t => (
              <div key={t.id} className="p-3 hover:bg-slate-800/50 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-white">{t.id}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${t.priority==='critical'?'bg-rose-500/20 text-rose-400':t.priority==='high'?'bg-amber-500/20 text-amber-400':'bg-slate-700 text-slate-300'}`}>{t.priority}</span>
                </div>
                <p className="text-xs font-bold text-white truncate">{t.subject}</p>
                <p className="text-[11px] text-slate-400">{t.gym} · {t.at} · <span className="text-violet-300">{t.status}</span></p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col min-h-[360px]">
          <div className="flex-1 space-y-3">
            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700 text-xs">
              <p className="text-slate-400 text-[11px]">FuerzaFit Palermo — hace 2h</p>
              <p className="text-white">Hola, no nos llega el mail de OTP a socios con Outlook. ¿Pueden revisar?</p>
            </div>
            <div className="p-3 rounded-2xl bg-violet-600/20 border border-violet-500/30 text-xs ml-8">
              <p className="text-violet-200">Vimos logs: Supabase rate limit por envíos. Ajustamos y reenviamos. Probá ahora con 123456 en demo.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-4 border-t border-slate-800">
            <input placeholder="Responder..." className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white" />
            <button className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold flex items-center gap-1"><MessageCircle className="w-4 h-4"/>Enviar</button>
          </div>
          <p className="text-[11px] text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3"/> SLA: responder &lt;4h. Todo queda en `support_tickets.messages` + `audit_logs`.</p>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Zap, Clock, Mail, Ban, FileText, ToggleLeft, Play } from 'lucide-react';

export const MaestroAutomationsView: React.FC = () => {
  const [cfg, setCfg] = useState({
    alert3d: true,
    suspend7d: true,
    genInvoices: true,
    pdfAuto: true,
    whatsapp: true,
  });

  const toggle = (k: keyof typeof cfg) => setCfg(c => ({ ...c, [k]: !c[k] }));

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
        <h1 className="font-black text-white flex items-center gap-2"><Zap className="w-5 h-5 text-amber-400"/> Automatizaciones</h1>
        <p className="text-xs text-slate-400">Cron diario <code className="bg-slate-800 px-1 rounded">/cron/billing-check</code> + jobs en Supabase. Sin intervención manual.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400"><Mail className="w-5 h-5"/></div>
              <div><p className="text-sm font-bold text-white">Alerta mora 3 días</p><p className="text-[11px] text-slate-400">Email + in-app a admin del gym</p></div>
            </div>
            <button onClick={()=>toggle('alert3d')} className={`px-3 py-1.5 rounded-full text-xs font-black border ${cfg.alert3d?'bg-emerald-500/15 text-emerald-400 border-emerald-500/30':'bg-slate-700 text-slate-400'}`}>{cfg.alert3d?'ON':'OFF'}</button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-400"><Ban className="w-5 h-5"/></div>
              <div><p className="text-sm font-bold text-white">Suspensión 7 días</p><p className="text-[11px] text-slate-400">Bloquea login y molinete, guarda audit</p></div>
            </div>
            <button onClick={()=>toggle('suspend7d')} className={`px-3 py-1.5 rounded-full text-xs font-black border ${cfg.suspend7d?'bg-emerald-500/15 text-emerald-400 border-emerald-500/30':'bg-slate-700 text-slate-400'}`}>{cfg.suspend7d?'ON':'OFF'}</button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-400"><FileText className="w-5 h-5"/></div>
              <div><p className="text-sm font-bold text-white">Generar facturas</p><p className="text-[11px] text-slate-400">Crea tenant_invoices cada 30d</p></div>
            </div>
            <button onClick={()=>toggle('genInvoices')} className={`px-3 py-1.5 rounded-full text-xs font-black border ${cfg.genInvoices?'bg-emerald-500/15 text-emerald-400 border-emerald-500/30':'bg-slate-700 text-slate-400'}`}>{cfg.genInvoices?'ON':'OFF'}</button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400"><Clock className="w-5 h-5"/></div>
              <div><p className="text-sm font-bold text-white">WhatsApp recordatorio</p><p className="text-[11px] text-slate-400">Aviso 48h antes del vencimiento</p></div>
            </div>
            <button onClick={()=>toggle('whatsapp')} className={`px-3 py-1.5 rounded-full text-xs font-black border ${cfg.whatsapp?'bg-emerald-500/15 text-emerald-400 border-emerald-500/30':'bg-slate-700 text-slate-400'}`}>{cfg.whatsapp?'ON':'OFF'}</button>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={()=>alert('Mock: POST /superadmin/automations/test → ejecuta cron ahora y loguea en audit_logs')} className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black flex items-center gap-2"><Play className="w-4 h-4"/>Probar automatizaciones ahora</button>
          <button className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300">Ver logs cron</button>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">Todo queda en <code className="bg-slate-800 px-1 rounded">audit_logs</code> y <code className="bg-slate-800 px-1 rounded">tenant_invoices</code>. En prod usa <code className="bg-slate-800 px-1 rounded">pg_cron</code> o Edge Function diaria.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
        <h2 className="font-bold text-white text-sm">Más mejoras de interface</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700"><p className="font-bold text-white">Atajos</p><p className="text-slate-400">⌘K para buscar gym, `I` para impersonar</p></div>
          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700"><p className="font-bold text-white">Notificaciones</p><p className="text-slate-400">Campana Realtime para tickets y vencimientos</p></div>
          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700"><p className="font-bold text-white">Modo demo</p><p className="text-slate-400">Toggle para ver datos mock sin Supabase</p></div>
        </div>
      </div>
    </div>
  );
};

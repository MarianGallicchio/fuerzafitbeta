import React from 'react';
import { CreditCard, FileText, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

const mockInvoices = [
  { id: 'INV-2026-001', gym: 'FuerzaFit Palermo', type: 'setup_fee', amount: 79000, status: 'paid', due: '2026-08-01' },
  { id: 'INV-2026-014', gym: 'Gym Central', type: 'subscription', amount: 49000, status: 'pending', due: '2026-09-05' },
  { id: 'INV-2026-015', gym: 'PowerHouse', type: 'subscription', amount: 79000, status: 'overdue', due: '2026-08-28' },
];

export const SuperBillingView: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
        <h1 className="font-black text-white">Facturación Maestra</h1>
        <p className="text-xs text-slate-400">Setup Fee único + suscripción mensual. Mora → alerta 3d → suspensión 7d (cron). Comprobantes PDF.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20"><p className="text-xs text-slate-400">MRR total</p><p className="text-xl font-black text-white">$1.240.000 ARS</p><p className="text-[11px] text-emerald-400">12 tenants activos</p></div>
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20"><p className="text-xs text-slate-400">En mora</p><p className="text-xl font-black text-amber-300">3</p><p className="text-[11px] text-slate-400">Vencidas &gt;3d</p></div>
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20"><p className="text-xs text-slate-400">Para suspender</p><p className="text-xl font-black text-rose-300">1</p><p className="text-[11px] text-slate-400">&gt;7d impago</p></div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-white text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-violet-400"/>Facturas</h2>
          <button onClick={()=>alert('Mock: POST /superadmin/invoices {type: setup_fee}')} className="px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-bold">+ Crear Setup Fee</button>
        </div>
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400">
            <tr><th className="p-3">ID</th><th className="p-3">Gym</th><th className="p-3">Tipo</th><th className="p-3">Vence</th><th className="p-3">Importe</th><th className="p-3">Estado</th><th className="p-3 text-right">Acción</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {mockInvoices.map(inv => (
              <tr key={inv.id} className="hover:bg-slate-800/40">
                <td className="p-3 font-mono text-white">{inv.id}</td>
                <td className="p-3 text-slate-300">{inv.gym}</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px]">{inv.type}</span></td>
                <td className="p-3 text-slate-400">{inv.due}</td>
                <td className="p-3 font-bold text-white">${inv.amount.toLocaleString('es-AR')}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${inv.status==='paid'?'bg-emerald-500/15 text-emerald-400 border-emerald-500/30':inv.status==='overdue'?'bg-rose-500/15 text-rose-400 border-rose-500/30':'bg-amber-500/15 text-amber-400 border-amber-500/30'}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button className="p-1.5 rounded-lg bg-slate-800 text-slate-300" title="Ver PDF"><FileText className="w-3.5 h-3.5"/></button>
                    <button onClick={()=>alert(`Mock: POST /superadmin/invoices/${inv.id}/mark-paid`)} className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold" title="Marcar pagado"><CheckCircle2 className="w-3.5 h-3.5"/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center gap-2"><Clock className="w-3.5 h-3.5"/> Cron <code className="bg-slate-800 px-1 rounded">/cron/billing-check</code> corre diario: 3d → past_due + email, 7d → suspended + bloqueo login.</div>
      </div>
    </div>
  );
};

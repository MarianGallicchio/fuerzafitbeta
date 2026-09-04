import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';

export const MaestroBillingView: React.FC = () => {
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');

  const invoices = [
    { id: 'INV-2026-014', gym: 'Gym Central', type: 'subscription', amount: 49000, discount: 0, status: 'pending', due: '2026-09-05', pdf: '' },
    { id: 'INV-2026-015', gym: 'PowerHouse', type: 'subscription', amount: 79000, status: 'overdue', due: '2026-08-28', pdf: '' },
    { id: 'INV-2026-001', gym: 'FuerzaFit Palermo', type: 'setup_fee', amount: 79000, status: 'paid', due: '2026-08-01', pdf: '#' },
  ];

  const filtered = invoices.filter(i => (status==='all'||i.status===status) && (type==='all'||i.type===type));
  const totalFacturado = invoices.reduce((s,i)=>s+i.amount,0);
  const totalCobrado = invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+i.amount,0);
  const totalVencido = invoices.filter(i=>i.status==='overdue').reduce((s,i)=>s+i.amount,0);
  const tasa = totalFacturado? Math.round(totalCobrado/totalFacturado*100):0;

  const exportCsv = () => {
    const headers = ['ID','Gym','Tipo','Vence','Importe','Descuento','Estado','PDF'];
    const rows = filtered.map(i=> [i.id,i.gym,i.type,i.due,i.amount,i.discount,i.status,i.pdf].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=`Maestro_Facturacion_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
        <h1 className="font-black text-white">Facturación global</h1>
        <p className="text-xs text-slate-400">Filtros por estado y tipo. Totales y tasa de cobro. Fuente `tenant_invoices`.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700"><p className="text-xs text-slate-400">Facturado</p><p className="font-black text-white">${totalFacturado.toLocaleString('es-AR')}</p></div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20"><p className="text-xs text-slate-400">Cobrado</p><p className="font-black text-emerald-400">${totalCobrado.toLocaleString('es-AR')}</p></div>
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20"><p className="text-xs text-slate-400">Vencido</p><p className="font-black text-rose-400">${totalVencido.toLocaleString('es-AR')}</p></div>
          <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20"><p className="text-xs text-slate-400">Tasa cobro</p><p className="font-black text-white">{tasa}%</p></div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <select value={status} onChange={e=>setStatus(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white">
              <option value="all">Todos estados</option>
              <option value="pending">Pendiente</option>
              <option value="paid">Pagada</option>
              <option value="overdue">Vencida</option>
              <option value="void">Anulada</option>
            </select>
            <select value={type} onChange={e=>setType(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white">
              <option value="all">Todos tipos</option>
              <option value="setup_fee">Setup</option>
              <option value="subscription">Suscripción</option>
              <option value="overage">Exceso</option>
            </select>
          </div>
          <button onClick={exportCsv} className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white flex items-center gap-2"><Download className="w-4 h-4"/>Exportar CSV</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400"><tr><th className="p-3">ID</th><th className="p-3">Gym</th><th className="p-3">Tipo</th><th className="p-3">Vence</th><th className="p-3">Importe</th><th className="p-3">Estado</th><th className="p-3">PDF</th></tr></thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map(i=>(
                <tr key={i.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-mono text-white">{i.id}</td>
                  <td className="p-3 text-slate-300">{i.gym}</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px]">{i.type}</span></td>
                  <td className="p-3 text-slate-400">{i.due}</td>
                  <td className="p-3 font-bold text-white">${i.amount.toLocaleString('es-AR')}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${i.status==='paid'?'bg-emerald-500/15 text-emerald-400 border-emerald-500/30':i.status==='overdue'?'bg-rose-500/15 text-rose-400 border-rose-500/30':'bg-amber-500/15 text-amber-400 border-amber-500/30'}`}>{i.status}</span></td>
                  <td className="p-3">{i.pdf ? <a href={i.pdf} className="text-violet-400 hover:underline flex items-center gap-1"><FileText className="w-3.5 h-3.5"/>PDF</a> : <span className="text-slate-500">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

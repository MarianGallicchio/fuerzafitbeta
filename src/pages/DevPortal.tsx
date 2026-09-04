import React from 'react';

export const DevPortal: React.FC = () => {
  const base = window.location.pathname.toLowerCase().includes('/fuerzafitbeta') ? '/fuerzafitbeta' : '';
  const links = [
    { label: 'Landing / Presentación', href: `${base}/`, desc: 'Pública — hero, servicios, planes, sedes' },
    { label: 'Gym Admin (Dueño/Staff)', href: `${base}/admin`, desc: '/admin — Panel completo, Caja, Rutinas. Demo: admin.temp@fuerzafit.com' },
    { label: 'Socios (Web)', href: `${base}/socio`, desc: '/socio — Web demo + anclaje a App Móvil' },
    { label: 'Kiosco (opcional)', href: `${base}/kiosco`, desc: '?app=kiosk — Tablet molinete DNI' },
    { label: 'Maestro', href: `${base}/maestro`, desc: '/maestro — SuperAdmin, clave maestra' },
    { label: 'App Móvil', href: 'https://github.com/MarianGallicchio/fuerzafitbeta/releases', desc: 'APK Flutter — /mobile' },
    { label: 'Soporte', href: `${base}/soporte`, desc: 'Centro de ayuda' },
    { label: 'Reset Pass', href: `${base}/reset-password`, desc: 'Recuperar cuenta' },
  ];
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black">FuerzaFitBeta — Portal Dev</h1>
          <p className="text-xs text-slate-400">Carpetas separadas para testear desde cualquier lado (GitHub Pages). Mismo Supabase.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {links.map(l => (
            <a key={l.href} href={l.href} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/30 text-left block">
              <p className="font-bold text-white text-sm">{l.label}</p>
              <p className="text-xs text-emerald-400 font-mono break-all">{l.href}</p>
              <p className="text-[11px] text-slate-400 mt-1">{l.desc}</p>
            </a>
          ))}
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
          <p className="font-bold text-white">Carpetas en repo:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li><code className="bg-slate-800 px-1 rounded">src/</code> — Web Panel (admin) + Kiosco + Socios web</li>
            <li><code className="bg-slate-800 px-1 rounded">mobile/</code> — App Móvil Flutter (socios)</li>
            <li><code className="bg-slate-800 px-1 rounded">supabase_*.sql</code> — SQL compartido para las 3 apps</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

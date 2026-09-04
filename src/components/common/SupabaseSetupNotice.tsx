import React, { useState } from 'react';
import { Database, AlertTriangle, CheckCircle, Copy, ExternalLink, Terminal, ShieldAlert } from 'lucide-react';
import { isSupabaseConfigured, supabaseConfigDetails } from '../../lib/supabase';

interface SupabaseSetupNoticeProps {
  onDismiss?: () => void;
  isBlocking?: boolean;
}

export const SupabaseSetupNotice: React.FC<SupabaseSetupNoticeProps> = ({
  onDismiss,
  isBlocking = false
}) => {
  const [copied, setCopied] = useState(false);

  const envSample = `# .env
VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`;

  const copyEnv = () => {
    navigator.clipboard.writeText(envSample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (isSupabaseConfigured) return null;

  return (
    <div className={isBlocking 
      ? "fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      : "bg-amber-950/40 border-b border-amber-500/30 text-amber-200 px-4 py-3 text-xs"
    }>
      <div className={isBlocking ? "max-w-xl w-full bg-[#0d1322] border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-5" : "max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3"}>
        
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Configuración de Supabase requerida</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Beta Multi-Tenant
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              FuerzaFit requiere una base de datos PostgreSQL en Supabase conectada para persistir gimnasios, socios, pagos y asistencias sin pérdida de datos.
            </p>
          </div>
        </div>

        {isBlocking ? (
          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400 font-semibold">
                <span className="flex items-center gap-1.5 text-slate-200">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Paso 1: Variables de Entorno (.env)
                </span>
                <button
                  onClick={copyEnv}
                  className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium"
                >
                  {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado' : 'Copiar formato'}
                </button>
              </div>
              <pre className="p-2.5 rounded-lg bg-black/60 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                {envSample}
              </pre>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs text-slate-300">
              <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-sky-400" />
                Paso 2: Ejecutar esquema en Supabase
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Abrí tu proyecto de Supabase en <span className="text-white font-mono">SQL Editor</span> y ejecutá el contenido del archivo <span className="text-sky-400 font-mono">/supabase_schema.sql</span> para generar las tablas, funciones RLS y datos iniciales.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <span>Ir al Dashboard de Supabase</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all"
                >
                  Continuar en modo de prueba local
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[11px] text-amber-300 font-mono">
              URL: {supabaseConfigDetails.hasUrl ? 'Detectada' : 'Faltante'} | KEY: {supabaseConfigDetails.hasAnonKey ? 'Detectada' : 'Faltante'}
            </span>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-xs font-medium underline text-amber-400 hover:text-amber-300"
              >
                Cerrar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

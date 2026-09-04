import React, { useState, useEffect } from 'react';
import { useGym } from '../context/GymContext';
import { Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { navigateToPath } from '../lib/appMode';

export const ResetPasswordPage: React.FC = () => {
  const { updatePassword } = useGym();
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Supabase recovery flow sets session via URL hash
    if (!isSupabaseConfigured || !supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setHasSession(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setMsg({ text: 'Las contraseñas no coinciden.', type: 'error' });
      return;
    }
    setLoading(true);
    const res = await updatePassword(newPass);
    setLoading(false);
    setMsg({ text: res.message, type: res.success ? 'success' : 'error' });
    if (res.success) {
      setTimeout(() => navigateToPath('/'), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-100">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-black text-white">Restablecer contraseña</h1>
          <p className="text-xs text-slate-400">
            {hasSession ? 'Ingresá tu nueva contraseña (mín. 6 caracteres).' : 'Abrí el link que te enviamos por email. Si ya lo hiciste, esta página detectará tu sesión.'}
          </p>
        </div>

        {msg && (
          <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${msg.type==='error'?'bg-rose-500/15 border border-rose-500/30 text-rose-300':'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'}`}>
            {msg.type==='error'?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>}<span>{msg.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Nueva contraseña</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={newPass}
                onChange={e=>setNewPass(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                required
                minLength={6}
              />
              <button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {show ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Repetir contraseña</label>
            <input
              type={show ? 'text' : 'password'}
              value={confirmPass}
              onChange={e=>setConfirmPass(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
              required
              minLength={6}
            />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs disabled:opacity-50">
            {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
          </button>
        </form>

        <div className="text-center">
          <button onClick={()=>navigateToPath('/')} className="text-xs text-slate-400 hover:text-white">← Volver al inicio</button>
        </div>

        <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-[11px] text-slate-400 space-y-1">
          <p className="font-bold text-slate-300">Soporte</p>
          <p>¿No te llega el email? Revisá spam o escribí a <a href="mailto:soporte@fuerzafit.com" className="text-emerald-400">soporte@fuerzafit.com</a> o WhatsApp +54 9 11 5500-1122.</p>
        </div>
      </div>
    </div>
  );
};

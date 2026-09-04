import React, { useState } from 'react';
import { useGym } from '../context/GymContext';
import { ShieldCheck, Mail, Lock, Crown, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

export const MaestroLoginPage: React.FC = () => {
  const { currentUser, loginWithPassword, requestPasswordReset } = useGym();

  if (currentUser) {
    return (
      <div className="min-h-screen bg-[#05070a] flex items-center justify-center p-6 text-slate-100">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-violet-600 flex items-center justify-center text-white animate-pulse">
            <Crown className="w-6 h-6" />
          </div>
          <p className="font-black text-white">¡Hola, {currentUser.name.split(' ')[0]}!</p>
          <p className="text-xs text-slate-400">Entrando a Zona Maestra...</p>
        </div>
      </div>
    );
  }

  const [email, setEmail] = useState('maestro@fuerzafit.com');
  const [password, setPassword] = useState('Maestro2026!');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setFeedback({ text: 'Ingresá email y clave maestra.', type: 'error' }); return; }
    setIsLoading(true); setFeedback(null);
    const res = await loginWithPassword(email, password);
    setIsLoading(false);
    if (!res.success) {
      setFeedback({ text: res.message, type: 'error' });
    } else if (res.user?.role !== 'superadmin') {
      setFeedback({ text: `Tu cuenta es ${res.user?.role}, no superadmin. Usá /admin o /socio.`, type: 'error' });
    } else {
      setFeedback({ text: '¡Bienvenido, Maestro!', type: 'success' });
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await requestPasswordReset(forgotEmail || email);
    setIsLoading(false);
    setFeedback({ text: res.message, type: res.success ? 'success' : 'error' });
    if (res.success) setShowForgot(false);
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-slate-100 flex flex-col">
      <header className="sticky top-0 z-10 bg-[#05070a]/90 backdrop-blur border-b border-violet-900/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-md"><Crown className="w-5 h-5" /></div>
            <span className="font-extrabold text-white">FUERZA<span className="text-violet-400">FIT</span></span>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-violet-500/20 text-violet-300 border border-violet-500/30">ZONA MAESTRA</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.18),_transparent_60%)]">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-slate-900 border border-violet-500/20 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-600 flex items-center justify-center text-white shadow-lg">
              <Crown className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-black text-white">Acceso Maestro</h1>
            <p className="text-xs text-slate-400">Solo dueño del software. No es el acceso de gimnasio (<span className="text-amber-300">/admin</span>).</p>
            <p className="text-[11px] text-violet-300 bg-violet-500/10 border border-violet-500/20 rounded-full px-2 py-0.5 inline-block">Página totalmente distinta y privada</p>
          </div>

          {feedback && (
            <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${feedback.type==='error'?'bg-rose-500/15 border border-rose-500/30 text-rose-300':'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'}`}>
              {feedback.type==='error'?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>}<span>{feedback.text}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Email maestro</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"/>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="maestro@fuerzafit.com" className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none text-sm" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Clave maestra</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"/>
                <input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none text-sm" required />
                <button type="button" onClick={()=>setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPass?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <button type="button" onClick={()=>{ setShowForgot(!showForgot); setForgotEmail(email); }} className="text-[11px] text-violet-400 hover:underline">¿Olvidaste tu clave maestra?</button>
              <span className="text-[11px] text-slate-500">Solo superadmin</span>
            </div>
            <button type="submit" disabled={isLoading} className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 text-white font-black text-sm shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {isLoading ? 'Verificando...' : <><Crown className="w-4 h-4"/> Entrar a Zona Maestra</>}
            </button>
          </form>

          {showForgot && (
            <form onSubmit={handleForgot} className="p-3 rounded-2xl bg-slate-800 border border-violet-500/20 space-y-2">
              <p className="text-xs font-bold text-white">Recuperar acceso maestro</p>
              <p className="text-[11px] text-slate-400">Te enviamos un link a tu email. Revisá spam. Luego entrá a /reset-password.</p>
              <div className="flex gap-2">
                <input type="email" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} placeholder="tu@email.com" className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white" required />
                <button type="submit" disabled={isLoading} className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-black">Enviar</button>
              </div>
            </form>
          )}

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200">
            <p className="font-bold">Acceso totalmente separado de /admin</p>
            <p>Ni gimnasios ni socios pueden entrar acá. Solo el dueño del software con <code className="bg-slate-900 px-1 rounded">maestro@fuerzafit.com</code>.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

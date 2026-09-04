import React, { useState } from 'react';
import { useGym } from '../context/GymContext';
import {
  Dumbbell,
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  RefreshCw,
  Phone,
  MapPin,
  Hash,
  HelpCircle,
  KeyRound
} from 'lucide-react';
import { motion } from 'motion/react';
import { SupportModal } from '../components/common/SupportModal';

export const AdminLoginPage: React.FC = () => {
  const { currentUser, loginWithPassword, registerGymOwnerAccount, loginAsAdmin, requestPasswordReset } = useGym();
  const [showSupport, setShowSupport] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  if (currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 animate-pulse">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="font-black text-white">¡Hola, {currentUser.name.split(' ')[0]}!</p>
          <p className="text-xs text-slate-400">Entrando al panel...</p>
        </div>
      </div>
    );
  }

  const [adminView, setAdminView] = useState<'login' | 'create_gym'>('login');
  const [adminLoginEmail, setAdminLoginEmail] = useState('admin@fuerzafit.com');
  const [adminLoginPassword, setAdminLoginPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  const [gymName, setGymName] = useState('');
  const [gymSlug, setGymSlug] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('+54 9 11 ');
  const [branchAddress, setBranchAddress] = useState('');

  const handleGymNameChange = (name: string) => {
    setGymName(name);
    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
    setGymSlug(slug);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminLoginEmail || !adminLoginPassword) { setFeedbackMessage({ text: 'Ingresá correo y contraseña.', type: 'error' }); return; }
    setIsLoading(true); setFeedbackMessage(null);
    const res = await loginWithPassword(adminLoginEmail, adminLoginPassword);
    setIsLoading(false);
    if (!res.success) setFeedbackMessage({ text: res.message, type: 'error' });
    else setFeedbackMessage({ text: '¡Bienvenido al Panel!', type: 'success' });
  };

  const handleCreateGymTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gymName.trim() || !ownerName.trim() || !ownerEmail.trim() || !ownerPhone.trim()) { setFeedbackMessage({ text: 'Completá datos básicos del gimnasio y titular.', type: 'error' }); return; }
    setIsLoading(true); setFeedbackMessage(null);
    try {
      const res = await registerGymOwnerAccount({ gymName: gymName.trim(), slug: gymSlug.trim() || gymName.toLowerCase().replace(/[^a-z0-9]/g,'-'), ownerName: ownerName.trim(), email: ownerEmail.trim(), password: ownerPassword || 'admin123', phone: ownerPhone.trim(), branchAddress: branchAddress.trim() || 'Sede Principal' });
      setIsLoading(false);
      if (!res.success) setFeedbackMessage({ text: res.message, type: 'error' });
      else setFeedbackMessage({ text: res.message, type: 'success' });
    } catch (err: any) { setIsLoading(false); setFeedbackMessage({ text: err?.message || 'Error al crear gimnasio.', type: 'error' }); }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await requestPasswordReset(forgotEmail || adminLoginEmail);
    setIsLoading(false);
    setFeedbackMessage({ text: res.message, type: res.success ? 'success' : 'error' });
    if (res.success) setShowForgot(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-slate-950 font-black shadow-md"><Dumbbell className="w-5 h-5 -rotate-12" /></div>
            <span className="font-extrabold text-white">FUERZA<span className="text-amber-400">FIT</span></span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">PANEL GESTIÓN</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-[radial-gradient(ellipse_at_top,_rgba(245,158,11,0.14),_transparent_60%)]">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400"><ShieldCheck className="w-6 h-6" /></div>
            <h1 className="text-xl font-black text-white">Panel Dueño / Staff</h1>
            <p className="text-xs text-slate-400">Gestión de socios, caja, molinete por DNI, rutinas y reportes. <strong className="text-amber-300">Cuentas de socio no entran por este acceso.</strong></p>
          </div>

          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold gap-1">
            <button onClick={() => { setAdminView('login'); setFeedbackMessage(null); }} className={`py-2 rounded-xl ${adminView==='login'?'bg-amber-500 text-slate-950 shadow':'text-slate-400'}`}>Ingresar</button>
            <button onClick={() => { setAdminView('create_gym'); setFeedbackMessage(null); }} className={`py-2 rounded-xl ${adminView==='create_gym'?'bg-amber-500 text-slate-950 shadow':'text-slate-400'}`}>Registrar mi gimnasio</button>
          </div>

          {feedbackMessage && (
            <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${feedbackMessage.type==='error'?'bg-rose-500/15 border border-rose-500/30 text-rose-300':'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'}`}>
              {feedbackMessage.type==='error'?<AlertCircle className="w-4 h-4 shrink-0"/>:<CheckCircle2 className="w-4 h-4 shrink-0"/>}<span>{feedbackMessage.text}</span>
            </div>
          )}

          {adminView==='login' ? (
            <>
              <form onSubmit={handleAdminLogin} className="space-y-3.5 text-xs">
                <div><label className="block text-slate-300 font-bold mb-1">Email de administración</label><div className="relative"><Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/><input type="email" value={adminLoginEmail} onChange={e=>setAdminLoginEmail(e.target.value)} placeholder="admin@fuerzafit.com" className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"/></div></div>
                <div><label className="block text-slate-300 font-bold mb-1">Contraseña</label><div className="relative"><Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/><input type="password" value={adminLoginPassword} onChange={e=>setAdminLoginPassword(e.target.value)} placeholder="••••••••" className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"/></div></div>
                <div className="flex items-center justify-between">
                  <button type="button" onClick={()=>{ setShowForgot(!showForgot); setForgotEmail(adminLoginEmail); }} className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"><KeyRound className="w-3 h-3"/>¿Olvidaste tu contraseña?</button>
                  <button type="button" onClick={()=>setShowSupport(true)} className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"><HelpCircle className="w-3 h-3"/>Soporte</button>
                </div>
                <button type="submit" disabled={isLoading} className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">{isLoading?<><RefreshCw className="w-4 h-4 animate-spin"/>Ingresando…</>:<><ShieldCheck className="w-4 h-4"/>Entrar al panel</>}</button>
                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-[11px] text-slate-400">
                  Demo local: <code className="text-amber-300 bg-slate-900 px-1 rounded">admin@fuerzafit.com / admin123</code> o <button type="button" onClick={()=>{ loginAsAdmin(); }} className="text-amber-400 font-bold hover:underline">Ingreso rápido</button>
                  <span className="mx-1">·</span><span>Temp: <code className="text-white bg-slate-900 px-1 rounded">admin.temp@fuerzafit.com / TempAdmin2026!</code></span>
                </div>
              </form>
              {showForgot && (
                <form onSubmit={handleForgot} className="p-3 rounded-2xl bg-slate-800 border border-amber-500/20 space-y-2">
                  <p className="text-xs font-bold text-white">Recuperar cuenta</p>
                  <p className="text-[11px] text-slate-400">Te enviamos un link a tu email para restablecerla. Revisá spam.</p>
                  <div className="flex gap-2">
                    <input type="email" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} placeholder="tu@email.com" className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white" required />
                    <button type="submit" disabled={isLoading} className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-black disabled:opacity-50">Enviar link</button>
                  </div>
                  <div className="flex gap-2 text-[11px]">
                    <a href="/reset-password" className="text-amber-400 hover:underline">Ya tengo el link → restablecer</a>
                    <span className="text-slate-500">·</span>
                    <button type="button" onClick={()=>setShowSupport(true)} className="text-slate-400 hover:text-white">Soporte</button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <form onSubmit={handleCreateGymTenant} className="space-y-3 text-xs max-h-[60vh] overflow-y-auto pr-1">
              <div><label className="block text-slate-300 font-bold mb-1">Nombre del gimnasio *</label><input type="text" placeholder="FuerzaFit Palermo" value={gymName} onChange={e=>handleGymNameChange(e.target.value)} required className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"/></div>
              <div><label className="block text-slate-300 font-bold mb-1">Slug (URL) *</label><div className="flex items-center gap-2"><Hash className="w-4 h-4 text-slate-500"/><input type="text" placeholder="fuerzafit-palermo" value={gymSlug} onChange={e=>setGymSlug(e.target.value)} required className="flex-1 p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:border-amber-400 focus:outline-none"/><span className="text-[10px] text-slate-500 hidden sm:inline">tu link: /g/{gymSlug||'tu-gym'}</span></div></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div><label className="block text-slate-300 font-bold mb-1">Tu nombre *</label><input type="text" placeholder="Mariano López" value={ownerName} onChange={e=>setOwnerName(e.target.value)} required className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-amber-400 focus:outline-none"/></div>
                <div><label className="block text-slate-300 font-bold mb-1">WhatsApp *</label><input type="text" value={ownerPhone} onChange={e=>setOwnerPhone(e.target.value)} required className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-amber-400 focus:outline-none"/></div>
              </div>
              <div><label className="block text-slate-300 font-bold mb-1">Email de dueño *</label><div className="relative"><Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/><input type="email" placeholder="dueno@tugym.com" value={ownerEmail} onChange={e=>setOwnerEmail(e.target.value)} required className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"/></div></div>
              <div className="grid grid-cols-2 gap-2.5">
                <div><label className="block text-slate-300 font-bold mb-1">Contraseña</label><input type="password" placeholder="admin123" value={ownerPassword} onChange={e=>setOwnerPassword(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-amber-400 focus:outline-none"/></div>
                <div><label className="block text-slate-300 font-bold mb-1">Dirección sede</label><div className="relative"><MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/><input type="text" placeholder="Av. Santa Fe 3000" value={branchAddress} onChange={e=>setBranchAddress(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"/></div></div>
              </div>
              <button type="submit" disabled={isLoading} className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">{isLoading?<><RefreshCw className="w-4 h-4 animate-spin"/>Creando…</>:<><Building2 className="w-4 h-4"/>Crear mi gimnasio</>}</button>
              <p className="text-[11px] text-slate-500 text-center">Se crea tenant + sede + plan base. Luego cargás socios con DNI.</p>
            </form>
          )}
        </motion.div>
      </div>

      <div className="p-4 text-center text-[11px] text-slate-500">
        <button onClick={()=>setShowSupport(true)} className="hover:text-white">¿Necesitás ayuda? Soporte →</button>
        <span className="mx-1">·</span>
        <a href="/soporte" className="hover:text-white">Centro de ayuda</a>
      </div>

      <SupportModal isOpen={showSupport} onClose={()=>setShowSupport(false)} />
    </div>
  );
};
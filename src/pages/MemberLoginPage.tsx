import React, { useState, useEffect } from 'react';
import { useGym } from '../context/GymContext';
import { PaymentMethod } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';

import {
  Dumbbell,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Phone,
  Building2,
  RefreshCw,
  KeyRound,
  UserPlus,
  Hash,
  User,
  IdCard,
  HelpCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { SupportModal } from '../components/common/SupportModal';

interface MemberLoginPageProps {
  initialPlanId?: string;
}

export const MemberLoginPage: React.FC<MemberLoginPageProps> = ({ initialPlanId }) => {
  const {
    currentUser,
    requestLoginOtp,
    verifyLoginOtp,
    requestPhoneOtp,
    verifyPhoneOtp,
    loginWithPassword,
    registerMemberSelf,
    confirmRegistration,
    branches,
    selectedBranchId,
    plans,
    requestPasswordReset,
  } = useGym();
  const [showSupport, setShowSupport] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // Auto-redirect cuando el login realmente pegó (AppShell detecta currentUser)
  if (currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-pulse">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="font-black text-white">¡Listo, {currentUser.name.split(' ')[0]}!</p>
          <p className="text-xs text-slate-400">Redirigiendo a tu panel...</p>
        </div>
      </div>
    );
  }

  const [memberView, setMemberView] = useState<'login_otp' | 'verify_otp' | 'login_password' | 'login_phone' | 'verify_phone' | 'register' | 'verify_register'>(
    'login_otp'
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(45);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'error' | 'success' | 'info' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneE164, setPhoneE164] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('+54 9 11 ');
  const [regDni, setRegDni] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPlanId, setRegPlanId] = useState(initialPlanId || plans[0]?.id || '');
  const [regBranchId, setRegBranchId] = useState(selectedBranchId || branches[0]?.id || 'branch-1');
  const [regPaymentMethod, setRegPaymentMethod] = useState<PaymentMethod>('mercadopago');
  const defaultBranchCode = branches[0]?.code || 'GYM-CENTRAL-2026';
  const [gymCodeInput, setGymCodeInput] = useState(defaultBranchCode);
  const [isManualBranchSelection, setIsManualBranchSelection] = useState(false);
  const [codeValidationStatus, setCodeValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('valid');
  const [validatedBranch, setValidatedBranch] = useState(branches[0] || null);

  useEffect(() => {
    if (initialPlanId) setRegPlanId(initialPlanId);
  }, [initialPlanId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if ((memberView === 'verify_otp' || memberView === 'verify_register' || memberView === 'verify_phone') && resendTimer > 0) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [memberView, resendTimer]);

  const handleGymCodeChange = (rawCode: string) => {
    const cleaned = rawCode.toUpperCase().trim();
    setGymCodeInput(cleaned);
    if (!cleaned) { setCodeValidationStatus('idle'); setValidatedBranch(null); return; }
    const match = branches.find(b => b.code && b.code.toUpperCase() === cleaned);
    if (match) { setCodeValidationStatus('valid'); setValidatedBranch(match); setRegBranchId(match.id); setFeedbackMessage(null); }
    else { setCodeValidationStatus('invalid'); setValidatedBranch(null); }
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.slice(0, 6).split('');
      const newOtp = [...otpCode];
      digits.forEach((d, i) => { if (i < 6) newOtp[i] = d; });
      setOtpCode(newOtp); return;
    }
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);
    if (value && index < 5) document.getElementById(`m-otp-${index + 1}`)?.focus();
  };
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) document.getElementById(`m-otp-${index - 1}`)?.focus();
  };

  const handleRequestOtp = async (targetEmail?: string) => {
    const emailToUse = (targetEmail || email).trim();
    if (!emailToUse || !emailToUse.includes('@')) { setFeedbackMessage({ text: 'Ingresá un correo válido.', type: 'error' }); return; }
    setIsLoading(true); setFeedbackMessage(null);
    const res = await requestLoginOtp(emailToUse);
    setIsLoading(false);
    if (res.success) { setEmail(emailToUse); setMemberView('verify_otp'); setResendTimer(45); setOtpCode(['','','','','','']); setFeedbackMessage({ text: res.message, type: 'success' }); }
    else setFeedbackMessage({ text: res.message, type: 'error' });
  };
  const handleVerifyOtp = async (codeOverride?: string) => {
    const fullCode = codeOverride || otpCode.join('');
    if (fullCode.length < 6) { setFeedbackMessage({ text: 'Ingresá los 6 dígitos.', type: 'error' }); return; }
    setIsLoading(true);
    const res = await verifyLoginOtp(email, fullCode);
    setIsLoading(false);
    if (!res.success) setFeedbackMessage({ text: res.message, type: 'error' });
    else setFeedbackMessage({ text: res.message, type: 'success' });
  };
  const handleRequestPhoneOtp = async () => {
    if (!phoneNumber.trim()) { setFeedbackMessage({ text: 'Ingresá tu número.', type: 'error' }); return; }
    setIsLoading(true); setFeedbackMessage(null);
    const res = await requestPhoneOtp(phoneNumber.trim());
    setIsLoading(false);
    if (res.success && res.phoneE164) { setPhoneE164(res.phoneE164); setMemberView('verify_phone'); setResendTimer(45); setOtpCode(['','','','','','']); setFeedbackMessage({ text: res.message, type: 'success' }); }
    else { if (res.phoneE164) setPhoneE164(res.phoneE164); setFeedbackMessage({ text: res.message, type: 'error' }); }
  };
  const handleVerifyPhoneOtp = async (codeOverride?: string) => {
    const fullCode = codeOverride || otpCode.join('');
    if (fullCode.length < 6) { setFeedbackMessage({ text: 'Ingresá los 6 dígitos del SMS.', type: 'error' }); return; }
    if (!phoneE164) { setFeedbackMessage({ text: 'Pedí primero el código SMS.', type: 'error' }); return; }
    setIsLoading(true);
    const res = await verifyPhoneOtp(phoneE164, fullCode);
    setIsLoading(false);
    if (!res.success) setFeedbackMessage({ text: res.message, type: 'error' });
    else setFeedbackMessage({ text: res.message, type: 'success' });
  };
  const handleMemberPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setFeedbackMessage({ text: 'Ingresá tu correo.', type: 'error' }); return; }
    setIsLoading(true);
    const res = await loginWithPassword(email, password);
    setIsLoading(false);
    if (!res.success) setFeedbackMessage({ text: res.message, type: 'error' });
    else setFeedbackMessage({ text: res.message, type: 'success' });
  };
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await requestPasswordReset(forgotEmail || email);
    setIsLoading(false);
    setFeedbackMessage({ text: res.message, type: res.success ? 'success' : 'error' });
    if (res.success) setShowForgot(false);
  };
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regDni) { setFeedbackMessage({ text: 'Completá nombre, email y DNI.', type: 'error' }); return; }
    if (!isManualBranchSelection && codeValidationStatus !== 'valid') { setFeedbackMessage({ text: 'Ingresá un código de gimnasio válido o elegí sede manual.', type: 'error' }); return; }
    setIsLoading(true); setFeedbackMessage(null);
    const res = await registerMemberSelf({ name: regName, email: regEmail, phone: regPhone, dni: regDni, password: regPassword || 'socio123', planId: regPlanId, branchId: regBranchId, initialPaymentMethod: regPaymentMethod });
    setIsLoading(false);
    if (res.success) { setMemberView('verify_register'); setResendTimer(45); setOtpCode(['','','','','','']); setFeedbackMessage({ text: res.message, type: 'success' }); }
    else setFeedbackMessage({ text: res.message, type: 'error' });
  };
  const handleConfirmRegistration = async (codeOverride?: string) => {
    const fullCode = codeOverride || otpCode.join('');
    if (fullCode.length < 6) { setFeedbackMessage({ text: 'Ingresá los 6 dígitos.', type: 'error' }); return; }
    setIsLoading(true);
    const res = await confirmRegistration(regEmail, fullCode);
    setIsLoading(false);
    if (!res.success) setFeedbackMessage({ text: res.message, type: 'error' });
    else setFeedbackMessage({ text: res.message, type: 'success' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top bar - sin Inicio */}
      <header className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-md"><Dumbbell className="w-5 h-5 -rotate-12" /></div>
            <span className="font-extrabold text-white">FUERZA<span className="text-emerald-400">FIT</span></span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">PORTAL SOCIOS</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.12),_transparent_60%)]">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400"><User className="w-6 h-6" /></div>
            <h1 className="text-xl font-black text-white">Ingreso Socios</h1>
            <p className="text-xs text-slate-400">Ingresá con tu email o teléfono. El ingreso diario al gym es con tu <strong className="text-slate-200">DNI en recepción</strong>.</p>
          </div>

          {/* Tabs Ingreso / Registro */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold gap-1">
            <button onClick={() => { setMemberView('login_otp'); setFeedbackMessage(null); }} className={`py-2 rounded-xl flex items-center justify-center gap-1.5 ${memberView.startsWith('login') || memberView.startsWith('verify_') && memberView !== 'verify_register' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}><Mail className="w-3.5 h-3.5 text-emerald-400" /> Ingresar</button>
            <button onClick={() => { setMemberView('register'); setFeedbackMessage(null); }} className={`py-2 rounded-xl flex items-center justify-center gap-1.5 ${memberView === 'register' || memberView === 'verify_register' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}><UserPlus className="w-3.5 h-3.5" /> Nuevo socio</button>
          </div>

          {feedbackMessage && (
            <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${feedbackMessage.type==='error'?'bg-rose-500/15 border border-rose-500/30 text-rose-300':'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'}`}>
              {feedbackMessage.type==='error'?<AlertCircle className="w-4 h-4 shrink-0"/>:<CheckCircle2 className="w-4 h-4 shrink-0"/>}<span>{feedbackMessage.text}</span>
            </div>
          )}

          {/* OTP helper */}
          {(memberView==='verify_otp' || memberView==='verify_register') && (
            <div className={`p-3 rounded-2xl border text-xs flex gap-2.5 ${isSupabaseConfigured?'bg-emerald-950/40 border-emerald-500/40 text-emerald-200':'bg-slate-800 border-slate-700 text-slate-300'}`}>
              <Mail className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex justify-between"><span className="font-bold text-white">{isSupabaseConfigured?'Código enviado vía Supabase':'Modo local'}</span>{!isSupabaseConfigured && <button type="button" onClick={() => { setOtpCode('123456'.split('')); if(memberView==='verify_otp') handleVerifyOtp('123456'); else handleConfirmRegistration('123456'); }} className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">Usar 123456</button>}</div>
                <p className="text-[11px] text-slate-300 mt-0.5">Revisá tu correo {memberView==='verify_otp'?email:regEmail}. También revisá spam.</p>
              </div>
            </div>
          )}

          {/* VIEWS */}
          {memberView==='login_otp' && (
            <div className="space-y-4 text-xs">
              <div><label className="block text-slate-300 font-bold mb-1">Correo electrónico</label><div className="relative"><Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/><input type="email" placeholder="socio@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>{if(e.key==='Enter') handleRequestOtp();}} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"/></div></div>
              <button onClick={()=>handleRequestOtp()} disabled={isLoading} className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">{isLoading?<><RefreshCw className="w-4 h-4 animate-spin"/>Enviando…</>:<><span>Enviar código por email</span><ArrowRight className="w-4 h-4"/></>}</button>
              <div className="flex justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800"><button onClick={()=>setMemberView('login_password')} className="text-emerald-400 font-bold flex items-center gap-1"><KeyRound className="w-3 h-3"/>Con contraseña</button><button onClick={()=>setMemberView('login_phone')} className="text-slate-300 hover:text-white">Con teléfono y SMS →</button></div>
            </div>
          )}

          {memberView==='verify_otp' && (
            <div className="space-y-4 text-xs">
              <div className="text-center"><h3 className="font-black text-white">Ingresá el código de 6 dígitos</h3><p className="text-slate-400 text-[11px]">Enviado a <strong className="text-slate-200">{email}</strong></p></div>
              <div className="flex justify-center gap-2">{otpCode.map((d,i)=><input key={i} id={`m-otp-${i}`} type="text" maxLength={1} value={d} onChange={e=>handleOtpDigitChange(i,e.target.value)} onKeyDown={e=>handleOtpKeyDown(i,e)} className="w-11 h-13 text-center text-xl font-black rounded-2xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"/> )}</div>
              <div className="flex justify-between text-[11px] text-slate-400"><span>¿No llegó?</span>{resendTimer>0?<span>Reenviar en {resendTimer}s</span>:<button onClick={()=>handleRequestOtp()} className="text-emerald-400 font-bold">Reenviar</button>}</div>
              <button onClick={()=>handleVerifyOtp()} disabled={isLoading || otpCode.join('').length<6} className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold disabled:opacity-50 flex items-center justify-center gap-2">{isLoading?<><RefreshCw className="w-4 h-4 animate-spin"/>Verificando…</>:<><Sparkles className="w-4 h-4"/>Ingresar al panel</>}</button>
              <button onClick={()=>setMemberView('login_otp')} className="w-full text-slate-400 text-center text-[11px]">← Cambiar correo</button>
            </div>
          )}

          {memberView==='login_phone' && (
            <div className="space-y-4 text-xs">
              <div><label className="block text-slate-300 font-bold mb-1">Número de teléfono</label><div className="relative"><Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/><input type="tel" placeholder="11 2333 3343" value={phoneNumber} onChange={e=>setPhoneNumber(e.target.value)} onKeyDown={e=>{if(e.key==='Enter') handleRequestPhoneOtp();}} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"/></div><p className="text-[11px] text-slate-500 mt-1">Con código de área, sin 0 ni 15. Código por SMS.</p></div>
              <button onClick={handleRequestPhoneOtp} disabled={isLoading} className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold disabled:opacity-50 flex items-center justify-center gap-2">{isLoading?<><RefreshCw className="w-4 h-4 animate-spin"/>Enviando…</>:<><span>Enviar SMS</span><ArrowRight className="w-4 h-4"/></>}</button>
              <button onClick={()=>setMemberView('login_otp')} className="w-full text-slate-400 text-center text-[11px]">← Volver a email</button>
            </div>
          )}
          {memberView==='verify_phone' && (
            <div className="space-y-4 text-xs">
              <div className="text-center"><h3 className="font-black text-white">Código del SMS</h3><p className="text-slate-400 text-[11px]">Enviado a <strong className="text-slate-200">{phoneE164||phoneNumber}</strong></p></div>
              <div className="flex justify-center gap-2">{otpCode.map((d,i)=><input key={i} id={`m-otp-${i}`} type="text" maxLength={1} value={d} onChange={e=>handleOtpDigitChange(i,e.target.value)} onKeyDown={e=>handleOtpKeyDown(i,e)} className="w-11 h-13 text-center text-xl font-black rounded-2xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"/> )}</div>
              <div className="flex justify-between text-[11px] text-slate-400"><span>¿No llegó?</span>{resendTimer>0?<span>{resendTimer}s</span>:<button onClick={handleRequestPhoneOtp} className="text-emerald-400 font-bold">Reenviar</button>}</div>
              <button onClick={()=>handleVerifyPhoneOtp()} disabled={isLoading || otpCode.join('').length<6} className="w-full py-3 rounded-2xl bg-emerald-500 text-slate-950 font-extrabold disabled:opacity-50 flex items-center justify-center gap-2">{isLoading?<><RefreshCw className="w-4 h-4 animate-spin"/>Verificando…</>:<><Sparkles className="w-4 h-4"/>Ingresar</>}</button>
              <button onClick={()=>setMemberView('login_phone')} className="w-full text-slate-400 text-center text-[11px]">← Cambiar número</button>
            </div>
          )}

          {memberView==='login_password' && (
            <form onSubmit={handleMemberPasswordLogin} className="space-y-3 text-xs">
              <div><label className="block text-slate-300 font-bold mb-1">Correo</label><div className="relative"><Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/><input type="email" placeholder="socio@email.com" value={email} onChange={e=>setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"/></div></div>
              <div><label className="block text-slate-300 font-bold mb-1">Contraseña</label><div className="relative"><Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/><input type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"/></div></div>
              <div className="flex items-center justify-between">
                <button type="button" onClick={()=>{ setShowForgot(!showForgot); setForgotEmail(email); }} className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"><KeyRound className="w-3 h-3"/>¿Olvidaste tu contraseña?</button>
                <button type="button" onClick={()=>setShowSupport(true)} className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"><HelpCircle className="w-3 h-3"/>Soporte</button>
              </div>
              <button type="submit" disabled={isLoading} className="w-full mt-2 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold disabled:opacity-50 flex items-center justify-center gap-2">{isLoading?<><RefreshCw className="w-4 h-4 animate-spin"/>Entrando…</>:<span>Entrar como socio</span>}</button>
              <div className="flex justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800"><button type="button" onClick={()=>setMemberView('login_otp')} className="text-emerald-400">Volver a OTP</button><button type="button" onClick={()=>setMemberView('register')} className="text-slate-300">¿Sin cuenta? Registrate</button></div>
              {showForgot && (
                <form onSubmit={handleForgot} className="p-3 rounded-xl bg-slate-800 border border-amber-500/20 space-y-2">
                  <p className="font-bold text-white">Recuperar cuenta</p>
                  <p className="text-[11px] text-slate-400">Te enviamos un link a tu email. Revisá spam.</p>
                  <div className="flex gap-2">
                    <input type="email" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} placeholder="tu@email.com" className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white" required />
                    <button type="submit" disabled={isLoading} className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-black">Enviar link</button>
                  </div>
                  <a href="/reset-password" className="text-[11px] text-amber-400 hover:underline">Ya tengo el link → restablecer</a>
                </form>
              )}
            </form>
          )}

          {memberView==='register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div><label className="block text-slate-300 font-bold mb-1">Nombre *</label><input type="text" placeholder="Martín Gómez" value={regName} onChange={e=>setRegName(e.target.value)} required className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"/></div>
                <div><label className="block text-slate-300 font-bold mb-1">DNI *</label><input type="text" placeholder="38450192" value={regDni} onChange={e=>setRegDni(e.target.value)} required className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"/></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div><label className="block text-slate-300 font-bold mb-1">Email *</label><input type="email" placeholder="socio@email.com" value={regEmail} onChange={e=>setRegEmail(e.target.value)} required className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"/></div>
                <div><label className="block text-slate-300 font-bold mb-1">WhatsApp</label><input type="text" placeholder="+54 9 11..." value={regPhone} onChange={e=>setRegPhone(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"/></div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700 space-y-2">
                <div className="flex justify-between"><label className="text-slate-300 font-bold text-[11px] flex items-center gap-1"><Hash className="w-3.5 h-3.5 text-emerald-400"/>Código de gimnasio</label><button type="button" onClick={()=>setIsManualBranchSelection(!isManualBranchSelection)} className="text-[10px] text-emerald-400 font-bold">{isManualBranchSelection?'Ingresar código':'Elegir sede'}</button></div>
                {isManualBranchSelection?(
                  <select value={regBranchId} onChange={e=>setRegBranchId(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none">{branches.map(b=><option key={b.id} value={b.id}>{b.name} — {b.address}</option>)}</select>
                ):(
                  <div><input type="text" placeholder="GYM-CENTRAL-2026" value={gymCodeInput} onChange={e=>handleGymCodeChange(e.target.value)} className={`w-full p-2.5 rounded-xl bg-slate-800 border font-mono uppercase tracking-wider text-white ${codeValidationStatus==='valid'?'border-emerald-500':codeValidationStatus==='invalid'?'border-rose-500':'border-slate-700'}`}/>{codeValidationStatus==='valid'&&validatedBranch&&<p className="text-[10px] text-emerald-400 font-bold mt-1">✓ {validatedBranch.name} ({validatedBranch.address})</p>}</div>
                )}
              </div>
              <div><label className="block text-slate-300 font-bold mb-1">Plan de entrenamiento</label><select value={regPlanId} onChange={e=>setRegPlanId(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none">{plans.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><p className="text-[11px] text-slate-500 mt-1">El plan se confirma en recepción. Sin precios aquí.</p></div>
              <div><label className="block text-slate-300 font-bold mb-1">Contraseña (opcional)</label><input type="password" placeholder="Creá clave" value={regPassword} onChange={e=>setRegPassword(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"/></div>
              <button type="submit" disabled={isLoading} className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">{isLoading?<><RefreshCw className="w-4 h-4 animate-spin"/>Procesando…</>:<><Sparkles className="w-4 h-4"/>Crear cuenta y recibir código</>}</button>
            </form>
          )}

          {memberView==='verify_register' && (
            <div className="space-y-4 text-xs">
              <div className="text-center"><h3 className="font-black text-white">Confirmá tu código para activar el pase</h3><p className="text-slate-400 text-[11px]">Enviado a <strong className="text-slate-200">{regEmail}</strong></p></div>
              <div className="flex justify-center gap-2">{otpCode.map((d,i)=><input key={i} id={`m-otp-${i}`} type="text" maxLength={1} value={d} onChange={e=>handleOtpDigitChange(i,e.target.value)} onKeyDown={e=>handleOtpKeyDown(i,e)} className="w-11 h-13 text-center text-xl font-black rounded-2xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"/> )}</div>
              <button onClick={()=>handleConfirmRegistration()} disabled={isLoading || otpCode.join('').length<6} className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold disabled:opacity-50 flex items-center justify-center gap-2">{isLoading?<><RefreshCw className="w-4 h-4 animate-spin"/>Activando…</>:<><Sparkles className="w-4 h-4"/>Confirmar y activar pase</>}</button>
              <button onClick={()=>setMemberView('register')} className="w-full text-slate-400 text-center text-[11px]">← Volver al registro</button>
            </div>
          )}

        </motion.div>
      </div>

      <div className="p-4 text-center text-[11px] text-slate-500">
        <button onClick={()=>setShowSupport(true)} className="hover:text-white">¿Necesitás ayuda? Soporte →</button>
        <span className="mx-1">·</span>
        <a href="/soporte" className="hover:text-white">Centro de ayuda</a>
        <span className="mx-1">·</span>
        <a href="/reset-password" className="hover:text-white">Recuperar cuenta</a>
      </div>

      <SupportModal isOpen={showSupport} onClose={()=>setShowSupport(false)} />
    </div>
  );
};
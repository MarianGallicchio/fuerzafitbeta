import React, { useState, useEffect } from 'react';
import { useGym } from '../../context/GymContext';
import { PaymentMethod, GymBranch } from '../../types';
import { isSupabaseConfigured } from '../../lib/supabase';
import {
  Dumbbell,
  Shield,
  User,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Building2,
  RefreshCw,
  KeyRound,
  UserPlus,
  Check,
  Hash,
  ShieldCheck,
  CheckCheck,
  Store,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { isDemoModeEnabled } from '../../lib/appMode';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'admin' | 'register_gym';
  initialPlanId?: string;
  // BETA: bloquea el modal a un solo rol (links separados admin/socios).
  // Si se pasa, se oculta el switcher Socios/Admin y no se puede cambiar.
  lockedRole?: 'member' | 'admin' | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  initialPlanId,
  lockedRole = null
}) => {
  const {
    users,
    currentUser,
    switchUser,
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
    loginAsAdmin,
    createQuickTestMember,
    registerGymOwnerAccount
  } = useGym();

  // Top level role tabs: 'member' (socios/alumnos) | 'admin' (dueños y administradores)
  const [roleTab, setRoleTab] = useState<'member' | 'admin'>(
    initialMode === 'admin' || initialMode === 'register_gym' ? 'admin' : 'member'
  );

  // Member sub-views: 'login_otp' | 'verify_otp' | 'login_password' | 'login_phone' | 'verify_phone' | 'register' | 'verify_register'
  const [memberView, setMemberView] = useState<'login_otp' | 'verify_otp' | 'login_password' | 'login_phone' | 'verify_phone' | 'register' | 'verify_register'>(
    initialMode === 'register' ? 'register' : 'login_otp'
  );

  // Admin sub-views: 'login' | 'create_gym'
  const [adminView, setAdminView] = useState<'login' | 'create_gym'>(
    initialMode === 'register_gym' ? 'create_gym' : 'login'
  );

  // Sync mode and plan if props change
  useEffect(() => {
    // BETA: rol bloqueado por link tiene prioridad sobre initialMode
    if (lockedRole) {
      setRoleTab(lockedRole);
      if (lockedRole === 'admin' && adminView !== 'login' && adminView !== 'create_gym') {
        setAdminView(initialMode === 'register_gym' ? 'create_gym' : 'login');
      }
      return;
    }
    if (initialMode === 'admin') {
      setRoleTab('admin');
      setAdminView('login');
    } else if (initialMode === 'register_gym') {
      setRoleTab('admin');
      setAdminView('create_gym');
    } else if (initialMode === 'register') {
      setRoleTab('member');
      setMemberView('register');
    } else {
      setRoleTab('member');
      if (memberView !== 'verify_otp' && memberView !== 'verify_register' && memberView !== 'verify_phone') {
        setMemberView('login_otp');
      }
    }
  }, [initialMode, isOpen]);

  // Member Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(45);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'error' | 'success' | 'info' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Member Phone OTP state (ingreso con número + código SMS)
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneE164, setPhoneE164] = useState('');

  // Member Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('+54 9 11 ');
  const [regDni, setRegDni] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPlanId, setRegPlanId] = useState(initialPlanId || plans[0]?.id || 'plan-1');
  const [regBranchId, setRegBranchId] = useState(selectedBranchId || branches[0]?.id || 'branch-1');
  const [regPaymentMethod, setRegPaymentMethod] = useState<PaymentMethod>('mercadopago');

  // Member Gym Code Registration state
  const defaultBranchCode = branches[0]?.code || 'GYM-CENTRAL-2026';
  const [gymCodeInput, setGymCodeInput] = useState(defaultBranchCode);
  const [isManualBranchSelection, setIsManualBranchSelection] = useState(false);
  const [codeValidationStatus, setCodeValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('valid');
  const [validatedBranch, setValidatedBranch] = useState<GymBranch | null>(branches[0] || null);

  // Admin Login state
  const [adminLoginEmail, setAdminLoginEmail] = useState('admin@fuerzafit.com');
  const [adminLoginPassword, setAdminLoginPassword] = useState('admin123');

  // Admin / Gym Tenant Creation state (Create Account for new gym)
  const [gymName, setGymName] = useState('');
  const [gymSlug, setGymSlug] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('+54 9 11 ');
  const [branchAddress, setBranchAddress] = useState('');

  // Auto-generate slug when gymName changes
  const handleGymNameChange = (name: string) => {
    setGymName(name);
    const generatedSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setGymSlug(generatedSlug);
  };

  const handleGymCodeChange = (rawCode: string) => {
    const cleaned = rawCode.toUpperCase().trim();
    setGymCodeInput(cleaned);

    if (!cleaned) {
      setCodeValidationStatus('idle');
      setValidatedBranch(null);
      return;
    }

    const match = branches.find(b => b.code && b.code.toUpperCase() === cleaned);
    if (match) {
      setCodeValidationStatus('valid');
      setValidatedBranch(match);
      setRegBranchId(match.id);
      setFeedbackMessage(null);
    } else {
      setCodeValidationStatus('invalid');
      setValidatedBranch(null);
    }
  };

  useEffect(() => {
    if (initialPlanId) {
      setRegPlanId(initialPlanId);
    }
  }, [initialPlanId]);

  // Timer countdown for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if ((memberView === 'verify_otp' || memberView === 'verify_register' || memberView === 'verify_phone') && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [memberView, resendTimer]);

  if (!isOpen) return null;

  const handleOtpDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.slice(0, 6).split('');
      const newOtp = [...otpCode];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtpCode(newOtp);
      return;
    }
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    // Auto move to next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  // 1. Request Login OTP (Real Supabase Auth Integration)
  const handleRequestOtp = async (targetEmail?: string) => {
    const emailToUse = (targetEmail || email).trim();
    if (!emailToUse || !emailToUse.includes('@')) {
      setFeedbackMessage({ text: 'Por favor ingresá un correo electrónico válido.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setFeedbackMessage(null);

    const res = await requestLoginOtp(emailToUse);
    setIsLoading(false);
    if (res.success) {
      setEmail(emailToUse);
      setMemberView('verify_otp');
      setResendTimer(45);
      setOtpCode(['', '', '', '', '', '']);
      setFeedbackMessage({
        text: res.message || `Te enviamos un código de 6 dígitos a ${emailToUse}.`,
        type: 'success'
      });
    } else {
      setFeedbackMessage({ text: res.message, type: 'error' });
    }
  };

  // 2. Submit Login OTP Verification (Real Supabase Auth Integration)
  const handleVerifyOtp = async (codeOverride?: string) => {
    const fullCode = codeOverride || otpCode.join('');
    if (fullCode.length < 6) {
      setFeedbackMessage({ text: 'Por favor ingresá los 6 dígitos del código.', type: 'error' });
      return;
    }

    setIsLoading(true);
    const res = await verifyLoginOtp(email, fullCode);
    setIsLoading(false);
    if (res.success) {
      setFeedbackMessage({ text: res.message, type: 'success' });
      setTimeout(() => {
        onClose();
      }, 500);
    } else {
      setFeedbackMessage({ text: res.message, type: 'error' });
    }
  };

  // 2b. Login con teléfono + SMS (requiere proveedor SMS en Supabase)
  const handleRequestPhoneOtp = async () => {
    if (!phoneNumber.trim()) {
      setFeedbackMessage({ text: 'Ingresá tu número de teléfono.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setFeedbackMessage(null);

    const res = await requestPhoneOtp(phoneNumber.trim());
    setIsLoading(false);
    if (res.success && res.phoneE164) {
      setPhoneE164(res.phoneE164);
      setMemberView('verify_phone');
      setResendTimer(45);
      setOtpCode(['', '', '', '', '', '']);
      setFeedbackMessage({ text: res.message, type: 'success' });
    } else {
      if (res.phoneE164) setPhoneE164(res.phoneE164);
      setFeedbackMessage({ text: res.message, type: 'error' });
    }
  };

  const handleVerifyPhoneOtp = async (codeOverride?: string) => {
    const fullCode = codeOverride || otpCode.join('');
    if (fullCode.length < 6) {
      setFeedbackMessage({ text: 'Por favor ingresá los 6 dígitos del código SMS.', type: 'error' });
      return;
    }
    if (!phoneE164) {
      setFeedbackMessage({ text: 'Pedí primero el código SMS.', type: 'error' });
      return;
    }

    setIsLoading(true);
    const res = await verifyPhoneOtp(phoneE164, fullCode);
    setIsLoading(false);
    if (res.success) {
      setFeedbackMessage({ text: res.message, type: 'success' });
      setTimeout(() => {
        onClose();
      }, 500);
    } else {
      setFeedbackMessage({ text: res.message, type: 'error' });
    }
  };

  // 3. Member Login with Password
  const handleMemberPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setFeedbackMessage({ text: 'Ingresá tu correo electrónico.', type: 'error' });
      return;
    }

    setIsLoading(true);
    const res = await loginWithPassword(email, password);
    setIsLoading(false);
    if (res.success) {
      setFeedbackMessage({ text: res.message, type: 'success' });
      setTimeout(() => {
        onClose();
      }, 400);
    } else {
      setFeedbackMessage({ text: res.message, type: 'error' });
    }
  };

  // 4. Register Member Self
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regDni) {
      setFeedbackMessage({ text: 'Por favor completá nombre, email y DNI.', type: 'error' });
      return;
    }

    if (!isManualBranchSelection && codeValidationStatus !== 'valid') {
      setFeedbackMessage({
        text: 'Por favor ingresá un código de gimnasio válido o seleccioná tu sede manualmente.',
        type: 'error'
      });
      return;
    }

    setIsLoading(true);
    setFeedbackMessage(null);

    const res = await registerMemberSelf({
      name: regName,
      email: regEmail,
      phone: regPhone,
      dni: regDni,
      password: regPassword || 'socio123',
      planId: regPlanId,
      branchId: regBranchId,
      initialPaymentMethod: regPaymentMethod
    });

    setIsLoading(false);
    if (res.success) {
      setMemberView('verify_register');
      setResendTimer(45);
      setOtpCode(['', '', '', '', '', '']);
      setFeedbackMessage({
        text: res.message || 'Código de activación enviado a tu correo.',
        type: 'success'
      });
    } else {
      setFeedbackMessage({ text: res.message, type: 'error' });
    }
  };

  // 5. Confirm Registration OTP
  const handleConfirmRegistration = async (codeOverride?: string) => {
    const fullCode = codeOverride || otpCode.join('');
    if (fullCode.length < 6) {
      setFeedbackMessage({ text: 'Ingresá los 6 dígitos del código.', type: 'error' });
      return;
    }

    setIsLoading(true);
    const res = await confirmRegistration(regEmail, fullCode);
    setIsLoading(false);
    if (res.success) {
      setFeedbackMessage({ text: res.message, type: 'success' });
      setTimeout(() => {
        onClose();
      }, 600);
    } else {
      setFeedbackMessage({ text: res.message, type: 'error' });
    }
  };

  // 6. Admin Login Handler (Inicio de Sesión para Panel de Administrador)
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminLoginEmail || !adminLoginPassword) {
      setFeedbackMessage({ text: 'Ingresá el correo y contraseña del administrador.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setFeedbackMessage(null);

    const res = await loginWithPassword(adminLoginEmail, adminLoginPassword);
    setIsLoading(false);

    if (res.success) {
      setFeedbackMessage({ text: '¡Bienvenido al Panel de Administración!', type: 'success' });
      setTimeout(() => {
        onClose();
      }, 400);
    } else {
      setFeedbackMessage({ text: res.message || 'Credenciales de administrador no válidas.', type: 'error' });
    }
  };

  // 7. Admin Quick Demo Login
  const handleQuickAdminLogin = () => {
    loginAsAdmin();
    setFeedbackMessage({ text: 'Accediendo como Administrador...', type: 'success' });
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // 8. Create Account / Register New Gym Tenant (Inicialización de nuevo registro en 'gyms')
  const handleCreateGymTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gymName.trim() || !ownerName.trim() || !ownerEmail.trim() || !ownerPhone.trim()) {
      setFeedbackMessage({ text: 'Por favor completá los datos básicos del gimnasio y titular.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setFeedbackMessage(null);

    try {
      const res = await registerGymOwnerAccount({
        gymName: gymName.trim(),
        slug: gymSlug.trim() || gymName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        ownerName: ownerName.trim(),
        email: ownerEmail.trim(),
        password: ownerPassword || 'admin123',
        phone: ownerPhone.trim(),
        branchAddress: branchAddress.trim() || 'Sede Principal'
      });

      setIsLoading(false);
      if (res.success) {
        setFeedbackMessage({ text: res.message, type: 'success' });
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setFeedbackMessage({ text: res.message, type: 'error' });
      }
    } catch (err: any) {
      setIsLoading(false);
      setFeedbackMessage({ text: err?.message || 'Error al crear la cuenta del gimnasio.', type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 space-y-4 my-auto relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20">
              <Dumbbell className="w-5 h-5 transform -rotate-12" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-white">FUERZA<span className="text-emerald-400">FIT</span></span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {roleTab === 'admin' ? 'PANEL GESTIÓN' : 'PORTAL SOCIOS'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Sistema integral para gimnasios y miembros</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top-Level Role Tabs: Socios vs Dueños/Admin */}
        {lockedRole ? (
          <div className={`px-3 py-2 rounded-2xl text-[11px] font-bold border flex items-center gap-2 ${
            lockedRole === 'admin'
              ? 'bg-amber-400/10 text-amber-300 border-amber-400/30'
              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
          }`}>
            {lockedRole === 'admin' ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
            <span>
              {lockedRole === 'admin'
                ? 'Acceso exclusivo Dueño / Staff — las cuentas de socio usan el link de socios.'
                : 'Acceso exclusivo Socios — el ingreso diario al gym es con tu DNI.'}
            </span>
          </div>
        ) : (
        <div className="grid grid-cols-2 p-1 bg-slate-950/70 rounded-2xl text-xs font-bold gap-1 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setRoleTab('member');
              setFeedbackMessage(null);
            }}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
              roleTab === 'member'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Portal Socios</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRoleTab('admin');
              setFeedbackMessage(null);
            }}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
              roleTab === 'admin'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Panel Administrador</span>
          </button>
        </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION A: PORTAL SOCIOS */}
        {/* ========================================================================= */}
        {roleTab === 'member' && (
          <div className="space-y-3">
            
            {/* Sub-tabs for Member: Iniciar Sesión vs Registro */}
            <div className="grid grid-cols-2 p-1 bg-slate-850 rounded-xl text-xs font-bold gap-1 border border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setMemberView('login_otp');
                  setFeedbackMessage(null);
                }}
                className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  memberView === 'login_otp' || memberView === 'verify_otp' || memberView === 'login_password' || memberView === 'login_phone' || memberView === 'verify_phone'
                    ? 'bg-slate-750 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mail className="w-3 h-3 text-emerald-400" />
                <span>Ingreso Socio</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMemberView('register');
                  setFeedbackMessage(null);
                }}
                className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  memberView === 'register' || memberView === 'verify_register'
                    ? 'bg-slate-750 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3 h-3 text-emerald-400" />
                <span>Nuevo Socio</span>
              </button>
            </div>

            {/* Real Supabase OTP Status Notification / Local helper */}
            {(memberView === 'verify_otp' || memberView === 'verify_register') && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 ${
                  isSupabaseConfigured
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <Mail className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">
                      {isSupabaseConfigured ? 'Código enviado vía Supabase Auth' : 'Modo Local (Demo)'}
                    </span>
                    {!isSupabaseConfigured && (
                      <button
                        type="button"
                        onClick={() => {
                          const digits = '123456'.split('');
                          setOtpCode(digits);
                          if (memberView === 'verify_otp') handleVerifyOtp('123456');
                          else handleConfirmRegistration('123456');
                        }}
                        className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-mono font-bold text-[10px]"
                      >
                        Usar 123456
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {isSupabaseConfigured
                      ? `Revisá tu correo (${email || regEmail}) para obtener el código de 6 dígitos.`
                      : `En modo local podés usar el código de prueba 123456 o cualquier código de 6 dígitos.`}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Feedback Message */}
            {feedbackMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  feedbackMessage.type === 'error'
                    ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                    : feedbackMessage.type === 'success'
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                    : 'bg-sky-500/15 border border-sky-500/30 text-sky-300'
                }`}
              >
                {feedbackMessage.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                )}
                <span>{feedbackMessage.text}</span>
              </motion.div>
            )}

            {/* VIEW 1: MEMBER LOGIN VIA SUPABASE OTP */}
            {memberView === 'login_otp' && (
              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="block text-slate-300 font-bold">Correo Electrónico del Socio</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="socio@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRequestOtp();
                      }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRequestOtp()}
                  disabled={isLoading}
                  className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Enviando código...</span>
                    </>
                  ) : (
                    <>
                      <span>Enviar Código de Acceso (OTP)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  <span>¿Preferís usar tu clave?</span>
                  <button
                    type="button"
                    onClick={() => setMemberView('login_password')}
                    className="text-emerald-400 hover:underline font-bold flex items-center gap-1"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Iniciar con contraseña</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="flex-1 h-px bg-slate-800" />
                  <span>o</span>
                  <span className="flex-1 h-px bg-slate-800" />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMemberView('login_phone');
                    setFeedbackMessage(null);
                  }}
                  className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>Ingresar con teléfono y SMS</span>
                </button>
              </div>
            )}

            {/* VIEW 2: VERIFY OTP CODE */}
            {memberView === 'verify_otp' && (
              <div className="space-y-4 text-xs">
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-black text-white">Ingresá el código de 6 dígitos</h3>
                  <p className="text-slate-400 text-[11px]">
                    Enviado a <span className="font-bold text-slate-200">{email}</span>
                  </p>
                </div>

                <div className="flex justify-center gap-2 sm:gap-2.5 py-1">
                  {otpCode.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-input-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(idx, e)}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-black rounded-2xl bg-slate-800/90 border border-slate-700 text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none transition-all"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>¿No recibiste el correo?</span>
                  {resendTimer > 0 ? (
                    <span>Reenviar en <span className="text-emerald-400 font-bold">{resendTimer}s</span></span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRequestOtp()}
                      className="text-emerald-400 hover:underline font-bold"
                    >
                      Reenviar código
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleVerifyOtp()}
                    disabled={isLoading || otpCode.join('').length < 6}
                    className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-50 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verificando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Verificar e Ingresar al Panel de Socio</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMemberView('login_otp')}
                    className="w-full py-1.5 text-slate-400 hover:text-white text-center text-[11px] transition-colors"
                  >
                    ← Cambiar correo electrónico
                  </button>
                </div>
              </div>
            )}

            {/* VIEW 2b: MEMBER LOGIN VIA PHONE (SMS OTP) */}
            {memberView === 'login_phone' && (
              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="block text-slate-300 font-bold">Número de teléfono</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      inputMode="tel"
                      placeholder="Ej: 11 2333 3343"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRequestPhoneOtp();
                      }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Con código de área, sin 0 ni 15. Te llega un código de 6 dígitos por SMS.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRequestPhoneOtp()}
                  disabled={isLoading}
                  className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Enviando SMS...</span>
                    </>
                  ) : (
                    <>
                      <span>Enviar código por SMS</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setMemberView('login_otp')}
                  className="w-full py-1.5 text-slate-400 hover:text-white text-center text-[11px] transition-colors"
                >
                  ← Volver al ingreso con email
                </button>
              </div>
            )}

            {/* VIEW 2c: VERIFY PHONE OTP CODE */}
            {memberView === 'verify_phone' && (
              <div className="space-y-4 text-xs">
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-black text-white">Ingresá el código del SMS</h3>
                  <p className="text-slate-400 text-[11px]">
                    Enviado al <span className="font-bold text-slate-200">{phoneE164 || phoneNumber}</span>
                  </p>
                </div>

                <div className="flex justify-center gap-2 sm:gap-2.5 py-1">
                  {otpCode.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-input-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(idx, e)}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-black rounded-2xl bg-slate-800/90 border border-slate-700 text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none transition-all"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>¿No recibiste el SMS?</span>
                  {resendTimer > 0 ? (
                    <span>Reenviar en <span className="text-emerald-400 font-bold">{resendTimer}s</span></span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRequestPhoneOtp()}
                      className="text-emerald-400 hover:underline font-bold"
                    >
                      Reenviar código
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleVerifyPhoneOtp()}
                    disabled={isLoading || otpCode.join('').length < 6}
                    className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-50 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verificando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Verificar e Ingresar al Panel de Socio</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMemberView('login_phone')}
                    className="w-full py-1.5 text-slate-400 hover:text-white text-center text-[11px] transition-colors"
                  >
                    ← Cambiar número de teléfono
                  </button>
                </div>
              </div>
            )}

            {/* VIEW 3: MEMBER PASSWORD LOGIN */}
            {memberView === 'login_password' && (
              <form onSubmit={handleMemberPasswordLogin} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="socio@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Contraseña</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Iniciando sesión...</span>
                    </>
                  ) : (
                    <span>Entrar como Socio</span>
                  )}
                </button>

                <div className="pt-2 border-t border-slate-800 flex justify-between text-[11px] text-slate-400">
                  <button
                    type="button"
                    onClick={() => setMemberView('login_otp')}
                    className="text-emerald-400 hover:underline"
                  >
                    Volver a acceso con OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemberView('register')}
                    className="text-slate-300 hover:text-white"
                  >
                    ¿No tenés cuenta? Registrate
                  </button>
                </div>
              </form>
            )}

            {/* VIEW 4: MEMBER REGISTRATION */}
            {memberView === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs max-h-[62vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      placeholder="Ej. Martín Gómez"
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">DNI / Documento *</label>
                    <input
                      type="text"
                      placeholder="Ej. 38450192"
                      value={regDni}
                      onChange={e => setRegDni(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Email de Acceso *</label>
                    <input
                      type="email"
                      placeholder="socio@email.com"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Teléfono / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="+54 9 11 5555 4444"
                      value={regPhone}
                      onChange={e => setRegPhone(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Sede / Branch Code Selection */}
                <div className="p-3 rounded-2xl bg-slate-850/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-bold text-[11px] flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Código de Gimnasio / Sede</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsManualBranchSelection(!isManualBranchSelection)}
                      className="text-[10px] text-emerald-400 hover:underline font-bold"
                    >
                      {isManualBranchSelection ? 'Ingresar código de sede' : 'Elegir sede de la lista'}
                    </button>
                  </div>

                  {isManualBranchSelection ? (
                    <select
                      value={regBranchId}
                      onChange={e => setRegBranchId(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} — {b.address}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div>
                      <input
                        type="text"
                        placeholder="Ej. GYM-CENTRAL-2026"
                        value={gymCodeInput}
                        onChange={e => handleGymCodeChange(e.target.value)}
                        className={`w-full p-2.5 rounded-xl bg-slate-800 border font-mono uppercase tracking-wider text-white ${
                          codeValidationStatus === 'valid'
                            ? 'border-emerald-500 ring-1 ring-emerald-500/30'
                            : codeValidationStatus === 'invalid'
                            ? 'border-rose-500 ring-1 ring-rose-500/30'
                            : 'border-slate-700'
                        }`}
                      />
                      {codeValidationStatus === 'valid' && validatedBranch && (
                        <p className="text-[10px] text-emerald-400 font-bold mt-1">
                          ✓ Sede: {validatedBranch.name} ({validatedBranch.address})
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Plan a Contratar</label>
                  <select
                    value={regPlanId}
                    onChange={e => setRegPlanId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"
                  >
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} - ${p.priceARS.toLocaleString('es-AR')} ARS
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Medio de Pago</label>
                    <select
                      value={regPaymentMethod}
                      onChange={e => setRegPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"
                    >
                      <option value="mercadopago">Mercado Pago</option>
                      <option value="cash">Efectivo en Recepción</option>
                      <option value="transfer">Transferencia Bancaria</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Contraseña (Opcional)</label>
                    <input
                      type="password"
                      placeholder="Creá una clave"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Continuar y Recibir Código de Activación</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* VIEW 5: VERIFY REGISTRATION OTP */}
            {memberView === 'verify_register' && (
              <div className="space-y-4 text-xs">
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-black text-white">Confirmá tu código para activar tu pase</h3>
                  <p className="text-slate-400 text-[11px]">
                    Enviamos el código a <span className="font-bold text-slate-200">{regEmail}</span>
                  </p>
                </div>

                <div className="flex justify-center gap-2 sm:gap-2.5 py-1">
                  {otpCode.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-input-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(idx, e)}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-black rounded-2xl bg-slate-800/90 border border-slate-700 text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none transition-all"
                    />
                  ))}
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleConfirmRegistration()}
                    disabled={isLoading || otpCode.join('').length < 6}
                    className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-50 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Activando membresía...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Confirmar y Activar Pase QR</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMemberView('register')}
                    className="w-full py-1.5 text-slate-400 hover:text-white text-center text-[11px] transition-colors"
                  >
                    ← Corregir datos
                  </button>
                </div>
              </div>
            )}

            {/* Quick Test Member Action — solo demo local, oculto en beta */}
            {isDemoModeEnabled() && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>¿Querés probar como socio de prueba?</span>
              <button
                type="button"
                onClick={() => {
                  const m = createQuickTestMember();
                  if (m) {
                    onClose();
                  }
                }}
                className="text-emerald-400 hover:underline font-bold"
              >
                + Crear Socio Demo
              </button>
            </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION B: PANEL ADMINISTRADOR & REGISTRO DE NUEVO GIMNASIO */}
        {/* ========================================================================= */}
        {roleTab === 'admin' && (
          <div className="space-y-4">
            
            {/* Sub-tabs for Admin: Iniciar Sesión vs Crear Cuenta Gimnasio */}
            <div className="grid grid-cols-2 p-1 bg-slate-850 rounded-xl text-xs font-bold gap-1 border border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setAdminView('login');
                  setFeedbackMessage(null);
                }}
                className={`py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  adminView === 'login'
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Ingreso Administrador</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAdminView('create_gym');
                  setFeedbackMessage(null);
                }}
                className={`py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  adminView === 'create_gym'
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Crear Cuenta Gimnasio</span>
              </button>
            </div>

            {/* Feedback Message */}
            {feedbackMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  feedbackMessage.type === 'error'
                    ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                    : feedbackMessage.type === 'success'
                    ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                    : 'bg-sky-500/15 border border-sky-500/30 text-sky-300'
                }`}
              >
                {feedbackMessage.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-400" />
                )}
                <span>{feedbackMessage.text}</span>
              </motion.div>
            )}

            {/* 1. ADMIN LOGIN VIEW */}
            {adminView === 'login' && (
              <div className="space-y-4 text-xs">
                
                {/* 1-Click Fast Track Demo Admin — solo demo local, oculto en beta */}
                {isDemoModeEnabled() && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="font-bold text-amber-300 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      Acceso Rápido Administrador Demo
                    </span>
                    <p className="text-[11px] text-slate-300">
                      Entrá directo al panel con permisos totales y métricas en vivo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickAdminLogin}
                    className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md shadow-amber-400/20 shrink-0 transition-all active:scale-95 flex items-center gap-1"
                  >
                    <span>Entrar Ya</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                )}

                {/* Standard Admin Form */}
                <form onSubmit={handleAdminLogin} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Email del Administrador</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={adminLoginEmail}
                        onChange={e => setAdminLoginEmail(e.target.value)}
                        placeholder="admin@fuerzafit.com"
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Contraseña</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={adminLoginPassword}
                        onChange={e => setAdminLoginPassword(e.target.value)}
                        placeholder="admin123"
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verificando credenciales...</span>
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        <span>Ingresar al Panel de Administración</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>¿Querés digitalizar tu propio gimnasio?</span>
                  <button
                    type="button"
                    onClick={() => setAdminView('create_gym')}
                    className="text-amber-400 hover:underline font-bold"
                  >
                    Crear cuenta de gimnasio
                  </button>
                </div>
              </div>
            )}

            {/* 2. CREATE GYM TENANT VIEW (NUEVO REGISTRO EN TABLA 'GYMS') */}
            {adminView === 'create_gym' && (
              <form onSubmit={handleCreateGymTenant} className="space-y-3 text-xs max-h-[62vh] overflow-y-auto pr-1">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white">Alta de Nuevo Gimnasio (Multi-tenant)</p>
                    <p className="text-slate-300">
                      Creará el registro en la tabla <code className="font-mono text-amber-300">gyms</code>, configurará la sede inicial, el plan por defecto y te asignará el rol de administrador.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Nombre del Gimnasio *</label>
                    <input
                      type="text"
                      placeholder="Ej. Spartan Fitness Center"
                      value={gymName}
                      onChange={e => handleGymNameChange(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Identificador Web / Slug</label>
                    <input
                      type="text"
                      placeholder="spartan-fitness"
                      value={gymSlug}
                      onChange={e => setGymSlug(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 font-mono text-amber-300 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Nombre del Dueño / Admin *</label>
                    <input
                      type="text"
                      placeholder="Ej. Carlos Méndez"
                      value={ownerName}
                      onChange={e => setOwnerName(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">WhatsApp / Teléfono *</label>
                    <input
                      type="text"
                      placeholder="+54 9 11 4444 3333"
                      value={ownerPhone}
                      onChange={e => setOwnerPhone(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Email de Acceso Admin *</label>
                    <input
                      type="email"
                      placeholder="admin@spartanfitness.com"
                      value={ownerEmail}
                      onChange={e => setOwnerEmail(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Contraseña de Admin *</label>
                    <input
                      type="password"
                      placeholder="Creá una clave segura"
                      value={ownerPassword}
                      onChange={e => setOwnerPassword(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Dirección de la Sede Principal</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Ej. Av. Corrientes 1420, CABA"
                      value={branchAddress}
                      onChange={e => setBranchAddress(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Inicializando gimnasio...</span>
                    </>
                  ) : (
                    <>
                      <Building2 className="w-4 h-4" />
                      <span>Crear Cuenta & Abrir Panel de Gestión</span>
                    </>
                  )}
                </button>

                <div className="pt-2 border-t border-slate-800 text-center text-[11px] text-slate-400">
                  <span>¿Ya tenés cuenta creada? </span>
                  <button
                    type="button"
                    onClick={() => setAdminView('login')}
                    className="text-amber-400 hover:underline font-bold"
                  >
                    Iniciá sesión como administrador
                  </button>
                </div>
              </form>
            )}

          </div>
        )}

      </motion.div>
    </div>
  );
};

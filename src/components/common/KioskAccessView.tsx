import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGym } from '../../context/GymContext';
import { User, Membership, SubscriptionPlan } from '../../types';
import {
  IdCard,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Maximize2,
  Minimize2,
  Delete,
  ArrowRight,
  ShieldCheck,
  Building2,
  Clock,
  Sparkles,
  QrCode,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface KioskScanResult {
  allowed: boolean;
  message: string;
  reasonCode?: string;
  user?: User;
  membership?: Membership;
  plan?: SubscriptionPlan;
}

export const KioskAccessView: React.FC = () => {
  const {
    currentGym,
    branches,
    selectedBranchId,
    setSelectedBranchId,
    validateDniAccess,
    validateQrAccess,
    getMembershipForUser,
    getPlanById
  } = useGym();

  const [dniValue, setDniValue] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<KioskScanResult | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showQrMode, setShowQrMode] = useState<boolean>(false);
  const [qrInput, setQrInput] = useState<string>('');
  const [autoResetSeconds, setAutoResetSeconds] = useState<number>(0);

  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentBranch = branches.find(b => b.id === selectedBranchId) || branches[0];

  // Digital clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Audio tone generator
  const playSound = useCallback((type: 'success' | 'warning' | 'error') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } else if (type === 'warning') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.setValueAtTime(370, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.setValueAtTime(140, audioCtx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.45);
      }
    } catch {
      // Audio context might be restricted before user gesture
    }
  }, []);

  const triggerResetTimer = (seconds: number) => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setAutoResetSeconds(seconds);

    countdownIntervalRef.current = setInterval(() => {
      setAutoResetSeconds(prev => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    resetTimerRef.current = setTimeout(() => {
      setResult(null);
      setDniValue('');
      setQrInput('');
      setIsProcessing(false);
    }, seconds * 1000);
  };

  const processDniSubmit = useCallback((dniToValidate?: string) => {
    const targetDni = (dniToValidate ?? dniValue).replace(/[^0-9]/g, '');
    if (!targetDni || isProcessing) return;

    setIsProcessing(true);

    setTimeout(() => {
      const res = validateDniAccess(targetDni, selectedBranchId, 'dni_kiosk');

      let soundType: 'success' | 'warning' | 'error' = 'error';
      if (res.allowed) {
        soundType = res.reasonCode === 'EXPIRED_GRACE' ? 'warning' : 'success';
      }

      setResult(res);
      setIsProcessing(false);
      playSound(soundType);

      // Auto clear after 3.5s for success, 5s for error/warning
      triggerResetTimer(res.allowed ? 4 : 5);
    }, 300);
  }, [dniValue, isProcessing, validateDniAccess, selectedBranchId, playSound]);

  const processQrSubmit = useCallback((qrTokenToValidate?: string) => {
    const targetToken = (qrTokenToValidate ?? qrInput).trim();
    if (!targetToken || isProcessing) return;

    setIsProcessing(true);

    setTimeout(() => {
      const res = validateQrAccess(targetToken, selectedBranchId, 'qr_scanner');

      let soundType: 'success' | 'warning' | 'error' = 'error';
      if (res.allowed) {
        soundType = res.reasonCode === 'EXPIRED_GRACE' ? 'warning' : 'success';
      }

      setResult(res);
      setIsProcessing(false);
      playSound(soundType);

      triggerResetTimer(res.allowed ? 4 : 5);
    }, 300);
  }, [qrInput, isProcessing, validateQrAccess, selectedBranchId, playSound]);

  // Keypad actions
  const handleDigitPress = (digit: string) => {
    if (result) {
      setResult(null);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }
    if (dniValue.length < 9) {
      setDniValue(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    if (result) {
      setResult(null);
    }
    setDniValue(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setDniValue('');
    setResult(null);
  };

  // Keyboard handler for physical barcode scanners / hardware keypads
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showQrMode) return;

      if (e.key >= '0' && e.key <= '9') {
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        processDniSubmit();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dniValue, showQrMode, processDniSubmit]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Format DNI with thousand separators
  const formatDniDisplay = (raw: string) => {
    if (!raw) return '';
    return raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  return (
    <div id="kiosk-container" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Top Bar / Header */}
      <header id="kiosk-header" className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black">
            FF
          </div>
          <div>
            <h1 className="text-base font-black text-white tracking-tight flex items-center gap-2">
              <span>{currentGym?.name || 'FuerzaFit'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                Molinete / Tótem
              </span>
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Sede {currentBranch?.name || 'Central'}</span>
            </p>
          </div>
        </div>

        {/* Live Clock & Action Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-4 py-2 rounded-2xl">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-sm font-bold text-white tracking-wider">{currentTime}</span>
          </div>

          {branches.length > 1 && (
            <select
              id="kiosk-branch-select"
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              aria-label="Seleccionar sede para el kiosco"
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-emerald-500"
            >
              {branches.map(b => (
                <option key={b.id} value={b.id}>Sede {b.name}</option>
              ))}
            </select>
          )}

          <button
            id="kiosk-fullscreen-toggle"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <a
            id="kiosk-exit-button"
            href="/admin"
            title="Volver a panel de administración"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* Main Kiosk Center Area */}
      <main id="kiosk-main" className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-2xl mx-auto w-full">
        
        {/* Step Instructions */}
        <div className="text-center mb-6">
          <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1.5 mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Ingreso Rápido de Socios
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {showQrMode ? 'Escaneá tu QR de Alta' : 'Ingresá tu DNI para pasar'}
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            {showQrMode
              ? 'Mostrá el código QR que recibiste por WhatsApp o en recepción.'
              : 'Escribí tu número de documento en el teclado táctil y presioná Ingresar.'}
          </p>
        </div>

        {/* Big Display Screen */}
        <div id="kiosk-display-card" className="w-full bg-slate-900 border-2 border-slate-800 rounded-3xl p-5 shadow-2xl mb-6 relative overflow-hidden">
          
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-bold">
            <span className="flex items-center gap-1.5">
              <IdCard className="w-4 h-4 text-emerald-400" />
              <span>NÚMERO DE DOCUMENTO (DNI)</span>
            </span>
            {dniValue && (
              <button
                id="kiosk-clear-display-btn"
                onClick={handleClear}
                className="text-slate-400 hover:text-rose-400 text-xs font-bold transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="h-16 flex items-center justify-center bg-slate-950/80 rounded-2xl border border-slate-800/80 px-4">
            {dniValue ? (
              <span className="text-3xl sm:text-4xl font-mono font-black text-emerald-400 tracking-widest">
                {formatDniDisplay(dniValue)}
              </span>
            ) : (
              <span className="text-slate-600 text-lg sm:text-xl font-medium flex items-center gap-2">
                <span className="w-2.5 h-5 bg-emerald-500/60 animate-pulse rounded-sm" />
                Ej: 38.456.789
              </span>
            )}
          </div>
        </div>

        {/* Tactical Touch Keypad */}
        <div id="kiosk-keypad" className="w-full grid grid-cols-3 gap-3 mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              id={`kiosk-btn-${digit}`}
              onClick={() => handleDigitPress(digit)}
              className="h-16 sm:h-20 rounded-2xl bg-slate-900 hover:bg-slate-800 active:bg-slate-750 active:scale-95 border border-slate-800 text-2xl sm:text-3xl font-black text-white shadow-md transition-all flex items-center justify-center cursor-pointer select-none"
            >
              {digit}
            </button>
          ))}

          {/* Delete / Backspace */}
          <button
            id="kiosk-btn-backspace"
            onClick={handleBackspace}
            title="Borrar último dígito"
            className="h-16 sm:h-20 rounded-2xl bg-slate-900/80 hover:bg-slate-800 active:bg-slate-750 active:scale-95 border border-slate-800 text-slate-300 shadow-md transition-all flex items-center justify-center cursor-pointer select-none"
          >
            <Delete className="w-7 h-7" />
          </button>

          {/* Zero */}
          <button
            id="kiosk-btn-0"
            onClick={() => handleDigitPress('0')}
            className="h-16 sm:h-20 rounded-2xl bg-slate-900 hover:bg-slate-800 active:bg-slate-750 active:scale-95 border border-slate-800 text-2xl sm:text-3xl font-black text-white shadow-md transition-all flex items-center justify-center cursor-pointer select-none"
          >
            0
          </button>

          {/* Submit / Enter button */}
          <button
            id="kiosk-btn-submit"
            onClick={() => processDniSubmit()}
            disabled={!dniValue || isProcessing}
            className={`h-16 sm:h-20 rounded-2xl font-black text-lg sm:text-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer select-none ${
              !dniValue || isProcessing
                ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            {isProcessing ? (
              <div className="w-6 h-6 border-3 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>INGRESAR</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Secondary Alternative: QR Alta Switch */}
        <div className="flex items-center justify-center gap-3">
          <button
            id="kiosk-toggle-qr-mode"
            onClick={() => setShowQrMode(prev => !prev)}
            className="text-xs text-slate-400 hover:text-emerald-400 font-bold flex items-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900/60 border border-slate-800/80 transition-colors"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>{showQrMode ? 'Volver a teclado DNI' : '¿Primer día? Validar con QR de alta'}</span>
          </button>
        </div>

        {/* QR Code Input Modal / Drawer when QR mode is open */}
        {showQrMode && (
          <div className="w-full mt-4 p-4 bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-xl">
            <p className="text-xs text-slate-300 font-bold mb-2">Pegá o escaneá el código QR de alta:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="FF-QR-..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => processQrSubmit()}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl"
              >
                Validar QR
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Footer Instructions / Reception Note */}
      <footer id="kiosk-footer" className="py-4 px-6 text-center text-xs text-slate-500 border-t border-slate-900">
        ¿Problemas para ingresar? Acercate al mostrador de recepción para verificar tu cuota o darte de alta.
      </footer>

      {/* OVERLAY POPUP: FULL-SCREEN SCAN RESULT WITH RICH STATUS */}
      <AnimatePresence>
        {result && (
          <motion.div
            id="kiosk-result-overlay"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 backdrop-blur-xl ${
              result.allowed
                ? result.reasonCode === 'EXPIRED_GRACE'
                  ? 'bg-amber-950/80 border-4 border-amber-500'
                  : 'bg-emerald-950/85 border-4 border-emerald-500'
                : 'bg-rose-950/85 border-4 border-rose-500'
            }`}
          >
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
              
              {/* Progress bar auto-reset */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800">
                <div
                  className={`h-full transition-all duration-1000 ${
                    result.allowed
                      ? result.reasonCode === 'EXPIRED_GRACE' ? 'bg-amber-400' : 'bg-emerald-400'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.max(10, (autoResetSeconds / 5) * 100)}%` }}
                />
              </div>

              {/* Status Icon */}
              <div className="flex justify-center">
                {result.allowed ? (
                  result.reasonCode === 'EXPIRED_GRACE' ? (
                    <div className="w-20 h-20 rounded-full bg-amber-500/20 text-amber-400 border-2 border-amber-500/40 flex items-center justify-center animate-bounce">
                      <AlertTriangle className="w-12 h-12" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40 flex items-center justify-center animate-pulse">
                      <CheckCircle2 className="w-12 h-12" />
                    </div>
                  )
                ) : (
                  <div className="w-20 h-20 rounded-full bg-rose-500/20 text-rose-400 border-2 border-rose-500/40 flex items-center justify-center">
                    <XCircle className="w-12 h-12" />
                  </div>
                )}
              </div>

              {/* Title & Badge */}
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                  result.allowed
                    ? result.reasonCode === 'EXPIRED_GRACE'
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                      : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {result.allowed
                    ? result.reasonCode === 'EXPIRED_GRACE'
                      ? 'PASE AUTORIZADO · CUOTA VENCIDA'
                      : 'PASE AUTORIZADO · ¡ADELANTE!'
                    : 'ACCESO BLOQUEADO'}
                </span>

                {result.user ? (
                  <h3 className="text-2xl sm:text-3xl font-black text-white mt-3">
                    ¡HOLA, {result.user.name.toUpperCase()}!
                  </h3>
                ) : (
                  <h3 className="text-2xl font-black text-white mt-3">
                    {result.allowed ? '¡Bienvenido/a!' : 'Acceso no permitido'}
                  </h3>
                )}

                <p className="text-sm text-slate-300 mt-2 leading-relaxed font-medium">
                  {result.message}
                </p>
              </div>

              {/* Member Summary Card if known */}
              {result.user && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left flex items-center gap-3">
                  <img
                    src={result.user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                    alt={result.user.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                  />
                  <div className="overflow-hidden">
                    <p className="font-bold text-white text-sm truncate">{result.user.name}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{result.plan?.name || 'Membresía Activa'}</span>
                    </p>
                  </div>
                </div>
              )}

              <button
                id="kiosk-close-modal-btn"
                onClick={() => {
                  setResult(null);
                  setDniValue('');
                  setQrInput('');
                  if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
                  if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
                }}
                className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm transition-all cursor-pointer ${
                  result.allowed
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                {result.allowed ? 'Continuar al Gimnasio' : 'Cerrar y Reintentar'}
              </button>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

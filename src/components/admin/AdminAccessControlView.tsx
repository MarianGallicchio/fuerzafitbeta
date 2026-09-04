import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { User } from '../../types';
import {
  QrCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  DoorOpen,
  Scan,
  RefreshCw,
  Clock,
  IdCard,
  UserCheck,
  Building2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScanResult {
  allowed: boolean;
  message: string;
  user?: User;
  planName?: string;
}

export const AdminAccessControlView: React.FC = () => {
  const {
    validateQrAccess,
    validateDniAccess,
    users,
    memberships,
    getPlanById,
    attendanceRecords,
    branches,
    selectedBranchId
  } = useGym();

  const [dniInput, setDniInput] = useState('');
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const currentBranch = branches.find(b => b.id === selectedBranchId) || branches[0];
  const members = users.filter(u => u.role === 'member');
  const branchNameOf = (branchId: string) =>
    branches.find(b => b.id === branchId)?.name || currentBranch?.name || 'Sede';

  const playFeedback = (allowed: boolean) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (allowed) {
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
        osc.frequency.setValueAtTime(160, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      }
    } catch (e) {}
  };

  const runValidation = (fn: () => { allowed: boolean; message: string; user?: User; plan?: any }) => {
    setIsScanning(true);
    setTimeout(() => {
      const result = fn();
      const mapped: ScanResult = {
        allowed: result.allowed,
        message: result.message,
        user: result.user,
        planName: result.plan?.name
      };
      setLastScanResult(mapped);
      setIsScanning(false);
      playFeedback(mapped.allowed);
    }, 350);
  };

  // BETA: acceso diario por DNI (flujo principal de recepción)
  const handleDniAccess = (dni?: string) => {
    const value = (dni ?? dniInput).trim();
    if (!value) return;
    runValidation(() => validateDniAccess(value));
  };

  // Simulación desde la lista: usa el DNI real
  const handleSimulateMemberDni = (member: User) => {
    if (member.dni) {
      setDniInput(member.dni);
      handleDniAccess(member.dni);
    } else {
      setLastScanResult({
        allowed: false,
        message: `${member.name} no tiene DNI cargado. Editalo en Socios para usar el acceso por documento.`
      });
    }
  };

  // Pop-up DNI para que el socio tipee - sin QR, sin ruta nueva
  const openDniPopup = () => {
    const w = window.open('', '_blank', 'width=420,height=560,left=200,top=100');
    if (!w) {
      alert('Pop-up bloqueado. Permitir ventanas emergentes para este sitio.');
      return;
    }
    w.document.write(`
      <html><head><title>DNI - FuerzaFit</title>
      <meta name="viewport" content="width=device-width, initial-scale=1"/>
      <style>
        body{margin:0;font-family:system-ui;background:#020617;color:#e2e8f0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:24px}
        .card{background:#0f172a;border:1px solid #1e293b;border-radius:24px;padding:24px;width:100%;max-width:360px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.5)}
        h1{font-size:18px;font-weight:900;color:#fff;margin:0 0 4px}
        p{font-size:12px;color:#94a3b8;margin:0 0 16px}
        input{width:100%;padding:16px;border-radius:16px;border:2px solid #1e293b;background:#020617;color:#fff;font-size:22px;font-family:monospace;letter-spacing:0.2em;text-align:center;outline:none}
        input:focus{border-color:#10b981}
        button{width:100%;margin-top:12px;padding:14px;border-radius:16px;border:0;background:#10b981;color:#020617;font-weight:900;font-size:14px;cursor:pointer}
        button:active{transform:scale(0.98)}
        .hint{font-size:11px;color:#64748b;margin-top:12px}
      </style></head><body>
      <div class="card">
        <h1>Ingresá tu DNI</h1>
        <p>Te lo muestra el admin. Tipéalo y presioná Ingresar.</p>
        <input id="dni" inputmode="numeric" autocomplete="off" placeholder="38.456.789" maxlength="9" autofocus />
        <button id="btn">Ingresar →</button>
        <div class="hint">Se valida al instante en recepción. No se guarda el QR.</div>
      </div>
      <script>
        const inp=document.getElementById('dni');
        const btn=document.getElementById('btn');
        function send(){
          const v=inp.value.replace(/[^0-9]/g,'');
          if(!v) return;
          if(window.opener){ window.opener.postMessage({type:'fuerzafit-dni', dni:v}, '*'); }
          window.close();
        }
        btn.onclick=send;
        inp.onkeydown=e=>{ if(e.key==='Enter') send(); };
        inp.focus();
      <\/script></body></html>
    `);
    w.document.close();
  };

  // Escucha DNI tipeado en el pop-up
  React.useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data && e.data.type === 'fuerzafit-dni' && e.data.dni) {
        setDniInput(String(e.data.dni));
        handleDniAccess(String(e.data.dni));
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [handleDniAccess]);

  const handleManualOpen = () => {
    alert('Molinete desbloqueado manualmente por recepción (Apertura de cortesía).');
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Control de Accesos en Vivo
            </span>
            <span className="text-xs text-slate-400">Molinete / Torniquete Sede {currentBranch?.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Acceso por DNI</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            El socio tipea su DNI en la ventana que le muestra el admin. Sin QR en molinete.
          </p>
        </div>

        <button
          onClick={handleManualOpen}
          className="py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
        >
          <DoorOpen className="w-4 h-4 text-emerald-400" />
          <span>Apertura Manual de Emergencia</span>
        </button>
      </div>

      {/* Main Validation Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Validation Box (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-6">

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scan className="w-5 h-5 text-emerald-400" />
              <h2 className="font-extrabold text-base text-white">Puesto de Recepción</h2>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Sensor Activo
            </span>
          </div>

          {/* Validation Result Screen / Turnstile Display */}
          <div className="min-h-[220px] flex items-center justify-center">
            {isScanning ? (
              <div className="text-center space-y-3">
                <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-300">Validando membresía, cuota y sede...</p>
              </div>
            ) : lastScanResult ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`w-full p-6 rounded-3xl border-2 text-center space-y-3 ${
                  lastScanResult.allowed
                    ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-200 shadow-2xl shadow-emerald-500/10'
                    : 'bg-rose-950/40 border-rose-500/80 text-rose-200 shadow-2xl shadow-rose-500/10'
                }`}
              >
                <div className="flex items-center justify-center">
                  {lastScanResult.allowed ? (
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center ring-8 ring-emerald-500/10">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center ring-8 ring-rose-500/10">
                      <XCircle className="w-10 h-10" />
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-black text-white">
                    {lastScanResult.allowed ? 'ACCESO AUTORIZADO' : 'ACCESO DENEGADO'}
                  </h3>
                  <p className="text-xs font-bold mt-1 text-slate-300">{lastScanResult.message}</p>
                </div>

                {lastScanResult.user && (
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-center gap-3">
                    <img
                      src={lastScanResult.user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                      alt={lastScanResult.user.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-400"
                    />
                    <div className="text-left text-xs">
                      <p className="font-extrabold text-white">{lastScanResult.user.name}</p>
                      <p className="text-[11px] text-slate-400">{lastScanResult.planName || 'Plan Activo'}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="text-center p-8 border-2 border-dashed border-slate-800 rounded-3xl w-full">
                <IdCard className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-400">Esperando DNI del socio</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Escribí el DNI arriba o tocá un socio de la derecha para validar su ingreso.
                </p>
              </div>
            )}
          </div>

          {/* DNI — único flujo, con pop-up para el socio */}
          <div className="space-y-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <p className="text-[11px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
              <IdCard className="w-4 h-4" /> Acceso diario por DNI — pop-up para el socio
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Ej: 38990123"
                value={dniInput}
                onChange={e => setDniInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleDniAccess(); }}
                className="flex-1 p-3 rounded-2xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none font-mono tracking-widest"
              />
              <button
                onClick={() => handleDniAccess()}
                className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" /> Validar DNI
              </button>
            </div>
            <button
              onClick={openDniPopup}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2"
            >
              <Maximize2 className="w-4 h-4 text-emerald-400" />
              <span>Abrir ventana DNI para el socio (pop-up)</span>
            </button>
            <p className="text-[11px] text-slate-400">El admin abre esta ventana y la gira hacia el socio para que tipee su DNI. Sin QR, sin ruta nueva.</p>
          </div>

        </div>

        {/* Member Quick List (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-white">Socios del gimnasio</h3>
            <span className="text-[11px] text-slate-400">DNI = ingreso</span>
          </div>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {members.length === 0 ? (
              <div className="text-center p-6 border border-dashed border-slate-800 rounded-2xl space-y-2">
                <p className="text-xs font-bold text-slate-300">Aún no hay socios registrados</p>
                <p className="text-[11px] text-slate-500">
                  Dalos de alta desde la sección "Socios" (con DNI obligatorio) y probá acá el acceso.
                </p>
              </div>
            ) : (
              members.map(member => {
                const mem = memberships.find(m => m.userId === member.id);
                const plan = mem ? getPlanById(mem.planId) : undefined;
                const expired = mem ? new Date(mem.endDate) < new Date() : true;
                return (
                  <div
                    key={member.id}
                    className="w-full p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 text-left transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={member.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                        alt={member.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-white truncate">{member.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          DNI {member.dni || '—'} · {plan?.name || 'Sin plan'} {mem && (mem.status === 'suspended' ? '· Suspendida' : expired ? '· Vencida' : '· Activa')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleSimulateMemberDni(member)}
                        className="w-full py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                      >
                        <IdCard className="w-3.5 h-3.5" /> Ingreso DNI
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Attendance Records Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="font-extrabold text-base text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          <span>Historial de Accesos Registrados Hoy</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 pb-2 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 pl-3">Socio</th>
                <th className="py-2.5">Hora</th>
                <th className="py-2.5">Membresía</th>
                <th className="py-2.5">Sede</th>
                <th className="py-2.5">Resultado</th>
                <th className="py-2.5 text-right pr-3">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">
                    No hay accesos registrados hoy todavía. Las validaciones por DNI aparecerán aquí en tiempo real.
                  </td>
                </tr>
              ) : (
                attendanceRecords.map(rec => (
                  <tr key={rec.id} className="text-slate-300 hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 pl-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={rec.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                          alt={rec.userName}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="font-bold text-white">{rec.userName}</span>
                      </div>
                    </td>
                    <td className="py-3 font-mono text-slate-400">
                      {new Date(rec.timestamp).toLocaleTimeString('es-AR')}
                    </td>
                    <td className="py-3 text-slate-300">{rec.planName || 'Plan General'}</td>
                    <td className="py-3 text-slate-400">{branchNameOf(rec.branchId)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rec.status === 'granted'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-rose-500/15 text-rose-400'
                      }`}>
                        {rec.status === 'granted' ? 'Permitido' : 'Denegado'}
                      </span>
                    </td>
                    <td className="py-3 text-right pr-3 text-slate-400 text-[11px]">
                      {rec.reason} {rec.accessMethod === 'qr_scanner' ? '· QR alta' : rec.accessMethod === 'manual_checkin' ? '· DNI' : ''}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-900/60 border border-slate-800 rounded-2xl px-4 py-3">
        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p>
          Flujo beta recomendado: <strong className="text-slate-300">1)</strong> alta del socio en Socios con DNI obligatorio (se genera su QR de alta),{' '}
          <strong className="text-slate-300">2)</strong> ingreso diario escribiendo el DNI en recepción,{' '}
          <strong className="text-slate-300">3)</strong> QR solo si el socio nuevo lo presenta en su primer día.
        </p>
      </div>

    </div>
  );
};

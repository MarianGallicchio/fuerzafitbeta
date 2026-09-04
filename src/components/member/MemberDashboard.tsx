import React from 'react';
import { useGym } from '../../context/GymContext';
import {
  QrCode,
  Dumbbell,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Flame,
  Award,
  Sparkles,
  Users,
  PlayCircle,
  MessageCircle,
  Maximize2,
  ShieldCheck,
  Zap,
  Activity,
  User
} from 'lucide-react';
import { motion } from 'motion/react';
import { WeeklyCaloriesBarChart } from './WeeklyCaloriesBarChart';

interface MemberDashboardProps {
  onOpenQr: () => void;
  onOpenPayment?: () => void;
  onNavigateTab: (tab: 'dashboard' | 'routine' | 'classes' | 'progress' | 'profile') => void;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({
  onOpenQr,
  onNavigateTab
}) => {
  const {
    currentUser,
    getMembershipForUser,
    getPlanById,
    routines,
    classes,
    branches,
    selectedBranchId,
    workoutLogs,
    progressMetrics
  } = useGym();

  if (!currentUser) return null;

  const membership = getMembershipForUser(currentUser.id);
  const plan = membership ? getPlanById(membership.planId) : null;
  const currentBranch = branches.find(b => b.id === selectedBranchId) || branches[0];

  const now = new Date();
  const expiryDate = membership ? new Date(membership.endDate) : null;
  const isExpired = expiryDate ? expiryDate < now : true;
  const daysLeft = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  
  const graceDays = plan?.gracePeriodDays || 0;
  const isInGrace = isExpired && expiryDate && (now.getTime() - expiryDate.getTime()) <= graceDays * 24 * 60 * 60 * 1000;

  // Member's assigned routines
  const userRoutines = routines.filter(r => r.assignedUserIds.includes(currentUser.id));
  const activeRoutine = userRoutines[0] || routines[0];

  // Member's upcoming booked classes
  const myBookings = classes.filter(c => c.enrolledUserIds.includes(currentUser.id));
  const nextClass = myBookings[0];

  // Latest workout log
  const userLogs = workoutLogs.filter(l => l.userId === currentUser.id);
  const latestLog = userLogs[0];

  // Latest progress
  const userProgress = progressMetrics.filter(p => p.userId === currentUser.id);
  const currentWeight = userProgress[userProgress.length - 1]?.weightKg || 80.8;

  // Sede Occupancy calculation
  const occupancyPercent = Math.min(100, Math.round((currentBranch.currentOccupancy / currentBranch.maxCapacity) * 100));

  const handleOpenWhatsAppSupport = () => {
    const cleanPhone = currentBranch.phone.replace(/\D/g, '');
    const message = encodeURIComponent(`¡Hola FuerzaFit ${currentBranch.name}! Soy ${currentUser.name}. Quería consultar sobre el gimnasio.`);
    window.open(`https://wa.me/${cleanPhone.startsWith('54') ? cleanPhone : `549${cleanPhone}`}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-4">
      
      {/* =========================================================================
          BENTO GRID CONTAINER (12 Columns Layout)
          ========================================================================= */}
      <div className="grid grid-cols-12 gap-4">

        {/* -----------------------------------------------------------------------
            BENTO ITEM 1: Hero Greeting & Sede Occupancy (Col Span: 8 on LG)
            ----------------------------------------------------------------------- */}
        <div className="col-span-12 lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-2 z-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                Socio Activo
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {currentUser.name} • DNI {currentUser.dni}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight pt-1">
              ¿Listo para entrenar hoy?
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Sede <strong className="text-slate-200">{currentBranch.name}</strong> ({currentBranch.address}). Presentá tu pase QR digital en el molinete para ingresar.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4 z-10">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Ocupación Sede</span>
                <span className="text-emerald-400 font-extrabold">{currentBranch.currentOccupancy} / {currentBranch.maxCapacity} socios ({occupancyPercent}%)</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${occupancyPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2">
              <button
                onClick={() => onNavigateTab('classes')}
                className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                <span>Reservar Clase</span>
              </button>
              <button
                onClick={() => onNavigateTab('routine')}
                className="py-2 px-3.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Dumbbell className="w-3.5 h-3.5" />
                <span>Mi Rutina</span>
              </button>
            </div>
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            BENTO ITEM 2: Quick Access Digital QR Pass Card (Col Span: 4 on LG)
            ----------------------------------------------------------------------- */}
        <div
          onClick={onOpenQr}
          className="col-span-12 lg:col-span-4 bg-gradient-to-br from-emerald-500 via-emerald-400 to-teal-400 rounded-3xl p-6 shadow-2xl flex flex-col justify-between text-slate-950 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-black/10 rounded-full blur-xl pointer-events-none" />

          <div className="space-y-1.5 z-10">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/15 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                <Activity className="w-3 h-3 animate-pulse" />
                Pase Digital de Acceso
              </span>
              <Maximize2 className="w-4 h-4 opacity-75 group-hover:scale-110 transition-transform" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-tight pt-1">
              Credencial QR Molinete
            </h3>
            <p className="text-xs text-slate-900/80 font-medium">
              {isExpired && !isInGrace
                ? 'Acceso bloqueado. Requiere regularizar cuota.'
                : 'Pase activo. Apoyá el código en el lector de recepción.'}
            </p>
          </div>

          <div className="mt-5 p-3 rounded-2xl bg-slate-950 text-white flex items-center justify-between z-10 shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-mono text-[10px] text-slate-400">{currentUser.qrCode}</p>
                <p className="text-xs font-bold text-emerald-400">Tocar para ampliar</p>
              </div>
            </div>

            <span className="text-[10px] px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 font-black">
              MOSTRAR
            </span>
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            BENTO ITEM 3: Membership Status & Mercado Pago Renew (Col Span: 12 or 6)
            ----------------------------------------------------------------------- */}
        <div className={`col-span-12 lg:col-span-6 rounded-3xl p-6 border shadow-xl flex flex-col justify-between space-y-4 ${
          membership?.status === 'suspended'
            ? 'bg-slate-900 border-amber-500/40'
            : isExpired
            ? isInGrace
              ? 'bg-slate-900 border-amber-500/50'
              : 'bg-slate-900 border-rose-500/50'
            : daysLeft <= 5
            ? 'bg-slate-900 border-amber-500/40'
            : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${isExpired ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  {isExpired ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">{plan?.name || 'Membresía FuerzaFit'}</h3>
                  <p className="text-xs text-slate-400">Tu plan de entrenamiento asignado</p>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                isExpired
                  ? isInGrace ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}>
                {isExpired ? (isInGrace ? 'PERÍODO DE GRACIA' : 'CUOTA VENCIDA') : `${daysLeft} DÍAS RESTANTES`}
              </span>
            </div>

            <p className="text-xs text-slate-400">
              {membership?.status === 'suspended'
                ? 'Membresía en pausa temporal. Contactá a recepción para reactivarla.'
                : isExpired
                ? isInGrace
                  ? `Venció el ${expiryDate?.toLocaleDateString('es-AR')}. Tenés ${graceDays} días de tolerancia. Consultá en recepción.`
                  : `Venció el ${expiryDate?.toLocaleDateString('es-AR')}. Acercate a recepción para habilitar el acceso.`
                : `Vigente hasta el ${expiryDate?.toLocaleDateString('es-AR')}. Consultá vigencia y rutina en recepción si necesitás.`}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800">
            <button
              onClick={() => onNavigateTab('profile')}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors text-left"
            >
              <User className="w-4 h-4 text-emerald-400" />
              <span>Ver mi perfil</span>
            </button>
            <span className="text-[11px] text-slate-500">
              {isExpired ? 'Estado: a regularizar' : `Quedan ${daysLeft} días`}
            </span>
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            BENTO ITEM 4: Performance & Biometric Triplet (Col Span: 12 or 6)
            ----------------------------------------------------------------------- */}
        <div className="col-span-12 lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Triplet 1: Streak */}
          <div
            onClick={() => onNavigateTab('progress')}
            className="p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex flex-col justify-between shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Racha</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-white">4 Días</p>
              <p className="text-[11px] text-emerald-400 font-bold mt-0.5">Entrenando activo</p>
            </div>
          </div>

          {/* Triplet 2: Weight */}
          <div
            onClick={() => onNavigateTab('progress')}
            className="p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex flex-col justify-between shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Peso Actual</span>
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-white">{currentWeight} <span className="text-xs text-slate-400 font-normal">kg</span></p>
              <p className="text-[11px] text-sky-400 font-bold mt-0.5">-3.2 kg acumulado</p>
            </div>
          </div>

          {/* Triplet 3: Lifted Volume */}
          <div
            onClick={() => onNavigateTab('routine')}
            className="p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex flex-col justify-between shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Volumen</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-white truncate">
                {latestLog ? `${(latestLog.totalVolumeKg / 1000).toFixed(1)}k` : '4.8k'} <span className="text-xs text-slate-400 font-normal">kg</span>
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Última sesión</p>
            </div>
          </div>

        </div>

        {/* -----------------------------------------------------------------------
            BENTO ITEM 4.5: Weekly Calories Burned Bar Chart (Recharts)
            ----------------------------------------------------------------------- */}
        <WeeklyCaloriesBarChart onNavigateTab={onNavigateTab} />

        {/* -----------------------------------------------------------------------
            BENTO ITEM 5: Active Workout Routine Module (Col Span: 8 on LG)
            ----------------------------------------------------------------------- */}
        <div className="col-span-12 lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-base text-white">Mi Rutina de Entrenamiento</h2>
                <p className="text-xs text-slate-400">Asignada por {activeRoutine?.creatorName || 'Profesor de Sala'}</p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('routine')}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              <span>Ver Completa</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {activeRoutine ? (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {activeRoutine.goal.toUpperCase()} • {activeRoutine.level.toUpperCase()}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">{activeRoutine.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeRoutine.days.length} días estructurados • {activeRoutine.days.reduce((acc, d) => acc + d.blocks.reduce((bacc, b) => bacc + b.exercises.length, 0), 0)} ejercicios totales
                  </p>
                </div>

                <button
                  onClick={() => onNavigateTab('routine')}
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Empezar Sesión de Hoy</span>
                </button>
              </div>

              {/* Day preview pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {activeRoutine.days.map((day, idx) => (
                  <div
                    key={day.id}
                    onClick={() => onNavigateTab('routine')}
                    className="p-3 rounded-2xl bg-slate-800/30 border border-slate-700/40 hover:border-emerald-500/40 cursor-pointer transition-all text-xs"
                  >
                    <p className="text-slate-400 text-[11px] font-semibold">{day.dayOfWeek || `Día ${idx + 1}`}</p>
                    <p className="text-white font-bold truncate mt-0.5">{day.name.split(':')[1] || day.name}</p>
                    <span className="text-[10px] text-emerald-400 font-medium">
                      {day.blocks.reduce((acc, b) => acc + b.exercises.length, 0)} ejercicios
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">No tenés rutinas asignadas actualmente.</p>
          )}
        </div>

        {/* -----------------------------------------------------------------------
            BENTO ITEM 6: Group Classes & Bookings (Col Span: 4 on LG)
            ----------------------------------------------------------------------- */}
        <div className="col-span-12 lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-white">Clases Grupales</h3>
              </div>

              <button
                onClick={() => onNavigateTab('classes')}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300"
              >
                Explorar
              </button>
            </div>

            {/* Next reserved class */}
            {nextClass ? (
              <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  Tu Reserva Activa
                </span>
                <p className="font-bold text-xs text-white pt-1">{nextClass.title}</p>
                <p className="text-[11px] text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{nextClass.startTime} hs • {nextClass.instructorName}</span>
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/40 text-center text-xs text-slate-400">
                <p>No tenés clases reservadas hoy.</p>
              </div>
            )}

            {/* Upcoming classes list preview */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Próximas Grillas</p>
              {classes.slice(0, 2).map(cls => (
                <div
                  key={cls.id}
                  onClick={() => onNavigateTab('classes')}
                  className="p-2.5 rounded-xl bg-slate-800/30 border border-slate-700/40 hover:border-slate-600 cursor-pointer flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <p className="font-bold text-white text-xs">{cls.title}</p>
                    <p className="text-[10px] text-slate-400">{cls.date} • {cls.startTime} hs</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold">
                    {cls.capacity - cls.enrolledUserIds.length} cupos
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* WhatsApp Support CTA */}
          <button
            onClick={handleOpenWhatsAppSupport}
            className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/60 font-bold text-xs flex items-center justify-center gap-2 transition-colors mt-2"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Consultas por WhatsApp ({currentBranch.name})</span>
          </button>
        </div>

      </div>

    </div>
  );
};

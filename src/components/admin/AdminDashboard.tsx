import React from 'react';
import { useGym } from '../../context/GymContext';
import { ExpiringMembersAlert } from './ExpiringMembersAlert';
import {
  Users,
  CreditCard,
  Calendar,
  IdCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  DollarSign,
  UserPlus,
  Dumbbell,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Zap,
  MessageCircle,
  ArrowUpRight,
  Activity,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

interface AdminDashboardProps {
  onNavigateTab: (tab: 'dashboard' | 'members' | 'access' | 'plans' | 'routines' | 'classes' | 'reports') => void;
  onOpenNewMemberModal?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const {
    users,
    memberships,
    plans,
    payments,
    attendanceRecords,
    classes,
    branches,
    selectedBranchId,
    getMembershipForUser
  } = useGym();

  const members = users.filter(u => u.role === 'member');
  const now = new Date();

  // Active vs Expired vs Suspended using getMembershipForUser
  let activeCount = 0;
  let expiredCount = 0;
  let expiringSoonCount = 0; // next 7 days

  const expiringMembersList: Array<{
    user: typeof members[0];
    membership: typeof memberships[0];
    daysLeft: number;
  }> = [];

  members.forEach(user => {
    const m = getMembershipForUser(user.id);
    if (!m) {
      expiredCount++;
      return;
    }

    const exp = new Date(m.endDate);
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (m.status === 'suspended') {
      // suspended
    } else if (exp < now || m.status === 'expired') {
      expiredCount++;
      expiringMembersList.push({ user, membership: m, daysLeft: diffDays });
    } else {
      activeCount++;
      if (diffDays >= 0 && diffDays <= 7) {
        expiringSoonCount++;
        expiringMembersList.push({ user, membership: m, daysLeft: diffDays });
      }
    }
  });

  // Monthly Revenue ARS
  const totalMonthlyRevenueARS = payments.reduce((acc, p) => acc + (p.status === 'approved' ? p.amountARS : 0), 0);
  const mpRevenueARS = payments
    .filter(p => p.method === 'mercadopago' && p.status === 'approved')
    .reduce((acc, p) => acc + p.amountARS, 0);

  // Today's attendance
  const todayAttendance = attendanceRecords.filter(a => a.status === 'granted');
  const deniedAttendance = attendanceRecords.filter(a => a.status === 'denied');

  // Chart data: Monthly revenue computed dynamically from payments
  const monthsNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const revenueChartData = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (4 - i));
    const monthLabel = monthsNames[d.getMonth()];
    const targetMonth = d.getMonth();
    const targetYear = d.getFullYear();

    const monthPayments = payments.filter(p => {
      if (p.status !== 'approved') return false;
      const pDate = new Date((p as any).paymentDate || (p as any).createdAt || p.paymentDate);
      return !isNaN(pDate.getTime()) && pDate.getMonth() === targetMonth && pDate.getFullYear() === targetYear;
    });

    const total = monthPayments.reduce((sum, p) => sum + p.amountARS, 0);
    const mp = monthPayments.filter(p => p.method === 'mercadopago').reduce((sum, p) => sum + p.amountARS, 0);
    const efectivo = monthPayments.filter(p => p.method === 'cash').reduce((sum, p) => sum + p.amountARS, 0);

    return {
      month: monthLabel,
      ingresos: total,
      mp,
      efectivo
    };
  });

  // Plan distribution data
  const planColors = ['#10b981', '#38bdf8', '#f59e0b', '#a855f7', '#ec4899'];
  const planDistribution = plans.map(p => ({
    name: p.name.split('(')[0].trim(),
    value: memberships.filter(m => m.planId === p.id).length
  }));

  const currentBranch = branches.find(b => b.id === selectedBranchId) || branches[0];
  const occupancyPercent = Math.min(100, Math.round((currentBranch.currentOccupancy / currentBranch.maxCapacity) * 100));

  const handleSendWhatsAppReminder = (userPhone: string, userName: string, daysLeft: number) => {
    const cleanPhone = userPhone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Hola ${userName}! Te escribimos de FuerzaFit ${currentBranch.name}. Te recordamos que tu membresía ${
        daysLeft <= 0 ? 'se encuentra vencida' : `vence en ${daysLeft} días`
      }. Podés renovar cómodamente con Mercado Pago desde la app o en recepción. ¡Te esperamos para seguir entrenando!`
    );
    window.open(`https://wa.me/${cleanPhone.startsWith('54') ? cleanPhone : `549${cleanPhone}`}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-4">
      
      {/* =========================================================================
          BENTO GRID CONTAINER (12 Columns Layout)
          ========================================================================= */}
      <div className="grid grid-cols-12 gap-4">

        {/* -----------------------------------------------------------------------
            BENTO ITEM 1: Header / Executive Overview (12 Cols)
            ----------------------------------------------------------------------- */}
        <div className="col-span-12 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-1.5 z-10">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                Panel Administrativo
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                Sede {currentBranch.name}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Control General & Métricas
            </h1>
            <p className="text-xs text-slate-400">
              Gestión centralizada de socios, cobros con Mercado Pago, molinetes y programación de clases.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 z-10">
            <button
              onClick={() => onNavigateTab('access')}
              className="py-2.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <IdCard className="w-4 h-4" />
              <span>Abrir Molinete DNI</span>
            </button>

            <button
              onClick={() => onNavigateTab('members')}
              className="py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 transition-colors"
            >
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>Nuevo Socio</span>
            </button>
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            BENTO ITEM 1.5: VISUAL ALERT - Members Expiring in Next 7 Days
            ----------------------------------------------------------------------- */}
        <ExpiringMembersAlert onNavigateTab={onNavigateTab} />

        {/* -----------------------------------------------------------------------
            BENTO ITEM 2: Monthly Revenue & MP Status (Col Span: 4, Row Span: 2 on LG)
            ----------------------------------------------------------------------- */}
        <div
          onClick={() => onNavigateTab('plans')}
          className="col-span-12 sm:col-span-6 lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">
                Ingresos del Mes
              </span>
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 group-hover:scale-110 transition-transform">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>

            <div>
              <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                ${totalMonthlyRevenueARS.toLocaleString('es-AR')}
              </p>
              <p className="text-xs text-emerald-400 font-bold flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-4 h-4" /> +14.2% vs mes anterior
              </p>
            </div>
          </div>

          <div className="mt-5 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">
              MP
            </div>
            <div className="text-xs">
              <p className="font-bold text-white flex items-center gap-1.5">
                <span>Mercado Pago Subscriptions</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </p>
              <p className="text-slate-400 text-[11px]">88% acreditado automáticamente</p>
            </div>
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            BENTO ITEM 3: Active Members & Capacity Gauge (Col Span: 4 on LG)
            ----------------------------------------------------------------------- */}
        <div
          onClick={() => onNavigateTab('members')}
          className="col-span-12 sm:col-span-6 lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">
                Socios Activos
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <p className="text-3xl sm:text-4xl font-black text-emerald-400">{activeCount}</p>
              <p className="text-xs text-slate-400">/ {currentBranch.maxCapacity} cupo sede</p>
            </div>

            {/* Capacity Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${occupancyPercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
            <div className="p-2.5 rounded-2xl bg-slate-950/50 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Por Vencer</span>
              <span className="font-extrabold text-amber-400 text-base">{expiringSoonCount} socios</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-950/50 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Vencidos</span>
              <span className="font-extrabold text-rose-400 text-base">{expiredCount} socios</span>
            </div>
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            BENTO ITEM 4: DNI Turnstile High-Impact CTA Block (Col Span: 4 on LG)
            ----------------------------------------------------------------------- */}
        <div
          onClick={() => onNavigateTab('access')}
          className="col-span-12 lg:col-span-4 bg-gradient-to-br from-emerald-500 via-emerald-400 to-teal-400 rounded-3xl p-6 shadow-2xl flex flex-col justify-between text-slate-950 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-black/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="space-y-1.5 z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/15 text-slate-950 font-black text-[10px] uppercase tracking-wider">
              <Activity className="w-3 h-3 animate-pulse" />
              Terminal de Acceso
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight leading-tight">
              Control Molinete DNI
            </h3>
            <p className="text-xs text-slate-900/80 font-medium">
              Ingreso por DNI con teclado. Subventana para el socio.
            </p>
          </div>

          <div className="mt-5 flex items-center justify-between z-10">
            <div className="text-xs font-black bg-black/15 px-3 py-1.5 rounded-xl">
              {todayAttendance.length} ingresos hoy
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-950 text-emerald-400 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <IdCard className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            BENTO ITEM 5: Financial Bar Chart (Col Span: 8 on LG)
            ----------------------------------------------------------------------- */}
        <div className="col-span-12 lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Evolución de Facturación (ARS)</span>
              </h3>
              <p className="text-xs text-slate-400">Desglose Mercado Pago Online vs Cobros en Mostrador</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <span className="text-slate-300">Mercado Pago</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-slate-300">Efectivo / Mostrador</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={val => (val >= 1000000 ? `$${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `$${Math.round(val / 1000)}k` : `$${val}`)}
                />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString('es-AR')} ARS`, 'Monto']}
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '16px', fontSize: '12px' }}
                />
                <Bar dataKey="mp" name="Mercado Pago" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                <Bar dataKey="efectivo" name="Efectivo / Mostrador" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            BENTO ITEM 6: Membership Plans Breakdown (Col Span: 4 on LG)
            ----------------------------------------------------------------------- */}
        <div className="col-span-12 lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-white">Distribución de Planes</h3>
              <button
                onClick={() => onNavigateTab('plans')}
                className="text-xs font-bold text-emerald-400 hover:underline"
              >
                Ver Planes
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Suscripciones vigentes por modalidad</p>

            <div className="h-44 w-full flex items-center justify-center mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={planColors[index % planColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 text-xs pt-2 border-t border-slate-800">
            {planDistribution.slice(0, 4).map((p, idx) => (
              <div key={p.name} className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: planColors[idx % planColors.length] }} />
                  <span className="truncate max-w-[150px] font-medium">{p.name}</span>
                </div>
                <span className="font-bold text-white">{p.value} socios</span>
              </div>
            ))}
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            BENTO ITEM 7: Live Turnstile Feed (Col Span: 6 on LG)
            ----------------------------------------------------------------------- */}
        <div className="col-span-12 lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <IdCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">Molinete en Vivo</h3>
                <p className="text-xs text-slate-400">Últimos accesos por DNI</p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold animate-pulse">
              EN VIVO
            </span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {attendanceRecords.slice(0, 5).map(att => (
              <div
                key={att.id}
                className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between text-xs hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={att.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                    alt={att.userName}
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-700"
                  />
                  <div>
                    <p className="font-extrabold text-white text-xs">{att.userName}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(att.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs • {att.planName || 'Acceso'}
                    </p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  att.status === 'granted'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}>
                  {att.status === 'granted' ? 'PERMITIDO ✓' : 'BLOQUEADO ✕'}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigateTab('access')}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs transition-colors"
          >
            Abrir Visor de Molinete Completo →
          </button>
        </div>

        {/* -----------------------------------------------------------------------
            BENTO ITEM 8: Upcoming Expirations & WhatsApp Alerts (Col Span: 6 on LG)
            ----------------------------------------------------------------------- */}
        <div className="col-span-12 lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">Vencimientos Críticos</h3>
                <p className="text-xs text-slate-400">Recordatorios directos por WhatsApp</p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('members')}
              className="text-xs font-bold text-amber-400 hover:underline"
            >
              Ver Padrón
            </button>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {expiringMembersList.slice(0, 5).map(({ user, membership, daysLeft }) => (
              <div
                key={user.id}
                className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between text-xs hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-700"
                  />
                  <div>
                    <p className="font-extrabold text-white text-xs">{user.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {daysLeft <= 0 ? (
                        <span className="text-rose-400 font-bold">Vencido</span>
                      ) : (
                        <span className="text-amber-400 font-bold">Vence en {daysLeft} días</span>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleSendWhatsAppReminder(user.phone, user.name, daysLeft)}
                  className="py-1.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-bold text-[11px] flex items-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigateTab('members')}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs transition-colors"
          >
            Gestionar Cobros y Renovaciones →
          </button>
        </div>

      </div>

    </div>
  );
};

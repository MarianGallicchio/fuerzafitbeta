import React, { useMemo, useState } from 'react';
import { useGym } from '../../context/GymContext';
import {
  AlertTriangle,
  Clock,
  MessageCircle,
  CreditCard,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { User, Membership } from '../../types';

interface ExpiringMembersAlertProps {
  onNavigateTab: (tab: 'dashboard' | 'members' | 'access' | 'plans' | 'routines' | 'classes' | 'reports') => void;
}

export const ExpiringMembersAlert: React.FC<ExpiringMembersAlertProps> = ({ onNavigateTab }) => {
  const {
    users,
    getMembershipForUser,
    getPlanById,
    branches,
    selectedBranchId
  } = useGym();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [filterMode, setFilterMode] = useState<'all_7d' | 'today_tomorrow' | '3_to_7d'>('all_7d');

  const currentBranch = branches.find(b => b.id === selectedBranchId) || branches[0];
  const members = useMemo(() => users.filter(u => u.role === 'member'), [users]);
  const now = new Date();

  // Retrieve members expiring in next 7 days using getMembershipForUser
  const expiringData = useMemo(() => {
    const items: Array<{
      member: User;
      membership: Membership;
      diffDays: number;
      expDate: Date;
      planName: string;
      planPrice: number;
    }> = [];

    members.forEach(member => {
      const mem = getMembershipForUser(member.id);
      if (!mem) return;

      if (mem.status === 'suspended') return;

      const expDate = new Date(mem.endDate);
      const diffTime = expDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Threshold: within the next 7 days (including today)
      if (diffDays >= 0 && diffDays <= 7) {
        const plan = getPlanById(mem.planId);
        items.push({
          member,
          membership: mem,
          diffDays,
          expDate,
          planName: plan?.name.split('(')[0].trim() || 'Plan de Entrenamiento',
          planPrice: plan?.priceARS || 0
        });
      }
    });

    // Sort by closest to expire first (0 days first)
    return items.sort((a, b) => a.diffDays - b.diffDays);
  }, [members, getMembershipForUser, getPlanById]);

  const filteredItems = useMemo(() => {
    if (filterMode === 'today_tomorrow') {
      return expiringData.filter(item => item.diffDays <= 1);
    }
    if (filterMode === '3_to_7d') {
      return expiringData.filter(item => item.diffDays >= 2);
    }
    return expiringData;
  }, [expiringData, filterMode]);

  const todayCount = expiringData.filter(i => i.diffDays === 0).length;
  const tomorrowCount = expiringData.filter(i => i.diffDays === 1).length;

  const handleSendWhatsApp = (member: User, planName: string, diffDays: number, expDate: Date) => {
    const cleanPhone = (member.phone || '').replace(/\D/g, '');
    const dateFormatted = expDate.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    let timeText = '';
    if (diffDays === 0) {
      timeText = 'vence hoy mismo';
    } else if (diffDays === 1) {
      timeText = 'vence mañana';
    } else {
      timeText = `vence en ${diffDays} días (el ${dateFormatted})`;
    }

    const message = encodeURIComponent(
      `Hola ${member.name}! Te saludamos desde FuerzaFit (${currentBranch.name}). Te recordamos que tu membresía "${planName}" ${timeText}. Podés renovar cómodamente de forma online o acercarte a la recepción para continuar entrenando sin interrupciones. ¡Que tengas un excelente entrenamiento!`
    );

    const fullNumber = cleanPhone.startsWith('54') ? cleanPhone : `549${cleanPhone}`;
    window.open(`https://wa.me/${fullNumber}?text=${message}`, '_blank');
  };

  // If there are no members expiring in the next 7 days, show a calm, reassuring status banner
  if (expiringData.length === 0) {
    return (
      <div
        id="admin-no-expiring-alert"
        className="col-span-12 bg-slate-900/60 border border-emerald-500/20 rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-4 transition-all"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>Membresías al Día en los Próximos 7 Días</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                100% Regularizado
              </span>
            </h4>
            <p className="text-xs text-slate-400">
              No se registran vencimientos inmediatos de socios activos para la semana en curso.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('members')}
          className="text-xs font-bold text-slate-400 hover:text-emerald-400 flex items-center gap-1 shrink-0 transition-colors"
        >
          <span>Ver Padrón Completo</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      id="admin-expiring-members-alert"
      className="col-span-12 bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-amber-950/30 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden transition-all"
    >
      {/* Subtle background glow effect */}
      <div className="absolute top-0 right-1/4 w-72 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header section with Alert summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Alerta de Renovación
              </span>
              <span className="text-xs font-bold text-amber-400/90">
                Próximos 7 Días
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
              <span>{expiringData.length} {expiringData.length === 1 ? 'socio próximo' : 'socios próximos'} a vencer</span>
              {todayCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {todayCount} vencen hoy
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-300">
              Datos verificados en tiempo real mediante <code className="text-amber-300 font-mono text-[11px] bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">getMembershipForUser</code>.
            </p>
          </div>
        </div>

        {/* Action and Filter Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-2xl p-1 text-xs">
            <button
              onClick={() => setFilterMode('all_7d')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                filterMode === 'all_7d'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({expiringData.length})
            </button>
            <button
              onClick={() => setFilterMode('today_tomorrow')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                filterMode === 'today_tomorrow'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Urgentes (≤48hs) ({todayCount + tomorrowCount})
            </button>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors"
            title={isCollapsed ? "Expandir lista" : "Colapsar lista"}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Grid of Expiring Members */}
      {!isCollapsed && (
        <div className="mt-5 space-y-3 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredItems.map(({ member, membership, diffDays, expDate, planName, planPrice }) => {
              const isToday = diffDays === 0;
              const isTomorrow = diffDays === 1;

              return (
                <div
                  key={member.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    isToday
                      ? 'bg-rose-950/30 border-rose-500/40 hover:border-rose-500/60'
                      : isTomorrow
                      ? 'bg-amber-950/30 border-amber-500/40 hover:border-amber-500/60'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top info */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={member.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-white truncate">{member.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{planName}</p>
                        {member.dni && (
                          <p className="text-[10px] text-slate-500 font-mono">DNI: {member.dni}</p>
                        )}
                      </div>
                    </div>

                    {/* Expiry Badge */}
                    <div className="text-right shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                          isToday
                            ? 'bg-rose-500 text-white animate-pulse'
                            : isTomorrow
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {isToday ? 'VENCE HOY' : isTomorrow ? 'MAÑANA' : `${diffDays} DÍAS`}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">
                        {expDate.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => handleSendWhatsApp(member, planName, diffDays, expDate)}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      title="Enviar recordatorio automático por WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      onClick={() => onNavigateTab('members')}
                      className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                      title="Ver en lista de socios"
                    >
                      <span>Gestionar</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Bar: Total count and quick shortcut to members padron */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Recordatorio: Las renovaciones extienden automáticamente 30 días la vigencia en Supabase.</span>
            </span>

            <button
              onClick={() => onNavigateTab('members')}
              className="font-bold text-amber-400 hover:underline flex items-center gap-1 shrink-0"
            >
              <span>Ver Padrón de Socios por Vencer ({expiringData.length})</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

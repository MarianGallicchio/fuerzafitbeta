import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import {
  Dumbbell,
  User,
  Shield,
  QrCode,
  Bell,
  Building2,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  CreditCard,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { isDemoModeEnabled } from '../../lib/appMode';

interface HeaderProps {
  onOpenQrModal?: () => void;
  onOpenPaymentModal?: () => void;
  onOpenAuthModal?: (mode?: 'login' | 'register' | 'profiles') => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenQrModal, onOpenPaymentModal, onOpenAuthModal }) => {
  const {
    currentUser,
    currentRole,
    logout,
    branches,
    selectedBranchId,
    setSelectedBranchId,
    notifications,
    markNotificationRead,
    getMembershipForUser,
    lastSimulatedEmailNotification
  } = useGym();
  const showDemoMenu = isDemoModeEnabled();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const selectedBranch = branches.find(b => b.id === selectedBranchId) || branches[0];
  const membership = currentUser ? getMembershipForUser(currentUser.id) : null;
  const unreadNotifs = notifications.filter(n => !n.read && (n.userId === 'all' || n.userId === currentUser?.id));

  // Determine membership badge color
  const getMembershipBadge = () => {
    if (!membership) return null;
    const isExpired = new Date(membership.endDate) < new Date();
    if (membership.status === 'suspended') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertCircle className="w-3 h-3" /> Suspendida
        </span>
      );
    }
    if (isExpired || membership.status === 'expired') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <AlertCircle className="w-3 h-3" /> Cuota Vencida
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="w-3 h-3" /> Membresía Activa
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Gym Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black">
              <Dumbbell className="w-6 h-6 transform -rotate-12" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  FUERZA<span className="text-emerald-400">FIT</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Supabase Cloud
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Gestión Integral de Gimnasios & Entrenamiento</p>
            </div>
          </div>

          {/* Sede Selector */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowBranchMenu(!showBranchMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-medium truncate max-w-[150px]">{selectedBranch?.name}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            {showBranchMenu && (
              <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50">
                <p className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">Cambiar Sede</p>
                {branches.map(b => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setSelectedBranchId(b.id);
                      setShowBranchMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      b.id === selectedBranchId ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <p>{b.name}</p>
                      <p className="text-[10px] text-slate-400">{b.address}</p>
                    </div>
                    <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                      {b.currentOccupancy}/{b.maxCapacity} socios
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

            {/* Actions & Role Switcher */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Socio specific quick QR & Pay button */}
              {currentRole === 'member' && (
                <>
                  <button
                    onClick={onOpenQrModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                    title="Abrir código QR para ingresar al gimnasio"
                  >
                    <QrCode className="w-4 h-4" />
                    <span className="hidden sm:inline">Mi Pase QR</span>
                  </button>

                  {membership && (new Date(membership.endDate) < new Date() || membership.status === 'expired') && (
                    <button
                      onClick={onOpenPaymentModal}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs animate-pulse transition-all"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Pagar Cuota</span>
                    </button>
                  )}
                </>
              )}

              {/* Login / Auth Modal Trigger */}
              <button
                onClick={() => onOpenAuthModal?.('login')}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
                title="Iniciar sesión por email con confirmación"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ingreso / Login</span>
              </button>

              {/* Notifications Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifMenu(!showNotifMenu)}
                  className="relative p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 transition-colors"
                  aria-label="Notificaciones"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifs.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-slate-950 text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadNotifs.length}
                    </span>
                  )}
                </button>

                {showNotifMenu && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Avisos & Notificaciones</span>
                      <span className="text-[11px] text-slate-400">{unreadNotifs.length} nuevas</span>
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2">
                      {notifications.filter(n => n.userId === 'all' || n.userId === currentUser?.id).length === 0 ? (
                        <p className="text-center text-xs text-slate-400 py-4">No tenés notificaciones pendientes.</p>
                      ) : (
                        notifications
                          .filter(n => n.userId === 'all' || n.userId === currentUser?.id)
                          .map(n => (
                            <div
                              key={n.id}
                              onClick={() => markNotificationRead(n.id)}
                              className={`p-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                                n.read ? 'bg-slate-800/40 text-slate-400' : 'bg-slate-800 text-slate-200 border-l-2 border-emerald-500'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-white">{n.title}</span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(n.createdAt).toLocaleDateString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-slate-300 text-[11px]">{n.message}</p>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Demo Switcher Pill */}
              <div className="relative">
                <button
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs text-white transition-all shadow-sm"
                >
                  <img
                    src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                    alt={currentUser?.name}
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-emerald-500/50"
                  />
                  <div className="text-left hidden sm:block">
                    <p className="font-bold leading-none text-slate-200 truncate max-w-[110px]">{currentUser?.name?.split(' ')[0]}</p>
                    <p className="text-[10px] text-emerald-400 uppercase font-semibold">
                      {currentRole === 'admin' ? 'Dueño / Admin' : currentRole === 'trainer' ? 'Entrenador' : 'Socio'}
                    </p>
                  </div>
                </button>

                {showRoleMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 space-y-2">
                    <div className="px-2.5 py-2 bg-slate-800/90 rounded-xl border border-slate-750">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Sesión Actual</p>
                      <p className="text-xs font-black text-white">{currentUser?.name}</p>
                      <p className="text-[11px] text-emerald-400 font-medium">{currentUser?.email}</p>
                      {currentRole === 'member' && <div className="mt-1.5">{getMembershipBadge()}</div>}
                    </div>

                    {/* Auth actions inside menu */}
                    <div className="space-y-1 pt-1">
                      <button
                        onClick={() => {
                          setShowRoleMenu(false);
                          onOpenAuthModal?.('login');
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-xl text-xs bg-slate-800/60 hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2 transition-colors"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Iniciar sesión con otro correo</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowRoleMenu(false);
                          onOpenAuthModal?.('register');
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-xl text-xs bg-slate-800/60 hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2 transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-sky-400" />
                        <span>Registrar nuevo socio</span>
                      </button>
                    </div>

                    {/* Atajos demo ocultos en beta: evitaban mezcla de cuentas */}
                    {showDemoMenu && (
                      <p className="text-[10px] font-bold text-slate-400 px-1 pt-1 uppercase tracking-wider">
                        Demo local
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-end text-[11px]">
                      <button
                        onClick={() => {
                          logout();
                          setShowRoleMenu(false);
                          onOpenAuthModal?.('login');
                        }}
                        className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold transition-colors"
                      >
                        <LogOut className="w-3 h-3" /> Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>

        </div>
      </div>
    </header>
  );
};

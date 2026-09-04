import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import {
  Dumbbell,
  LayoutDashboard,
  Calendar,
  TrendingUp,
  User,
  QrCode,
  Flame,
  Building2,
  Bell,
  Sparkles,
  LogOut,
  ShieldCheck,
  ChevronDown,
  Globe,
  RefreshCw,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Sub-views
import { MemberDashboard } from './MemberDashboard';
import { MemberRoutineView } from './MemberRoutineView';
import { MemberClassesView } from './MemberClassesView';
import { MemberProgressView } from './MemberProgressView';
import { MemberProfileView } from './MemberProfileView';

export type MemberTab = 'dashboard' | 'routine' | 'classes' | 'progress' | 'profile';

interface MemberLayoutProps {
  onOpenQrModal: () => void;
  onOpenPaymentModal?: () => void;
  onOpenAuthModal: (mode?: 'login' | 'register' | 'profiles') => void;
  onViewLanding?: () => void;
}

export const MemberLayout: React.FC<MemberLayoutProps> = ({
  onOpenQrModal,
  onOpenPaymentModal,
  onOpenAuthModal,
  onViewLanding
}) => {
  const {
    currentUser,
    logout,
    branches,
    selectedBranchId,
    setSelectedBranchId,
    getMembershipForUser,
    getPlanById,
    workoutLogs
  } = useGym();

  const [activeTab, setActiveTab] = useState<MemberTab>('dashboard');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);

  if (!currentUser) return null;

  const membership = getMembershipForUser(currentUser.id);
  const currentPlan = membership ? getPlanById(membership.planId) : null;
  const currentBranch = branches.find(b => b.id === selectedBranchId) || branches[0];

  // Calculate current streak
  const userLogs = workoutLogs.filter(l => l.userId === currentUser.id);
  const streakDays = userLogs.length > 0 ? 4 : 1; // Motivating streak counter

  // Membership status
  const now = new Date();
  const isExpired = membership ? new Date(membership.endDate) < now : false;

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 flex flex-col pb-24 md:pb-12">
      
      {/* -------------------------------------------------------------
          ATHLETE APP TOPBAR (Mobile-First, Inspiring & Energetic)
          ------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-[#080d1a]/90 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Athlete Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-400 to-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/25">
              <Dumbbell className="w-5 h-5 -rotate-12" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-white">
                  FUERZA<span className="text-emerald-400">FIT</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  ATHLETE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">App de Entrenamiento & Socios</p>
            </div>
          </div>

          {/* Center/Right widgets: Streak, Branch, QR button, Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Motivational Streak Pill (Nike Training / Strava style) */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 text-amber-400 text-xs font-black shadow-sm"
              title="Tu racha de días activos entrenando en FuerzaFit"
            >
              <Flame className="w-4 h-4 fill-amber-400 animate-bounce" />
              <span>{streakDays} DÍAS</span>
            </div>

            {/* Quick Sede Selector Pill */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setShowBranchMenu(!showBranchMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="max-w-[110px] truncate font-semibold">{currentBranch.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </button>

              {showBranchMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50">
                  <p className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                    Sedes FuerzaFit
                  </p>
                  {branches.map(b => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setSelectedBranchId(b.id);
                        setShowBranchMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        b.id === selectedBranchId
                          ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <p>{b.name}</p>
                        <p className="text-[10px] text-slate-400">{b.address}</p>
                      </div>
                      <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                        {b.currentOccupancy}/{b.maxCapacity}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Prominent Quick Access QR Pass Button */}
            <button
              id="btn-member-top-qr-pass"
              onClick={onOpenQrModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
              title="Abrir código QR para entrar al molinete"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden md:inline">Mi Pase QR</span>
            </button>

            {/* Member Profile Avatar & Menu */}
            <div className="relative">
              <button
                id="btn-member-profile-menu"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-emerald-500/40"
                />
                <span className="hidden md:inline text-xs font-bold text-slate-200 max-w-[100px] truncate">
                  {currentUser.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:inline" />
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-3 z-50 space-y-2">
                  <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center gap-3">
                    <img
                      src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                      alt={currentUser.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/40"
                    />
                    <div className="overflow-hidden">
                      <p className="text-xs font-black text-white truncate">{currentUser.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                      <span className="inline-flex items-center gap-1 mt-0.5 text-[9px] font-bold uppercase text-emerald-400">
                        <Sparkles className="w-2.5 h-2.5" /> Plan {currentPlan?.name || 'Activo'}
                      </span>
                    </div>
                  </div>

                  {/* Account options - sin comercio */}
                  <div className="pt-2 border-t border-slate-800 flex flex-col gap-1">
                    {onViewLanding && (
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onViewLanding();
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-between transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-teal-400" />
                          <span>Ver Sitio Web Público</span>
                        </span>
                      </button>
                    )}

                    {/* BETA: sin salto a admin desde la app de socios.
                        El dueño usa su link ?app=admin. Evita mezcla de sesiones. */}
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2 transition-colors font-semibold"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>

                </div>
              )}
            </div>

          </div>

        </div>

        {/* Desktop Tab Pills Bar */}
        <div className="hidden md:flex max-w-5xl mx-auto px-4 sm:px-6 pb-2.5 gap-2 overflow-x-auto">
          <button
            id="tab-member-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-850 border border-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Inicio / Hoy</span>
          </button>

          <button
            id="tab-member-routine"
            onClick={() => setActiveTab('routine')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'routine'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-850 border border-slate-800'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span>Mi Rutina</span>
          </button>

          <button
            id="tab-member-classes"
            onClick={() => setActiveTab('classes')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'classes'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-850 border border-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Clases Grupales</span>
          </button>

          <button
            id="tab-member-progress"
            onClick={() => setActiveTab('progress')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'progress'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-850 border border-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Mi Progreso</span>
          </button>

          <button
            id="tab-member-profile"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-850 border border-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Perfil</span>
          </button>
        </div>

      </header>

      {/* -------------------------------------------------------------
          MAIN ATHLETE CONTENT CONTAINER
          ------------------------------------------------------------- */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={`member-view-${activeTab}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <MemberDashboard
                onOpenQr={onOpenQrModal}
                onNavigateTab={tab => setActiveTab(tab)}
              />
            )}
            {activeTab === 'routine' && <MemberRoutineView />}
            {activeTab === 'classes' && <MemberClassesView />}
            {activeTab === 'progress' && <MemberProgressView />}
            {activeTab === 'profile' && <MemberProfileView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* -------------------------------------------------------------
          MOBILE NATIVE-APP STYLE BOTTOM NAVIGATION
          ------------------------------------------------------------- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080d1a]/95 backdrop-blur-2xl border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        
        {/* 1. Inicio */}
        <button
          id="btn-nav-mobile-dashboard"
          onClick={() => setActiveTab('dashboard')}
          className={`p-2 flex flex-col items-center gap-0.5 text-[10px] font-black transition-colors ${
            activeTab === 'dashboard' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Inicio</span>
        </button>

        {/* 2. Mi Rutina */}
        <button
          id="btn-nav-mobile-routine"
          onClick={() => setActiveTab('routine')}
          className={`p-2 flex flex-col items-center gap-0.5 text-[10px] font-black transition-colors ${
            activeTab === 'routine' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <Dumbbell className="w-5 h-5" />
          <span>Rutina</span>
        </button>

        {/* 3. Central Glowing QR Action Button (Molinete Pass) */}
        <button
          id="btn-nav-mobile-qr"
          onClick={onOpenQrModal}
          className="p-3.5 -mt-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-xl shadow-emerald-500/40 flex items-center justify-center active:scale-95 transition-transform"
          title="Pase QR Gimnasio"
        >
          <QrCode className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* 4. Clases Grupales */}
        <button
          id="btn-nav-mobile-classes"
          onClick={() => setActiveTab('classes')}
          className={`p-2 flex flex-col items-center gap-0.5 text-[10px] font-black transition-colors ${
            activeTab === 'classes' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span>Clases</span>
        </button>

        {/* 5. Perfil & Pagos */}
        <button
          id="btn-nav-mobile-profile"
          onClick={() => setActiveTab('profile')}
          className={`p-2 flex flex-col items-center gap-0.5 text-[10px] font-black transition-colors ${
            activeTab === 'profile' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <User className="w-5 h-5" />
          <span>Perfil</span>
        </button>

      </nav>

    </div>
  );
};

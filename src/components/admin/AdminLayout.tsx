import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { buildModeUrl } from '../../lib/appMode';
import { GymTenantModal } from '../common/GymTenantModal';
import { ManualPaymentModal } from './ManualPaymentModal';
import {
  LayoutDashboard,
  Users,
  QrCode,
  CreditCard,
  Layers,
  Calendar,
  BarChart3,
  Building2,
  Bell,
  Search,
  Plus,
  LogOut,
  ShieldCheck,
  ChevronDown,
  Menu,
  X,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Globe,
  DollarSign,
  Database,
  RefreshCw,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Sub-views
import { AdminDashboard } from './AdminDashboard';
import { AdminMembersView } from './AdminMembersView';
import { AdminAccessControlView } from './AdminAccessControlView';
import { AdminPlansView } from './AdminPlansView';
import { AdminRoutinesView } from './AdminRoutinesView';
import { AdminClassesView } from './AdminClassesView';
import { AdminReportsView } from './AdminReportsView';

export type AdminTab = 'dashboard' | 'members' | 'access' | 'plans' | 'routines' | 'classes' | 'reports';

interface AdminLayoutProps {
  onOpenPaymentModal: () => void;
  onOpenAuthModal: (mode?: 'login' | 'register' | 'profiles') => void;
  onViewLanding?: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
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
    notifications,
    markNotificationRead,
    memberships,
    payments,
    currentGym,
    isLoadingData,
    refreshGymData
  } = useGym();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isGymModalOpen, setIsGymModalOpen] = useState(false);
  const [isManualPaymentModalOpen, setIsManualPaymentModalOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (!currentUser) return null;

  const currentBranch = branches.find(b => b.id === selectedBranchId) || branches[0];
  const unreadNotifs = notifications.filter(n => !n.read);

  // Count expiring members in next 7 days for badge
  const now = new Date();
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const expiringCount = memberships.filter(m => {
    const end = new Date(m.endDate);
    return end >= now && end <= next7Days;
  }).length;

  // Pending manual payments requiring audit
  const pendingPaymentsCount = payments.filter(p => p.status === 'pending').length;

  const handleNavigate = (tab: AdminTab) => {
    setActiveTab(tab);
    setMobileDrawerOpen(false);
  };

  const occupancyPercent = Math.min(100, Math.round((currentBranch.currentOccupancy / currentBranch.maxCapacity) * 100));

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 flex flex-col md:flex-row">
      
      {/* -------------------------------------------------------------
          SIDEBAR (Desktop Fixed - Enterprise SaaS ERP Style)
          ------------------------------------------------------------- */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-[#0d1322] border-r border-slate-800 shrink-0 h-screen sticky top-0 z-30">
        
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-sky-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-white">
                  FUERZA<span className="text-emerald-400">FIT</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  CORE OS
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Panel Administrativo & ERP</p>
            </div>
          </div>

          {/* Multi-tenant Gym Selector Button */}
          <button
            onClick={() => setIsGymModalOpen(true)}
            className="w-full text-left p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 transition-all flex items-center justify-between group"
            title="Cambiar de gimnasio o crear uno nuevo"
          >
            <div className="space-y-0.5 min-w-0 flex-1 pr-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Gimnasio Activo</span>
              <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                {currentGym?.name || 'FuerzaFit Centro'}
              </p>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
              Tenants
            </span>
          </button>

          {/* Sede Occupancy Widget in Sidebar */}
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-bold text-[10px] uppercase flex items-center gap-1">
                <Building2 className="w-3 h-3 text-emerald-400" />
                {currentBranch.name}
              </span>
              <span className="text-emerald-400 font-extrabold text-[11px]">
                {currentBranch.currentOccupancy}/{currentBranch.maxCapacity} ({occupancyPercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  occupancyPercent > 85 ? 'bg-rose-500' : occupancyPercent > 65 ? 'bg-amber-500' : 'bg-emerald-400'
                }`}
                style={{ width: `${occupancyPercent}%` }}
              />
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              id="btn-admin-sidebar-new-member"
              onClick={() => handleNavigate('members')}
              className="py-2 px-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/15 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Nuevo Socio</span>
            </button>

            <button
              id="btn-admin-sidebar-collect-payment"
              onClick={onOpenPaymentModal}
              className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cobrar Cuota</span>
            </button>
          </div>
        </div>

        {/* Categorized ERP Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-5">
          
          {/* Group 1: OPERACIONES */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pb-1">
              Operaciones en Vivo
            </p>

            <button
              id="admin-nav-dashboard"
              onClick={() => handleNavigate('dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard General</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            <button
              id="admin-nav-access"
              onClick={() => handleNavigate('access')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'access'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <QrCode className="w-4 h-4" />
                <span>Molinete & Pase QR</span>
              </div>
            </button>
          </div>

          {/* Group 2: CLIENTES & DEPORTE */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pb-1">
              Gestión de Gimnasio
            </p>

            <button
              id="admin-nav-members"
              onClick={() => handleNavigate('members')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'members'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>Padrón de Socios</span>
              </div>
              {expiringCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {expiringCount} por vencer
                </span>
              )}
            </button>

            <button
              id="admin-nav-routines"
              onClick={() => handleNavigate('routines')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'routines'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4" />
                <span>Creador de Rutinas</span>
              </div>
            </button>

            <button
              id="admin-nav-classes"
              onClick={() => handleNavigate('classes')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'classes'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4" />
                <span>Clases Grupales</span>
              </div>
            </button>
          </div>

          {/* Group 3: FINANZAS & REPORTES */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pb-1">
              Finanzas & Reportes
            </p>

            <button
              id="admin-nav-plans"
              onClick={() => handleNavigate('plans')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'plans'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4" />
                <span>Planes & Cuotas</span>
              </div>
            </button>

            <button
              id="admin-nav-reports"
              onClick={() => handleNavigate('reports')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'reports'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4" />
                <span>Métricas & Reportes</span>
              </div>
            </button>

            <button
              id="admin-nav-manual-payments"
              onClick={() => setIsManualPaymentModalOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 transition-all shadow-sm group"
            >
              <div className="flex items-center gap-2.5">
                <Receipt className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
                <span>Caja & Pagos Manuales</span>
              </div>
              {pendingPaymentsCount > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-slate-950 animate-pulse">
                  {pendingPaymentsCount}
                </span>
              ) : (
                <span className="text-[10px] text-amber-400/80 font-mono">Nuevo</span>
              )}
            </button>
          </div>

        </nav>

        {/* Sidebar Footer: Admin Profile & Switch to Member App */}
        <div className="p-3 border-t border-slate-800 space-y-2 bg-[#090d16]">
          
          {/* Quick link to public website */}
          {onViewLanding && (
            <button
              id="btn-admin-view-landing"
              onClick={onViewLanding}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-between transition-all"
              title="Ver sitio web público"
            >
              <span className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Ver Sitio Web Público</span>
              </span>
              <span className="text-[10px] text-slate-500">→</span>
            </button>
          )}

          {/* Abrir App de Socios en su link (no mezcla sesión del dueño) */}
          <a
            id="btn-admin-switch-to-member"
            href={buildModeUrl('member')}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-emerald-400 hover:text-emerald-300 text-xs font-bold flex items-center justify-between transition-all"
            title="Abrir la App de Socios en su link separado (?app=socio)"
          >
            <span className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Abrir App de Socios</span>
            </span>
            <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
              ?app=socio
            </span>
          </a>

          {/* User info & quick logout */}
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <img
                src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-sky-500/40"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                <p className="text-[10px] text-sky-400 font-semibold uppercase">Administrador</p>
              </div>
            </div>

            <button
              onClick={() => logout()}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

      </aside>

      {/* -------------------------------------------------------------
          MAIN WORKSPACE & TOPBAR
          ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Top Command Bar */}
        <header className="sticky top-0 z-20 bg-[#0d1322]/90 backdrop-blur-xl border-b border-slate-800 px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Mobile hamburger + Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              id="btn-admin-mobile-drawer-toggle"
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 hidden sm:inline">FuerzaFit OS</span>
              <span className="text-xs text-slate-600 hidden sm:inline">/</span>
              <span className="text-sm font-extrabold text-white capitalize">
                {activeTab === 'dashboard' && 'Dashboard Operativo'}
                {activeTab === 'members' && 'Padrón de Socios'}
                {activeTab === 'access' && 'Control de Acceso & Molinete'}
                {activeTab === 'plans' && 'Planes de Membresía & Cuotas'}
                {activeTab === 'routines' && 'Creador de Rutinas'}
                {activeTab === 'classes' && 'Clases Grupales'}
                {activeTab === 'reports' && 'Reportes & Facturación'}
              </span>
            </div>
          </div>

          {/* Top Actions: Search, Sede, Notifs, Profiles */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Database & Sync Status Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
              <Database className={`w-3.5 h-3.5 ${isSupabaseConfigured ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span className="font-semibold text-slate-300">
                {isSupabaseConfigured ? 'PostgreSQL' : 'Local State'}
              </span>
              <button
                onClick={() => refreshGymData()}
                disabled={isLoadingData}
                className="ml-1 p-0.5 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                title="Sincronizar datos con Supabase"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingData ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>

            {/* Quick Manual Payment & Audit Trigger */}
            <button
              id="btn-admin-manual-payment-topbar"
              onClick={() => setIsManualPaymentModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-black transition-all shadow-sm active:scale-95"
              title="Registrar cobro manual en caja y auditar pagos pendientes"
            >
              <Receipt className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Caja & Cobros</span>
              {pendingPaymentsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-500 text-slate-950 animate-pulse">
                  {pendingPaymentsCount}
                </span>
              )}
            </button>

            {/* Quick Sede Selector */}
            <div className="relative">
              <button
                onClick={() => setShowBranchMenu(!showBranchMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-bold transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="max-w-[120px] truncate">{currentBranch.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showBranchMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50">
                  <p className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                    Cambiar Sede Activa
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
                      <span>{b.name}</span>
                      <span className="text-[10px] text-slate-400">{b.currentOccupancy}/{b.maxCapacity}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Notificaciones del Sistema
                    </span>
                    <span className="text-[10px] text-slate-400">{unreadNotifs.length} nuevas</span>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-4">No hay notificaciones.</p>
                    ) : (
                      notifications.slice(0, 5).map(n => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`p-2.5 rounded-xl text-xs cursor-pointer transition-colors ${
                            n.read ? 'bg-slate-800/40 text-slate-400' : 'bg-slate-800 text-slate-200 border-l-2 border-emerald-500'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-white">{n.title}</span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

            {/* Landing page preview link */}
            {onViewLanding && (
              <button
                onClick={onViewLanding}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-bold transition-colors"
                title="Ver página de presentación pública"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ver Landing</span>
              </button>
            )}

          </div>

        </header>

        {/* Dynamic Admin View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`admin-view-${activeTab}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && (
                <AdminDashboard
                  onNavigateTab={tab => setActiveTab(tab)}
                  onOpenNewMemberModal={() => setActiveTab('members')}
                />
              )}
              {activeTab === 'members' && <AdminMembersView />}
              {activeTab === 'access' && <AdminAccessControlView />}
              {activeTab === 'plans' && <AdminPlansView />}
              {activeTab === 'routines' && <AdminRoutinesView />}
              {activeTab === 'classes' && <AdminClassesView />}
              {activeTab === 'reports' && <AdminReportsView />}
            </motion.div>
          </AnimatePresence>
        </main>

      </div>

      {/* -------------------------------------------------------------
          MOBILE ADMIN DRAWER
          ------------------------------------------------------------- */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />

          <div className="relative w-72 max-w-[85vw] bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between h-full z-10">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-slate-950 font-black">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="font-extrabold text-white text-base">FuerzaFit OS</span>
                </div>

                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Navigation List */}
              <div className="space-y-1">
                <button
                  onClick={() => handleNavigate('dashboard')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                    activeTab === 'dashboard' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => handleNavigate('members')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                    activeTab === 'members' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Padrón de Socios</span>
                </button>

                <button
                  onClick={() => handleNavigate('access')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                    activeTab === 'access' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Molinete QR</span>
                </button>

                <button
                  onClick={() => handleNavigate('plans')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                    activeTab === 'plans' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Planes & Cuotas</span>
                </button>

                <button
                  onClick={() => handleNavigate('routines')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                    activeTab === 'routines' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Rutinas</span>
                </button>

                <button
                  onClick={() => handleNavigate('classes')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                    activeTab === 'classes' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Clases Grupales</span>
                </button>

                <button
                  onClick={() => handleNavigate('reports')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                    activeTab === 'reports' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Reportes</span>
                </button>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="space-y-2 pt-4 border-t border-slate-800">
              {onViewLanding && (
                <button
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    onViewLanding();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-2"
                >
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>Ver Sitio Web Público</span>
                </button>
              )}

              <button
                onClick={() => logout()}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 text-rose-400 font-bold text-xs flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Multi-Tenant Switcher & Creation Modal */}
      <GymTenantModal
        isOpen={isGymModalOpen}
        onClose={() => setIsGymModalOpen(false)}
      />

      {/* Manual Payment Registration & Audit Modal */}
      <ManualPaymentModal
        isOpen={isManualPaymentModalOpen}
        onClose={() => setIsManualPaymentModalOpen(false)}
      />

    </div>
  );
};

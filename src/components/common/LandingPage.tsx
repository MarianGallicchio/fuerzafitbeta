import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { User } from '../../types';
import {
  Dumbbell,
  QrCode,
  CreditCard,
  Users,
  ShieldCheck,
  Building2,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Smartphone,
  BarChart3,
  Layers,
  ChevronRight,
  Flame,
  Clock,
  MapPin,
  Check,
  LogOut,
  LayoutDashboard
} from 'lucide-react';
import { motion } from 'motion/react';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'register' | 'admin' | 'register_gym', planId?: string) => void;
  currentUser?: User | null;
  onGoToDashboard?: () => void;
  onLogout?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuth,
  currentUser,
  onGoToDashboard,
  onLogout
}) => {
  const { plans, branches } = useGym();
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0]?.id || '');

  const activeBranch = branches.find(b => b.id === selectedBranchId) || branches[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* -------------------------------------------------------------
          TOPBAR / NAVBAR
          ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <Dumbbell className="w-5 h-5 -rotate-12" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white">
                FUERZA<span className="text-emerald-400">FIT</span>
              </span>
              <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                SISTEMA INTEGRAL DE FITNESS
              </span>
            </div>
          </div>

          {/* Quick anchor links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-400">
            <a href="#planes" className="hover:text-white transition-colors">Planes & Membresías</a>
            <a href="#sedes" className="hover:text-white transition-colors">Sedes & Aforo</a>
            <a href="#servicios" className="hover:text-white transition-colors">Servicios</a>
          </nav>

          {/* User actions */}
          <div className="flex items-center gap-2.5">
            {currentUser ? (
              /* Already logged-in user options */
              <div className="flex items-center gap-2">
                <button
                  id="btn-landing-go-dashboard"
                  onClick={onGoToDashboard}
                  className="px-4 py-2 rounded-xl text-xs font-black text-slate-950 bg-emerald-500 hover:bg-emerald-400 shadow-md shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Ir a mi Panel ({currentUser.name.split(' ')[0]})</span>
                </button>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 border border-slate-800 transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              /* Public visitor buttons — ahora navegan a páginas dedicadas /admin y /socio */
              <>
                <a
                  id="btn-landing-admin"
                  href="/admin"
                  onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/admin'); window.dispatchEvent(new PopStateEvent('popstate')); window.scrollTo(0,0); }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Panel Admin</span>
                </a>

                <a
                  id="btn-landing-login"
                  href="/socio"
                  onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/socio'); window.dispatchEvent(new PopStateEvent('popstate')); window.scrollTo(0,0); }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 transition-colors"
                >
                  Ingreso Socios
                </a>

                <a
                  id="btn-landing-register"
                  href="/socio"
                  onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/socio'); window.dispatchEvent(new PopStateEvent('popstate')); window.scrollTo(0,0); }}
                  className="px-4 py-2 rounded-xl text-xs font-black text-slate-950 bg-emerald-500 hover:bg-emerald-400 shadow-md shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Quiero ser socio</span>
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------
          HERO — PRESENTACIÓN COMERCIAL DEL SOFTWARE
          ------------------------------------------------------------- */}
      <section className="relative overflow-hidden pt-14 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-black tracking-wider uppercase">Software privado para gimnasios — Venta directa</span>
            <span className="hidden sm:inline text-slate-400">• Demo en /admin y /socio</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none">
            El sistema operativo de tu gimnasio. <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">Sin Excel. Sin mora.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            <strong className="text-white">FuerzaFit</strong> es el software privado que usan dueños y staff para cobrar, controlar accesos por <strong className="text-emerald-400">DNI en 2s</strong> y entrenar socios — sin mostrar precios ni admin al socio. Instalación en 24h, datos aislados por gimnasio (Supabase RLS).
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold">
            <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300">✓ DNI + QR de alta</span>
            <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300">✓ Caja con descuentos auditados</span>
            <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300">✓ Rutinas y clases con cupo</span>
            <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300">✓ Reportes retención & MRR real</span>
          </div>

          {/* Hero CTAs — venta */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <a
              href="/admin"
              onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/admin'); window.dispatchEvent(new PopStateEvent('popstate')); window.scrollTo(0,0); }}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Ver demo Dueño → /admin</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/socio"
              onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/socio'); window.dispatchEvent(new PopStateEvent('popstate')); window.scrollTo(0,0); }}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Ver demo Socio → /socio</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          <p className="text-[11px] text-slate-500">Venta privada por WhatsApp. Escribí <strong className="text-slate-300">DEMO</strong> y te habilito tu gimnasio de prueba en 15 min.</p>

          {/* Live System Pillars Showcase Cards */}
          <div id="servicios" className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-12 text-left">
            
            {/* Athlete App Card */}
            <a
              href="/socio"
              onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/socio'); window.dispatchEvent(new PopStateEvent('popstate')); window.scrollTo(0,0); }}
              className="group p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer shadow-xl relative overflow-hidden block"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Smartphone className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Para Socios & Atletas
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-white group-hover:text-emerald-300 transition-colors">
                App Móvil Personal con Pase QR
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Ingresá al gimnasio escaneando tu credencial QR dinámica en el molinete. Llevá tu plan de entrenamiento, cronometrá tus descansos, reservá cupo en clases de CrossFit, Spinning o Yoga y descargá tus facturas oficiales.
              </p>

              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-emerald-400 font-bold">
                <span>Registrarme y Activar Pase</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </a>

            {/* Admin ERP Card */}
            <a
              href="/admin"
              onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/admin'); window.dispatchEvent(new PopStateEvent('popstate')); window.scrollTo(0,0); }}
              className="group p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer shadow-xl relative overflow-hidden block"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Panel de Administración
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-white group-hover:text-amber-300 transition-colors">
                Control Operativo & Molinete en Vivo
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Control de molinete en tiempo real con apertura y bloqueo automático. Gestión de padrón de socios, alertas preventivas de vencimiento en 7 días con recordatorios directos por WhatsApp, caja manual y recaudación.
              </p>

              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-amber-400 font-bold">
                <span>Ingresar al Panel de Administración</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </a>

          </div>

        </div>
      </section>

      {/* -------------------------------------------------------------
          MEMBERSHIP PLANS
          ------------------------------------------------------------- */}
      <section id="planes" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
            Planes de Entrenamiento
          </span>
          <h2 className="text-3xl font-black text-white">Elegí el plan adecuado para tus objetivos</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Aboná de forma segura con Mercado Pago, tarjeta de débito o transferencia inmediata con activación en el acto.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`p-6 rounded-3xl bg-slate-900 border transition-all relative flex flex-col justify-between ${
                plan.isPopular
                  ? 'border-emerald-500/80 shadow-2xl shadow-emerald-500/10'
                  : 'border-slate-800'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                  Más Elegido
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-extrabold text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">
                    ${plan.priceARS.toLocaleString('es-AR')}
                  </span>
                  <span className="text-xs text-slate-400">ARS / mes</span>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-800 text-xs">
                  {plan.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <a
                href="/socio"
                onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', `/socio?plan=${plan.id}`); window.dispatchEvent(new PopStateEvent('popstate')); window.scrollTo(0,0); }}
                className="mt-6 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Elegir Plan {plan.name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>

        {/* -------------------------------------------------------------
            BRANCHES & LIVE OCCUPANCY MONITOR
            ------------------------------------------------------------- */}
        <div id="sedes" className="pt-12 border-t border-slate-800/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <span>Nuestras Sedes & Aforo en Vivo</span>
              </h3>
              <p className="text-xs text-slate-400">Equipamiento de alto rendimiento con monitoreo de capacidad en tiempo real</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {branches.map(branch => {
              const occupancyPct = Math.round((branch.currentOccupancy / branch.maxCapacity) * 100);
              return (
                <div
                  key={branch.id}
                  className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-white text-sm">
                      {branch.name}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      occupancyPct > 80 ? 'bg-rose-500/15 text-rose-400' : 'bg-emerald-500/15 text-emerald-400'
                    }`}>
                      {branch.currentOccupancy} / {branch.maxCapacity} en sala ({occupancyPct}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        occupancyPct > 80 ? 'bg-rose-500' : occupancyPct > 60 ? 'bg-amber-500' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, occupancyPct)}%` }}
                    />
                  </div>

                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{branch.address}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span>Horario: {branch.openingHours}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Call to action for Gym Owners / Administrators */}
        <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Solución para Dueños & Administradores
            </span>
            <h4 className="text-xl sm:text-2xl font-black text-white">
              ¿Administrás tu propio gimnasio o centro de fitness?
            </h4>
            <p className="text-xs text-slate-400 max-w-xl">
              Controlá el padrón de socios, cobros por mostrador y Mercado Pago, molinete QR y rutinas con una plataforma lista para usar.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <a
              href="/admin"
              onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/admin'); window.dispatchEvent(new PopStateEvent('popstate')); window.scrollTo(0,0); }}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Acceso Administrador</span>
            </a>

            <a
              href="/admin"
              onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/admin'); window.dispatchEvent(new PopStateEvent('popstate')); window.scrollTo(0,0); }}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Building2 className="w-4 h-4" />
              <span>Registrar Mi Gimnasio</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-10 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 space-y-2">
        <p className="font-bold text-slate-400">FUERZAFIT • Red de Gimnasios y Centros de Rendimiento Físico</p>
        <p>Control de acceso molinetes QR • Facturación electrónica • Planes personalizados • Todos los derechos reservados.</p>
      </footer>

    </div>
  );
};

import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { User, Membership, SubscriptionPlan, PaymentMethod, DISCOUNT_REASONS } from '../../types';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  CreditCard,
  Send,
  MoreVertical,
  Dumbbell,
  Trash2,
  Edit2,
  FileCheck,
  Building2,
  Sparkles,
  Check,
  Copy,
  User as UserIcon,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ManualPaymentModal } from './ManualPaymentModal';

export const AdminMembersView: React.FC = () => {
  const {
    users,
    memberships,
    plans,
    createMember,
    updateMember,
    deleteMember,
    toggleMembershipSuspension,
    getMembershipForUser,
    getPlanById,
    sendWhatsAppReminder,
    routines,
    assignRoutineToUsers,
    processPayment,
    branches,
    selectedBranchId
  } = useGym();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring_soon' | 'expired' | 'suspended'>('all');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignRoutineModal, setShowAssignRoutineModal] = useState<User | null>(null);
  const [showQuickPayModal, setShowQuickPayModal] = useState<User | null>(null);
  const [manualPayModalOpen, setManualPayModalOpen] = useState(false);
  const [manualPayUserId, setManualPayUserId] = useState<string | undefined>(undefined);
  const [selectedRoutineToAssign, setSelectedRoutineToAssign] = useState<string>('');

  // Quick Pay State
  const [quickPayPlanId, setQuickPayPlanId] = useState<string>('');
  const [quickPayMethod, setQuickPayMethod] = useState<PaymentMethod>('cash');
  const [isProcessingPay, setIsProcessingPay] = useState(false);

  // New Member Form State (Admin / Cashier Registration)
  const [newName, setNewName] = useState('');
  const [newDni, setNewDni] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('+54 9 11 ');
  const [newBranchId, setNewBranchId] = useState(selectedBranchId || 'branch-1');
  const [newPlanId, setNewPlanId] = useState(plans[0]?.id || '');
  const [newAmountARS, setNewAmountARS] = useState<number>(plans[0]?.priceARS || 25000);
  const [newDiscountARS, setNewDiscountARS] = useState<number>(0);
  const [newDiscountReason, setNewDiscountReason] = useState<string>(DISCOUNT_REASONS[0]);
  const [newDiscountMode, setNewDiscountMode] = useState<'ars' | 'percent'>('ars');
  const [newDiscountPercent, setNewDiscountPercent] = useState<number>(0);
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentMethod>('cash');
  const [newMedicalClearance, setNewMedicalClearance] = useState(true);
  const [newEmergencyName, setNewEmergencyName] = useState('');
  const [newEmergencyPhone, setNewEmergencyPhone] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Success summary modal after member creation
  const [createdSuccessData, setCreatedSuccessData] = useState<{
    user: User;
    membership: Membership;
    tempPassword: string;
    activationOtp: string;
    planName: string;
    amountARS: number;
    paymentMethod: PaymentMethod;
    loginReady: boolean;
    loginHint?: string;
  } | null>(null);
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  const members = users.filter(u => u.role === 'member');
  const now = new Date();

  // Keep plan price in sync when changing selected plan in form
  const handlePlanChange = (planId: string) => {
    setNewPlanId(planId);
    const p = getPlanById(planId);
    if (p) {
      setNewAmountARS(p.priceARS);
      // recalcular descuento porcentual si estaba activo
      if (newDiscountMode === 'percent' && newDiscountPercent > 0) {
        const disc = Math.round(p.priceARS * (newDiscountPercent / 100));
        setNewDiscountARS(disc);
        setNewAmountARS(Math.max(1, p.priceARS - disc));
      } else {
        setNewDiscountARS(0);
        setNewDiscountPercent(0);
      }
    }
  };

  const handleDiscountPercentChange = (pct: number) => {
    const clamped = Math.max(0, Math.min(100, pct));
    setNewDiscountPercent(clamped);
    const plan = getPlanById(newPlanId) || plans[0];
    if (plan) {
      const disc = Math.round(plan.priceARS * (clamped / 100));
      setNewDiscountARS(disc);
      setNewAmountARS(Math.max(1, plan.priceARS - disc));
    }
  };

  const handleDiscountARSChange = (val: number) => {
    const plan = getPlanById(newPlanId) || plans[0];
    const max = plan ? plan.priceARS - 1 : 999999;
    const clamped = Math.max(0, Math.min(val, max));
    setNewDiscountARS(clamped);
    if (plan) setNewAmountARS(Math.max(1, plan.priceARS - clamped));
    // sync percent
    if (plan && plan.priceARS > 0) setNewDiscountPercent(Math.round((clamped / plan.priceARS) * 100));
  };

  // Filter logic
  const filteredMembers = members.filter(member => {
    const mem = getMembershipForUser(member.id);
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.dni && member.dni.includes(searchTerm)) ||
      member.phone.includes(searchTerm);

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;

    if (!mem) return statusFilter === 'expired';

    const exp = new Date(mem.endDate);
    const isExp = exp < now;
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (statusFilter === 'suspended') return mem.status === 'suspended';
    if (statusFilter === 'expired') return isExp || mem.status === 'expired';
    if (statusFilter === 'expiring_soon') return !isExp && diffDays >= 0 && diffDays <= 7;
    if (statusFilter === 'active') return !isExp && mem.status === 'active';

    return true;
  });

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const plan = getPlanById(newPlanId) || plans[0];
    // BETA: sin planes no hay alta posible (antes reventaba en silencio).
    if (!plan) {
      alert('Este gimnasio aún no tiene planes. Creá uno en la sección Planes y reintentá el alta.');
      return;
    }

    // BETA: DNI obligatorio y único — es la llave del acceso diario.
    const cleanDni = (newDni || '').replace(/[^0-9]/g, '');
    if (cleanDni.length < 7) {
      alert('El DNI es obligatorio para el alta (mínimo 7 dígitos). Es la llave del ingreso diario.');
      return;
    }
    const dniExists = users.some(u => (u.dni || '').replace(/[^0-9]/g, '') === cleanDni);
    if (dniExists) {
      alert(`Ya existe un socio con DNI ${cleanDni} en este gimnasio. Buscalo en el listado en lugar de duplicarlo.`);
      return;
    }

    const result = await createMember({
      name: newName,
      dni: cleanDni,
      email: newEmail,
      phone: newPhone,
      role: 'member',
      planId: newPlanId,
      initialPaymentMethod: newPaymentMethod,
      amountARS: Number(newAmountARS),
      discountARS: Number(newDiscountARS) || 0,
      discountReason: newDiscountARS > 0 ? newDiscountReason : undefined,
      branchId: newBranchId || selectedBranchId,
      medicalClearance: newMedicalClearance,
      notes: newNotes,
      emergencyContact: {
        name: newEmergencyName || 'Familiar / Contacto',
        phone: newEmergencyPhone || newPhone,
        relationship: 'Contacto'
      }
    });

    setShowCreateModal(false);

    // Show success dialog with credentials
    if (result && result.user) {
      setCreatedSuccessData({
        user: result.user,
        membership: result.membership,
        tempPassword: result.tempPassword,
        activationOtp: result.activationOtp,
        planName: plan?.name || 'Membresía',
        amountARS: Number(newAmountARS),
        paymentMethod: newPaymentMethod,
        loginReady: result.loginReady,
        loginHint: result.loginHint
      });
    }

    // Reset fields
    setNewName('');
    setNewDni('');
    setNewEmail('');
    setNewPhone('+54 9 11 ');
    setNewNotes('');
    setNewEmergencyName('');
    setNewEmergencyPhone('');
    setNewDiscountARS(0);
    setNewDiscountPercent(0);
    setNewDiscountReason(DISCOUNT_REASONS[0]);
  };

  const handleAssignRoutine = () => {
    if (!showAssignRoutineModal || !selectedRoutineToAssign) return;
    assignRoutineToUsers(selectedRoutineToAssign, [showAssignRoutineModal.id]);
    setShowAssignRoutineModal(null);
  };

  const handleQuickPay = async () => {
    if (!showQuickPayModal) return;
    const targetPlan = getPlanById(quickPayPlanId) || plans[0];
    // BETA: sin planes, avisar en vez de pantalla negra (targetPlan.id reventaba).
    if (!targetPlan) {
      alert('Este gimnasio aún no tiene planes. Creá uno en la sección Planes y reintentá el cobro.');
      return;
    }
    setIsProcessingPay(true);
    try {
      await processPayment({
        userId: showQuickPayModal.id,
        planId: targetPlan.id,
        method: quickPayMethod,
        amountARS: targetPlan.priceARS,
        notes: `Cobro en recepción registrado por administrador`
      });
      setShowQuickPayModal(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessingPay(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Padrón de Socios
            </span>
            <span className="text-xs text-slate-400">{members.length} socios registrados</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Gestión de Socios & Membresías</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Control de cuotas, cobranzas vía WhatsApp/Mercado Pago, asignación de rutinas y fichas médicas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setManualPayUserId(undefined);
              setManualPayModalOpen(true);
            }}
            className="py-3 px-4 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Receipt className="w-4 h-4 text-amber-400" />
            <span>Caja & Cobros Manuales</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="py-3 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Dar de Alta Socio</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, email, teléfono..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:border-emerald-400 focus:outline-none"
          />
        </div>

        {/* Status Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              statusFilter === 'all' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            Todos ({members.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              statusFilter === 'active' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            Activos
          </button>
          <button
            onClick={() => setStatusFilter('expiring_soon')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              statusFilter === 'expiring_soon' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            Por Vencer (7d)
          </button>
          <button
            onClick={() => setStatusFilter('expired')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              statusFilter === 'expired' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            Vencidos
          </button>
          <button
            onClick={() => setStatusFilter('suspended')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              statusFilter === 'suspended' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            Suspendidos
          </button>
        </div>

      </div>

      {/* Members Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMembers.length === 0 ? (
          <div className="col-span-2 p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <Users className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-base font-bold text-white">
                {members.length === 0 ? 'Aún no hay socios registrados en el gimnasio' : 'No se encontraron socios con los filtros aplicados'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {members.length === 0
                  ? 'El software está listo para tu gimnasio. Podés ingresar tu primer socio con el botón "Nuevo Socio" o probar la experiencia de alta.'
                  : 'Probá cambiando el término de búsqueda o seleccionando "Todos".'}
              </p>
            </div>
            {members.length === 0 && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>Registrar Primer Socio</span>
              </button>
            )}
          </div>
        ) : (
          filteredMembers.map(member => {
            const mem = getMembershipForUser(member.id);
            const plan = mem ? getPlanById(mem.planId) : null;
            const expiry = mem ? new Date(mem.endDate) : null;
            const isExp = expiry ? expiry < now : true;
            const daysLeft = expiry ? Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
            const assignedRoutines = routines.filter(r => r.assignedUserIds.includes(member.id));

            return (
              <div
                key={member.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                        alt={member.name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-700 shrink-0"
                      />
                      <div>
                        <h3 className="font-extrabold text-base text-white">{member.name}</h3>
                        <p className="text-xs text-slate-400">{member.email}</p>
                        <p className="text-[11px] text-emerald-400 font-mono">{member.phone}</p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase shrink-0 ${
                      mem?.status === 'suspended'
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : isExp
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : daysLeft <= 7
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {mem?.status === 'suspended' ? 'Suspendida' : isExp ? 'Vencida' : daysLeft <= 7 ? `Vence en ${daysLeft}d` : 'Activa'}
                    </span>
                  </div>

                  {/* Plan and Medical Info */}
                  <div className="mt-4 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Plan Asignado:</span>
                      <span className="font-bold text-white">{plan?.name || 'Sin Plan'}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Fecha de Vencimiento:</span>
                      <span className={`font-semibold ${isExp ? 'text-rose-400' : 'text-slate-200'}`}>
                        {expiry ? expiry.toLocaleDateString('es-AR') : 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Apto Físico:</span>
                      <span className={`font-semibold ${member.medicalClearance ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {member.medicalClearance ? 'Aprobado ✓' : 'Pendiente ⚠'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Rutinas Asignadas:</span>
                      <span className="font-semibold text-sky-400">
                        {assignedRoutines.length > 0 ? assignedRoutines.map(r => r.title).join(', ') : 'Ninguna'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  
                  {/* WhatsApp Reminder Direct Action */}
                  <button
                    onClick={() => sendWhatsAppReminder(member.id)}
                    className="py-1.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1.5 transition-colors"
                    title="Enviar recordatorio automático por WhatsApp"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  {/* Cobrar en Caja / Pago Manual Auditado */}
                  <button
                    onClick={() => {
                      setManualPayUserId(member.id);
                      setManualPayModalOpen(true);
                    }}
                    className="py-1.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                    title="Registrar cobro en caja mostrador para este socio"
                  >
                    <Receipt className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cobrar</span>
                  </button>

                  {/* Asignar Rutina */}
                  <button
                    onClick={() => {
                      setShowAssignRoutineModal(member);
                      setSelectedRoutineToAssign(routines[0]?.id || '');
                    }}
                    className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
                    <span>Rutina</span>
                  </button>

                  {/* Suspender / Activar */}
                  <button
                    onClick={() => toggleMembershipSuspension(member.id)}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white"
                    title={mem?.status === 'suspended' ? 'Reactivar' : 'Suspender'}
                  >
                    {mem?.status === 'suspended' ? 'Activar' : 'Suspender'}
                  </button>

                  {/* Eliminar */}
                  <button
                    onClick={() => {
                      if (confirm(`¿Estás seguro de eliminar al socio ${member.name}?`)) {
                        deleteMember(member.id);
                      }
                    }}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Eliminar socio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Modal: Alta de Nuevo Socio (Caja / Recepción / Admin) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 my-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Alta de Nuevo Socio en Caja / Recepción</h3>
                  <p className="text-[11px] text-slate-400">Registrá los datos del socio para habilitar su acceso y credenciales</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Nombre y Apellido *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Juan Pérez"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">DNI / Cédula * <span className="text-[10px] font-medium text-emerald-400">(llave del ingreso diario)</span></label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    placeholder="Ej: 38450192"
                    value={newDni}
                    onChange={e => setNewDni(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none font-mono tracking-widest"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Correo Electrónico (Para Login) *</label>
                  <input
                    type="email"
                    required
                    placeholder="socio@gmail.com"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">WhatsApp / Teléfono *</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Sede de Inscripción</label>
                  <select
                    value={newBranchId}
                    onChange={e => setNewBranchId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Plan de Suscripción</label>
                  <select
                    value={newPlanId}
                    onChange={e => handlePlanChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"
                  >
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${p.priceARS.toLocaleString('es-AR')} ARS)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Cobro Inicial en Caja (ARS) — Neto a cobrar</label>
                  <input
                    type="number"
                    value={newAmountARS}
                    onChange={e => setNewAmountARS(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none font-mono font-bold"
                  />
                  {(() => {
                    const plan = getPlanById(newPlanId) || plans[0];
                    const gross = plan?.priceARS || 0;
                    const disc = newDiscountARS || 0;
                    if (disc > 0) return <p className="text-[10px] text-emerald-400 mt-1 font-bold">Tarifa lista: ${gross.toLocaleString('es-AR')} → Descuento ${disc.toLocaleString('es-AR')} → Neto ${newAmountARS.toLocaleString('es-AR')}</p>;
                    return <p className="text-[10px] text-slate-500 mt-1">Tarifa lista del plan: ${gross.toLocaleString('es-AR')}</p>;
                  })()}
                </div>

                {/* DESCUENTO PRIMERA CUOTA */}
                <div className="sm:col-span-2 p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-emerald-300 font-black text-xs flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">%</span>
                      Descuento 1ª Cuota (Bienvenida / Promo)
                    </label>
                    <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
                      <button type="button" onClick={() => setNewDiscountMode('ars')} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${newDiscountMode==='ars' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}>$ ARS</button>
                      <button type="button" onClick={() => setNewDiscountMode('percent')} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${newDiscountMode==='percent' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}>% Off</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1 text-[11px]">{newDiscountMode==='ars' ? 'Monto descontado ($ ARS)' : 'Porcentaje descuento (%)'}</label>
                      {newDiscountMode==='ars' ? (
                        <input type="number" min={0} max={(getPlanById(newPlanId)?.priceARS || 35000)-1} value={newDiscountARS} onChange={e => handleDiscountARSChange(Number(e.target.value))} placeholder="Ej: 5000" className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none font-mono" />
                      ) : (
                        <input type="number" min={0} max={90} value={newDiscountPercent} onChange={e => handleDiscountPercentChange(Number(e.target.value))} placeholder="Ej: 20" className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none font-mono" />
                      )}
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1 text-[11px]">Motivo del descuento</label>
                      <select value={newDiscountReason} onChange={e => setNewDiscountReason(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none text-xs">
                        {DISCOUNT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[10,15,20,50].map(pct => (
                      <button key={pct} type="button" onClick={() => { setNewDiscountMode('percent'); handleDiscountPercentChange(pct); }} className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300">{pct}% OFF</button>
                    ))}
                    <button type="button" onClick={() => { setNewDiscountARS(0); setNewDiscountPercent(0); const p=getPlanById(newPlanId); if(p) setNewAmountARS(p.priceARS); }} className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300">Sin descuento</button>
                  </div>
                  {newDiscountARS>0 && <p className="text-[11px] text-emerald-300 font-bold">✓ Se cobrará ${newAmountARS.toLocaleString('es-AR')} ARS (ahorro ${newDiscountARS.toLocaleString('es-AR')} por {newDiscountReason}). Queda registrado para auditoría y comprobante PDF.</p>}
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Medio de Pago Recibido</label>
                  <select
                    value={newPaymentMethod}
                    onChange={e => setNewPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"
                  >
                    <option value="cash">Efectivo en Caja Mostrador</option>
                    <option value="mercadopago">Mercado Pago (Link / QR)</option>
                    <option value="transfer">Transferencia Bancaria Comprobada</option>
                    <option value="debit_card">Tarjeta de Débito</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Contacto de Emergencia</label>
                  <input
                    type="text"
                    placeholder="Nombre y parentesco"
                    value={newEmergencyName}
                    onChange={e => setNewEmergencyName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Tel. Emergencia</label>
                  <input
                    type="text"
                    placeholder="+54 9 11 ..."
                    value={newEmergencyPhone}
                    onChange={e => setNewEmergencyPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <input
                  type="checkbox"
                  id="medicalClearanceCheck"
                  checked={newMedicalClearance}
                  onChange={e => setNewMedicalClearance(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="medicalClearanceCheck" className="text-slate-300 font-medium cursor-pointer">
                  Apto Físico / Certificado Médico entregado y validado
                </label>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Observaciones / Objetivos del Socio</label>
                <input
                  type="text"
                  placeholder="Ej: Quiere hipertrofia, lesión previa en rodilla izquierda"
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-750 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  Guardar Socio & Emitir Pase QR
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal: Credenciales & Éxito de Alta de Socio */}
      {createdSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl text-slate-100 my-6 space-y-4 text-xs"
          >
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-white">¡Socio Registrado con Éxito!</h3>
              <p className="text-slate-400 text-[11px]">
                La membresía y el pase QR ya están habilitados en el molinete y sistema.
              </p>
            </div>

            {/* Member Details Box */}
            <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-slate-700/60">
                <span className="text-slate-400">Socio:</span>
                <span className="font-extrabold text-white text-xs">{createdSuccessData.user.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Email de Ingreso:</span>
                <span className="font-mono text-emerald-300 font-bold">{createdSuccessData.user.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Código de Activación / PIN:</span>
                <span className="font-mono text-amber-300 font-black tracking-wider bg-slate-900 px-2 py-0.5 rounded border border-amber-500/30">
                  {createdSuccessData.activationOtp}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Clave Temporal:</span>
                <span className="font-mono text-slate-200 font-bold">{createdSuccessData.tempPassword}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-700/60">
                <span className="text-slate-400">Plan & Cobro:</span>
                <span className="font-bold text-white">
                  {createdSuccessData.planName} (${createdSuccessData.amountARS.toLocaleString('es-AR')} ARS)
                </span>
              </div>
              <div className={`flex items-start gap-2 pt-2 border-t border-slate-700/60 text-[11px] leading-relaxed ${
                createdSuccessData.loginReady ? 'text-emerald-300' : 'text-amber-300'
              }`}>
                <span>{createdSuccessData.loginReady ? '✅' : '⚠️'}</span>
                <span>
                  {createdSuccessData.loginReady
                    ? 'Login del socio activado: entra en ?app=socio con su email y la clave temporal.'
                    : (createdSuccessData.loginHint || 'Login pendiente: el socio puede activarse con código por email.')}
                </span>
              </div>
            </div>

            {/* Quick Share Actions */}
            <div className="space-y-2">
              <a
                href={`https://wa.me/${createdSuccessData.user.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `¡Hola ${createdSuccessData.user.name}! Te damos la bienvenida a FuerzaFit. Ya podés ingresar a tu panel de socio con tu email: ${createdSuccessData.user.email} y tu código de confirmación: ${createdSuccessData.activationOtp} o contraseña: ${createdSuccessData.tempPassword}. ¡Te esperamos en el gym!`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
              >
                <Phone className="w-4 h-4" />
                <span>Enviar Acceso por WhatsApp</span>
              </a>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `FuerzaFit - Acceso Socio\nEmail: ${createdSuccessData.user.email}\nCódigo PIN: ${createdSuccessData.activationOtp}\nClave: ${createdSuccessData.tempPassword}`
                    );
                    setCopiedCredentials(true);
                    setTimeout(() => setCopiedCredentials(false), 2000);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedCredentials ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCredentials ? 'Copiado' : 'Copiar Datos'}</span>
                </button>

                {/* BETA: no auto-ingresar como el socio recién creado.
                    El admin sigue en su sesión; el socio entra por su link con DNI. */}
                <div className="py-2.5 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-[11px] font-bold text-center">
                  Socio dado de alta. Ingreso diario con DNI · QR solo para su primer día.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCreatedSuccessData(null)}
              className="w-full py-2 rounded-xl text-slate-400 hover:text-white font-medium text-center transition-colors"
            >
              Cerrar y volver al listado de socios
            </button>
          </motion.div>
        </div>
      )}

      {/* Modal: Asignar Rutina */}
      {showAssignRoutineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 space-y-4 text-xs"
          >
            <h3 className="text-base font-extrabold text-white">
              Asignar Rutina a {showAssignRoutineModal.name}
            </h3>
            
            <div>
              <label className="block text-slate-400 font-bold mb-1">Seleccionar Programa de Entrenamiento</label>
              <select
                value={selectedRoutineToAssign}
                onChange={e => setSelectedRoutineToAssign(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"
              >
                {routines.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.goal.toUpperCase()} • {r.days.length} días)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowAssignRoutineModal(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignRoutine}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
              >
                Asignar Rutina
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal: Cobro Rápido en Caja */}
      {showQuickPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 space-y-4 text-xs"
          >
            <h3 className="text-base font-extrabold text-white">
              Registrar Cobro para {showQuickPayModal.name}
            </h3>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Plan a Cobrar</label>
              {plans.length === 0 ? (
                <p className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                  Sin planes en este gimnasio. Creá uno en la sección Planes para poder cobrar.
                </p>
              ) : (
              <select
                value={quickPayPlanId}
                onChange={e => setQuickPayPlanId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${p.priceARS.toLocaleString('es-AR')} ARS)
                  </option>
                ))}
              </select>
              )}
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Medio de Pago Recibido</label>
              <select
                value={quickPayMethod}
                onChange={e => setQuickPayMethod(e.target.value as PaymentMethod)}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              >
                <option value="cash">Efectivo en Caja Mostrador</option>
                <option value="transfer">Transferencia Bancaria Comprobada</option>
                <option value="mercadopago">Mercado Pago Cobrado</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowQuickPayModal(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleQuickPay}
                disabled={isProcessingPay}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
              >
                {isProcessingPay ? 'Procesando...' : 'Acreditar Pago & Extender'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de Cobro Manual en Caja con Validación de Historial */}
      <ManualPaymentModal
        isOpen={manualPayModalOpen}
        onClose={() => {
          setManualPayModalOpen(false);
          setManualPayUserId(undefined);
        }}
        preselectedUserId={manualPayUserId}
      />

    </div>
  );
};

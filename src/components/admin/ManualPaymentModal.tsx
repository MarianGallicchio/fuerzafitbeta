import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { PaymentMethod, SubscriptionPlan, User, DISCOUNT_REASONS } from '../../types';
import {
  X,
  CreditCard,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Calendar,
  UserCheck,
  Building2,
  FileText,
  ShieldCheck,
  ArrowRight,
  Receipt,
  Check,
  XCircle,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ManualPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedUserId?: string;
}

export const ManualPaymentModal: React.FC<ManualPaymentModalProps> = ({
  isOpen,
  onClose,
  preselectedUserId
}) => {
  const {
    users,
    plans,
    memberships,
    payments,
    getMembershipForUser,
    getPlanById,
    recordManualPayment,
    approveManualPayment,
    rejectManualPayment
  } = useGym();

  // Active Tab: 'register' (Nuevo Pago) or 'audit' (Bandeja de Pendientes)
  const [activeTab, setActiveTab] = useState<'register' | 'audit'>('register');

  // Form states
  const members = users.filter(u => u.role === 'member');
  const [selectedUserId, setSelectedUserId] = useState<string>(preselectedUserId || members[0]?.id || '');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountARS, setAmountARS] = useState<number>(plans[0]?.priceARS || 35000);
  const [discountARS, setDiscountARS] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>(DISCOUNT_REASONS[0]);
  const [discountMode, setDiscountMode] = useState<'ars' | 'percent'>('ars');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [transactionReference, setTransactionReference] = useState('');
  const [notes, setNotes] = useState('');

  // Execution states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [rejectionModalId, setRejectionModalId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Selected member object & validation against membership history
  const selectedMember = users.find(u => u.id === selectedUserId);
  const currentMembership = selectedMember ? getMembershipForUser(selectedMember.id) : undefined;
  const currentPlan = currentMembership ? getPlanById(currentMembership.planId) : undefined;
  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];

  // User payment history
  const memberPaymentHistory = payments.filter(p => p.userId === selectedUserId);
  const existingPendingPayment = memberPaymentHistory.find(p => p.status === 'pending');

  // Sync plan price when selected plan changes
  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      setAmountARS(plan.priceARS);
      setDiscountARS(0);
      setDiscountPercent(0);
    }
  };

  const handleDiscountPercentChange = (pct: number) => {
    const clamped = Math.max(0, Math.min(90, pct));
    setDiscountPercent(clamped);
    const plan = plans.find(p => p.id === selectedPlanId) || plans[0];
    if (plan) {
      const disc = Math.round(plan.priceARS * (clamped / 100));
      setDiscountARS(disc);
      setAmountARS(Math.max(1, plan.priceARS - disc));
    }
  };
  const handleDiscountARSChange = (val: number) => {
    const plan = plans.find(p => p.id === selectedPlanId) || plans[0];
    const max = plan ? plan.priceARS - 1 : 999999;
    const clamped = Math.max(0, Math.min(val, max));
    setDiscountARS(clamped);
    if (plan) {
      setAmountARS(Math.max(1, plan.priceARS - clamped));
      setDiscountPercent(Math.round((clamped / plan.priceARS) * 100));
    }
  };

  // Sync when selecting a user
  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    const mem = getMembershipForUser(userId);
    if (mem && mem.planId) {
      handlePlanChange(mem.planId);
    }
    setFeedback(null);
  };

  // All pending payments in the gym for the audit tab
  const pendingPayments = payments.filter(p => p.status === 'pending');

  // Filter members by search query
  const filteredMembers = members.filter(m => {
    const q = userSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.dni && m.dni.includes(q))
    );
  });

  // Calculate projected extension
  const now = new Date();
  let projectedStartDate = now;
  if (currentMembership && new Date(currentMembership.endDate) > now && currentMembership.status === 'active') {
    projectedStartDate = new Date(currentMembership.endDate);
  }
  const durationDays = (selectedPlan?.durationMonths && selectedPlan.durationMonths > 0) ? selectedPlan.durationMonths * 30 : 1;
  const projectedEndDate = new Date(projectedStartDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

  // Submit manual payment (Registers as 'pending' with validation)
  const handleSubmitManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !selectedPlan) {
      setFeedback({ text: 'Por favor seleccioná un socio y un plan válido.', type: 'error' });
      return;
    }

    if (amountARS <= 0) {
      setFeedback({ text: 'El monto ingresado debe ser mayor a 0.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const result = await recordManualPayment({
        userId: selectedMember.id,
        planId: selectedPlan.id,
        method: paymentMethod,
        amountARS: Number(amountARS),
        discountARS: Number(discountARS) || 0,
        discountReason: discountARS > 0 ? discountReason : undefined,
        notes: notes.trim(),
        transactionReference: transactionReference.trim()
      });

      setIsSubmitting(false);

      if (result.success) {
        setFeedback({
          text: `Pago registrado con éxito en la tabla 'payments' con estado PENDIENTE. Requiere auditoría para acreditarse.`,
          type: 'success'
        });
        setTransactionReference('');
        setNotes('');
        setDiscountARS(0);
        setDiscountPercent(0);
        // Switch to audit tab after a brief delay
        setTimeout(() => {
          setActiveTab('audit');
        }, 1200);
      } else {
        setFeedback({ text: result.message, type: 'error' });
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setFeedback({ text: err.message || 'Error al registrar el pago manual.', type: 'error' });
    }
  };

  // Approve pending payment (Audits and applies extension)
  const handleApprove = async (paymentId: string) => {
    setIsSubmitting(true);
    const res = await approveManualPayment(paymentId);
    setIsSubmitting(false);
    if (res.success) {
      setFeedback({ text: res.message, type: 'success' });
    } else {
      setFeedback({ text: res.message, type: 'error' });
    }
  };

  // Reject pending payment
  const handleReject = async (paymentId: string) => {
    setIsSubmitting(true);
    const res = await rejectManualPayment(paymentId, rejectionReason);
    setIsSubmitting(false);
    setRejectionModalId(null);
    setRejectionReason('');
    if (res.success) {
      setFeedback({ text: res.message, type: 'info' });
    } else {
      setFeedback({ text: res.message, type: 'error' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl text-slate-100 space-y-5 my-auto relative max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">Registro de Pagos Manuales & Auditoría</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Caja Mostrador
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Los cobros manuales se guardan como pendientes y requieren auditoría contable previa a la activación de pase.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Selection Tabs */}
        <div className="flex items-center justify-between gap-3 shrink-0">
          <div className="grid grid-cols-2 p-1 bg-slate-850 rounded-2xl text-xs font-bold border border-slate-800 w-full sm:w-auto">
            <button
              onClick={() => {
                setActiveTab('register');
                setFeedback(null);
              }}
              className={`py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'register'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Registrar Pago Manual</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('audit');
                setFeedback(null);
              }}
              className={`py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-2 relative ${
                activeTab === 'audit'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Bandeja de Auditoría</span>
              {pendingPayments.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                  {pendingPayments.length}
                </span>
              )}
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Validación estricta contra historial de membresía</span>
          </div>
        </div>

        {/* Feedback message banner */}
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 shrink-0 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                : feedback.type === 'warning'
                ? 'bg-amber-950/60 border border-amber-500/50 text-amber-300'
                : 'bg-rose-950/60 border border-rose-500/50 text-rose-300'
            }`}
          >
            {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
            {feedback.type === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />}
            {feedback.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
            <span className="font-medium">{feedback.text}</span>
          </motion.div>
        )}

        {/* Content Body */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-5">
          {activeTab === 'register' ? (
            /* TAB 1: FORMULARIO DE REGISTRO MANUAL CON VALIDACIÓN DE HISTORIAL */
            <form onSubmit={handleSubmitManualPayment} className="space-y-5">
              
              {/* 1. Selección de Socio */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>1. Seleccionar Socio a Facturar</span>
                  </label>
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre, DNI o email..."
                      value={userSearchQuery}
                      onChange={e => setUserSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-900/50 rounded-xl border border-slate-800/50">
                  {filteredMembers.map(m => {
                    const isSelected = m.id === selectedUserId;
                    const mem = getMembershipForUser(m.id);
                    const isExpired = mem ? new Date(mem.endDate) < now : true;
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => handleSelectUser(m.id)}
                        className={`p-2.5 rounded-xl text-left text-xs transition-all border flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500 text-white font-bold shadow-sm'
                            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{m.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{m.email}</p>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black shrink-0 ${
                            !mem
                              ? 'bg-slate-800 text-slate-400'
                              : isExpired
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {!mem ? 'Sin Plan' : isExpired ? 'Vencido' : 'Activo'}
                        </span>
                      </button>
                    );
                  })}
                  {filteredMembers.length === 0 && (
                    <p className="text-xs text-slate-500 col-span-3 py-3 text-center">No se encontraron socios con ese criterio.</p>
                  )}
                </div>
              </div>

              {/* 2. VALIDACIÓN CONTRA HISTORIAL DE MEMBRESÍA DEL SOCIO SELECCIONADO */}
              {selectedMember && (
                <div className="bg-slate-850/70 border border-slate-800 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-sky-400" />
                      <span>2. Validación del Historial de Membresía</span>
                    </span>
                    <span className="text-xs font-bold text-sky-400">
                      Socio: {selectedMember.name} (DNI: {selectedMember.dni || 'S/D'})
                    </span>
                  </div>

                  {/* ALERTA DE DUPLICADOS EN CASO DE PAGO PENDIENTE EXISTENTE */}
                  {existingPendingPayment && (
                    <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-500/60 text-xs flex items-start gap-3 text-amber-200">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-extrabold text-amber-300">
                          ¡Atención! Este socio ya registra un cobro PENDIENTE de auditoría
                        </p>
                        <p className="text-[11px] text-amber-200/90 mt-0.5">
                          ID: {existingPendingPayment.id} • Monto: ${existingPendingPayment.amountARS.toLocaleString('es-AR')} • Fecha: {new Date(existingPendingPayment.paymentDate).toLocaleDateString('es-AR')}.
                          Verifique en la pestaña "Bandeja de Auditoría" antes de asentar otro comprobante para evitar duplicaciones de caja.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Grid de Estado Actual vs Proyección */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Tarjeta: Estado actual de la membresía */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-bold text-[11px]">Membresía Actual</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            !currentMembership
                              ? 'bg-slate-800 text-slate-400'
                              : new Date(currentMembership.endDate) < now
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          }`}
                        >
                          {!currentMembership
                            ? 'SIN MEMBRESÍA'
                            : new Date(currentMembership.endDate) < now
                            ? 'VENCIDA'
                            : 'ACTIVA'}
                        </span>
                      </div>

                      <p className="font-extrabold text-white text-sm">
                        {currentPlan?.name || 'Ningún plan asignado'}
                      </p>

                      <div className="text-[11px] text-slate-400 space-y-0.5">
                        <p>
                          Vencimiento:{' '}
                          <strong className="text-slate-200">
                            {currentMembership ? new Date(currentMembership.endDate).toLocaleDateString('es-AR') : 'N/A'}
                          </strong>
                        </p>
                        <p>
                          Último pago registrado:{' '}
                          <strong className="text-slate-200">
                            {memberPaymentHistory[0]
                              ? `${new Date(memberPaymentHistory[0].paymentDate).toLocaleDateString('es-AR')} ($${memberPaymentHistory[0].amountARS.toLocaleString('es-AR')} - ${memberPaymentHistory[0].status})`
                              : 'Sin pagos'}
                          </strong>
                        </p>
                      </div>
                    </div>

                    {/* Tarjeta: Proyección de Extensión si se aprueba */}
                    <div className="p-3 rounded-xl bg-emerald-950/25 border border-emerald-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 font-bold text-[11px]">Proyección Post-Auditoría</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          +{durationDays} DÍAS
                        </span>
                      </div>

                      <p className="font-extrabold text-emerald-300 text-sm">
                        {selectedPlan?.name}
                      </p>

                      <div className="text-[11px] text-slate-300 space-y-0.5">
                        <p>
                          Nuevo periodo proyectado:{' '}
                          <strong className="text-emerald-300">
                            {projectedStartDate.toLocaleDateString('es-AR')} al {projectedEndDate.toLocaleDateString('es-AR')}
                          </strong>
                        </p>
                        <p className="text-slate-400 text-[10px]">
                          * Esta vigencia se hará efectiva únicamente cuando el pago sea auditado y aprobado.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tabla resumida de pagos históricos del socio */}
                  {memberPaymentHistory.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Historial reciente de cobros del socio ({memberPaymentHistory.length})
                      </p>
                      <div className="overflow-x-auto rounded-xl border border-slate-800">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-900 text-slate-400 font-bold">
                            <tr>
                              <th className="p-2">Fecha</th>
                              <th className="p-2">Plan</th>
                              <th className="p-2">Monto</th>
                              <th className="p-2">Método</th>
                              <th className="p-2">Estado</th>
                              <th className="p-2">Comprobante</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 text-slate-300">
                            {memberPaymentHistory.slice(0, 3).map(p => (
                              <tr key={p.id}>
                                <td className="p-2">{new Date(p.paymentDate).toLocaleDateString('es-AR')}</td>
                                <td className="p-2 truncate max-w-[120px]">{p.planName}</td>
                                <td className="p-2 font-bold text-white">${p.amountARS.toLocaleString('es-AR')}</td>
                                <td className="p-2 capitalize">{p.method}</td>
                                <td className="p-2">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                      p.status === 'approved'
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : p.status === 'pending'
                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    }`}
                                  >
                                    {p.status}
                                  </span>
                                </td>
                                <td className="p-2 text-slate-400 truncate max-w-[100px]">{p.transactionId}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. DATOS DEL COBRO MANUAL */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-4">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>3. Datos de la Operación en Caja</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Plan a abonar */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Plan de Membresía</label>
                    <select
                      value={selectedPlanId}
                      onChange={e => handlePlanChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
                    >
                      {plans.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} - ${p.priceARS.toLocaleString('es-AR')} ({p.billingCycle})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Método de Cobro Manual */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Medio de Pago</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cash')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                          paymentMethod === 'cash'
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        💵 Efectivo
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('transfer')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                          paymentMethod === 'transfer'
                            ? 'bg-sky-500 text-slate-950 border-sky-400 font-extrabold'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        🏦 Transf.
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('debit_card')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                          paymentMethod === 'debit_card'
                            ? 'bg-purple-500 text-slate-950 border-purple-400 font-extrabold'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        💳 Débito
                      </button>
                    </div>
                  </div>

                  {/* Monto en ARS */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300">Monto Cobrado Neto ($ ARS)</label>
                      {selectedPlan && amountARS !== selectedPlan.priceARS && (
                        <span className="text-[10px] font-bold text-amber-400">
                          Difiere de tarifa (${selectedPlan.priceARS.toLocaleString('es-AR')})
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      required
                      min={1}
                      value={amountARS}
                      onChange={e => setAmountARS(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-extrabold focus:outline-none focus:border-emerald-500"
                    />
                    {discountARS>0 && <p className="text-[10px] text-emerald-400 font-bold">Tarifa ${selectedPlan?.priceARS.toLocaleString('es-AR')} − Desc. ${discountARS.toLocaleString('es-AR')} = Neto ${amountARS.toLocaleString('es-AR')} ({discountReason})</p>}
                  </div>

                  {/* DESCUENTO */}
                  <div className="sm:col-span-2 p-3 rounded-xl bg-emerald-950/15 border border-emerald-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-emerald-300">Descuento / Promo (opcional)</label>
                      <div className="flex gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
                        <button type="button" onClick={()=>setDiscountMode('ars')} className={`px-2 py-0.5 rounded text-[10px] font-bold ${discountMode==='ars'?'bg-emerald-500 text-slate-950':'text-slate-400'}`}>$ ARS</button>
                        <button type="button" onClick={()=>setDiscountMode('percent')} className={`px-2 py-0.5 rounded text-[10px] font-bold ${discountMode==='percent'?'bg-emerald-500 text-slate-950':'text-slate-400'}`}>% Off</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        {discountMode==='ars' ? (
                          <input type="number" min={0} placeholder="Ej: 7000" value={discountARS} onChange={e=>handleDiscountARSChange(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500" />
                        ) : (
                          <input type="number" min={0} max={90} placeholder="Ej: 20" value={discountPercent} onChange={e=>handleDiscountPercentChange(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500" />
                        )}
                      </div>
                      <select value={discountReason} onChange={e=>setDiscountReason(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500">
                        {DISCOUNT_REASONS.map(r=> <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {[10,20,50].map(p=> <button key={p} type="button" onClick={()=>{setDiscountMode('percent'); handleDiscountPercentChange(p);}} className="px-2 py-1 rounded-full text-[10px] font-bold bg-slate-800 border border-slate-700 text-emerald-300">{p}% OFF</button>)}
                      <button type="button" onClick={()=>{setDiscountARS(0); setDiscountPercent(0); if(selectedPlan) setAmountARS(selectedPlan.priceARS);}} className="px-2 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 border border-rose-500/30 text-rose-300">Sin desc.</button>
                    </div>
                  </div>

                  {/* N° Comprobante / Referencia */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      N° Comprobante / Recibo / Ref. Bancaria
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: REC-001-0492 o TRX-948102"
                      value={transactionReference}
                      onChange={e => setTransactionReference(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Notas internas */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Observaciones / Notas de Auditoría (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Cobrado en turno mañana por recepción. Socio presentó comprobante de transferencia bancaria."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* AVISO DE PROTOCOLO CONTABLE */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs flex items-start gap-3 text-slate-300">
                <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong className="text-white">Protocolo de Control Interno:</strong> Al confirmar, este pago se insertará en la tabla <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded">payments</code> con estado <code className="text-amber-400 bg-slate-900 px-1 py-0.5 rounded">pending</code>.
                  <span className="text-amber-300 font-semibold"> No se extenderá la membresía del socio automáticamente</span> hasta que sea auditado en la bandeja de pagos pendientes.
                </div>
              </div>

              {/* Botón de envío */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-850 hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedMember}
                  className="px-6 py-2.5 rounded-xl text-xs font-black text-slate-950 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Registrando en tabla 'payments'...</span>
                  ) : (
                    <>
                      <Receipt className="w-4 h-4" />
                      <span>Registrar Pago Manual (Pendiente de Auditoría)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* TAB 2: BANDEJA DE AUDITORÍA & APROBACIÓN DE COBROS PENDIENTES */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Pagos Manuales Pendientes de Verificación ({pendingPayments.length})</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Auditá y aprobá los cobros en efectivo o transferencias para acreditar el pase del socio.
                  </p>
                </div>
              </div>

              {pendingPayments.length === 0 ? (
                <div className="text-center py-12 px-4 bg-slate-950/40 rounded-3xl border border-slate-800 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Bandeja de auditoría al día</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    No hay pagos manuales pendientes de aprobación. Todos los cobros registrados están auditados y acreditados.
                  </p>
                  <button
                    onClick={() => setActiveTab('register')}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 transition-colors"
                  >
                    Registrar nuevo cobro
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingPayments.map(p => {
                    const member = users.find(u => u.id === p.userId);
                    const mem = member ? getMembershipForUser(member.id) : undefined;
                    return (
                      <div
                        key={p.id}
                        className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-3 shadow-md"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850 pb-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-white text-sm">{p.userName}</span>
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                PENDIENTE DE AUDITORÍA
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">{p.userEmail}</p>
                          </div>

                          <div className="text-right">
                            <span className="text-base font-black text-emerald-400">
                              ${p.amountARS.toLocaleString('es-AR')} ARS
                            </span>
                            <p className="text-[10px] text-slate-400">
                              {new Date(p.paymentDate).toLocaleString('es-AR')}
                            </p>
                          </div>
                        </div>

                        {/* Detalles de la operación y validación de membresía */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Plan & Método</span>
                            <span className="font-semibold text-white truncate block">
                              {p.planName} • {p.method === 'cash' ? 'Efectivo' : p.method === 'transfer' ? 'Transferencia' : 'Débito'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Comprobante</span>
                            <span className="font-mono text-slate-200 truncate block">
                              {p.transactionId}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Estado Membresía Actual</span>
                            <span className="font-semibold text-slate-300">
                              {mem ? `Vence: ${new Date(mem.endDate).toLocaleDateString('es-AR')}` : 'Sin membresía activa'}
                            </span>
                          </div>
                        </div>

                        {p.notes && (
                          <p className="text-xs text-slate-400 bg-slate-900/40 p-2 rounded-lg border border-slate-800/40">
                            <strong>Notas:</strong> {p.notes}
                          </p>
                        )}

                        {/* Acciones de Auditoría */}
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setRejectionModalId(p.id)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/50 transition-colors flex items-center gap-1.5"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Rechazar</span>
                          </button>

                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleApprove(p.id)}
                            className="px-4 py-1.5 rounded-xl text-xs font-black text-slate-950 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 transition-all shadow-md shadow-emerald-500/20 active:scale-95 flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Aprobar & Acreditar Membresía</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal simple de confirmación de rechazo */}
        {rejectionModalId && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Rechazar Pago Manual</span>
              </h4>
              <p className="text-xs text-slate-400">
                Ingresá el motivo por el cual se rechaza el comprobante (ej: no impactó en cuenta bancaria, billete no aceptado).
              </p>
              <input
                type="text"
                placeholder="Motivo de rechazo..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setRejectionModalId(null);
                    setRejectionReason('');
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleReject(rejectionModalId)}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500"
                >
                  Confirmar Rechazo
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

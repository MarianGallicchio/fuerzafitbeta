import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { SubscriptionPlan, BillingCycle, PaymentMethod } from '../../types';
import {
  CreditCard,
  Plus,
  Edit2,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
  DollarSign,
  TrendingUp,
  Download,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';

export const AdminPlansView: React.FC = () => {
  const { plans, createPlan, updatePlan, payments } = useGym();

  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  // New Plan Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceARS, setPriceARS] = useState<number>(38000);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [gracePeriodDays, setGracePeriodDays] = useState<number>(3);
  const [benefitsText, setBenefitsText] = useState('Acceso musculación y cardio\nClases grupales ilimitadas\nEvaluación física mensual');

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    const benefits = benefitsText.split('\n').map(b => b.trim()).filter(Boolean);
    const durationMonths = billingCycle === 'annual' ? 12 : billingCycle === 'quarterly' ? 3 : billingCycle === 'biannual' ? 6 : 1;

    if (editingPlan) {
      updatePlan(editingPlan.id, {
        name,
        description,
        priceARS: Number(priceARS),
        billingCycle,
        durationMonths,
        gracePeriodDays: Number(gracePeriodDays),
        benefits
      });
      setEditingPlan(null);
    } else {
      createPlan({
        name,
        description,
        priceARS: Number(priceARS),
        billingCycle,
        durationMonths,
        gracePeriodDays: Number(gracePeriodDays),
        benefits,
        branchIds: ['branch-1', 'branch-2', 'branch-3'],
        active: true
      });
    }

    setShowCreatePlanModal(false);
    setName('');
    setDescription('');
  };

  const openEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setDescription(plan.description);
    setPriceARS(plan.priceARS);
    setBillingCycle(plan.billingCycle);
    setGracePeriodDays(plan.gracePeriodDays);
    setBenefitsText(plan.benefits.join('\n'));
    setShowCreatePlanModal(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/15 text-sky-400 border border-sky-500/30">
              Planes & Pasarela Mercado Pago
            </span>
            <span className="text-xs text-slate-400">Suscripciones Recurrentes ARS</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Gestión de Planes de Membresía</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configurá precios, beneficios, días de gracia y débito automático con Mercado Pago.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingPlan(null);
            setShowCreatePlanModal(true);
          }}
          className="py-3 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Nuevo Plan</span>
        </button>
      </div>

      {/* Mercado Pago Integration Status Banner */}
      <div className="p-5 rounded-3xl bg-sky-950/40 border border-sky-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-sm">Mercado Pago Checkout Pro & Subscriptions</span>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400">
                Conectado ✓
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Webhook activo: <code className="text-sky-300 bg-sky-950/60 px-1.5 py-0.5 rounded font-mono">https://api.fuerzafit.com.ar/webhook/mercadopago</code> • Cobros acreditados al instante.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Idempotencia y transacciones automáticas</span>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div
            key={plan.id}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all space-y-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {plan.billingCycle.toUpperCase()}
                </span>
                <button
                  onClick={() => openEdit(plan)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-xl font-black text-white mt-2">{plan.name}</h3>
              <p className="text-xs text-slate-400 mt-1">{plan.description}</p>

              <div className="my-4">
                <span className="text-2xl sm:text-3xl font-black text-white">
                  ${plan.priceARS.toLocaleString('es-AR')}
                </span>
                <span className="text-xs text-slate-400 ml-1">ARS / período</span>
              </div>

              {/* Benefits list */}
              <div className="space-y-2 text-xs pt-3 border-t border-slate-800/80">
                {plan.benefits.map((b, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Plan badges info */}
            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>{plan.gracePeriodDays} días de gracia</span>
              <span className="text-emerald-400 font-semibold">
                {plan.branchIds?.length > 1 ? 'Pase Multi-Sede' : 'Sede Única'}
              </span>
            </div>

          </div>
        ))}
      </div>

      {/* Payments Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <span>Libro Mayor de Cobros & Facturación (Mercado Pago / Caja)</span>
          </h3>
          <span className="text-xs text-slate-400">{payments.length} transacciones registradas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 pb-2 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 pl-3">Fecha</th>
                <th className="py-2.5">Socio</th>
                <th className="py-2.5">Plan</th>
                <th className="py-2.5">Medio</th>
                <th className="py-2.5">ID Transacción</th>
                <th className="py-2.5 text-right pr-3">Monto (ARS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {payments.map(pay => (
                <tr key={pay.id} className="text-slate-300 hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 pl-3 font-mono text-slate-400">
                    {new Date(pay.paymentDate).toLocaleDateString('es-AR')}
                  </td>
                  <td className="py-3 font-bold text-white">{pay.userName}</td>
                  <td className="py-3 text-slate-300">{pay.planName}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      pay.method === 'mercadopago'
                        ? 'bg-sky-500/15 text-sky-400'
                        : pay.method === 'transfer'
                        ? 'bg-purple-500/15 text-purple-400'
                        : 'bg-emerald-500/15 text-emerald-400'
                    }`}>
                      {pay.method === 'mercadopago' ? 'Mercado Pago' : pay.method === 'transfer' ? 'Transferencia' : 'Efectivo'}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-slate-400 text-[11px]">{pay.transactionId}</td>
                  <td className="py-3 text-right pr-3 font-black text-emerald-400 text-sm">
                    ${pay.amountARS.toLocaleString('es-AR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create / Edit Plan */}
      {showCreatePlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 my-8 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white">
                {editingPlan ? 'Editar Plan de Membresía' : 'Crear Nuevo Plan de Membresía'}
              </h3>
              <button
                onClick={() => setShowCreatePlanModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-bold mb-1">Nombre del Plan</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Plan Anual VIP Black"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-bold mb-1">Descripción Breve</label>
                  <input
                    type="text"
                    placeholder="Ej: Acceso total a todas las sedes con pase libre"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Precio en Pesos (ARS)</label>
                  <input
                    type="number"
                    required
                    value={priceARS}
                    onChange={e => setPriceARS(parseFloat(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Período de Duración</label>
                  <select
                    value={billingCycle}
                    onChange={e => setBillingCycle(e.target.value as BillingCycle)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"
                  >
                    <option value="single_pass">Pase Diario / Clase Suelta</option>
                    <option value="monthly">Mensual</option>
                    <option value="quarterly">Trimestral (3 meses)</option>
                    <option value="annual">Anual (12 meses)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Días de Gracia tras Vencimiento</label>
                  <input
                    type="number"
                    value={gracePeriodDays}
                    onChange={e => setGracePeriodDays(parseInt(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-bold mb-1">Beneficios Incluidos (1 por línea)</label>
                  <textarea
                    rows={3}
                    value={benefitsText}
                    onChange={e => setBenefitsText(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreatePlanModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20"
                >
                  {editingPlan ? 'Guardar Cambios' : 'Publicar Plan'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};

import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { SubscriptionPlan, PaymentMethod, DISCOUNT_REASONS } from '../../types';
import {
  X,
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Copy,
  AlertCircle,
  ExternalLink,
  Lock,
  Calendar,
  Building2,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { generatePaymentReceiptPDF } from '../../utils/receiptGenerator';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlanId?: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, targetPlanId }) => {
  const { plans, currentUser, processPayment, getMembershipForUser, branches, selectedBranchId } = useGym();

  const [selectedPlanId, setSelectedPlanId] = useState<string>(targetPlanId || plans[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mercadopago');
  const [couponCode, setCouponCode] = useState('');
  const [discountARS, setDiscountARS] = useState(0);
  const [discountReason, setDiscountReason] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{type:'success'|'error',msg:string}|null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedAlias, setCopiedAlias] = useState(false);

  // Sync selected plan if prop changes
  React.useEffect(() => {
    if (targetPlanId) setSelectedPlanId(targetPlanId);
  }, [targetPlanId]);

  if (!isOpen) return null;

  const currentMembership = currentUser ? getMembershipForUser(currentUser.id) : null;
  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    const planPrice = selectedPlan.priceARS;
    // Cupones demo: BIENVENIDA20=20%, FUERZA15=15%, REFERIDO10=10%, BETA50=50%
    const coupons: Record<string,{pct:number, reason:string}> = {
      'BIENVENIDA20': {pct:20, reason:'Primera cuota / Bienvenida'},
      'BIENVENIDA10': {pct:10, reason:'Primera cuota / Bienvenida'},
      'FUERZA15': {pct:15, reason:'Promo / Referido'},
      'REFERIDO10': {pct:10, reason:'Promo / Referido'},
      'FAMILIA20': {pct:20, reason:'Plan familiar'},
      'BETA50': {pct:50, reason:'Beca deportiva'},
    };
    if (!code) { setDiscountARS(0); setDiscountReason(''); setCouponFeedback(null); return; }
    if (coupons[code]) {
      const disc = Math.round(planPrice * coupons[code].pct / 100);
      setDiscountARS(disc);
      setDiscountReason(coupons[code].reason);
      setCouponFeedback({type:'success', msg:`Cupón ${code}: ${coupons[code].pct}% OFF ($${disc.toLocaleString('es-AR')}) aplicado — ${coupons[code].reason}`});
    } else {
      setDiscountARS(0); setDiscountReason('');
      setCouponFeedback({type:'error', msg:'Cupón no válido. Probá BIENVENIDA20, FUERZA15 o REFERIDO10'});
    }
  };

  const handlePlanSelectWithCouponReset = (planId: string) => {
    setSelectedPlanId(planId);
    setDiscountARS(0); setDiscountReason(''); setCouponCode(''); setCouponFeedback(null);
  };

  const handlePay = async () => {
    if (!currentUser || !selectedPlan) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Simulate realistic network roundtrip to Mercado Pago API
      await new Promise(resolve => setTimeout(resolve, 1400));

      const netAmount = Math.max(1, selectedPlan.priceARS - discountARS);
      const result = await processPayment({
        userId: currentUser.id,
        planId: selectedPlan.id,
        method: paymentMethod,
        amountARS: netAmount,
        discountARS: discountARS > 0 ? discountARS : undefined,
        discountReason: discountARS > 0 ? discountReason : undefined,
        notes: `Pago online vía ${paymentMethod === 'mercadopago' ? 'Mercado Pago Checkout Pro' : paymentMethod}${discountARS>0 ? ` (cupón ${couponCode.toUpperCase()} −$${discountARS})` : ''}`
      });

      setPaymentSuccess(result);
      // Trigger festive celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al procesar el pago con Mercado Pago. Intentá nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyAlias = () => {
    navigator.clipboard.writeText('fuerzafit.gym.mp');
    setCopiedAlias(true);
    setTimeout(() => setCopiedAlias(false), 2000);
  };

  const resetAndClose = () => {
    setPaymentSuccess(null);
    setErrorMessage(null);
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 my-8 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Renovación & Pagos Online</h3>
              <p className="text-xs text-slate-400">Integración Oficial Mercado Pago LATAM</p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {paymentSuccess ? (
          /* Payment Success View */
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center ring-8 ring-emerald-500/10">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h4 className="text-xl font-extrabold text-white">¡Pago Aprobado con Éxito!</h4>
              <p className="text-xs text-slate-300 mt-1">
                Tu membresía ha sido activada y tu código QR de acceso ya está habilitado.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Plan Contratado:</span>
                <span className="font-bold text-white">{paymentSuccess.payment.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Monto Abonado:</span>
                <span className="font-bold text-emerald-400 text-sm">
                  ${paymentSuccess.payment.amountARS.toLocaleString('es-AR')} ARS
                  {paymentSuccess.payment.discountARS ? <span className="ml-2 text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">Desc. ${paymentSuccess.payment.discountARS.toLocaleString('es-AR')} ({paymentSuccess.payment.discountReason})</span> : null}
                </span>
              </div>
              {paymentSuccess.payment.discountARS ? (
                <div className="flex justify-between">
                  <span className="text-slate-400">Tarifa lista:</span>
                  <span className="font-bold text-slate-400 line-through text-xs">${(paymentSuccess.payment.amountARS + paymentSuccess.payment.discountARS).toLocaleString('es-AR')} ARS</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-slate-400">Medio de Pago:</span>
                <span className="font-medium text-slate-200 uppercase">
                  {paymentSuccess.payment.method === 'mercadopago' ? 'Mercado Pago (Dinero / Tarjeta)' : paymentSuccess.payment.method}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ID de Transacción:</span>
                <span className="font-mono text-slate-300">{paymentSuccess.payment.transactionId}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-700">
                <span className="text-slate-400">Vigencia hasta:</span>
                <span className="font-bold text-emerald-400">
                  {new Date(paymentSuccess.membership.endDate).toLocaleDateString('es-AR')}
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  if (currentUser && paymentSuccess) {
                    const branch = branches.find(b => b.id === (currentUser.branchId || selectedBranchId)) || branches[0];
                    generatePaymentReceiptPDF({
                      payment: paymentSuccess.payment,
                      member: currentUser,
                      plan: selectedPlan,
                      branch
                    });
                  }
                }}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Descargar Comprobante PDF</span>
              </button>

              <button
                onClick={resetAndClose}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-98"
              >
                Volver a la App
              </button>
            </div>
          </div>
        ) : (
          /* Payment Form View */
          <div className="mt-4 space-y-5">
            
            {/* Plan Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                1. Seleccioná tu Plan de Entrenamiento
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                {plans.filter(p => p.active).map(plan => {
                  const isSelected = plan.id === selectedPlanId;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => handlePlanSelectWithCouponReset(plan.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/30'
                          : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-white truncate">{plan.name}</p>
                          {plan.isPopular && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                              Recomendado
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{plan.description}</p>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <p className="text-base font-extrabold text-emerald-400">
                          ${plan.priceARS.toLocaleString('es-AR')}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {plan.durationMonths === 1 ? '/mes' : plan.durationMonths === 3 ? '/trimestre' : plan.durationMonths === 12 ? '/año' : '/pase'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                2. Método de Pago
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('mercadopago')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    paymentMethod === 'mercadopago'
                      ? 'bg-sky-500/15 border-sky-400 text-sky-300 font-bold ring-1 ring-sky-400/30'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="w-7 h-7 mx-auto rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400 mb-1">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="text-xs block leading-tight">Mercado Pago</span>
                  <span className="text-[9px] text-sky-400 font-normal">Acreditación instantánea</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    paymentMethod === 'transfer'
                      ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300 font-bold ring-1 ring-emerald-400/30'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="w-7 h-7 mx-auto rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-1">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <span className="text-xs block leading-tight">Transferencia</span>
                  <span className="text-[9px] text-slate-400 font-normal">CVU / Alias MP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-amber-500/15 border-amber-400 text-amber-300 font-bold ring-1 ring-amber-400/30'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="w-7 h-7 mx-auto rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 mb-1">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <span className="text-xs block leading-tight">Efectivo</span>
                  <span className="text-[9px] text-slate-400 font-normal">En recepción</span>
                </button>
              </div>
            </div>

            {/* Method Details info */}
            {paymentMethod === 'mercadopago' && (
              <div className="p-3 bg-sky-950/40 border border-sky-800/50 rounded-xl text-xs space-y-1.5 text-sky-200">
                <div className="flex items-center gap-1.5 font-semibold text-sky-300">
                  <ShieldCheck className="w-4 h-4" /> Pasarela Segura Mercado Pago Checkout Pro
                </div>
                <p className="text-[11px] text-sky-300/80">
                  Acepta dinero en cuenta Mercado Pago, tarjetas de débito (Visa Débito, Mastercard Débito, Cabal) y crédito en cuotas. La membresía se activa de inmediato.
                </p>
              </div>
            )}

            {paymentMethod === 'transfer' && (
              <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Alias de Destino:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-emerald-400 bg-slate-900 px-2 py-0.5 rounded">
                      fuerzafit.gym.mp
                    </span>
                    <button
                      onClick={handleCopyAlias}
                      className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200"
                      title="Copiar Alias"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {copiedAlias && <p className="text-[10px] text-emerald-400 text-right">¡Alias copiado al portapapeles!</p>}
                <div className="flex justify-between">
                  <span className="text-slate-400">Titular:</span>
                  <span className="font-medium text-slate-200">FuerzaFit SRL (CUIT 30-71829304-9)</span>
                </div>
              </div>
            )}

            {paymentMethod === 'cash' && (
              <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-xs text-amber-200">
                <p className="font-semibold text-amber-300 mb-0.5">Abono en Mostrador / Recepción</p>
                <p className="text-[11px] text-amber-300/80">
                  Al confirmar, se generará una orden pendiente. Podés acercarte a cualquier sede con tu DNI para abonar en efectivo.
                </p>
              </div>
            )}

            {/* CUPÓN DESCUENTO */}
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
              <label className="block text-xs font-bold text-slate-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">%</span>
                ¿Tenés cupón? (1ª cuota, referido, etc.)
              </label>
              <div className="flex gap-2">
                <input type="text" placeholder="Ej: BIENVENIDA20" value={couponCode} onChange={e=>setCouponCode(e.target.value.toUpperCase())} onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); handleApplyCoupon(); }}} className="flex-1 py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 font-mono uppercase tracking-wider focus:border-emerald-500 focus:outline-none" />
                <button type="button" onClick={handleApplyCoupon} className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs">Aplicar</button>
                {discountARS>0 && <button type="button" onClick={()=>{setDiscountARS(0); setDiscountReason(''); setCouponCode(''); setCouponFeedback(null);}} className="px-3 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold text-xs">Quitar</button>}
              </div>
              {couponFeedback && <p className={`text-[11px] font-bold ${couponFeedback.type==='success'?'text-emerald-400':'text-rose-400'}`}>{couponFeedback.msg}</p>}
              <p className="text-[11px] text-slate-500">Probá: <code className="text-emerald-300 bg-slate-900 px-1 rounded">BIENVENIDA20</code> (20% 1ª cuota), <code className="text-sky-300 bg-slate-900 px-1 rounded">FUERZA15</code>, <code className="text-amber-300 bg-slate-900 px-1 rounded">REFERIDO10</code></p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Total and CTA Button */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] text-slate-400">Total a Pagar</p>
                {discountARS>0 ? (
                  <div>
                    <p className="text-xs text-slate-500 line-through">${selectedPlan.priceARS.toLocaleString('es-AR')} ARS</p>
                    <p className="text-xl font-black text-emerald-400">${(selectedPlan.priceARS - discountARS).toLocaleString('es-AR')} <span className="text-xs font-normal text-slate-400">ARS</span> <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">−${discountARS.toLocaleString('es-AR')} ({discountReason})</span></p>
                  </div>
                ) : (
                  <p className="text-xl font-black text-white">
                    ${selectedPlan.priceARS.toLocaleString('es-AR')} <span className="text-xs font-normal text-slate-400">ARS</span>
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handlePay}
                disabled={isProcessing}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Conectando con Mercado Pago...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Confirmar y Pagar</span>
                  </>
                )}
              </button>
            </div>

          </div>
        )}
      </motion.div>
    </div>
  );
};

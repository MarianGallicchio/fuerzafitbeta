import React from 'react';
import {
  X,
  Download,
  Printer,
  CheckCircle2,
  Calendar,
  CreditCard,
  Building2,
  ShieldCheck,
  QrCode,
  ExternalLink,
  Hash
} from 'lucide-react';
import { Payment, User, SubscriptionPlan, GymBranch } from '../../types';
import { generatePaymentReceiptPDF } from '../../utils/receiptGenerator';

interface PaymentReceiptModalProps {
  payment: Payment | null;
  member: User;
  plan?: SubscriptionPlan | null;
  branch?: GymBranch | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  payment,
  member,
  plan,
  branch,
  isOpen,
  onClose
}) => {
  if (!isOpen || !payment) return null;

  const paymentDate = new Date(payment.paymentDate);
  const dateFormatted = paymentDate.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const timeFormatted = paymentDate.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const receiptNumber = `0001-${payment.transactionId.replace(/\D/g, '').slice(-8).padStart(8, '0')}`;

  const handleDownloadPDF = () => {
    generatePaymentReceiptPDF({
      payment,
      member,
      plan,
      branch
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const methodLabel = payment.method === 'mercadopago'
    ? 'Mercado Pago (Tarjeta / Saldo en cuenta)'
    : payment.method === 'transfer'
    ? 'Transferencia Bancaria Inmediata'
    : payment.method === 'debit_card'
    ? 'Tarjeta de Débito'
    : 'Efectivo en Recepción';

  return (
    <div
      id="payment-receipt-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-80 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header Controls */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Comprobante Oficial de Pago</h3>
              <p className="text-xs text-slate-400">Constancia digital de acreditación de membresía</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Document Card (Paper layout) */}
        <div
          id="printable-receipt-card"
          className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6 relative overflow-hidden shadow-inner"
        >
          {/* Top Receipt Bar */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white">
                  FUERZA<span className="text-emerald-400">FIT</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  LATAM
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Red de Centros de Entrenamiento & Salud
              </p>
              <p className="text-[10px] text-slate-500">
                CUIT: 30-71894231-8 • IVA Responsable Inscripto
              </p>
            </div>

            <div className="sm:text-right bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Recibo de Cobro
              </span>
              <span className="text-sm font-extrabold text-emerald-400 font-mono">
                Nº {receiptNumber}
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {dateFormatted} - {timeFormatted} hs
              </p>
            </div>
          </div>

          {/* Member & Branch Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-900/50 p-4 rounded-xl border border-slate-800/60">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                Titular del Servicio
              </span>
              <p className="font-black text-white text-sm">{member.name}</p>
              <p className="text-slate-300">{member.email}</p>
              <p className="text-slate-400">DNI: <span className="text-slate-200 font-mono">{member.dni || 'Sin registrar'}</span></p>
              <p className="text-slate-500 text-[11px]">ID Socio: {member.id}</p>
            </div>

            <div className="space-y-1.5 sm:border-l sm:border-slate-800 sm:pl-4">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                Sede & Emisión
              </span>
              <p className="font-bold text-white flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{branch?.name || 'Sede Central'}</span>
              </p>
              <p className="text-slate-400 text-[11px]">{branch?.address || 'Av. Corrientes 3200, CABA'}</p>
              <p className="text-slate-400 text-[11px]">Condición IVA: Consumidor Final</p>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 mt-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Operación Acreditada</span>
              </span>
            </div>
          </div>

          {/* Item Breakdown Table */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center bg-slate-900/80 px-3.5 py-2 rounded-lg border border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
              <span>Concepto / Plan</span>
              <span>Importe Total</span>
            </div>

            <div className="flex justify-between items-start p-3.5 bg-slate-900/30 rounded-xl border border-slate-800/80">
              <div className="space-y-1">
                <p className="font-extrabold text-white text-sm">
                  {payment.planName || plan?.name || 'Membresía Mensual FuerzaFit'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {plan?.description || 'Acceso total a equipamiento de musculación, cardio y clases programadas.'}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-300">
                    TRX: {payment.transactionId}
                  </span>
                  <span>•</span>
                  <span>Medio: {methodLabel}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-base font-black text-emerald-400">
                  ${payment.amountARS.toLocaleString('es-AR')} ARS
                </span>
                <span className="block text-[10px] text-slate-500">IVA Inc.</span>
              </div>
            </div>
          </div>

          {/* Totals & Security summary */}
          <div className="flex flex-col sm:flex-row justify-between items-end gap-4 pt-3 border-t border-slate-800">
            <div className="text-[10px] text-slate-500 space-y-1 max-w-xs">
              <p className="font-semibold text-slate-400">Constancia de Acceso Válida:</p>
              <p>
                El presente comprobante certifica el cobro y habilita el uso de las instalaciones según el reglamento vigente.
              </p>
              <p className="font-mono text-slate-500">
                ID Seg: {payment.idempotencyKey || payment.transactionId}
              </p>
            </div>

            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 w-full sm:w-64 text-right">
              <span className="text-[11px] text-slate-400 block">Total Cancelado</span>
              <span className="text-2xl font-black text-emerald-400 tracking-tight">
                ${payment.amountARS.toLocaleString('es-AR')} <span className="text-xs text-slate-400 font-normal">ARS</span>
              </span>
              <span className="block text-[10px] text-emerald-500 font-semibold mt-0.5">
                ● Pago Registrado & Verificado
              </span>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-xs text-slate-400 text-center sm:text-left">
            Podés descargar el archivo PDF oficial para presentar en tu obra social o como constancia de pago.
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id="btn-print-voucher"
              onClick={handlePrint}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700"
              title="Imprimir comprobante"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              id="btn-download-pdf-modal"
              onClick={handleDownloadPDF}
              className="flex-1 sm:flex-initial py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Descargar PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

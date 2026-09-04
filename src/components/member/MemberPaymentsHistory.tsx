import React, { useState, useMemo } from 'react';
import { useGym } from '../../context/GymContext';
import {
  CreditCard,
  Download,
  Eye,
  Calendar,
  CheckCircle2,
  Receipt,
  Search,
  ArrowUpDown,
  Filter,
  FileText,
  DollarSign,
  ShieldCheck,
  Building2,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { Payment, User } from '../../types';
import { PaymentReceiptModal } from './PaymentReceiptModal';
import { generatePaymentReceiptPDF } from '../../utils/receiptGenerator';

interface MemberPaymentsHistoryProps {
  onOpenPaymentModal: () => void;
}

export const MemberPaymentsHistory: React.FC<MemberPaymentsHistoryProps> = ({ onOpenPaymentModal }) => {
  const { currentUser, payments, getMembershipForUser, getPlanById, branches, selectedBranchId } = useGym();

  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | 'mercadopago' | 'transfer' | 'cash' | 'debit_card'>('all');
  const [selectedPaymentForModal, setSelectedPaymentForModal] = useState<Payment | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  if (!currentUser) return null;

  const currentMembership = getMembershipForUser(currentUser.id);
  const currentPlan = currentMembership ? getPlanById(currentMembership.planId) : null;
  const currentBranch = branches.find(b => b.id === (currentUser.branchId || selectedBranchId)) || branches[0];

  // User's payments sorted descending by date
  const userPayments = useMemo(() => {
    return payments
      .filter(p => p.userId === currentUser.id)
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }, [payments, currentUser.id]);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return userPayments.filter(p => {
      const matchSearch =
        p.planName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.amountARS.toString().includes(searchQuery);

      const matchMethod = methodFilter === 'all' || p.method === methodFilter;

      return matchSearch && matchMethod;
    });
  }, [userPayments, searchQuery, methodFilter]);

  // Aggregate stats
  const totalSpentARS = useMemo(() => {
    return userPayments.reduce((acc, curr) => acc + curr.amountARS, 0);
  }, [userPayments]);

  const handleDownloadDirectPDF = (payment: Payment, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDownloadingId(payment.id);

    try {
      const plan = getPlanById(payment.planId);
      generatePaymentReceiptPDF({
        payment,
        member: currentUser,
        plan,
        branch: currentBranch
      });
    } catch (err) {
      console.error('Error al generar PDF:', err);
    } finally {
      setTimeout(() => setDownloadingId(null), 800);
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'mercadopago':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            Mercado Pago
          </span>
        );
      case 'transfer':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            Transferencia
          </span>
        );
      case 'debit_card':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            Tarjeta Débito
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Efectivo
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
      
      {/* Header with Title and Renew Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>Historial de Pagos & Comprobantes</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {userPayments.length} emitidos
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Consultá y descargá los recibos oficiales en PDF de tus cuotas y membresías
            </p>
          </div>
        </div>

        <button
          id="btn-member-renew-membership"
          onClick={onOpenPaymentModal}
          className="py-2.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0"
        >
          <CreditCard className="w-4 h-4" />
          <span>Renovar Cuota / Pagar Plan</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div id="card-member-total-spent" className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Abonado en la App
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-white">
              ${totalSpentARS.toLocaleString('es-AR')}
            </span>
            <span className="text-xs text-slate-500 font-semibold">ARS</span>
          </div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>100% de operaciones regularizadas</span>
          </span>
        </div>

        <div id="card-member-vouchers-count" className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Comprobantes Disponibles
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-emerald-400">
              {userPayments.length}
            </span>
            <span className="text-xs text-slate-400">recibos en PDF</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">
            Listos para descargar o imprimir
          </span>
        </div>

        <div id="card-member-current-plan-status" className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Membresía Vigente
          </span>
          <div className="mt-2">
            <p className="text-sm font-extrabold text-white truncate">
              {currentPlan?.name.split('(')[0] || 'Sin plan activo'}
            </p>
            <p className="text-[11px] text-emerald-400 mt-0.5">
              {currentMembership
                ? `Vence el ${new Date(currentMembership.endDate).toLocaleDateString('es-AR')}`
                : 'Pendiente de suscripción'}
            </p>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 truncate">
            {currentBranch.name}
          </span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      {userPayments.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-payments"
              type="text"
              placeholder="Buscar por plan, TRX o monto..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              id="btn-filter-method-all"
              onClick={() => setMethodFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors shrink-0 ${
                methodFilter === 'all'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              id="btn-filter-method-mp"
              onClick={() => setMethodFilter('mercadopago')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors shrink-0 ${
                methodFilter === 'mercadopago'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Mercado Pago
            </button>
            <button
              id="btn-filter-method-transfer"
              onClick={() => setMethodFilter('transfer')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors shrink-0 ${
                methodFilter === 'transfer'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Transferencia
            </button>
          </div>
        </div>
      )}

      {/* Payments List */}
      {filteredPayments.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              {searchQuery ? 'No se encontraron pagos con ese criterio' : 'Aún no registrás pagos en la plataforma'}
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {searchQuery
                ? 'Intentá buscar por otro término o limpiar los filtros aplicados.'
                : 'Al abonar tu cuota mensual o pase de entrenamiento, verás reflejados tus recibos oficiales y podrás descargarlos en PDF cuando lo desees.'}
            </p>
          </div>
          {!searchQuery && (
            <button
              onClick={onOpenPaymentModal}
              className="mt-2 py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Abonar Mi Primera Cuota</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPayments.map(payment => {
            const pDate = new Date(payment.paymentDate);
            const dateStr = pDate.toLocaleDateString('es-AR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            });
            const timeStr = pDate.toLocaleTimeString('es-AR', {
              hour: '2-digit',
              minute: '2-digit'
            });

            const isDownloading = downloadingId === payment.id;

            return (
              <div
                id={`card-payment-item-${payment.id}`}
                key={payment.id}
                onClick={() => setSelectedPaymentForModal(payment)}
                className="group p-4 rounded-2xl bg-slate-950/60 hover:bg-slate-950/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
              >
                {/* Left side: Icon + Details */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700 group-hover:border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-extrabold text-white group-hover:text-emerald-300 transition-colors">
                        {payment.planName}
                      </h4>
                      {getMethodBadge(payment.method)}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
                        Aprobado
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{dateStr} a las {timeStr} hs</span>
                      </span>
                      <span>•</span>
                      <span className="font-mono text-slate-400 text-[10px]">
                        TRX: {payment.transactionId}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side: Amount + Download/View Buttons */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                  <div className="sm:text-right">
                    <span className="text-base sm:text-lg font-black text-white">
                      ${payment.amountARS.toLocaleString('es-AR')}
                    </span>
                    <span className="text-xs text-slate-400 font-normal ml-1">ARS</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Direct Download Button */}
                    <button
                      id={`btn-download-pdf-${payment.id}`}
                      onClick={e => handleDownloadDirectPDF(payment, e)}
                      disabled={isDownloading}
                      className="py-1.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-1.5 transition-colors active:scale-95 disabled:opacity-50"
                      title="Descargar comprobante en formato PDF"
                    >
                      <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
                      <span>{isDownloading ? 'Generando...' : 'Descargar PDF'}</span>
                    </button>

                    {/* View Details Button */}
                    <button
                      id={`btn-view-receipt-${payment.id}`}
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedPaymentForModal(payment);
                      }}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Ver detalle del comprobante"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Official Receipt Modal */}
      {selectedPaymentForModal && (
        <PaymentReceiptModal
          payment={selectedPaymentForModal}
          member={currentUser}
          plan={getPlanById(selectedPaymentForModal.planId)}
          branch={currentBranch}
          isOpen={Boolean(selectedPaymentForModal)}
          onClose={() => setSelectedPaymentForModal(null)}
        />
      )}

    </div>
  );
};

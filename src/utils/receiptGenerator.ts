import { jsPDF } from 'jspdf';
import { Payment, User, SubscriptionPlan, GymBranch } from '../types';

interface ReceiptOptions {
  payment: Payment;
  member: User;
  plan?: SubscriptionPlan | null;
  branch?: GymBranch | null;
}

export function generatePaymentReceiptPDF({
  payment,
  member,
  plan,
  branch
}: ReceiptOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [16, 185, 129]; // Emerald 500
  const darkSlate = [15, 23, 42]; // Slate 900
  const midSlate = [71, 85, 105]; // Slate 600
  const lightBg = [248, 250, 252]; // Slate 50

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // Header Banner Background
  doc.setFillColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Emerald Accent Line
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 42, pageWidth, 2.5, 'F');

  // Brand Name & Tagline
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('FUERZAFIT', margin, 20);

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('LATAM', margin + 46, 20);

  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.setFont('helvetica', 'normal');
  doc.text('Red de Centros de Entrenamiento & Salud Integral', margin, 27);
  doc.text('CUIT: 30-71894231-8 | IVA Responsable Inscripto', margin, 32);

  // Voucher Box (Top Right)
  const voucherBoxWidth = 60;
  const voucherBoxX = pageWidth - margin - voucherBoxWidth;

  doc.setFillColor(30, 41, 59); // Slate 800
  doc.roundedRect(voucherBoxX, 10, voucherBoxWidth, 24, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('RECIBO DE PAGO', voucherBoxX + voucherBoxWidth / 2, 17, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  const receiptNumber = `Nº 0001-${payment.transactionId.replace(/\D/g, '').slice(-8).padStart(8, '0')}`;
  doc.text(receiptNumber, voucherBoxX + voucherBoxWidth / 2, 23, { align: 'center' });

  doc.setTextColor(203, 213, 225); // Slate 300
  doc.setFontSize(7.5);
  const paymentDate = new Date(payment.paymentDate);
  const dateFormatted = paymentDate.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  doc.text(`Fecha: ${dateFormatted}`, voucherBoxX + voucherBoxWidth / 2, 29, { align: 'center' });

  // -------------------------------------------------------------
  // Socio / Cliente Data
  // -------------------------------------------------------------
  let currentY = 56;

  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(margin, currentY, contentWidth, 34, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(margin, currentY, contentWidth, 34, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('DATOS DEL TITULAR / SOCIO', margin + 6, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(midSlate[0], midSlate[1], midSlate[2]);

  const col1X = margin + 6;
  const col2X = margin + contentWidth / 2 + 4;

  doc.text(`Nombre y Apellido:`, col1X, currentY + 15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(`${member.name}`, col1X + 34, currentY + 15);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(midSlate[0], midSlate[1], midSlate[2]);
  doc.text(`Correo Electrónico:`, col1X, currentY + 22);
  doc.text(`${member.email}`, col1X + 34, currentY + 22);

  doc.text(`Documento (DNI):`, col1X, currentY + 29);
  doc.text(`${member.dni || 'Sin registrar'}`, col1X + 34, currentY + 29);

  // Column 2
  doc.text(`Sede Asignada:`, col2X, currentY + 15);
  doc.text(`${branch?.name || 'Sede Central'}`, col2X + 28, currentY + 15);

  doc.text(`ID Socio:`, col2X, currentY + 22);
  doc.text(`${member.id}`, col2X + 28, currentY + 22);

  doc.text(`Condición IVA:`, col2X, currentY + 29);
  doc.text(`Consumidor Final`, col2X + 28, currentY + 29);

  // -------------------------------------------------------------
  // Detalle de la Transacción / Plan
  // -------------------------------------------------------------
  currentY += 42;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('DETALLE DEL CONCEPTO FACTURADO', margin, currentY);

  currentY += 4;

  // Table Header
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(margin, currentY, contentWidth, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DESCRIPCIÓN / SERVICIO', margin + 4, currentY + 5.5);
  doc.text('MÉTODO DE PAGO', margin + 95, currentY + 5.5);
  doc.text('ESTADO', margin + 130, currentY + 5.5);
  doc.text('TOTAL', pageWidth - margin - 6, currentY + 5.5, { align: 'right' });

  // Table Row
  currentY += 8;
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, currentY, contentWidth, 22, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, currentY, contentWidth, 22, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(payment.planName || plan?.name || 'Membresía Gimnasio', margin + 4, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(midSlate[0], midSlate[1], midSlate[2]);
  const planSub = plan?.description || 'Acceso a salas de musculación, cardio y clases grupales según plan.';
  const truncatedSub = planSub.length > 55 ? planSub.substring(0, 52) + '...' : planSub;
  doc.text(truncatedSub, margin + 4, currentY + 12);
  doc.text(`TRX: ${payment.transactionId}`, margin + 4, currentY + 17);

  // Method
  doc.setFontSize(8.5);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  const methodLabel = payment.method === 'mercadopago' 
    ? 'Mercado Pago'
    : payment.method === 'transfer'
    ? 'Transferencia'
    : payment.method === 'debit_card'
    ? 'Tarjeta Débito'
    : 'Efectivo / Caja';
  doc.text(methodLabel, margin + 95, currentY + 10);

  // Status Badge
  doc.setFillColor(209, 250, 229); // Emerald 100
  doc.roundedRect(margin + 128, currentY + 5, 20, 6, 1.5, 1.5, 'F');
  doc.setTextColor(5, 150, 105); // Emerald 600
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('APROBADO', margin + 138, currentY + 9.2, { align: 'center' });

  // Amount
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  const formattedTotal = `$${payment.amountARS.toLocaleString('es-AR')} ARS`;
  doc.text(formattedTotal, pageWidth - margin - 6, currentY + 10, { align: 'right' });

  // -------------------------------------------------------------
  // Summary & Totals Block
  // -------------------------------------------------------------
  currentY += 28;

  const totalsBoxWidth = 85;
  const totalsBoxX = pageWidth - margin - totalsBoxWidth;

  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(totalsBoxX, currentY, totalsBoxWidth, 34, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(totalsBoxX, currentY, totalsBoxWidth, 34, 2, 2, 'S');

  const discountVal = Number(payment.discountARS) || 0;
  const grossTotal = discountVal > 0 ? payment.amountARS + discountVal : payment.amountARS;
  const grossFormatted = `$${grossTotal.toLocaleString('es-AR')} ARS`;
  const discountFormatted = discountVal > 0 ? `-$${discountVal.toLocaleString('es-AR')} ARS` : '$0,00 ARS';

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(midSlate[0], midSlate[1], midSlate[2]);
  doc.text('Subtotal:', totalsBoxX + 6, currentY + 8);
  doc.text(discountVal > 0 ? grossFormatted : formattedTotal, totalsBoxX + totalsBoxWidth - 6, currentY + 8, { align: 'right' });

  doc.text('Bonificaciones / Descuentos:', totalsBoxX + 6, currentY + 15);
  doc.text(discountFormatted, totalsBoxX + totalsBoxWidth - 6, currentY + 15, { align: 'right' });
  if (discountVal > 0 && payment.discountReason) {
    doc.setFontSize(6.5);
    doc.setTextColor(5, 150, 105);
    doc.text(`(${payment.discountReason})`, totalsBoxX + totalsBoxWidth - 6, currentY + 18.5, { align: 'right' });
  }

  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(totalsBoxX, currentY + 20, totalsBoxWidth, 0.5, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('TOTAL ABONADO:', totalsBoxX + 6, currentY + 28);
  doc.setTextColor(5, 150, 105);
  doc.text(formattedTotal, totalsBoxX + totalsBoxWidth - 6, currentY + 28, { align: 'right' });

  // Left Note / Security Stamp Box
  const notesWidth = contentWidth - totalsBoxWidth - 8;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, notesWidth, 34, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, notesWidth, 34, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('COMPROBANTE ELECTRÓNICO OFICIAL', margin + 5, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(midSlate[0], midSlate[1], midSlate[2]);
  doc.text('• Este comprobante certifica la acreditación efectiva del arancel.', margin + 5, currentY + 13);
  doc.text('• Habilita el pase por molinete mediante el código QR de la App.', margin + 5, currentY + 18);
  doc.text(`• Identificador Único: ${payment.idempotencyKey || payment.transactionId}`, margin + 5, currentY + 23);
  doc.text('• Válido como constancia de pago y seguro de responsabilidad civil.', margin + 5, currentY + 28);

  // -------------------------------------------------------------
  // Footer
  // -------------------------------------------------------------
  const footerY = 265;

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text('FUERZAFIT LATAM S.A. - Todos los derechos reservados.', margin, footerY + 6);
  doc.text('Atención al Socio: contacto@fuerzafit.com | WhatsApp: +54 9 11 5500-1122', margin, footerY + 10);
  doc.text(
    `Documento generado el ${new Date().toLocaleString('es-AR')}`,
    pageWidth - margin,
    footerY + 6,
    { align: 'right' }
  );

  // Save the PDF
  const filename = `Comprobante-FuerzaFit-${payment.transactionId.replace(/\s+/g, '-')}.pdf`;
  doc.save(filename);
}

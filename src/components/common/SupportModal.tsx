import React from 'react';
import { X, MessageCircle, Mail, Ticket, HelpCircle, Phone, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="font-black text-white flex items-center gap-2"><HelpCircle className="w-5 h-5 text-emerald-400"/> Centro de Ayuda</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href="https://wa.me/5491155001122?text=Hola%20FuerzaFit%20necesito%20ayuda" target="_blank" rel="noreferrer" className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 text-left">
            <MessageCircle className="w-6 h-6 text-emerald-400 mb-2"/>
            <p className="font-bold text-white text-sm">WhatsApp</p>
            <p className="text-xs text-slate-400">Respuesta en &lt; 2h. Lunes a Sábado 8-20h.</p>
            <p className="text-xs text-emerald-400 mt-1">+54 9 11 5500-1122 →</p>
          </a>
          <a href="mailto:soporte@fuerzafit.com" className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/15 text-left">
            <Mail className="w-6 h-6 text-sky-400 mb-2"/>
            <p className="font-bold text-white text-sm">Email</p>
            <p className="text-xs text-slate-400">soporte@fuerzafit.com</p>
            <p className="text-xs text-sky-400 mt-1">24h hábiles →</p>
          </a>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 space-y-2">
          <h3 className="font-bold text-white text-sm flex items-center gap-2"><Ticket className="w-4 h-4 text-amber-400"/> Tickets</h3>
          <p className="text-xs text-slate-400">Si ya tenés cuenta, creá un ticket desde tu panel (Maestro → Soporte) y te respondemos con prioridad. Queda registro en tu gimnasio.</p>
          <button onClick={onClose} className="w-full py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white">Entendido</button>
        </div>

        <div className="space-y-2">
          <h3 className="font-bold text-white text-sm">Preguntas frecuentes</h3>
          <details className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-xs">
            <summary className="font-bold text-white cursor-pointer">Olvidé mi contraseña</summary>
            <p className="text-slate-400 mt-1">Tocá “Olvidé mi contraseña” en el login, ingresá tu email y te enviamos un link para restablecerla. Revisá spam.</p>
          </details>
          <details className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-xs">
            <summary className="font-bold text-white cursor-pointer">No me llega el código OTP</summary>
            <p className="text-slate-400 mt-1">En demo usá 123456. Con Supabase real revisá que el email no esté en spam y que el dominio esté verificado.</p>
          </details>
          <details className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-xs">
            <summary className="font-bold text-white cursor-pointer">Recuperar cuenta bloqueada</summary>
            <p className="text-slate-400 mt-1">Si tu gimnasio está en mora o suspendido, contactá a tu admin o a soporte maestro. No intentes crear otra cuenta con el mismo email.</p>
          </details>
          <details className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-xs">
            <summary className="font-bold text-white cursor-pointer">Contacto comercial</summary>
            <p className="text-slate-400 mt-1">¿Querés contratar FuerzaFit para tu gimnasio? Escribí a <a href="mailto:ventas@fuerzafit.com" className="text-emerald-400">ventas@fuerzafit.com</a></p>
          </details>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
          <span className="text-slate-500">FuerzaFit v1.0 · Soporte LATAM</span>
          <a href="https://mariangallicchio.github.io/FuerzaFit/" target="_blank" className="text-emerald-400 flex items-center gap-1">Ver presentación <ExternalLink className="w-3 h-3"/></a>
        </div>
      </motion.div>
    </div>
  );
};

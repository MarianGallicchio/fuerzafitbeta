import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import {
  FileCheck,
  Phone,
  Mail,
  HeartPulse,
  Save,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';

interface MemberProfileViewProps {
  onOpenPayment?: () => void;
}

export const MemberProfileView: React.FC<MemberProfileViewProps> = () => {
  const { currentUser, updateMember, getMembershipForUser, getPlanById } = useGym();

  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [emergencyName, setEmergencyName] = useState(currentUser?.emergencyContact?.name || '');
  const [emergencyPhone, setEmergencyPhone] = useState(currentUser?.emergencyContact?.phone || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!currentUser) return null;

  const membership = getMembershipForUser(currentUser.id);
  const plan = membership ? getPlanById(membership.planId) : null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMember(currentUser.id, {
      name,
      email,
      phone,
      emergencyContact: {
        name: emergencyName,
        phone: emergencyPhone,
        relationship: 'Contacto Designado'
      }
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Profile Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center gap-6">
        <img
          src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'}
          alt={currentUser.name}
          className="w-24 h-24 rounded-full object-cover ring-4 ring-emerald-500/30 shadow-xl"
        />
        <div className="text-center sm:text-left space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-black text-white">{currentUser.name}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Socio Activo
            </span>
          </div>
          <p className="text-xs text-slate-400">Plan: <strong className="text-slate-200">{plan?.name || 'Membresía Activa'}</strong></p>
          <p className="text-xs text-slate-400">Miembro desde: {new Date(currentUser.createdAt).toLocaleDateString('es-AR')}</p>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 text-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h2 className="text-base font-extrabold text-white">Datos Personales & Contacto</h2>
          {savedSuccess && (
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Datos actualizados
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 font-bold mb-1">Nombre y Apellido</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Teléfono Móvil (WhatsApp)</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Fecha de Nacimiento</label>
            <input
              type="date"
              defaultValue={currentUser.birthDate || '1996-05-14'}
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Medical & Emergency Section */}
        <div className="pt-4 border-t border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-rose-400" />
            <span>Ficha Médica & Contacto de Emergencia</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Contacto de Emergencia (Nombre)</label>
              <input
                type="text"
                value={emergencyName}
                onChange={e => setEmergencyName(e.target.value)}
                placeholder="Ej: Camila Rodríguez (Hermana)"
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Teléfono de Emergencia</label>
              <input
                type="text"
                value={emergencyPhone}
                onChange={e => setEmergencyPhone(e.target.value)}
                placeholder="+54 9 11 4411-2233"
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Apto Físico Status */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-white">Certificado de Apto Físico Obligatorio (Ley CABA)</p>
                <p className="text-[11px] text-slate-400">
                  {currentUser.medicalClearance ? `Vigente hasta el ${currentUser.medicalClearanceExpiry || '31/12/2026'}` : 'Pendiente de presentación'}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400">
              Aprobado
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="py-3 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Cambios</span>
          </button>
        </div>
      </form>

      {/* Nota: historial y comprobantes de pago se gestionan en recepción/administración */}

    </div>
  );
};

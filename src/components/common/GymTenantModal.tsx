import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { Building2, Plus, Check, ShieldCheck, ArrowRight, X, AlertCircle } from 'lucide-react';
import { GymTenant } from '../../types';

interface GymTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GymTenantModal: React.FC<GymTenantModalProps> = ({ isOpen, onClose }) => {
  const { currentGym, allGyms, switchGym, createNewGym } = useGym();
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New gym form
  const [gymName, setGymName] = useState('');
  const [slug, setSlug] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setGymName(val);
    if (!isCreating) return;
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    setSlug(generatedSlug);
  };

  const handleCreateGym = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gymName.trim() || !slug.trim()) {
      setErrorMsg('Por favor ingresá el nombre y slug del gimnasio.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const res = await createNewGym({
      name: gymName.trim(),
      slug: slug.trim(),
      contactEmail: contactEmail.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      initialBranchName: branchName.trim() || undefined,
      initialBranchAddress: branchAddress.trim() || undefined
    });

    setLoading(false);

    if (res.success && res.gym) {
      await switchGym(res.gym.id);
      setIsCreating(false);
      onClose();
    } else {
      setErrorMsg(res.error || 'No se pudo crear el gimnasio.');
    }
  };

  const handleSelectGym = async (gym: GymTenant) => {
    setLoading(true);
    await switchGym(gym.id);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#0d1322] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isCreating ? 'Dar de alta nuevo Gimnasio' : 'Gimnasios (Multi-Tenant)'}
              </h2>
              <p className="text-xs text-slate-400">
                {isCreating ? 'Configurá la nueva cuenta y su sede inicial' : 'Seleccioná el gimnasio activo o creá uno nuevo'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!isCreating ? (
          <div className="space-y-4">
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {allGyms.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
                  No hay otros gimnasios registrados aún.
                </div>
              ) : (
                allGyms.map(gym => {
                  const isCurrent = currentGym?.id === gym.id;
                  return (
                    <div
                      key={gym.id}
                      onClick={() => handleSelectGym(gym)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                          : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{gym.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-400">
                            {gym.slug}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{gym.contactEmail || 'Sin email registrado'}</p>
                      </div>

                      {isCurrent ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                          <Check className="w-4 h-4" />
                          Activo
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 group-hover:text-white flex items-center gap-1">
                          Cambiar <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-400">
                Tenant actual: <strong className="text-white">{currentGym?.name || 'FuerzaFit Gym'}</strong>
              </span>
              <button
                onClick={() => {
                  setIsCreating(true);
                  setErrorMsg(null);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Crear Nuevo Gimnasio
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateGym} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Nombre del Gimnasio *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Iron Gym Belgrano"
                  value={gymName}
                  onChange={e => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Slug (Identificador único) *</label>
                <input
                  type="text"
                  required
                  placeholder="iron-gym-belgrano"
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Email de Contacto</label>
                <input
                  type="email"
                  placeholder="admin@irongym.com"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  placeholder="+54 9 11 1234-5678"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Nombre de Sede Inicial</label>
                <input
                  type="text"
                  placeholder="Sede Central Belgrano"
                  value={branchName}
                  onChange={e => setBranchName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Dirección de Sede</label>
                <input
                  type="text"
                  placeholder="Av. Cabildo 2400"
                  value={branchAddress}
                  onChange={e => setBranchAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear y Habilitar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

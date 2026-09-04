import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { UserRole } from '../../types';
import { Users, UserPlus, Shield, Briefcase, GraduationCap, Trash2, Mail, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const AdminStaffView: React.FC = () => {
  const { users, createStaff, deleteMember, branches, selectedBranchId } = useGym();
  const staff = users.filter(u => ['reception', 'trainer', 'admin'].includes(u.role));

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('reception');
  const [branchId, setBranchId] = useState(selectedBranchId);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) { setFeedback({ text: 'Nombre y email son obligatorios.', type: 'error' }); return; }
    setIsLoading(true);
    try {
      const res = await createStaff({ name, email, phone: phone || '+54 9 11 0000-0000', role, branchId });
      if (res.success) {
        setFeedback({ text: `Empleado ${name} (${role}) creado. Temp: ${res.tempPassword} — Ingresa por /admin`, type: 'success' });
        setName(''); setEmail(''); setPhone('');
        setShowCreate(false);
      } else {
        setFeedback({ text: res.message || 'Error', type: 'error' });
      }
    } catch (err: any) {
      setFeedback({ text: err.message || 'Error al crear empleado', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (r: string) => {
    switch(r) {
      case 'admin': return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'reception': return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
      case 'trainer': return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  const getRoleDesc = (r: string) => {
    switch(r) {
      case 'admin': return 'Acceso total';
      case 'reception': return 'Solo socios, caja y accesos';
      case 'trainer': return 'Solo rutinas y clases';
      default: return '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-black text-white flex items-center gap-2"><Briefcase className="w-5 h-5 text-violet-400"/> Equipo del Gimnasio</h1>
          <p className="text-xs text-slate-400">Crea cuentas para empleados con accesos limitados a lo básico de sus tareas.</p>
        </div>
        <button onClick={()=>setShowCreate(true)} className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black flex items-center gap-2">
          <UserPlus className="w-4 h-4"/> Nuevo empleado
        </button>
      </div>

      {feedback && (
        <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${feedback.type==='error'?'bg-rose-500/15 border border-rose-500/30 text-rose-300':'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'}`}>
          {feedback.type==='error'?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>}<span>{feedback.text}</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="p-3">Empleado</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Accesos</th>
                <th className="p-3">Sede</th>
                <th className="p-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {staff.map(u => (
                <tr key={u.id} className="hover:bg-slate-800/30">
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <img src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'} alt={u.name} className="w-8 h-8 rounded-full object-cover"/>
                      <div>
                        <p className="font-bold text-white">{u.name}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1"><Mail className="w-3 h-3"/>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getRoleBadge(u.role)}`}>{u.role}</span></td>
                  <td className="p-3 text-slate-300">{getRoleDesc(u.role)}</td>
                  <td className="p-3 text-slate-400">{branches.find(b=>b.id===u.branchId)?.name || u.branchId}</td>
                  <td className="p-3 text-right">
                    <button onClick={()=>{ if(confirm(`Eliminar a ${u.name}?`)) deleteMember(u.id); }} className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </td>
                </tr>
              ))}
              {staff.length===0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">Aún no hay empleados. Creá el primero.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-slate-800 bg-slate-950/30 text-[11px] text-slate-500 space-y-1">
          <p><span className="font-bold text-sky-300">Recepción:</span> ve solo Padrón, Caja y Molinete. No ve Planes, Reportes ni Rutinas.</p>
          <p><span className="font-bold text-emerald-300">Entrenador:</span> ve solo Rutinas y Clases. No ve Caja ni Reportes.</p>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <h2 className="font-black text-white flex items-center gap-2"><UserPlus className="w-5 h-5 text-violet-400"/> Nuevo empleado</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nombre completo *</label>
                <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Ej: Laura Gómez" className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email *</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="laura@gym.com" className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Teléfono</label>
                <input type="text" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+54 9 11 ..." className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Rol *</label>
                  <select value={role} onChange={e=>setRole(e.target.value as UserRole)} className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs">
                    <option value="reception">Recepción</option>
                    <option value="trainer">Entrenador</option>
                    <option value="admin">Admin (total)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Sede</label>
                  <select value={branchId} onChange={e=>setBranchId(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs">
                    {branches.map(b=> <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-[11px] text-slate-400">
                {role==='reception' && <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-sky-400"/> Recepción: acceso a Socios, Caja y Molinete</span>}
                {role==='trainer' && <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3 text-emerald-400"/> Entrenador: acceso a Rutinas y Clases</span>}
                {role==='admin' && <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-amber-400"/> Admin: acceso total</span>}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={()=>setShowCreate(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold">Cancelar</button>
                <button type="submit" disabled={isLoading} className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black disabled:opacity-50">{isLoading?'Creando...':'Crear cuenta'}</button>
              </div>
              <p className="text-[11px] text-slate-500 text-center">Se crea con clave temporal y se envía por email. Ingresa por <span className="font-mono text-slate-300">/admin</span></p>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

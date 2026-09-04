import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { GroupClass, ClassCategory } from '../../types';
import {
  Calendar,
  Plus,
  Users,
  Clock,
  MapPin,
  CheckCircle2,
  Trash2,
  Edit2,
  AlertTriangle,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { motion } from 'motion/react';

export const AdminClassesView: React.FC = () => {
  const { classes, createClass, users, branches, selectedBranchId } = useGym();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedClassForDetails, setSelectedClassForDetails] = useState<GroupClass | null>(null);

  // New Class Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ClassCategory>('CrossFit');
  const [instructorName, setInstructorName] = useState('Coach Marcos Varela');
  const [capacity, setCapacity] = useState<number>(20);
  const [room, setRoom] = useState('Sala Principal de Box');
  const [date, setDate] = useState('Hoy');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('19:00');

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    createClass({
      title,
      category,
      instructorName,
      capacity: Number(capacity),
      room,
      date,
      startTime,
      endTime,
      branchId: selectedBranchId,
      enrolledUserIds: [],
      waitingListUserIds: []
    });

    setShowCreateModal(false);
    setTitle('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/15 text-sky-400 border border-sky-500/30">
              Grilla Semanal
            </span>
            <span className="text-xs text-slate-400">{classes.length} clases programadas</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Programación de Clases Grupales</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestión de profesores, salones, cupos máximos y listas de espera automáticas.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="py-3 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Programar Nueva Clase</span>
        </button>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map(cls => {
          const enrolledMembers = users.filter(u => cls.enrolledUserIds.includes(u.id));
          const availableSpots = cls.capacity - cls.enrolledUserIds.length;
          const isFull = availableSpots <= 0;

          return (
            <div
              key={cls.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    {cls.category}
                  </span>
                  <span className={`text-[11px] font-bold ${isFull ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {cls.enrolledUserIds.length}/{cls.capacity} inscriptos
                  </span>
                </div>

                <h3 className="text-lg font-black text-white mt-2">{cls.title}</h3>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{cls.date} • {cls.startTime} - {cls.endTime} hs</span>
                </p>

                <div className="mt-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Profesor:</span>
                    <span className="font-bold text-white">{cls.instructorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Salón:</span>
                    <span className="text-slate-300">{cls.room}</span>
                  </div>
                </div>

                {/* Enrolled Avatars */}
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <p className="text-[11px] font-bold text-slate-400 mb-2">Socios Inscriptos:</p>
                  {enrolledMembers.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No hay socios inscriptos aún.</p>
                  ) : (
                    <div className="flex items-center -space-x-2 overflow-hidden">
                      {enrolledMembers.slice(0, 5).map(m => (
                        <img
                          key={m.id}
                          src={m.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                          alt={m.name}
                          title={m.name}
                          className="w-7 h-7 rounded-full object-cover ring-2 ring-slate-900"
                        />
                      ))}
                      {enrolledMembers.length > 5 && (
                        <span className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300 flex items-center justify-center">
                          +{enrolledMembers.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedClassForDetails(cls)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold transition-colors"
                >
                  Ver Lista de Asistencia
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Modal: Create Class */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 my-8 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white">Programar Nueva Clase Grupal</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-bold mb-1">Nombre / Título de la Clase</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: CrossFit WOD Intensivo"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Disciplina</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as ClassCategory)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  >
                    <option value="CrossFit">CrossFit</option>
                    <option value="Spinning">Spinning</option>
                    <option value="Funcional">Funcional</option>
                    <option value="Yoga">Yoga</option>
                    <option value="Pilates">Pilates</option>
                    <option value="HIIT">HIIT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Profesor / Instructor</label>
                  <input
                    type="text"
                    required
                    value={instructorName}
                    onChange={e => setInstructorName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Cupo Máximo (Socios)</label>
                  <input
                    type="number"
                    required
                    value={capacity}
                    onChange={e => setCapacity(parseInt(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Salón / Espacio</label>
                  <input
                    type="text"
                    required
                    value={room}
                    onChange={e => setRoom(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Día</label>
                  <input
                    type="text"
                    placeholder="Hoy, Mañana, Lunes..."
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Horario (Inicio - Fin)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="18:00"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="w-1/2 p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    />
                    <input
                      type="text"
                      placeholder="19:00"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className="w-1/2 p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20"
                >
                  Programar Clase
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal: Class Attendance Sheet */}
      {selectedClassForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-white">{selectedClassForDetails.title}</h3>
                <p className="text-slate-400">{selectedClassForDetails.date} • {selectedClassForDetails.startTime} hs</p>
              </div>
              <button onClick={() => setSelectedClassForDetails(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-slate-300">
                Inscriptos ({selectedClassForDetails.enrolledUserIds.length}/{selectedClassForDetails.capacity}):
              </p>
              
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {users
                  .filter(u => selectedClassForDetails.enrolledUserIds.includes(u.id))
                  .map(member => (
                    <div
                      key={member.id}
                      className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={member.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                          alt={member.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-bold text-white">{member.name}</p>
                          <p className="text-[10px] text-slate-400">{member.phone}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
                        Presente ✓
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedClassForDetails(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};

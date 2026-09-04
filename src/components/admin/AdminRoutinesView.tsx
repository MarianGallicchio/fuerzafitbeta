import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { Routine, RoutineDay, RoutineBlock, RoutineExercise, MuscleGroup, FitnessGoal, ExperienceLevel, User } from '../../types';
import {
  Dumbbell,
  Plus,
  Trash2,
  Edit2,
  Users,
  Video,
  Clock,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Layers,
  Save,
  Search,
  UserX,
  UserCheck,
  AlertTriangle,
  ArrowRight,
  Check,
  X
} from 'lucide-react';
import { motion } from 'motion/react';

export const AdminRoutinesView: React.FC = () => {
  const { routines, createRoutine, updateRoutine, users, assignRoutineToUsers, branches } = useGym();

  const [activeView, setActiveView] = useState<'routines' | 'unassigned_members'>('routines');
  const [selectedRoutine, setSelectedRoutine] = useState<Routine>(routines[0]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUserIdsForAssign, setSelectedUserIdsForAssign] = useState<string[]>([]);

  // Direct quick assignment modal for unassigned members
  const [quickAssignMember, setQuickAssignMember] = useState<User | null>(null);
  const [quickAssignRoutineId, setQuickAssignRoutineId] = useState<string>(routines[0]?.id || '');
  const [unassignedSearchQuery, setUnassignedSearchQuery] = useState('');

  // Routine Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState<FitnessGoal>('hipertrofia');
  const [level, setLevel] = useState<ExperienceLevel>('intermedio');
  const [preassignedMemberId, setPreassignedMemberId] = useState<string | null>(null);

  // Days in creation
  const [routineDays, setRoutineDays] = useState<RoutineDay[]>([
    {
      id: 'day-1',
      name: 'Día 1: Torso y Empuje',
      dayOfWeek: 'Lunes',
      blocks: [
        {
          id: 'blk-1',
          name: 'Fuerza Principal',
          order: 1,
          exercises: [
            {
              id: 'ex-1',
              exerciseId: 'lib-1',
              name: 'Press de Banca Plano con Barra',
              muscleGroup: 'pecho',
              targetSets: 4,
              targetReps: '8-10',
              restSeconds: 90,
              weightKgSuggested: 60,
              videoUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80',
              instructions: 'Retracción escapular, barra al esternón medio.'
            }
          ]
        }
      ]
    }
  ]);

  const members = users.filter(u => u.role === 'member');

  // Socios sin rutina asignada
  const membersWithoutRoutine = members.filter(m => {
    return !routines.some(r => r.assignedUserIds.includes(m.id));
  });

  const filteredUnassignedMembers = membersWithoutRoutine.filter(m => {
    const q = unassignedSearchQuery.toLowerCase();
    return m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.dni && m.dni.includes(q));
  });

  const handleStartCustomRoutineForMember = (member: User) => {
    setTitle(`Rutina Personalizada - ${member.name}`);
    setDescription(`Plan específico de adaptación y objetivos para ${member.name}.`);
    setPreassignedMemberId(member.id);
    setShowCreateModal(true);
  };

  const handleExecuteQuickAssign = () => {
    if (!quickAssignMember || !quickAssignRoutineId) return;
    assignRoutineToUsers(quickAssignRoutineId, [quickAssignMember.id]);
    setQuickAssignMember(null);
  };


  const handleAddDay = () => {
    const nextIdx = routineDays.length + 1;
    setRoutineDays([
      ...routineDays,
      {
        id: `day-${Date.now()}`,
        name: `Día ${nextIdx}: Nuevo Bloque`,
        dayOfWeek: `Día ${nextIdx}`,
        blocks: [
          {
            id: `blk-${Date.now()}`,
            name: 'Bloque Principal',
            order: 1,
            exercises: []
          }
        ]
      }
    ]);
  };

  const handleAddExerciseToDay = (dayIndex: number, blockIndex: number) => {
    const newDays = [...routineDays];
    newDays[dayIndex].blocks[blockIndex].exercises.push({
      id: `ex-${Date.now()}`,
      exerciseId: `lib-${Date.now()}`,
      name: 'Nuevo Ejercicio',
      muscleGroup: 'pecho',
      targetSets: 3,
      targetReps: '10-12',
      restSeconds: 60,
      weightKgSuggested: 20,
      instructions: 'Ejecución controlada con buena técnica.'
    });
    setRoutineDays(newDays);
  };

  const handleSaveRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    createRoutine({
      title,
      description,
      creatorName: 'Head Coach Admin',
      goal,
      level,
      days: routineDays,
      assignedUserIds: preassignedMemberId ? [preassignedMemberId] : []
    });

    setShowCreateModal(false);
    setTitle('');
    setDescription('');
    setPreassignedMemberId(null);
  };

  const handleSaveAssignments = () => {
    if (!selectedRoutine) return;
    assignRoutineToUsers(selectedRoutine.id, selectedUserIdsForAssign);
    setShowAssignModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
              Constructor de Entrenamientos
            </span>
            <span className="text-xs text-slate-400">{routines.length} programas diseñados</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Creador de Rutinas por Bloques</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Armá planes de entrenamiento estructurados con series, repeticiones, descansos y videos demostrativos.
          </p>
        </div>

        <button
          onClick={() => {
            setPreassignedMemberId(null);
            setShowCreateModal(true);
          }}
          className="py-3 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Diseñar Nueva Rutina</span>
        </button>
      </div>

      {/* View Switcher Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveView('routines')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
            activeView === 'routines'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Catálogo de Rutinas</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            activeView === 'routines' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-300'
          }`}>
            {routines.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('unassigned_members')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
            activeView === 'unassigned_members'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <UserX className="w-4 h-4" />
          <span>Socios sin rutina asignada</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
            membersWithoutRoutine.length > 0
              ? activeView === 'unassigned_members'
                ? 'bg-slate-950 text-amber-300'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-slate-800 text-slate-300'
          }`}>
            {membersWithoutRoutine.length}
          </span>
        </button>
      </div>

      {/* VIEW 1: Socios sin rutina asignada */}
      {activeView === 'unassigned_members' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-white">Socios Pendientes de Rutina</h3>
                <p className="text-xs text-slate-400">
                  Asignales un plan activo en 1 clic o diseñá una rutina personalizada a su medida.
                </p>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={unassignedSearchQuery}
                  onChange={e => setUnassignedSearchQuery(e.target.value)}
                  placeholder="Buscar socio por nombre o DNI..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {filteredUnassignedMembers.length === 0 ? (
              <div className="p-10 text-center border-2 border-dashed border-slate-800 rounded-2xl space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-black text-white">¡Excelente! No hay socios sin rutina</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Todos los socios activos ya tienen al menos un plan de entrenamiento asignado a su perfil.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-950/60 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Socio</th>
                      <th className="py-3 px-4">Contacto</th>
                      <th className="py-3 px-4">Sede</th>
                      <th className="py-3 px-4">Apto Físico</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUnassignedMembers.map(member => {
                      const branch = branches.find(b => b.id === member.branchId);
                      return (
                        <tr key={member.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={member.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                                alt={member.name}
                                className="w-8 h-8 rounded-xl object-cover border border-slate-700"
                              />
                              <div>
                                <p className="font-extrabold text-white text-xs">{member.name}</p>
                                <p className="text-[10px] text-slate-500">DNI: {member.dni || 'S/D'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-slate-300 font-medium">{member.email}</p>
                            <p className="text-[10px] text-slate-500">{member.phone}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-semibold">
                              {branch?.name || 'Sede Principal'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {member.medicalClearance ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                                <Check className="w-3 h-3" /> Apto vigente
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Pendiente
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setQuickAssignMember(member);
                                  setQuickAssignRoutineId(routines[0]?.id || '');
                                }}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-slate-700 font-bold text-xs inline-flex items-center gap-1.5 transition-all"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Asignar Existente</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStartCustomRoutineForMember(member)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 shadow-md shadow-emerald-500/15 transition-all"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Crear Personalizada</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: Routine Showcase & Selector */}
      {activeView === 'routines' && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 4 Cols: Routine Programs List */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          <h3 className="font-extrabold text-sm text-slate-300 uppercase tracking-wider px-1">
            Programas Activos
          </h3>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {routines.map(routine => {
              const isSelected = selectedRoutine?.id === routine.id;
              return (
                <div
                  key={routine.id}
                  onClick={() => setSelectedRoutine(routine)}
                  className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-emerald-500/60 shadow-lg ring-1 ring-emerald-500/30'
                      : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                      {routine.goal}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {routine.assignedUserIds.length} socios asignados
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-sm mt-1">{routine.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{routine.description}</p>
                  
                  <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-700/60 text-[11px] text-slate-400">
                    <span>{routine.days.length} días de rutina</span>
                    <span className="text-emerald-400 font-semibold">{routine.level}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 8 Cols: Selected Routine Details & Day Blocks */}
        {selectedRoutine && (
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            
            {/* Top info and action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-emerald-400">{selectedRoutine.goal.toUpperCase()}</span>
                  <span className="text-xs text-slate-400">• Nivel {selectedRoutine.level}</span>
                </div>
                <h2 className="text-xl font-black text-white">{selectedRoutine.title}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{selectedRoutine.description}</p>
              </div>

              <button
                onClick={() => {
                  setSelectedUserIdsForAssign(selectedRoutine.assignedUserIds || []);
                  setShowAssignModal(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-colors self-start sm:self-auto"
              >
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Asignar a Socios ({selectedRoutine.assignedUserIds.length})</span>
              </button>
            </div>

            {/* Days and Exercises in selected routine */}
            <div className="space-y-6">
              {selectedRoutine.days.map((day, dIdx) => (
                <div key={day.id} className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                      {day.dayOfWeek || `Día ${dIdx + 1}`} — {day.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      {day.blocks.reduce((acc, b) => acc + b.exercises.length, 0)} ejercicios
                    </span>
                  </div>

                  {/* Blocks */}
                  {day.blocks.map((block) => (
                    <div key={block.id} className="space-y-2">
                      <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{block.name}</span>
                      </p>

                      <div className="space-y-2">
                        {block.exercises.map((ex, exIdx) => (
                          <div
                            key={ex.id}
                            className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-5 h-5 rounded-lg bg-slate-800 text-[10px] font-bold text-emerald-400 flex items-center justify-center">
                                {exIdx + 1}
                              </span>
                              <div>
                                <p className="font-extrabold text-white">{ex.name}</p>
                                <p className="text-[10px] text-slate-400">
                                  {ex.targetSets} series x {ex.targetReps} reps • {ex.weightKgSuggested ? `${ex.weightKgSuggested} kg` : 'Libre'} • Descanso {ex.restSeconds}s
                                </p>
                              </div>
                            </div>

                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                              {ex.muscleGroup}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

          </div>
        )}

      </div>
      )}

      {/* Modal: Asignación Rápida a Socio sin Rutina */}
      {quickAssignMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Asignar Rutina Activa</h3>
                  <p className="text-[11px] text-slate-400">Socio: {quickAssignMember.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickAssignMember(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 block">
                Seleccioná el programa a asignar:
              </label>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {routines.map(rt => {
                  const isSelected = quickAssignRoutineId === rt.id;
                  return (
                    <div
                      key={rt.id}
                      onClick={() => setQuickAssignRoutineId(rt.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-800 border-emerald-500 text-white shadow-md'
                          : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs">{rt.title}</span>
                        <span className="px-2 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-900 text-emerald-400">
                          {rt.goal}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{rt.description}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-1.5 border-t border-slate-750">
                        <span>{rt.days.length} días</span>
                        <span className="capitalize text-slate-400">{rt.level}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setQuickAssignMember(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-750 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteQuickAssign}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95"
              >
                Confirmar Asignación
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal: Asignar Rutina a Socios */}
      {showAssignModal && selectedRoutine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white">
                Asignar Rutina "{selectedRoutine.title}" a Socios
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {members.map(member => {
                const isChecked = selectedUserIdsForAssign.includes(member.id);
                return (
                  <label
                    key={member.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-800/40 border-slate-700/50 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedUserIdsForAssign(selectedUserIdsForAssign.filter(id => id !== member.id));
                          } else {
                            setSelectedUserIdsForAssign([...selectedUserIdsForAssign, member.id]);
                          }
                        }}
                        className="rounded text-emerald-500 focus:ring-0"
                      />
                      <div>
                        <p className="font-bold text-white">{member.name}</p>
                        <p className="text-[10px] text-slate-400">{member.email}</p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAssignments}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20"
              >
                Guardar Asignaciones
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal: Diseñar Nueva Rutina */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 my-8 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white">Diseñador de Rutinas Personalizadas</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveRoutine} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-bold mb-1">Título del Programa</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Frecuencia 2 - Hipertrofia & Fuerza"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Objetivo Principal</label>
                  <select
                    value={goal}
                    onChange={e => setGoal(e.target.value as FitnessGoal)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  >
                    <option value="hipertrofia">Hipertrofia Muscular</option>
                    <option value="fuerza">Fuerza Máxima</option>
                    <option value="perdida_grasa">Pérdida de Grasa / Definición</option>
                    <option value="funcional">Funcional & Cross</option>
                    <option value="resistencia">Resistencia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Nivel de Experiencia</label>
                  <select
                    value={level}
                    onChange={e => setLevel(e.target.value as ExperienceLevel)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  >
                    <option value="principiante">Principiante</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="avanzado">Avanzado</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-bold mb-1">Descripción / Recomendaciones</label>
                  <textarea
                    rows={2}
                    placeholder="Calentar 5 min en cinta antes de comenzar..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>
              </div>

              {/* Days Editor */}
              <div className="space-y-4 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-white text-sm">Estructura de Días & Bloques</h4>
                  <button
                    type="button"
                    onClick={handleAddDay}
                    className="py-1 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 text-emerald-400 font-bold text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Día
                  </button>
                </div>

                {routineDays.map((day, dIdx) => (
                  <div key={day.id} className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={day.name}
                        onChange={e => {
                          const newDays = [...routineDays];
                          newDays[dIdx].name = e.target.value;
                          setRoutineDays(newDays);
                        }}
                        className="flex-1 p-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddExerciseToDay(dIdx, 0)}
                        className="py-1.5 px-3 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold"
                      >
                        + Ejercicio
                      </button>
                    </div>

                    {day.blocks[0].exercises.map((ex, exIdx) => (
                      <div key={ex.id} className="grid grid-cols-12 gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800 items-center">
                        <input
                          type="text"
                          placeholder="Nombre ejercicio"
                          value={ex.name}
                          onChange={e => {
                            const newDays = [...routineDays];
                            newDays[dIdx].blocks[0].exercises[exIdx].name = e.target.value;
                            setRoutineDays(newDays);
                          }}
                          className="col-span-4 p-1.5 rounded bg-slate-800 border border-slate-700 text-white text-xs"
                        />
                        <select
                          value={ex.muscleGroup}
                          onChange={e => {
                            const newDays = [...routineDays];
                            newDays[dIdx].blocks[0].exercises[exIdx].muscleGroup = e.target.value as MuscleGroup;
                            setRoutineDays(newDays);
                          }}
                          className="col-span-3 p-1.5 rounded bg-slate-800 border border-slate-700 text-white text-xs"
                        >
                          <option value="pecho">Pecho</option>
                          <option value="espalda">Espalda</option>
                          <option value="piernas">Piernas</option>
                          <option value="hombros">Hombros</option>
                          <option value="brazos">Brazos</option>
                          <option value="core">Core</option>
                        </select>
                        <input
                          type="number"
                          placeholder="Series"
                          value={ex.targetSets}
                          onChange={e => {
                            const newDays = [...routineDays];
                            newDays[dIdx].blocks[0].exercises[exIdx].targetSets = parseInt(e.target.value) || 3;
                            setRoutineDays(newDays);
                          }}
                          className="col-span-2 p-1.5 rounded bg-slate-800 border border-slate-700 text-white text-xs text-center"
                        />
                        <input
                          type="text"
                          placeholder="Reps"
                          value={ex.targetReps}
                          onChange={e => {
                            const newDays = [...routineDays];
                            newDays[dIdx].blocks[0].exercises[exIdx].targetReps = e.target.value;
                            setRoutineDays(newDays);
                          }}
                          className="col-span-2 p-1.5 rounded bg-slate-800 border border-slate-700 text-white text-xs text-center"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newDays = [...routineDays];
                            newDays[dIdx].blocks[0].exercises.splice(exIdx, 1);
                            setRoutineDays(newDays);
                          }}
                          className="col-span-1 text-slate-500 hover:text-rose-400"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
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
                  Guardar & Publicar Rutina
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};

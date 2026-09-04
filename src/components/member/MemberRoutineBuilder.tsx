import React, { useState } from 'react';
import { Routine, RoutineDay, RoutineExercise, MuscleGroup, FitnessGoal, ExperienceLevel } from '../../types';
import { EXERCISE_LIBRARY, ExerciseLibraryItem } from '../../data/exerciseLibrary';
import {
  Dumbbell,
  Plus,
  Trash2,
  Search,
  Check,
  X,
  Clock,
  Sparkles,
  ArrowRight,
  Layers,
  ChevronDown
} from 'lucide-react';

export interface MemberRoutineBuilderProps {
  userId: string;
  userName: string;
  onSave: (routineData: Omit<Routine, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export const MemberRoutineBuilder: React.FC<MemberRoutineBuilderProps> = ({
  userId,
  userName,
  onSave,
  onCancel
}) => {
  const [title, setTitle] = useState('Mi Rutina Personalizada');
  const [goal, setGoal] = useState<FitnessGoal>('hipertrofia');
  const [level, setLevel] = useState<ExperienceLevel>('intermedio');

  // Days in routine
  const [days, setDays] = useState<RoutineDay[]>([
    {
      id: `day-${Date.now()}-1`,
      name: 'Día 1: Empuje (Pecho & Hombros)',
      dayOfWeek: 'Lunes',
      blocks: [
        {
          id: `blk-${Date.now()}-1`,
          name: 'Bloque Principal',
          exercises: [
            {
              id: `ex-${Date.now()}-1`,
              exerciseId: 'lib-bench-press',
              name: 'Press de Banca Plano con Barra',
              muscleGroup: 'pecho',
              targetSets: 4,
              targetReps: '8-10',
              restSeconds: 90,
              weightKgSuggested: 50,
              instructions: 'Retracción escapular, barra al esternón medio.'
            },
            {
              id: `ex-${Date.now()}-2`,
              exerciseId: 'lib-lateral-raises',
              name: 'Elevaciones Laterales con Mancuernas',
              muscleGroup: 'hombros',
              targetSets: 3,
              targetReps: '12-15',
              restSeconds: 60,
              weightKgSuggested: 8,
              instructions: 'Codos ligeramente flexionados.'
            }
          ]
        }
      ]
    },
    {
      id: `day-${Date.now()}-2`,
      name: 'Día 2: Tracción & Piernas',
      dayOfWeek: 'Miércoles',
      blocks: [
        {
          id: `blk-${Date.now()}-2`,
          name: 'Bloque Principal',
          exercises: [
            {
              id: `ex-${Date.now()}-3`,
              exerciseId: 'lib-lat-pulldown',
              name: 'Jalón al Pecho en Polea Alta',
              muscleGroup: 'espalda',
              targetSets: 4,
              targetReps: '10-12',
              restSeconds: 60,
              weightKgSuggested: 40,
              instructions: 'Pecho alto, tracción al mentón.'
            },
            {
              id: `ex-${Date.now()}-4`,
              exerciseId: 'lib-barbell-squat',
              name: 'Sentadilla Trasera con Barra',
              muscleGroup: 'piernas',
              targetSets: 3,
              targetReps: '10',
              restSeconds: 90,
              weightKgSuggested: 50,
              instructions: 'Bajar controlando el peso hasta el paralelo.'
            }
          ]
        }
      ]
    }
  ]);

  const [activeDayIndex, setActiveDayIndex] = useState(0);

  // Exercise picker modal state
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerFilterMuscle, setPickerFilterMuscle] = useState<MuscleGroup | 'all'>('all');

  const currentDay = days[activeDayIndex] || days[0];

  const handleAddDay = () => {
    const nextNum = days.length + 1;
    const newDay: RoutineDay = {
      id: `day-${Date.now()}-${nextNum}`,
      name: `Día ${nextNum}: Entrenamiento General`,
      dayOfWeek: `Día ${nextNum}`,
      blocks: [
        {
          id: `blk-${Date.now()}-${nextNum}`,
          name: 'Bloque Principal',
          exercises: []
        }
      ]
    };
    setDays([...days, newDay]);
    setActiveDayIndex(days.length);
  };

  const handleRemoveDay = (index: number) => {
    if (days.length <= 1) return;
    const updated = days.filter((_, i) => i !== index);
    setDays(updated);
    setActiveDayIndex(Math.max(0, index - 1));
  };

  const handleDayNameChange = (name: string) => {
    const updated = [...days];
    updated[activeDayIndex].name = name;
    setDays(updated);
  };

  const handleAddExerciseFromLibrary = (item: ExerciseLibraryItem) => {
    const updated = [...days];
    const targetBlock = updated[activeDayIndex].blocks[0];

    const newEx: RoutineExercise = {
      id: `ex-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      exerciseId: item.id,
      name: item.name,
      muscleGroup: item.muscleGroup,
      targetSets: item.defaultSets,
      targetReps: item.defaultReps,
      restSeconds: item.defaultRestSeconds,
      weightKgSuggested: item.defaultWeightKg,
      videoUrl: item.videoUrl,
      instructions: item.instructions
    };

    targetBlock.exercises.push(newEx);
    setDays(updated);
    setShowExercisePicker(false);
  };

  const handleUpdateExercise = (exIndex: number, field: keyof RoutineExercise, value: any) => {
    const updated = [...days];
    const exercises = updated[activeDayIndex].blocks[0].exercises;
    exercises[exIndex] = { ...exercises[exIndex], [field]: value };
    setDays(updated);
  };

  const handleRemoveExercise = (exIndex: number) => {
    const updated = [...days];
    updated[activeDayIndex].blocks[0].exercises.splice(exIndex, 1);
    setDays(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: `Plan autogestionado por ${userName} para ${goal}.`,
      creatorName: userName,
      goal,
      level,
      days,
      assignedUserIds: [userId]
    });
  };

  // Filtered exercises for modal
  const filteredLibrary = EXERCISE_LIBRARY.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
      item.muscleGroup.toLowerCase().includes(pickerSearch.toLowerCase());
    const matchesMuscle = pickerFilterMuscle === 'all' || item.muscleGroup === pickerFilterMuscle;
    return matchesSearch && matchesMuscle;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Autogestión de Socio
            </span>
            <span className="text-xs text-slate-400">Mini-Constructor de Rutina</span>
          </div>
          <h2 className="text-xl font-black text-white">Diseñá tu Propia Rutina</h2>
          <p className="text-xs text-slate-400">
            Armá tu cronograma por días agregando ejercicios de la librería con series, cargas y descansos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Guardar y Comenzar a Entrenar</span>
          </button>
        </div>
      </div>

      {/* Routine Metadata Form */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Nombre del Plan</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
            placeholder="Ej: Rutina Torso / Pierna"
            required
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Objetivo</label>
          <select
            value={goal}
            onChange={e => setGoal(e.target.value as FitnessGoal)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
          >
            <option value="hipertrofia">Hipertrofia (Masa Muscular)</option>
            <option value="fuerza">Fuerza Máxima</option>
            <option value="funcional">Funcional & Acondicionamiento</option>
            <option value="perdida_grasa">Pérdida de Grasa & Cardio</option>
            <option value="resistencia">Resistencia Muscular</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Nivel</label>
          <select
            value={level}
            onChange={e => setLevel(e.target.value as ExperienceLevel)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
          >
            <option value="principiante">Principiante</option>
            <option value="intermedio">Intermedio</option>
            <option value="avanzado">Avanzado</option>
          </select>
        </div>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          {days.map((day, idx) => (
            <button
              key={day.id}
              type="button"
              onClick={() => setActiveDayIndex(idx)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                activeDayIndex === idx
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
              }`}
            >
              <span>{day.name.split(':')[0] || `Día ${idx + 1}`}</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] ${activeDayIndex === idx ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-700 text-slate-300'}`}>
                {day.blocks[0].exercises.length} ex
              </span>
            </button>
          ))}

          <button
            type="button"
            onClick={handleAddDay}
            className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-dashed border-slate-700 hover:border-emerald-500/60 text-slate-300 hover:text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Día</span>
          </button>
        </div>

        {days.length > 1 && (
          <button
            type="button"
            onClick={() => handleRemoveDay(activeDayIndex)}
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar este día</span>
          </button>
        )}
      </div>

      {/* Active Day Exercises Section */}
      <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
        
        {/* Day Name Editor */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <label className="text-[11px] text-slate-400 font-bold uppercase block mb-1">Título del Día</label>
            <input
              type="text"
              value={currentDay.name}
              onChange={e => handleDayNameChange(e.target.value)}
              className="w-full max-w-md px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-750 text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
              placeholder="Ej: Día 1: Torso y Empuje"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowExercisePicker(true)}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/15 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Agregar Ejercicio de Librería</span>
          </button>
        </div>

        {/* Exercises List */}
        {currentDay.blocks[0].exercises.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-800 rounded-2xl space-y-3">
            <Dumbbell className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400 font-medium">
              Todavía no agregaste ningún ejercicio para este día.
            </p>
            <button
              type="button"
              onClick={() => setShowExercisePicker(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold inline-flex items-center gap-2 border border-slate-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Explorar Catálogo de Ejercicios</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {currentDay.blocks[0].exercises.map((ex, exIdx) => (
              <div
                key={ex.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Exercise Info */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[11px] flex items-center justify-center">
                      {exIdx + 1}
                    </span>
                    <h4 className="text-xs font-extrabold text-white">{ex.name}</h4>
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-slate-800 text-slate-400">
                      {ex.muscleGroup}
                    </span>
                  </div>
                  {ex.instructions && (
                    <p className="text-[11px] text-slate-400 pl-7 line-clamp-1">{ex.instructions}</p>
                  )}
                </div>

                {/* Parameters Inputs */}
                <div className="flex flex-wrap items-center gap-2.5 pl-7 md:pl-0">
                  <div className="w-16">
                    <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Series</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={ex.targetSets}
                      onChange={e => handleUpdateExercise(exIdx, 'targetSets', parseInt(e.target.value, 10) || 3)}
                      className="w-full px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-center text-xs font-bold text-white"
                    />
                  </div>

                  <div className="w-20">
                    <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Reps</label>
                    <input
                      type="text"
                      value={ex.targetReps}
                      onChange={e => handleUpdateExercise(exIdx, 'targetReps', e.target.value)}
                      className="w-full px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-center text-xs font-bold text-white"
                      placeholder="8-10"
                    />
                  </div>

                  <div className="w-20">
                    <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Peso (kg)</label>
                    <input
                      type="number"
                      min={0}
                      value={ex.weightKgSuggested || 0}
                      onChange={e => handleUpdateExercise(exIdx, 'weightKgSuggested', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-center text-xs font-bold text-emerald-400"
                    />
                  </div>

                  <div className="w-20">
                    <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Pausa</label>
                    <select
                      value={ex.restSeconds}
                      onChange={e => handleUpdateExercise(exIdx, 'restSeconds', parseInt(e.target.value, 10))}
                      className="w-full px-1.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-300"
                    >
                      <option value={45}>45s</option>
                      <option value={60}>60s</option>
                      <option value={75}>75s</option>
                      <option value={90}>90s</option>
                      <option value={120}>120s</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveExercise(exIdx)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors mt-3"
                    title="Quitar ejercicio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Catálogo de Ejercicios</h3>
                  <p className="text-xs text-slate-400">Seleccioná un ejercicio para sumarlo a {currentDay.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExercisePicker(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search and Filters */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={e => setPickerSearch(e.target.value)}
                  placeholder="Buscar por nombre o técnica..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Muscle Chips */}
              <div className="flex flex-wrap gap-1.5">
                {(['all', 'pecho', 'espalda', 'piernas', 'hombros', 'brazos', 'core'] as const).map(group => (
                  <button
                    key={group}
                    type="button"
                    onClick={() => setPickerFilterMuscle(group)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase transition-all ${
                      pickerFilterMuscle === group
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {group === 'all' ? 'Todos' : group}
                  </button>
                ))}
              </div>
            </div>

            {/* Exercises List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-800/60">
              {filteredLibrary.map(item => (
                <div
                  key={item.id}
                  className="pt-2 pb-2 flex items-center justify-between gap-3 hover:bg-slate-800/40 p-2 rounded-xl transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-xs">{item.name}</span>
                      <span className="px-2 py-0.2 rounded text-[9px] font-black uppercase bg-slate-800 text-emerald-400">
                        {item.muscleGroup}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{item.instructions}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-0.5">
                      <span>{item.defaultSets} series x {item.defaultReps} reps</span>
                      <span>•</span>
                      <span>Descanso: {item.defaultRestSeconds}s</span>
                      {item.defaultWeightKg > 0 && (
                        <>
                          <span>•</span>
                          <span>Sugerido: {item.defaultWeightKg} kg</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddExerciseFromLibrary(item)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1 shrink-0 transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

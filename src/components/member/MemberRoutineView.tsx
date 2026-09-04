import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { Routine, RoutineDay, RoutineExercise } from '../../types';
import { ExerciseDetailModal } from '../common/ExerciseDetailModal';
import { RestTimerModal } from '../common/RestTimerModal';
import { InstructorQuickContactModal } from './InstructorQuickContactModal';
import { MemberRoutineBuilder } from './MemberRoutineBuilder';
import {
  Dumbbell,
  Play,
  CheckCircle2,
  Clock,
  Flame,
  Award,
  Sparkles,
  ChevronRight,
  Info,
  RotateCcw,
  Check,
  Video,
  ListPlus,
  MessageSquare,
  ClipboardList,
  UserCheck,
  PlusCircle,
  HelpCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';

export const MemberRoutineView: React.FC = () => {
  const {
    currentUser,
    routines,
    createRoutine,
    logWorkoutSession,
    updateRoutineExerciseSet
  } = useGym();

  // Find assigned routine strictly for this user (NO fallback to routines[0] to honor unassigned state)
  const userRoutines = routines.filter(r => r.assignedUserIds.includes(currentUser?.id || ''));
  const activeRoutine = userRoutines[0] || null;

  const [selectedDayId, setSelectedDayId] = useState<string>('');
  const [selectedExerciseForModal, setSelectedExerciseForModal] = useState<RoutineExercise | null>(null);
  
  // Empty state actions
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [requestedTrainerRoutine, setRequestedTrainerRoutine] = useState(false);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [isTimerOpen, setIsTimerOpen] = useState(false);

  // Finish session modal
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionRating, setSessionRating] = useState(5);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(55);

  // Instructor quick contact modal with Gemini
  const [showInstructorModal, setShowInstructorModal] = useState(false);

  // Handler for requesting routine to trainer
  const handleRequestRoutine = () => {
    setRequestedTrainerRoutine(true);
  };

  // Handler for saving self-built routine
  const handleSaveSelfBuiltRoutine = (routineData: Omit<Routine, 'id' | 'createdAt'>) => {
    createRoutine(routineData);
    setIsBuilderOpen(false);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });
  };

  // If user has no routine assigned
  if (!activeRoutine) {
    if (isBuilderOpen) {
      return (
        <MemberRoutineBuilder
          userId={currentUser?.id || `usr-${Date.now()}`}
          userName={currentUser?.name || 'Socio'}
          onSave={handleSaveSelfBuiltRoutine}
          onCancel={() => setIsBuilderOpen(false)}
        />
      );
    }

    return (
      <div className="space-y-6">
        
        {/* Empty State Banner */}
        <div className="p-8 sm:p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl relative overflow-hidden space-y-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Graphic Icon */}
          <div className="relative inline-block">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-emerald-400 mx-auto shadow-xl">
              <ClipboardList className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Headline & Description */}
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Todavía no tenés una rutina asignada
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Para comenzar a entrenar de forma segura y orientada a tus metas, podés solicitarle un plan personalizado a tu entrenador o armar tu propio esquema hoy mismo.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-lg mx-auto">
            {requestedTrainerRoutine ? (
              <div className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-extrabold text-xs flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>¡Solicitud enviada! Tu entrenador Lucas te avisará apenas esté lista.</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRequestRoutine}
                className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
              >
                <UserCheck className="w-4 h-4" />
                <span>Pedir rutina a mi entrenador</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsBuilderOpen(true)}
              className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Crear mi propia rutina</span>
            </button>
          </div>

        </div>

        {/* Feature Explanations */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Dumbbell className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-extrabold text-white">Catálogo de Ejercicios</h4>
            <p className="text-xs text-slate-400">
              Más de 30 ejercicios con demostraciones, instrucciones y grupos musculares segmentados.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-extrabold text-white">Temporizador de Pausa</h4>
            <p className="text-xs text-slate-400">
              Control inteligente de tiempos de descanso entre series con alarma acústica.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-extrabold text-white">Historial de Sobrecarga</h4>
            <p className="text-xs text-slate-400">
              Guardado automático de volumen total (kg) y repeticiones logradas por sesión.
            </p>
          </div>
        </div>

      </div>
    );
  }

  const selectedDay = activeRoutine.days.find(d => d.id === selectedDayId) || activeRoutine.days[0];


  // Calculate current day completion progress
  let totalSets = 0;
  let completedSetsCount = 0;
  let currentVolumeKg = 0;

  selectedDay.blocks.forEach(b => {
    b.exercises.forEach(ex => {
      const sets = ex.completedSets || [];
      totalSets += ex.targetSets;
      sets.forEach(s => {
        if (s.completed) {
          completedSetsCount++;
          currentVolumeKg += (s.reps || 10) * (s.weightKg || ex.weightKgSuggested || 0);
        }
      });
    });
  });

  const completionPercent = totalSets > 0 ? Math.round((completedSetsCount / totalSets) * 100) : 0;

  const handleToggleSet = (
    blockId: string,
    exerciseId: string,
    setIndex: number,
    currentCompleted: boolean,
    restSeconds: number
  ) => {
    const nextCompleted = !currentCompleted;
    updateRoutineExerciseSet(activeRoutine.id, selectedDay.id, blockId, exerciseId, setIndex, nextCompleted);

    if (nextCompleted) {
      setTimerSeconds(restSeconds || 60);
      setIsTimerOpen(true);
    }
  };

  const handleFinishWorkout = () => {
    const estimatedCalories = Math.round(sessionDurationMinutes * 8.2 + ((currentVolumeKg || 3800) / 100));

    logWorkoutSession({
      userId: currentUser?.id || 'usr-member-1',
      routineId: activeRoutine.id,
      routineName: activeRoutine.title,
      dayName: selectedDay.name,
      date: new Date().toISOString(),
      durationMinutes: sessionDurationMinutes,
      totalVolumeKg: currentVolumeKg || 3800,
      completedExercisesCount: selectedDay.blocks.reduce((acc, b) => acc + b.exercises.length, 0),
      notes: sessionNotes || 'Excelente sesión completada.',
      rating: sessionRating,
      caloriesBurned: estimatedCalories
    });

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 }
    });

    setShowFinishModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header with Routine title & Goal */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {activeRoutine.goal} • {activeRoutine.level}
              </span>
              <span className="text-xs text-slate-400">Creado por {activeRoutine.creatorName}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">{activeRoutine.title}</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">{activeRoutine.description}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInstructorModal(true)}
              className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-750 text-white border border-slate-700/80 hover:border-emerald-500/50 font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 group"
              title="Consulta rápida al instructor con IA"
            >
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <Sparkles className="w-2.5 h-2.5 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <span className="hidden sm:inline">Consultar Instructor</span>
              <span className="sm:hidden">Instructor</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black border border-emerald-500/30">
                IA
              </span>
            </button>

            <button
              onClick={() => setShowFinishModal(true)}
              className="py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <Award className="w-4 h-4" />
              <span>Finalizar Sesión</span>
            </button>
          </div>
        </div>

        {/* Day selection tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-5 border-t border-slate-800/80 mt-5 pb-1">
          {activeRoutine.days.map((day, idx) => {
            const isSelected = day.id === selectedDay.id;
            return (
              <button
                key={day.id}
                onClick={() => setSelectedDayId(day.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700/60'
                }`}
              >
                <span>{day.dayOfWeek || `Día ${idx + 1}`}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>
                  {day.blocks.reduce((acc, b) => acc + b.exercises.length, 0)} ej.
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress & Live Volume Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 font-semibold">Progreso del Día</p>
            <p className="text-xl font-black text-white">{completionPercent}% <span className="text-xs font-normal text-slate-400">({completedSetsCount}/{totalSets} series)</span></p>
          </div>
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border-2 border-emerald-500 text-emerald-400 font-bold text-xs">
            {completionPercent}%
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 font-semibold">Volumen Levantado</p>
            <p className="text-xl font-black text-emerald-400">{currentVolumeKg.toLocaleString()} <span className="text-xs font-normal text-slate-400">kg</span></p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 font-semibold">Descanso Sugerido</p>
            <p className="text-xl font-black text-amber-400">60 - 120 <span className="text-xs font-normal text-slate-400">seg</span></p>
          </div>
          <button
            onClick={() => {
              setTimerSeconds(60);
              setIsTimerOpen(true);
            }}
            className="p-3 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
            title="Abrir Cronómetro"
          >
            <Clock className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick Instructor Assistance Bar with Gemini AI */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 border border-emerald-500/25 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold text-white">¿Dudas con la técnica o una máquina ocupada?</h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold uppercase border border-emerald-500/30">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Contactá a tu instructor asignado ({activeRoutine.creatorName || 'Carlos Ruiz'}) y obtené respuestas instantáneas sugeridas con IA.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowInstructorModal(true)}
          className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all shrink-0 active:scale-95"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Abrir Consulta Rápida</span>
        </button>
      </div>

      {/* Routine Blocks & Exercises List */}
      <div className="space-y-6">
        {selectedDay.blocks.map((block) => (
          <div key={block.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <h3 className="font-extrabold text-sm sm:text-base text-white uppercase tracking-wider">{block.name}</h3>
            </div>

            <div className="space-y-4">
              {block.exercises.map((exercise, exIdx) => {
                const sets = exercise.completedSets || Array.from({ length: exercise.targetSets }, (_, i) => ({
                  setNumber: i + 1,
                  reps: 10,
                  weightKg: exercise.weightKgSuggested || 0,
                  completed: false
                }));

                return (
                  <div
                    key={exercise.id}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4 transition-all hover:border-slate-700/80"
                  >
                    {/* Exercise Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-black text-emerald-400 shrink-0 border border-slate-700">
                          {exIdx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              {exercise.muscleGroup}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {exercise.targetSets} series x {exercise.targetReps} reps • Descanso: {exercise.restSeconds}s
                            </span>
                          </div>
                          <h4 className="text-base font-extrabold text-white mt-0.5">{exercise.name}</h4>
                          {exercise.instructions && (
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{exercise.instructions}</p>
                          )}
                        </div>
                      </div>

                      {/* Video Guide Modal button */}
                      <button
                        onClick={() => setSelectedExerciseForModal(exercise)}
                        className="py-1.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                      >
                        <Video className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Ver Video & Técnica</span>
                      </button>
                    </div>

                    {/* Interactive Sets Table */}
                    <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/60 overflow-x-auto">
                      <table className="w-full text-xs text-left min-w-[320px]">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-800 pb-2 text-[11px] uppercase tracking-wider">
                            <th className="py-2 pl-2">Serie</th>
                            <th className="py-2">Objetivo</th>
                            <th className="py-2">Peso (kg)</th>
                            <th className="py-2">Reps</th>
                            <th className="py-2 text-right pr-2">Completada</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {Array.from({ length: exercise.targetSets }).map((_, sIdx) => {
                            const setLog = sets[sIdx] || {
                              setNumber: sIdx + 1,
                              reps: 10,
                              weightKg: exercise.weightKgSuggested || 0,
                              completed: false
                            };

                            return (
                              <tr
                                key={sIdx}
                                className={`transition-colors ${setLog.completed ? 'bg-emerald-950/20 text-emerald-300' : 'text-slate-300'}`}
                              >
                                <td className="py-2 pl-2 font-bold font-mono">#{sIdx + 1}</td>
                                <td className="py-2 text-slate-400 text-[11px]">
                                  {exercise.targetReps} reps @ {exercise.weightKgSuggested || 'Libre'} kg
                                </td>
                                <td className="py-2">
                                  <input
                                    type="number"
                                    defaultValue={setLog.weightKg || exercise.weightKgSuggested || 20}
                                    onChange={(e) => {
                                      updateRoutineExerciseSet(
                                        activeRoutine.id,
                                        selectedDay.id,
                                        block.id,
                                        exercise.id,
                                        sIdx,
                                        setLog.completed,
                                        parseFloat(e.target.value) || 0,
                                        setLog.reps
                                      );
                                    }}
                                    className="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:border-emerald-400 focus:outline-none"
                                  />
                                </td>
                                <td className="py-2">
                                  <input
                                    type="number"
                                    defaultValue={setLog.reps || 10}
                                    onChange={(e) => {
                                      updateRoutineExerciseSet(
                                        activeRoutine.id,
                                        selectedDay.id,
                                        block.id,
                                        exercise.id,
                                        sIdx,
                                        setLog.completed,
                                        setLog.weightKg,
                                        parseInt(e.target.value) || 0
                                      );
                                    }}
                                    className="w-14 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:border-emerald-400 focus:outline-none"
                                  />
                                </td>
                                <td className="py-2 text-right pr-2">
                                  <button
                                    onClick={() => handleToggleSet(block.id, exercise.id, sIdx, setLog.completed, exercise.restSeconds)}
                                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                                      setLog.completed
                                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                                    }`}
                                  >
                                    <Check className="w-4 h-4 stroke-[3]" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action: Finish Workout Footer */}
      <div className="pt-4 flex items-center justify-center">
        <button
          onClick={() => setShowFinishModal(true)}
          className="w-full max-w-md py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:brightness-110 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          <Award className="w-5 h-5" />
          <span>Finalizar Sesión & Guardar Registro</span>
        </button>
      </div>

      {/* Exercise Video & Coaching tips Modal */}
      <ExerciseDetailModal
        exercise={selectedExerciseForModal}
        isOpen={!!selectedExerciseForModal}
        onClose={() => setSelectedExerciseForModal(null)}
      />

      {/* Interactive Rest Timer */}
      <RestTimerModal
        initialSeconds={timerSeconds}
        isOpen={isTimerOpen}
        onClose={() => setIsTimerOpen(false)}
      />

      {/* Finish Session Confirmation Modal */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 space-y-4"
          >
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center ring-8 ring-emerald-500/10">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-white">¡Gran Entrenamiento!</h3>
              <p className="text-xs text-slate-400">
                Resumen de tu sesión: <strong className="text-white">{selectedDay.name}</strong>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Volumen Total Levantado:</span>
                <span className="font-extrabold text-emerald-400">{currentVolumeKg.toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Series Completadas:</span>
                <span className="font-bold text-white">{completedSetsCount} / {totalSets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Duración Estimada:</span>
                <span className="font-bold text-white">{sessionDurationMinutes} minutos</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Sensación / RPE de la Sesión</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSessionRating(star)}
                      className={`flex-1 py-2 rounded-xl border font-bold text-xs ${
                        sessionRating >= star
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      ★ {star}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Notas del Entrenamiento (Opcional)</label>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Ej: Aumenté 2.5kg en press de banca, buena congestión..."
                  rows={2}
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowFinishModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Volver
              </button>
              <button
                onClick={handleFinishWorkout}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20"
              >
                Guardar Log
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Quick Instructor Contact Modal with Gemini */}
      <InstructorQuickContactModal
        isOpen={showInstructorModal}
        onClose={() => setShowInstructorModal(false)}
        activeRoutine={activeRoutine}
        selectedDay={selectedDay}
      />

    </div>
  );
};

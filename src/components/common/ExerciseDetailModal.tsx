import React from 'react';
import { ExerciseLibraryItem, RoutineExercise } from '../../types';
import { X, Play, Dumbbell, Activity, CheckCircle, Info, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface ExerciseDetailModalProps {
  exercise: RoutineExercise | ExerciseLibraryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({ exercise, isOpen, onClose }) => {
  if (!isOpen || !exercise) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-100 my-8 overflow-hidden"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Video demonstration frame */}
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 mb-4 shadow-inner">
          {exercise.videoUrl ? (
            <video
              src={exercise.videoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
              <Dumbbell className="w-12 h-12 mb-2 stroke-1" />
              <p className="text-xs">Demostración en video</p>
            </div>
          )}
          <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 border border-slate-800">
            <Sparkles className="w-3.5 h-3.5" /> Técnica Demostrativa HD
          </div>
        </div>

        {/* Title and tags */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {exercise.muscleGroup}
            </span>
            {'difficulty' in exercise && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                {exercise.difficulty}
              </span>
            )}
          </div>
          <h3 className="text-xl font-extrabold text-white">{exercise.name}</h3>
        </div>

        {/* Instructions & Coaching tips */}
        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <p className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-emerald-400" /> Instrucciones de Ejecución
            </p>
            <p className="text-slate-300 leading-relaxed">
              {exercise.instructions || 'Mantené la técnica estricta, controlando la fase excéntrica y manteniendo el core activo durante todo el rango de movimiento.'}
            </p>
          </div>

          {'targetSets' in exercise && (
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center">
                <span className="text-[10px] text-slate-400 block uppercase">Series</span>
                <span className="text-base font-bold text-white">{exercise.targetSets}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center">
                <span className="text-[10px] text-slate-400 block uppercase">Repeticiones</span>
                <span className="text-base font-bold text-emerald-400">{exercise.targetReps}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center">
                <span className="text-[10px] text-slate-400 block uppercase">Descanso</span>
                <span className="text-base font-bold text-amber-400">{exercise.restSeconds}s</span>
              </div>
            </div>
          )}
        </div>

        {/* Close CTA */}
        <div className="mt-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
          >
            Cerrar Guía
          </button>
        </div>
      </motion.div>
    </div>
  );
};

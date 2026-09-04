import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { GroupClass, ClassCategory } from '../../types';
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Filter,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

export const MemberClassesView: React.FC = () => {
  const { classes, currentUser, bookClass, cancelClassBooking, branches, selectedBranchId } = useGym();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');
  const [bookingFeedback, setBookingFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const categories: ClassCategory[] = ['CrossFit', 'Spinning', 'Funcional', 'Yoga', 'Pilates', 'HIIT'];

  // Filter classes
  const filteredClasses = classes.filter(cls => {
    const matchesCategory = selectedCategory === 'all' || cls.category === selectedCategory;
    const matchesDate = selectedDateFilter === 'all' || cls.date === selectedDateFilter;
    return matchesCategory && matchesDate;
  });

  const handleBook = (classId: string) => {
    if (!currentUser) return;
    const res = bookClass(classId, currentUser.id);
    setBookingFeedback({
      message: res.message,
      type: res.success ? 'success' : 'error'
    });

    if (res.success) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    }

    setTimeout(() => setBookingFeedback(null), 4000);
  };

  const handleCancel = (classId: string) => {
    if (!currentUser) return;
    const res = cancelClassBooking(classId, currentUser.id);
    setBookingFeedback({
      message: res.message,
      type: 'success'
    });
    setTimeout(() => setBookingFeedback(null), 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/15 text-sky-400 border border-sky-500/30">
                Calendario Semanal
              </span>
              <span className="text-xs text-slate-400">Cupos en Tiempo Real</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Reservar Clases Grupales</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Asegurá tu lugar en las mejores clases guiadas por profesores certificados.
            </p>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pt-5 border-t border-slate-800/80 mt-5 pb-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            Todas las Disciplinas
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Booking Feedback Alert */}
      <AnimatePresence>
        {bookingFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 shadow-lg ${
              bookingFeedback.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-200'
                : 'bg-rose-950/80 border border-rose-500/60 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {bookingFeedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span>{bookingFeedback.message}</span>
            </div>
            <button
              onClick={() => setBookingFeedback(null)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredClasses.length === 0 ? (
          <div className="col-span-2 p-10 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400">
            <Calendar className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="font-bold text-slate-300">No hay clases programadas para esta categoría.</p>
            <p className="text-xs mt-1">Probá cambiando los filtros superiores.</p>
          </div>
        ) : (
          filteredClasses.map(cls => {
            const isEnrolled = currentUser ? cls.enrolledUserIds.includes(currentUser.id) : false;
            const isWaiting = currentUser ? cls.waitingListUserIds.includes(currentUser.id) : false;
            const availableSpots = cls.capacity - cls.enrolledUserIds.length;
            const isFull = availableSpots <= 0;
            const branch = branches.find(b => b.id === cls.branchId) || branches[0];

            return (
              <div
                key={cls.id}
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                  isEnrolled
                    ? 'bg-slate-900/95 border-emerald-500/60 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top tags */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-sky-500/15 text-sky-300 border border-sky-500/30">
                      {cls.category}
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      isFull
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {isFull ? 'Cupo Completo' : `${availableSpots} cupos disponibles`}
                    </span>
                  </div>

                  {/* Title & Instructor */}
                  <h3 className="text-lg font-black text-white">{cls.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <strong className="text-slate-300">{cls.date} • {cls.startTime} a {cls.endTime} hs</strong>
                  </p>

                  {/* Room & Trainer */}
                  <div className="mt-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Profesor/a:</span>
                      <span className="font-semibold text-white">{cls.instructorName}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Espacio:</span>
                      <span className="text-slate-300">{cls.room}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Sede:</span>
                      <span className="text-slate-300 truncate max-w-[150px]">{branch.name}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom action */}
                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Users className="w-4 h-4" />
                    <span>{cls.enrolledUserIds.length}/{cls.capacity} confirmados</span>
                  </div>

                  {isEnrolled ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Lugar Reservado
                      </span>
                      <button
                        onClick={() => handleCancel(cls.id)}
                        className="py-1.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : isWaiting ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-400">En lista de espera</span>
                      <button
                        onClick={() => handleCancel(cls.id)}
                        className="py-1.5 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                      >
                        Salir
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleBook(cls.id)}
                      className={`py-2 px-4 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 ${
                        isFull
                          ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                      }`}
                    >
                      {isFull ? 'Anotarme en Lista de Espera' : 'Reservar Mi Lugar'}
                    </button>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

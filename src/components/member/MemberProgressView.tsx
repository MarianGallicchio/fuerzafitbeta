import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { UserProgressMetric } from '../../types';
import {
  TrendingUp,
  Scale,
  Activity,
  Plus,
  Calendar,
  Award,
  CheckCircle2,
  Dumbbell,
  Flame,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';

export const MemberProgressView: React.FC = () => {
  const { currentUser, progressMetrics, addProgressMetric, workoutLogs } = useGym();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newWeight, setNewWeight] = useState<number>(80.5);
  const [newFat, setNewFat] = useState<number>(14.5);
  const [newChest, setNewChest] = useState<number>(106);
  const [newWaist, setNewWaist] = useState<number>(82);
  const [newArms, setNewArms] = useState<number>(39.5);
  const [newNotes, setNewNotes] = useState<string>('');

  const userProgress = progressMetrics.filter(p => p.userId === currentUser?.id);
  const userLogs = workoutLogs.filter(l => l.userId === currentUser?.id);

  // Format data for chart
  const chartData = userProgress.map(p => ({
    date: p.date.slice(5), // MM-DD
    peso: p.weightKg,
    grasa: p.bodyFatPercent || 0,
    pecho: p.chestCm || 0,
    cintura: p.waistCm || 0,
    brazos: p.armsCm || 0
  }));

  const latestMetric = userProgress[userProgress.length - 1];
  const firstMetric = userProgress[0];
  const weightChange = latestMetric && firstMetric ? (latestMetric.weightKg - firstMetric.weightKg).toFixed(1) : '0';

  const handleAddMetric = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    addProgressMetric({
      userId: currentUser.id,
      date: new Date().toISOString().split('T')[0],
      weightKg: Number(newWeight),
      bodyFatPercent: Number(newFat),
      chestCm: Number(newChest),
      waistCm: Number(newWaist),
      armsCm: Number(newArms),
      notes: newNotes || 'Medición mensual registrada por el socio.'
    });

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });

    setShowAddForm(false);
    setNewNotes('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Evolución Física
              </span>
              <span className="text-xs text-slate-400">Recomposición Corporal</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Registro de Progreso & Medidas</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Monitoreá tu peso corporal, porcentaje de grasa y medidas musculares a lo largo del tiempo.
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="py-3 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Ocultar Formulario' : 'Nueva Medición'}</span>
          </button>
        </div>
      </div>

      {/* Add Metric Form Modal/Collapse */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl"
        >
          <h3 className="font-extrabold text-base text-white mb-4">Registrar Nueva Medición Corporal</h3>
          <form onSubmit={handleAddMetric} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Peso Corporal (kg)</label>
              <input
                type="number"
                step="0.1"
                required
                value={newWeight}
                onChange={e => setNewWeight(parseFloat(e.target.value))}
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">% Grasa Corporal Estimado</label>
              <input
                type="number"
                step="0.1"
                value={newFat}
                onChange={e => setNewFat(parseFloat(e.target.value))}
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Cintura (cm)</label>
              <input
                type="number"
                step="0.5"
                value={newWaist}
                onChange={e => setNewWaist(parseFloat(e.target.value))}
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Pecho / Torso (cm)</label>
              <input
                type="number"
                step="0.5"
                value={newChest}
                onChange={e => setNewChest(parseFloat(e.target.value))}
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Brazo Flexionado (cm)</label>
              <input
                type="number"
                step="0.5"
                value={newArms}
                onChange={e => setNewArms(parseFloat(e.target.value))}
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Notas / Observaciones</label>
              <input
                type="text"
                placeholder="Ej: Buena definición abdominal..."
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-750"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/20"
              >
                Guardar Medición
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Snapshot Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-[11px] text-slate-400 font-semibold">Peso Actual</p>
          <p className="text-xl font-black text-white mt-0.5">{latestMetric?.weightKg || 80.8} kg</p>
          <span className="text-[10px] text-emerald-400 font-semibold">
            {parseFloat(weightChange) > 0 ? `+${weightChange} kg (Masa magra)` : `${weightChange} kg`}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-[11px] text-slate-400 font-semibold">% Grasa Corporal</p>
          <p className="text-xl font-black text-emerald-400 mt-0.5">{latestMetric?.bodyFatPercent || 14.8}%</p>
          <span className="text-[10px] text-emerald-400 font-semibold">-3.4% desde inicio</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-[11px] text-slate-400 font-semibold">Cintura</p>
          <p className="text-xl font-black text-white mt-0.5">{latestMetric?.waistCm || 82.5} cm</p>
          <span className="text-[10px] text-emerald-400 font-semibold">-3.5 cm reducidos</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-[11px] text-slate-400 font-semibold">Brazo</p>
          <p className="text-xl font-black text-sky-400 mt-0.5">{latestMetric?.armsCm || 39.2} cm</p>
          <span className="text-[10px] text-sky-400 font-semibold">+2.2 cm hipertrofia</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Weight Progression Chart */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              <span>Evolución del Peso Corporal (kg)</span>
            </h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="peso" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPeso)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Body Measurements Chart */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              <span>Medidas Musculares (cm)</span>
            </h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="pecho" name="Pecho (cm)" stroke="#38bdf8" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="cintura" name="Cintura (cm)" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="brazos" name="Brazo (cm)" stroke="#a855f7" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Workout History Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="font-extrabold text-base text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          <span>Historial de Entrenamientos Completados</span>
        </h3>

        <div className="space-y-3">
          {userLogs.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">Aún no registraste entrenamientos completados.</p>
          ) : (
            userLogs.map(log => (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-extrabold text-white text-sm">{log.dayName}</span>
                    <span className="text-[10px] px-2 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                      {log.routineName}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    {new Date(log.date).toLocaleDateString('es-AR')} • {log.durationMinutes} min de sesión • {log.notes}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Volumen</span>
                    <span className="font-black text-emerald-400 text-sm">{log.totalVolumeKg.toLocaleString()} kg</span>
                  </div>
                  <div className="text-amber-400 font-bold">
                    {'★'.repeat(log.rating || 5)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { useGym } from '../../context/GymContext';
import {
  Flame,
  TrendingUp,
  Target,
  Award,
  Calendar,
  Clock,
  Dumbbell,
  CheckCircle2,
  ChevronRight,
  Info,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine
} from 'recharts';

interface WeeklyCaloriesBarChartProps {
  onNavigateTab?: (tab: 'dashboard' | 'routine' | 'classes' | 'progress' | 'profile') => void;
}

interface DayData {
  day: string;
  fullDay: string;
  dateStr: string;
  formattedDate: string;
  calories: number;
  target: number;
  durationMinutes: number;
  volumeKg: number;
  sessionTitle: string;
  isToday: boolean;
  isFuture: boolean;
}

export const WeeklyCaloriesBarChart: React.FC<WeeklyCaloriesBarChartProps> = ({ onNavigateTab }) => {
  const { currentUser, workoutLogs } = useGym();
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  // Daily target calorie burn in kcal
  const DAILY_CALORIE_TARGET = 500;
  const WEEKLY_GOAL = 3000;

  // Compute the 7 days of the current week (Monday to Sunday)
  const weekData: DayData[] = useMemo(() => {
    // Current reference date (supports current date and demo environment)
    const baseDate = new Date();
    
    // Check if user has logs in 2026 or current calendar year
    const userLogs = workoutLogs.filter(l => l.userId === currentUser?.id);
    
    // Find reference date: if there are logs around 2026-09-02, align with that week; else current week
    let refDate = baseDate;
    const has2026Logs = userLogs.some(l => l.date.startsWith('2026-09') || l.date.startsWith('2026-08'));
    if (has2026Logs && baseDate.getFullYear() < 2026) {
      refDate = new Date('2026-09-02T10:00:00Z');
    }

    const dayOfWeek = refDate.getDay(); // 0 = Sun, 1 = Mon ...
    // Shift so Monday is index 0
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    const monday = new Date(refDate);
    monday.setDate(refDate.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const dayNamesShort = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const dayNamesFull = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    const result: DayData[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];

      // Format date e.g. "31 Ago" o "2 Sep"
      const dayNum = d.getDate();
      const monthShort = d.toLocaleString('es-AR', { month: 'short' });
      const formattedDate = `${dayNum} ${monthShort.charAt(0).toUpperCase() + monthShort.slice(1)}`;

      const isToday = d.toISOString().split('T')[0] === refDate.toISOString().split('T')[0];
      const isFuture = d > refDate && !isToday;

      // Find logs matching this date
      const matchingLogs = userLogs.filter(l => l.date.startsWith(dateStr));

      let dayCalories = 0;
      let dayDuration = 0;
      let dayVolume = 0;
      let sessionTitle = '';

      if (matchingLogs.length > 0) {
        matchingLogs.forEach(log => {
          const cals = log.caloriesBurned ?? Math.round(log.durationMinutes * 8.2 + (log.totalVolumeKg / 100));
          dayCalories += cals;
          dayDuration += log.durationMinutes;
          dayVolume += log.totalVolumeKg;
        });
        sessionTitle = matchingLogs.map(l => l.routineName || l.dayName).join(' + ');
      } else {
        // Realistic fallback for demo week if user hasn't logged that day yet
        if (dateStr === '2026-08-31') {
          dayCalories = 490;
          dayDuration = 58;
          dayVolume = 4600;
          sessionTitle = 'Hipertrofia: Tracción & Espalda';
        } else if (dateStr === '2026-09-01') {
          dayCalories = 520;
          dayDuration = 50;
          dayVolume = 0;
          sessionTitle = 'Spinning Power Ride (Intervalos)';
        } else if (dateStr === '2026-09-02') {
          dayCalories = 580;
          dayDuration = 65;
          dayVolume = 5200;
          sessionTitle = 'Fuerza: Empuje (Pecho & Tríceps)';
        }
      }

      result.push({
        day: dayNamesShort[i],
        fullDay: dayNamesFull[i],
        dateStr,
        formattedDate,
        calories: dayCalories,
        target: DAILY_CALORIE_TARGET,
        durationMinutes: dayDuration,
        volumeKg: dayVolume,
        sessionTitle,
        isToday,
        isFuture
      });
    }

    return result;
  }, [workoutLogs, currentUser]);

  // Aggregate statistics
  const totalCaloriesThisWeek = useMemo(() => {
    return weekData.reduce((acc, d) => acc + d.calories, 0);
  }, [weekData]);

  const activeDaysCount = useMemo(() => {
    return weekData.filter(d => d.calories > 0).length;
  }, [weekData]);

  const dailyAverage = useMemo(() => {
    return activeDaysCount > 0 ? Math.round(totalCaloriesThisWeek / activeDaysCount) : 0;
  }, [totalCaloriesThisWeek, activeDaysCount]);

  const peakDay = useMemo(() => {
    return weekData.reduce((max, d) => (d.calories > max.calories ? d : max), weekData[0]);
  }, [weekData]);

  const progressPercent = Math.min(100, Math.round((totalCaloriesThisWeek / WEEKLY_GOAL) * 100));

  // Current selected day (defaults to today or peak day)
  const activeDay = selectedDayIndex !== null 
    ? weekData[selectedDayIndex] 
    : weekData.find(d => d.isToday) || peakDay || weekData[0];

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DayData = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md text-xs space-y-1.5 z-50 min-w-[180px]">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
            <span className="font-extrabold text-white text-xs">{data.fullDay} {data.formattedDate}</span>
            {data.isToday && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Hoy
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <span className="text-slate-400">Calorías:</span>
            <span className="font-black text-emerald-400 text-sm flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              {data.calories > 0 ? `${data.calories.toLocaleString('es-AR')} kcal` : '0 kcal (Descanso)'}
            </span>
          </div>

          {data.calories > 0 && (
            <>
              {data.durationMinutes > 0 && (
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span className="text-slate-400">Tiempo:</span>
                  <span className="font-semibold">{data.durationMinutes} min</span>
                </div>
              )}
              {data.sessionTitle && (
                <div className="text-[10px] text-slate-400 truncate max-w-[190px] pt-0.5">
                  {data.sessionTitle}
                </div>
              )}
              <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Meta ({data.target} kcal):</span>
                <span className={data.calories >= data.target ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {Math.round((data.calories / data.target) * 100)}%
                </span>
              </div>
            </>
          )}

          {data.calories === 0 && (
            <p className="text-[10px] text-slate-400 italic pt-0.5">
              {data.isFuture ? 'Día programado' : 'Día de descanso o recuperación'}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="weekly-calories-card"
      className="col-span-12 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6 relative overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Overview Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-slate-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-pulse" />
              Gasto Calórico Semanal
            </span>
            <span className="text-xs text-slate-400 font-medium">Lunes a Domingo</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 pt-0.5">
            <span>Calorías Quemadas Esta Semana</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Monitoreo en tiempo real del gasto energético en musculación, clases grupales y rutinas diarias.
          </p>
        </div>

        {/* Weekly Goal Progress Bar & Key Numbers */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Total Semana</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-white">{totalCaloriesThisWeek.toLocaleString('es-AR')}</span>
              <span className="text-xs font-bold text-emerald-400">kcal</span>
            </div>
            <span className="text-[11px] text-slate-400">de {WEEKLY_GOAL.toLocaleString('es-AR')} kcal</span>
          </div>

          <div className="h-10 w-px bg-slate-800 hidden sm:block" />

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Promedio Diario</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-white">{dailyAverage}</span>
              <span className="text-xs text-slate-400">kcal/día</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold">{activeDaysCount} días activos</span>
          </div>

          <div className="h-10 w-px bg-slate-800 hidden sm:block" />

          <div className="min-w-[130px]">
            <div className="flex items-center justify-between text-[10px] font-bold mb-1">
              <span className="text-slate-400 uppercase">Meta Semanal</span>
              <span className="text-emerald-400">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 via-emerald-400 to-teal-400 h-2.5 rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              {progressPercent >= 100 ? '¡Objetivo alcanzado!' : `Faltan ${(WEEKLY_GOAL - totalCaloriesThisWeek).toLocaleString('es-AR')} kcal`}
            </span>
          </div>
        </div>
      </div>

      {/* Main Bar Chart Section */}
      <div className="grid grid-cols-12 gap-6 items-center">
        {/* Recharts Bar Chart (Col Span: 8 on LG) */}
        <div className="col-span-12 lg:col-span-8">
          <div className="flex items-center justify-between mb-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                <span>Calorías por sesión</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <span className="w-2.5 h-0.5 bg-emerald-400 border border-dashed border-emerald-400 inline-block" />
                <span>Meta Diaria ({DAILY_CALORIE_TARGET} kcal)</span>
              </span>
            </div>

            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Tocá una barra para ver detalles del día
            </span>
          </div>

          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weekData}
                margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                onClick={(e) => {
                  if (e && e.activeTooltipIndex !== undefined) {
                    setSelectedDayIndex(e.activeTooltipIndex);
                  }
                }}
              >
                <defs>
                  <linearGradient id="todayBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.9} />
                  </linearGradient>
                  <linearGradient id="targetSurpassedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#047857" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="normalBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0d9488" stopOpacity={0.85} />
                    <stop offset="100%" stopColor="#0f766e" stopOpacity={0.7} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#334155"
                  opacity={0.35}
                />

                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                  dy={6}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  domain={[0, 750]}
                  ticks={[0, 250, 500, 750]}
                  tickFormatter={(v) => `${v}`}
                />

                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)', radius: 8 }}
                />

                <ReferenceLine
                  y={DAILY_CALORIE_TARGET}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                />

                <Bar
                  dataKey="calories"
                  radius={[8, 8, 2, 2]}
                  maxBarSize={44}
                  className="cursor-pointer transition-all"
                >
                  {weekData.map((entry, index) => {
                    const isSelected = selectedDayIndex === index;
                    let fill = 'url(#normalBarGradient)';
                    if (entry.isToday) {
                      fill = 'url(#todayBarGradient)';
                    } else if (entry.calories >= entry.target) {
                      fill = 'url(#targetSurpassedGradient)';
                    } else if (entry.calories === 0) {
                      fill = '#1e293b';
                    }

                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={fill}
                        stroke={isSelected ? '#34d399' : entry.isToday ? '#10b981' : 'none'}
                        strokeWidth={isSelected ? 2 : entry.isToday ? 1.5 : 0}
                        opacity={entry.calories === 0 ? 0.4 : 1}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Selected / Highlighted Day Insight Card (Col Span: 4 on LG) */}
        <div className="col-span-12 lg:col-span-4 bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-white">{activeDay.fullDay}</span>
                <span className="text-xs text-slate-400 font-mono">({activeDay.formattedDate})</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {activeDay.isToday ? 'Día de entrenamiento actual' : 'Detalle de la jornada'}
              </p>
            </div>

            {activeDay.isToday ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Hoy
              </span>
            ) : activeDay.calories >= activeDay.target ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                Meta Superada
              </span>
            ) : null}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Gasto Calórico:</span>
              <div className="text-right">
                <span className="text-lg font-black text-white flex items-center gap-1 justify-end">
                  <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                  {activeDay.calories > 0 ? `${activeDay.calories.toLocaleString('es-AR')} kcal` : '0 kcal'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {activeDay.calories > 0 
                    ? `${Math.round((activeDay.calories / activeDay.target) * 100)}% de la meta diaria`
                    : 'Día sin registros'}
                </span>
              </div>
            </div>

            {activeDay.calories > 0 ? (
              <>
                {activeDay.durationMinutes > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-sky-400" />
                      <span>Tiempo activo:</span>
                    </span>
                    <span className="font-bold text-slate-200">{activeDay.durationMinutes} minutos</span>
                  </div>
                )}

                {activeDay.volumeKg > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Volumen levantado:</span>
                    </span>
                    <span className="font-bold text-slate-200">{(activeDay.volumeKg / 1000).toFixed(1)}k kg</span>
                  </div>
                )}

                {activeDay.sessionTitle && (
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white text-[11px]">{activeDay.sessionTitle}</p>
                      <p className="text-[10px] text-slate-400">Sesión completada y sincronizada</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 space-y-1">
                <p className="text-slate-300 font-semibold text-[11px]">Recuperación y Descanso</p>
                <p className="text-[10px]">
                  El descanso muscular es fundamental para la hipertrofia y la regeneración de glucógeno muscular.
                </p>
              </div>
            )}
          </div>

          {/* Quick Routine Action */}
          {onNavigateTab && (
            <button
              id="btn-nav-routine-from-calories"
              onClick={() => onNavigateTab('routine')}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95"
            >
              <span>Ver Rutina del Día</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Highlights & Training Tips Footer */}
      <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Día Pico de Gasto</span>
            <span className="font-black text-white text-xs">
              {peakDay.fullDay} • {peakDay.calories} kcal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Días Superando Meta</span>
            <span className="font-black text-white text-xs">
              {weekData.filter(d => d.calories >= d.target).length} de 7 jornadas
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Ritmo Semanal</span>
            <span className="font-black text-emerald-400 text-xs">
              {progressPercent >= 70 ? 'Óptimo para déficit/fuerza' : 'En camino a la meta'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

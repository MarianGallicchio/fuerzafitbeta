import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, Plus, Bell, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RestTimerModalProps {
  initialSeconds: number;
  isOpen: boolean;
  onClose: () => void;
  onTimerComplete?: () => void;
}

export const RestTimerModal: React.FC<RestTimerModalProps> = ({
  initialSeconds = 60,
  isOpen,
  onClose,
  onTimerComplete
}) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    setTimeLeft(initialSeconds);
    setIsRunning(true);
  }, [initialSeconds, isOpen]);

  useEffect(() => {
    if (!isOpen || !isRunning) return;

    if (timeLeft <= 0) {
      // Audio beep feedback using Web Audio API synthesis
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } catch (e) {
        // Fallback or silently pass
      }

      onTimerComplete?.();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isRunning, timeLeft, onTimerComplete]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercent = Math.max(0, (timeLeft / (initialSeconds || 60)) * 100);

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-80 bg-slate-900/95 border-2 border-emerald-500/60 rounded-3xl shadow-2xl p-4 text-slate-100 backdrop-blur-md"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
            <Bell className="w-3.5 h-3.5 animate-bounce" />
            <span>Temporizador de Descanso</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Display Counter */}
        <div className="my-4 text-center">
          <div className="text-4xl font-black font-mono tracking-tight text-white">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setTimeLeft(prev => prev + 15)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold transition-all"
          >
            +15s
          </button>
          <button
            onClick={() => setTimeLeft(prev => prev + 30)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold transition-all"
          >
            +30s
          </button>

          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`p-2 rounded-xl text-slate-950 font-bold transition-all ${
              isRunning ? 'bg-amber-400 hover:bg-amber-300' : 'bg-emerald-400 hover:bg-emerald-300'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              setTimeLeft(initialSeconds);
              setIsRunning(true);
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300"
            title="Reiniciar"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-bold"
          >
            Listo
          </button>
        </div>
      </motion.div>
    </div>
  );
};

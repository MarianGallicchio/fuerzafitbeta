import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { Routine, RoutineDay } from '../../types';
import {
  MessageSquare,
  Sparkles,
  Send,
  X,
  Check,
  Copy,
  AlertCircle,
  HelpCircle,
  Clock,
  ShieldCheck,
  Phone,
  RefreshCw,
  Dumbbell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InstructorQuickContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRoutine: Routine;
  selectedDay: RoutineDay;
}

const QUICK_PROMPTS = [
  {
    category: 'replacement',
    label: '🔄 Máquina o banco ocupado',
    text: 'La máquina de este ejercicio está ocupada. ¿Con qué ejercicio con mancuernas o peso libre lo puedo reemplazar sin perder el estímulo?'
  },
  {
    category: 'pain',
    label: '⚠️ Molestia o dolor articular',
    text: 'Siento una leve molestia en la articulación al ejecutar este ejercicio. ¿Cómo adapto el ángulo, agarre o peso para no lesionarme?'
  },
  {
    category: 'load_adjustment',
    label: '⚖️ Ajuste de carga y fatiga',
    text: 'Hoy me siento con fatiga acumulada. ¿Me recomendás bajar series o mantener el peso y bajar repeticiones?'
  },
  {
    category: 'technique',
    label: '🎯 Postura y respiración',
    text: '¿En qué momento de la fase excéntrica y concéntrica debo inhalar y exhalar en los ejercicios principales de hoy?'
  }
];

export const InstructorQuickContactModal: React.FC<InstructorQuickContactModalProps> = ({
  isOpen,
  onClose,
  activeRoutine,
  selectedDay
}) => {
  const { currentUser, users, sendBroadcastNotification } = useGym();

  // Find trainer assigned or creator
  const trainer = users.find(u => u.role === 'trainer' && u.branchId === currentUser?.branchId) ||
    users.find(u => u.role === 'trainer') || {
      id: 'usr-trainer-1',
      name: activeRoutine?.creatorName || 'Carlos Ruiz',
      email: 'carlos.trainer@fuerzafit.com',
      phone: '+54 9 11 5555-1122',
      role: 'trainer',
      avatarUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=300&q=80',
      branchId: 'branch-1'
    };

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedResponse, setSuggestedResponse] = useState<string | null>(null);
  const [isAiGenerated, setIsAiGenerated] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);
  const [consultationSent, setConsultationSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Extract exercise names for context
  const exerciseNames = selectedDay.blocks
    .flatMap(b => b.exercises)
    .map(ex => `${ex.name} (${ex.targetSets}x${ex.targetReps}, ${ex.muscleGroup})`);

  const handleSelectQuickPrompt = (item: typeof QUICK_PROMPTS[0]) => {
    setQuery(item.text);
    setSelectedCategory(item.category);
    setErrorMessage(null);
  };

  const handleGenerateSuggestion = async (textToUse?: string) => {
    const finalQuery = (textToUse || query).trim();
    if (!finalQuery) {
      setErrorMessage('Por favor escribí o seleccioná una consulta breve.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuggestedResponse(null);

    try {
      const response = await fetch('/api/gemini/instructor-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberQuery: finalQuery,
          memberName: currentUser?.name || 'Socio',
          trainerName: trainer.name,
          routineTitle: activeRoutine.title,
          routineGoal: activeRoutine.goal,
          dayName: selectedDay.name,
          exercises: exerciseNames,
          category: selectedCategory
        })
      });

      if (!response.ok) {
        throw new Error(`Error en servidor (${response.status})`);
      }

      const data = await response.json();
      if (data.suggestion) {
        setSuggestedResponse(data.suggestion);
        setIsAiGenerated(data.isAiGenerated ?? true);
      } else {
        throw new Error(data.error || 'No se recibió respuesta');
      }
    } catch (err: any) {
      console.warn('Fallo en API de Gemini, utilizando respuesta contextual inmediata:', err);
      // Fallback response
      const fallback = `¡Hola ${currentUser?.name || 'Socio'}! 
Para esta sesión de "${activeRoutine.title}" (${selectedDay.name}):
- Si una máquina está ocupada, hacé la variante equivalente con mancuernas o poleas.
- Si sentís molestias, reducí el peso al 50% y priorizá la fase excéntrica lenta.
- Cualquier duda, vení a buscarme a la sala de musculación o mandame un mensaje.`;
      setSuggestedResponse(fallback);
      setIsAiGenerated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!suggestedResponse) return;
    navigator.clipboard.writeText(suggestedResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendToInstructor = () => {
    // Notify in context
    sendBroadcastNotification(
      `Consulta de ${currentUser?.name || 'Socio'} a ${trainer.name}`,
      `Consulta sobre ${activeRoutine.title}: "${query}"`,
      'routine'
    );
    setConsultationSent(true);
    setTimeout(() => {
      setConsultationSent(false);
      onClose();
    }, 1800);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-6"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={trainer.avatarUrl}
                  alt={trainer.name}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" title="En sala" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-white">{trainer.name}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Instructor Asignado
                  </span>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>En sala de entrenamiento • Respuestas con Gemini AI</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            {/* Current Context Card */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-400">Contexto Actual</p>
                  <p className="text-xs font-bold text-white">
                    {activeRoutine.title} • <span className="text-emerald-400">{selectedDay.name}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400">
                  {selectedDay.blocks.reduce((acc, b) => acc + b.exercises.length, 0)} ejercicios hoy
                </span>
              </div>
            </div>

            {/* Quick Topic Prompts */}
            <div>
              <p className="text-xs font-extrabold text-slate-300 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Consultas frecuentes rápidas:</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {QUICK_PROMPTS.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectQuickPrompt(item)}
                    className="p-2.5 rounded-xl text-left text-xs bg-slate-800/70 hover:bg-slate-800 text-slate-200 border border-slate-700/50 hover:border-emerald-500/40 transition-all flex items-center justify-between group active:scale-[0.99]"
                  >
                    <span className="font-semibold group-hover:text-emerald-300">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Query Input Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tu consulta para el instructor:</span>
                </label>
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="text-[11px] text-slate-400 hover:text-slate-200"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              <textarea
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                rows={3}
                placeholder="Escribí tu consulta breve (ej: ¿Con qué reemplazo el press banca inclinado hoy si el banco está ocupado?)..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950/70 border border-slate-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
              />

              {errorMessage && (
                <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action: Generate AI Suggestion */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleGenerateSuggestion()}
                  disabled={isLoading || !query.trim()}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-md ${
                    isLoading || !query.trim()
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 shadow-emerald-500/20 active:scale-95'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Consultando a Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Obtener Respuesta Sugerida (Gemini AI)</span>
                    </>
                  )}
                </button>

                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Recomendación técnica certificada</span>
                </span>
              </div>
            </div>

            {/* Suggested Response Output Box */}
            {suggestedResponse && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 shadow-inner space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-white">Respuesta Sugerida del Instructor</span>
                      <span className="text-[10px] text-emerald-400 block font-semibold">
                        {isAiGenerated ? 'Generada al instante por Gemini 3.8 Flash' : 'Asistencia rápida'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1 transition-colors"
                    title="Copiar texto"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[10px]">{copied ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>

                <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line font-normal">
                  {suggestedResponse}
                </div>

                {/* Confirm / Send Options */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                  <p className="text-[10px] text-slate-400">
                    ¿Te sirvió la sugerencia o preferís notificar al entrenador en recepción?
                  </p>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleSendToInstructor}
                      disabled={consultationSent}
                      className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                    >
                      {consultationSent ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>¡Notificación Enviada!</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Guardar en Notificaciones</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Direct Contact Footer */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                <span>¿Emergencia en sala? Avisá inmediatamente al staff.</span>
              </span>

              {trainer.phone && (
                <a
                  href={`https://wa.me/${trainer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${trainer.name}, soy ${currentUser?.name || 'socio'} de FuerzaFit. Tengo una duda sobre mi rutina "${activeRoutine.title}".`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 text-[11px]"
                >
                  <Phone className="w-3 h-3" />
                  <span>WhatsApp de {trainer.name.split(' ')[0]}</span>
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

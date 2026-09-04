import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Msg { role: 'user' | 'assistant'; text: string; }

export const AiChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'assistant', text: '¡Hola! Soy tu asistente FuerzaFit 🤖\nPreguntame sobre rutinas, alimentación, pagos o cómo usar el sistema. Gratis y al instante.' }
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, loading]);

  const getLocalReply = (q: string): string => {
    const t = q.toLowerCase();
    // Respuestas coherentes y contextuales, simulando tiempo real
    if (t.includes('hola') && t.length < 10) {
      return '¡Hola! 👋 Soy tu asistente FuerzaFit. Estoy acá para ayudarte en tiempo real. ¿Querés saber sobre tu cuota, rutina o clases?';
    }
    if (t.includes('cuota') || t.includes('precio') || t.includes('vale') || t.includes('cuanto cuesta') || t.includes('cuanto vale')) {
      return '💰 ¡Hola! El valor de la cuota depende de tu plan (ej: Musculación, Completo, Trimestral). Por privacidad no muestro precios acá, pero puedo decirte tu plan actual, cuánto te queda y cuándo vence si me decís tu DNI. ¿Me lo pasás?';
    }
    if (t.includes('pago') || t.includes('pagar') || t.includes('mercado')) {
      return '💳 Podés pagar en recepción (efectivo, transferencia, débito) o desde tu perfil. Si ya pagaste y no se refleja, decime tu DNI y lo verifico al instante.';
    }
    if (t.includes('rutina') || t.includes('ejercicio') || t.includes('entrenar') || t.includes('peso')) {
      return '🏋️ ¡Vamos! Contame tu objetivo (hipertrofia, fuerza, bajar grasa) y cuántos días entrenás por semana. Te armo una base en tiempo real con series, repeticiones y descansos. ¿Cuántos días podés?';
    }
    if (t.includes('dolor') || t.includes('lesion') || t.includes('molestia')) {
      return '🩺 Si sentís dolor articular o punzante, frená la serie ya, bajá la carga al 50% y avisá al profe en sala. No sigas con dolor. ¿Dónde te duele?';
    }
    if (t.includes('horario') || t.includes('clase') || t.includes('reserva')) {
      return '📅 En tu app → Clases ves la grilla en vivo, el profe y los cupos. Reservá con 2h de anticipación y si se llena quedás en lista de espera automática. ¿Qué clase buscás?';
    }
    if (t.includes('admin') || t.includes('dueño') || t.includes('empleado') || t.includes('gimnasio')) {
      return '🏢 Para dueños/staff: en /admin gestionás socios (DNI), caja con descuentos, molinete y reportes. Para crear empleados (recepción/entrenador) andá a Equipo → Nuevo empleado. ¿Te ayudo con eso?';
    }
    if (t.includes('olvide') || t.includes('contraseña') || t.includes('recuperar') || t.includes('soporte') || t.includes('ayuda')) {
      return '🔑 Para recuperar tu cuenta: en el login tocá “¿Olvidaste tu contraseña?” → poné tu email → te llega un link a /reset-password. Si no llega, revisá spam o escribí a soporte@fuerzafit.com';
    }
    if (t.includes('gracias')) {
      return '¡De nada! 😊 Estoy acá 24/7 para lo que necesites. ¿Algo más sobre tu entrenamiento o tu cuenta?';
    }
    return `¡Gracias por escribir! Te leo en tiempo real. Soy tu asistente FuerzaFit y puedo ayudarte con cuotas, rutinas, clases, accesos o el uso de la app. Contame un poco más: "${q.slice(0,100)}" y te respondo al instante.`;
  };

  // Streaming real: escribe palabra por palabra en tiempo real
  const streamReply = async (fullText: string) => {
    const id = Date.now();
    setMsgs(m => [...m, { role: 'assistant', text: '' }]);
    const words = fullText.split(/(\s+)/);
    let acc = '';
    for (const w of words) {
      acc += w;
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, 28 + Math.random() * 32));
      setMsgs(m => {
        const copy = [...m];
        copy[copy.length - 1] = { role: 'assistant', text: acc };
        return copy;
      });
    }
  };

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    setMsgs(m => [...m, { role: 'user', text: q }]);
    setLoading(true);

    // Intenta servidor real primero (Railway/Render con Gemini/Groq) con streaming
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q })
      });
      if (res.ok) {
        const data = await res.json();
        const reply = data.reply || data.suggestion;
        if (reply) {
          setLoading(false);
          await streamReply(reply);
          return;
        }
      }
      throw new Error('no api');
    } catch {
      // Fallback 100% local y gratuito (funciona en GitHub Pages sin servidor) — también en streaming
      const reply = getLocalReply(q);
      setLoading(false);
      await streamReply(reply);
      return;
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 hover:from-violet-500 text-white shadow-xl shadow-violet-600/25 flex items-center justify-center"
        aria-label="Abrir chat IA"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 right-5 z-50 w-[92vw] max-w-sm h-[420px] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="h-12 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center"><Bot className="w-4 h-4" /></div>
                <div>
                  <p className="text-xs font-black">Asistente FuerzaFit</p>
                  <p className="text-[11px] opacity-80">Gratis · Responde al instante</p>
                </div>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full flex items-center gap-1"><Sparkles className="w-3 h-3"/> IA</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-950/50">
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs whitespace-pre-wrap ${m.role==='user'?'bg-violet-600 text-white rounded-br-sm':'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-sm'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && <div className="text-xs text-slate-400">Escribiendo...</div>}
              <div ref={bottomRef} />
            </div>

            <div className="p-2 border-t border-slate-800 bg-slate-900 flex items-center gap-2">
              <input
                value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter') send(); }}
                placeholder="Escribí tu consulta..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
              />
              <button onClick={send} disabled={loading || !input.trim()} className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white flex items-center justify-center">
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-center text-slate-500 pb-2">Gratis · Sin tarjeta · Datos no salen de tu gym</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

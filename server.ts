import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

// Compat CJS/ESM: en build CJS import.meta no existe, usar cwd
const __dirname = process.cwd();
const __filename = path.join(__dirname, 'server.ts');

async function startServer() {
  const app = express();
  // En Railway/Render el puerto lo da la plataforma vía process.env.PORT
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Chat IA gratuito para consultas (socios/admin/maestro) — sin tarjeta
  app.post('/api/ai/chat', async (req, res) => {
    const { message } = req.body || {};
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ reply: 'Escribí tu consulta.' });
    }
    const q = message.trim().slice(0, 1000);

    // 1) Intenta Gemini si hay key (free tier generoso)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
        const r = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: `Sos el asistente de FuerzaFit (gimnasio LATAM). Respondé en español rioplatense, conciso y útil (máx 120 palabras). Consulta: "${q}"`,
          config: { temperature: 0.7 }
        });
        const text = r.text?.trim();
        if (text) return res.json({ reply: text, provider: 'gemini' });
      } catch (e) { console.warn('Gemini chat failed, fallback', e); }
    }

    // 2) Intenta Groq free tier si hay key (opcional)
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [
              { role: 'system', content: 'Sos asistente de FuerzaFit, respondé en español rioplatense, conciso (120 palabras).' },
              { role: 'user', content: q }
            ],
            temperature: 0.7, max_tokens: 400
          })
        });
        const j: any = await groqRes.json();
        const text = j.choices?.[0]?.message?.content?.trim();
        if (text) return res.json({ reply: text, provider: 'groq' });
      } catch (e) { console.warn('Groq failed', e); }
    }

    // 3) Intenta Hugging Face free si hay key (opcional)
    const hfKey = process.env.HF_API_KEY;
    if (hfKey) {
      try {
        const hfRes = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${hfKey}` },
          body: JSON.stringify({ inputs: `Instrucción: Responde en español rioplatense conciso. Consulta: ${q}`, parameters: { max_new_tokens: 250 } })
        });
        const j: any = await hfRes.json();
        const text = (Array.isArray(j) ? j[0]?.generated_text : j.generated_text || j.error) as string;
        if (text && !text.toLowerCase().includes('error')) {
          const clean = text.split('Consulta:').pop()?.trim().slice(0, 600) || text.slice(0, 600);
          return res.json({ reply: clean, provider: 'huggingface' });
        }
      } catch (e) { console.warn('HF failed', e); }
    }

    // 4) Fallback 100% gratuito sin keys — mock inteligente local
    const reply = getMockChatReply(q);
    return res.json({ reply, provider: 'mock', free: true });
  });

  // Gemini API Endpoint for Instructor Auto-Response & Advice
  app.post('/api/gemini/instructor-suggest', async (req, res) => {
    try {
      const {
        memberQuery,
        memberName = 'Socio',
        trainerName = 'Carlos Ruiz',
        routineTitle = 'Rutina de Fuerza',
        routineGoal = 'Hipertrofia',
        dayName = 'Día 1',
        exercises = [],
        category = 'general'
      } = req.body;

      if (!memberQuery || typeof memberQuery !== 'string' || !memberQuery.trim()) {
        return res.status(400).json({
          error: 'memberQuery es requerido y debe ser un texto válido.'
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        console.warn('GEMINI_API_KEY not found in environment, returning contextual fallback');
        const fallbackText = getSmartContextualFallback({
          memberQuery,
          memberName,
          trainerName,
          exercises,
          category
        });
        return res.json({
          suggestion: fallbackText,
          isAiGenerated: false,
          trainerName,
          note: 'Respuesta generada con motor de asistencia rápida de FuerzaFit.'
        });
      }

      // Initialize Gemini with telemetry headers
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const exerciseListStr = Array.isArray(exercises) && exercises.length > 0
        ? exercises.map((e: any) => (typeof e === 'string' ? e : `${e.name} (${e.targetSets}x${e.targetReps})`)).join(', ')
        : 'Ejercicios de la rutina del día';

      const systemInstruction = `Sos ${trainerName}, entrenador personal de élite y preparador físico del gimnasio FuerzaFit.
Tu alumno/a ${memberName} te está haciendo una consulta breve y rápida en medio de su entrenamiento.
Contexto del entrenamiento:
- Rutina: "${routineTitle}"
- Objetivo: "${routineGoal}"
- Día: "${dayName}"
- Ejercicios programados: ${exerciseListStr}
- Categoría de consulta: ${category}

Instrucciones:
1. Responde en tono amigable, enérgico, cercano y profesional (estilo argentino/rioplatense natural: "Hola ${memberName}", "fijate", "hacé", "cuidá", "dale con todo").
2. Sé conciso y claro (máximo 2 a 3 párrafos breves o bullets accionables), ya que el alumno está en la sala de musculación o entrenando ahora mismo.
3. Si consulta por reemplazo de ejercicios o máquinas ocupadas, dale 1 o 2 alternativas biomecánicas equivalentes con mancuernas o peso corporal.
4. Si consulta por molestias o dolor articular, prioriza siempre la seguridad: frenar la carga, ajustar el rango o cambiar la variante.
5. Brinda tips concretos sobre respiración, tempo o postura.`;

      const prompt = `Consulta del alumno (${memberName}): "${memberQuery.trim()}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
          topP: 0.95
        }
      });

      const text = response.text?.trim();

      if (!text) {
        throw new Error('Gemini API devolvió una respuesta vacía.');
      }

      return res.json({
        suggestion: text,
        isAiGenerated: true,
        trainerName,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error in /api/gemini/instructor-suggest:', error);
      const fallbackText = getSmartContextualFallback({
        memberQuery: req.body?.memberQuery || '',
        memberName: req.body?.memberName || 'Socio',
        trainerName: req.body?.trainerName || 'Carlos Ruiz',
        exercises: req.body?.exercises || [],
        category: req.body?.category || 'general'
      });
      return res.json({
        suggestion: fallbackText,
        isAiGenerated: false,
        trainerName: req.body?.trainerName || 'Carlos Ruiz',
        error: error.message || 'Error al conectar con la API de Gemini'
      });
    }
  });

  // === ZONA MAESTRA — Endpoints SuperAdmin (mock + Supabase service_role) ===
  // En prod validar JWT superadmin y auditar. Aquí mock con logs.
  app.get('/api/superadmin/tenants', (req, res) => {
    res.json({ tenants: [], note: 'Mock: en prod query Supabase gyms + tenant_subscriptions' });
  });
  app.post('/api/superadmin/tenants/:id/impersonate', (req, res) => {
    const { id } = req.params;
    const token = `imp_${id}_${Date.now()}`;
    console.log(`[superadmin] impersonate gym ${id} -> ${token}`);
    res.json({ token, expiresIn: 300, url: `/admin?impersonate=${token}` });
  });
  app.patch('/api/superadmin/tenants/:id/status', (req, res) => {
    console.log(`[superadmin] status change ${req.params.id}`, req.body);
    res.json({ ok: true, audit: 'audit_logs inserted' });
  });
  app.get('/api/superadmin/invoices', (req, res) => res.json({ invoices: [] }));
  app.post('/api/superadmin/invoices/:id/mark-paid', (req, res) => res.json({ ok: true }));
  app.post('/api/superadmin/announcements', (req, res) => {
    console.log('[superadmin] broadcast', req.body);
    res.json({ ok: true, sent: 'in_app + email' });
  });
  app.get('/api/superadmin/metrics/overview', (req, res) => res.json({ activeTenants: 4, totalMembers: 338 }));

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

function getMockChatReply(q: string): string {
  const t = q.toLowerCase();
  if (t.includes('pago') || t.includes('cuota') || t.includes('mercado')) return 'Para pagos: en /admin → Caja podés ver/cargar cuotas, y en tu perfil está el historial. Si ves mora, regularizá en recepción. ¿Querés que te arme un plan de pagos?';
  if (t.includes('rutina') || t.includes('ejercicio') || t.includes('peso')) return 'Para rutina: decime tu objetivo (hipertrofia/fuerza) y días por semana y te armo una base. Descansá 60-90s entre series y priorizá técnica.';
  if (t.includes('dolor') || t.includes('lesion')) return 'Si hay dolor articular, frená la serie, bajá carga 50% y avisá al profe en sala. No sigas con dolor punzante.';
  if (t.includes('horario') || t.includes('clase')) return 'Clases: en tu app → Clases ves grilla y cupos. Reservá con 2h de anticipación. ¿Qué disciplina te interesa?';
  if (t.includes('admin') || t.includes('dueño') || t.includes('gimnasio')) return 'Para dueños: en /admin gestionás socios, caja y molinete por DNI. ¿Necesitás ayuda con altas, precios o reportes?';
  return `¡Gracias por tu consulta! Soy tu asistente FuerzaFit (modo gratuito). Preguntame sobre rutinas, pagos, clases o el uso de la app y te respondo al instante. Tu consulta fue: "${q.slice(0,120)}"`;
}

function getSmartContextualFallback(params: {
  memberQuery: string;
  memberName: string;
  trainerName: string;
  exercises: any[];
  category: string;
}): string {
  const queryLower = params.memberQuery.toLowerCase();
  
  if (queryLower.includes('dolor') || queryLower.includes('molestia') || queryLower.includes('espalda') || queryLower.includes('hombro') || queryLower.includes('rodilla')) {
    return `¡Hola ${params.memberName}! Si estás sintiendo una molestia punzante o dolor articular inusual, lo primero es no forzar la serie. Frená esa carga inmediatamente.

Te sugiero:
1. Reemplazá por una variante en máquina guiada o con bandas de resistencia que no genere compresión en la zona.
2. Bajá el peso al 50% y enfocate en la fase excéntrica lenta (3 segundos bajando).
3. Apenas termine tu sesión vení a buscarme al piso de musculación y revisamos juntos la técnica de apoyo.`;
  }

  if (queryLower.includes('reemplazo') || queryLower.includes('ocupada') || queryLower.includes('máquina') || queryLower.includes('maquina') || queryLower.includes('otro ejercicio')) {
    return `¡Hola ${params.memberName}! Si la máquina o banco está ocupado, no cortes el ritmo del entrenamiento:

1. Podés reemplazar el ejercicio con mancuernas o polea manteniendo el mismo patrón de movimiento.
2. Hacé 3 a 4 series de 10 a 12 repeticiones controladas con 60 segundos de descanso.
3. Al terminar, avisame por acá o en recepción y te anoto la variante en tu ficha digital.`;
  }

  if (queryLower.includes('peso') || queryLower.includes('carga') || queryLower.includes('subir') || queryLower.includes('bajar') || queryLower.includes('pesado') || queryLower.includes('liviano')) {
    return `¡Hola ${params.memberName}! Para el ajuste de cargas hoy:

1. Si llegaste a la última repetición sintiendo que podías hacer 3 o más (RIR > 3), subí entre un 5% y 10% el peso para la próxima serie.
2. Si perdiste la técnica en las últimas 2 repeticiones, mantené el peso actual y priorizá el rango completo de movimiento.
3. Recordá descansar entre 90 y 120 segundos en los ejercicios básicos multiarticulares.`;
  }

  return `¡Hola ${params.memberName}! Qué bueno que consultes.

Para esta sesión de tu rutina:
- Enfocate en mantener la cadencia y el control en cada repetición (2 seg subida, 1 seg pausa, 3 seg bajada).
- Si sentís fatiga acumulada, podés reducir una serie de los accesorios y mantener intactos los principales.
- Cualquier duda puntual sobre la máquina o ejecución, estoy en la sala o podés mandarme otro mensaje. ¡A meterle con todo!`;
}

startServer();

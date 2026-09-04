import { MuscleGroup } from '../types';

export interface ExerciseLibraryItem {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  defaultSets: number;
  defaultReps: string;
  defaultWeightKg: number;
  defaultRestSeconds: number;
  videoUrl?: string;
  instructions: string;
}

export const EXERCISE_LIBRARY: ExerciseLibraryItem[] = [
  // Pecho
  {
    id: 'lib-bench-press',
    name: 'Press de Banca Plano con Barra',
    muscleGroup: 'pecho',
    defaultSets: 4,
    defaultReps: '8-10',
    defaultWeightKg: 60,
    defaultRestSeconds: 90,
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-doing-bench-press-with-a-barbell-40294-large.mp4',
    instructions: 'Retracción escapular, apoyar firmemente pies en el suelo, descender la barra al esternón medio con control.'
  },
  {
    id: 'lib-incline-db-press',
    name: 'Press Inclinado con Mancuernas (30°)',
    muscleGroup: 'pecho',
    defaultSets: 3,
    defaultReps: '10-12',
    defaultWeightKg: 22,
    defaultRestSeconds: 75,
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-training-with-dumbbells-in-a-gym-40290-large.mp4',
    instructions: 'Banco a 30 grados, codos a 45 grados respecto al torso, apretar en el punto de contracción superior.'
  },
  {
    id: 'lib-cable-crossover',
    name: 'Cruces en Polea Media / Pec Deck',
    muscleGroup: 'pecho',
    defaultSets: 3,
    defaultReps: '12-15',
    defaultWeightKg: 15,
    defaultRestSeconds: 60,
    instructions: 'Leve flexión de codos constante durante todo el recorrido, buscar máxima elongación sin hiperextender.'
  },

  // Espalda
  {
    id: 'lib-barbell-row',
    name: 'Remo con Barra Prono (Pendlay / 45°)',
    muscleGroup: 'espalda',
    defaultSets: 4,
    defaultReps: '8-10',
    defaultWeightKg: 50,
    defaultRestSeconds: 90,
    instructions: 'Espalda recta, activar dorsal llevando los codos hacia la cadera, evitar balancear el tronco.'
  },
  {
    id: 'lib-lat-pulldown',
    name: 'Jalón al Pecho en Polea Alta',
    muscleGroup: 'espalda',
    defaultSets: 4,
    defaultReps: '10-12',
    defaultWeightKg: 45,
    defaultRestSeconds: 60,
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-working-out-with-a-cable-machine-40293-large.mp4',
    instructions: 'Pecho erguido, traccionar hasta la altura de las clavículas y controlar el retorno excéntrico.'
  },
  {
    id: 'lib-deadlift',
    name: 'Peso Muerto Convencional / Rumano',
    muscleGroup: 'espalda',
    defaultSets: 4,
    defaultReps: '6-8',
    defaultWeightKg: 80,
    defaultRestSeconds: 120,
    instructions: 'Empuje desde el suelo con los talones, mantener la barra pegada a las tibias, columna neutra en todo momento.'
  },

  // Piernas
  {
    id: 'lib-barbell-squat',
    name: 'Sentadilla Trasera con Barra (Barbell Squat)',
    muscleGroup: 'piernas',
    defaultSets: 4,
    defaultReps: '8-10',
    defaultWeightKg: 70,
    defaultRestSeconds: 120,
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-doing-squats-with-a-barbell-40287-large.mp4',
    instructions: 'Pies al ancho de hombros con puntas ligeramente hacia afuera, romper el paralelo manteniendo el pecho alto.'
  },
  {
    id: 'lib-leg-press',
    name: 'Prensa Inclinada a 45°',
    muscleGroup: 'piernas',
    defaultSets: 3,
    defaultReps: '12-15',
    defaultWeightKg: 120,
    defaultRestSeconds: 90,
    instructions: 'Pies en el centro de la plataforma, bajar profundo sin despegar la zona lumbar del respaldo.'
  },
  {
    id: 'lib-leg-curl',
    name: 'Sillón de Cuádriceps & Camilla Isquios',
    muscleGroup: 'piernas',
    defaultSets: 3,
    defaultReps: '12-15',
    defaultWeightKg: 35,
    defaultRestSeconds: 60,
    instructions: 'Pausa isométrica de 1 segundo en contracción, retorno controlado en 3 segundos.'
  },

  // Hombros
  {
    id: 'lib-overhead-press',
    name: 'Press Militar con Barra / Mancuernas',
    muscleGroup: 'hombros',
    defaultSets: 4,
    defaultReps: '8-10',
    defaultWeightKg: 35,
    defaultRestSeconds: 90,
    instructions: 'Core y glúteos contraídos, empujar hacia arriba bloqueando la barra alineada sobre la cabeza.'
  },
  {
    id: 'lib-lateral-raises',
    name: 'Elevaciones Laterales con Mancuernas',
    muscleGroup: 'hombros',
    defaultSets: 4,
    defaultReps: '12-15',
    defaultWeightKg: 10,
    defaultRestSeconds: 60,
    instructions: 'Dirigir el movimiento con los codos ligeramente por delante del torso (plano escapular).'
  },

  // Brazos
  {
    id: 'lib-bicep-curl',
    name: 'Curl de Bíceps con Barra Z o Mancuernas',
    muscleGroup: 'brazos',
    defaultSets: 3,
    defaultReps: '10-12',
    defaultWeightKg: 20,
    defaultRestSeconds: 60,
    instructions: 'Codos pegados al cuerpo, supinación completa de muñeca en el punto más alto.'
  },
  {
    id: 'lib-tricep-pushdown',
    name: 'Extensiones de Tríceps en Polea con Cuerda',
    muscleGroup: 'brazos',
    defaultSets: 3,
    defaultReps: '12-15',
    defaultWeightKg: 20,
    defaultRestSeconds: 60,
    instructions: 'Separar las cuerdas en el extremo inferior para máxima activación de la cabeza lateral del tríceps.'
  },

  // Core
  {
    id: 'lib-plank',
    name: 'Plancha Isométrica Abdominal',
    muscleGroup: 'core',
    defaultSets: 3,
    defaultReps: '45-60 seg',
    defaultWeightKg: 0,
    defaultRestSeconds: 45,
    instructions: 'Cuerpo en línea recta de cabeza a talones, respiración fluida y pelvis en retroversión.'
  },
  {
    id: 'lib-hanging-leg-raise',
    name: 'Elevaciones de Piernas Colgado en Barra',
    muscleGroup: 'core',
    defaultSets: 3,
    defaultReps: '12-15',
    defaultWeightKg: 0,
    defaultRestSeconds: 60,
    instructions: 'Evitar el balanceo impulsivo, flexionar la cadera acercando la pelvis a las costillas.'
  }
];

import {
  User,
  SubscriptionPlan,
  Membership,
  Payment,
  ExerciseLibraryItem,
  Routine,
  GroupClass,
  GymBranch,
  GymNotification,
  AttendanceRecord,
  UserProgressMetric,
  WorkoutSessionLog
} from '../types';

/**
 * ----------------------------------------------------------------------------
 * FUERZAFIT - CONFIGURACIÓN LIMPIA PARA PUESTA EN MARCHA DE GIMNASIOS
 * ----------------------------------------------------------------------------
 * Este archivo inicializa el sistema sin socios de prueba ni registros ficticios,
 * permitiendo ingresar inmediatamente como Administrador para configurar el gimnasio
 * y luego registrar y dar de alta socios reales para evaluar la plataforma.
 */

export const INITIAL_BRANCHES: GymBranch[] = [
  {
    id: 'branch-1',
    code: 'GYM-CENTRAL-2026',
    name: 'Sede Central',
    address: 'Av. Principal 1000',
    city: 'Ciudad',
    phone: '+54 11 4000-0000',
    isOpen: true,
    currentOccupancy: 0,
    maxCapacity: 100,
    openingHours: 'Lun a Vie 06:30 - 22:30 | Sáb 08:00 - 20:00'
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin',
    name: 'Administrador del Gimnasio',
    email: 'admin@fuerzafit.com',
    phone: '+54 9 11 0000-0000',
    dni: '10000000',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    branchId: 'branch-1',
    createdAt: new Date().toISOString(),
    notes: 'Cuenta Principal de Administración',
    isEmailVerified: true
  }
];

export const INITIAL_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-musculacion',
    name: 'Pase Libre Musculación',
    description: 'Acceso total y libre al sector de máquinas de fuerza, peso libre y cardio.',
    durationMonths: 1,
    billingCycle: 'monthly',
    priceARS: 35000,
    benefits: [
      'Acceso ilimitado a sala de musculación y cardio',
      'Pase de acceso digital con código QR dinámico',
      'Rutina personalizada y seguimiento en la app',
      'Vestuarios, duchas y casilleros'
    ],
    gracePeriodDays: 3,
    isPopular: true,
    branchIds: ['branch-1'],
    active: true
  },
  {
    id: 'plan-completo',
    name: 'Pase Completo (Musculación + Clases)',
    description: 'Acceso ilimitado a sala de máquinas y reserva de todas las clases grupales.',
    durationMonths: 1,
    billingCycle: 'monthly',
    priceARS: 45000,
    benefits: [
      'Acceso ilimitado a musculación y cardio',
      'Clases grupales incluidas (Spinning, Funcional, Yoga)',
      'Reserva de cupos online desde la app',
      'Pase de acceso digital QR'
    ],
    gracePeriodDays: 3,
    isPopular: false,
    branchIds: ['branch-1'],
    active: true
  },
  {
    id: 'plan-trimestral',
    name: 'Plan Trimestral (-15% Off)',
    description: '3 meses completos con congelamiento de cuota y acceso total.',
    durationMonths: 3,
    billingCycle: 'quarterly',
    priceARS: 89000,
    benefits: [
      'Precio congelado por 90 días',
      'Acceso libre a sala de musculación y clases',
      'Pase de acceso digital con código QR'
    ],
    gracePeriodDays: 5,
    isPopular: false,
    branchIds: ['branch-1'],
    active: true
  }
];

export const INITIAL_MEMBERSHIPS: Membership[] = [];

export const INITIAL_PAYMENTS: Payment[] = [];

export const EXERCISE_LIBRARY: ExerciseLibraryItem[] = [
  {
    id: 'ex-bench-press',
    name: 'Press de Banca Plano con Barra',
    muscleGroup: 'pecho',
    equipment: 'Barra Olímpica y Banco Plano',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-athlete-lifting-weights-on-a-bench-press-40286-large.mp4',
    instructions: 'Apoyá los pies firmes en el suelo, retracción escapular, bajá la barra al esternón de forma controlada y empujá con potencia.',
    difficulty: 'Intermedio'
  },
  {
    id: 'ex-incline-db-press',
    name: 'Press Inclinado con Mancuernas',
    muscleGroup: 'pecho',
    equipment: 'Mancuernas y Banco Inclinado (30-45°)',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-working-out-with-dumbbells-in-a-gym-40289-large.mp4',
    instructions: 'Banco a 30-45°. Bajá las mancuernas abriendo los codos a 60-70° del torso y extendé arriba buscando contracción.',
    difficulty: 'Intermedio'
  },
  {
    id: 'ex-squat',
    name: 'Sentadilla Trasera con Barra (Back Squat)',
    muscleGroup: 'piernas',
    equipment: 'Rack y Barra Olímpica',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-doing-squats-with-a-barbell-40287-large.mp4',
    instructions: 'Pies al ancho de hombros, puntas ligeramente abiertas. Rompé el paralelo manteniendo la espalda neutra y el core apretado.',
    difficulty: 'Avanzado'
  },
  {
    id: 'ex-romanian-deadlift',
    name: 'Peso Muerto Rumano (RDL)',
    muscleGroup: 'piernas',
    equipment: 'Barra o Mancuernas',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-athletic-woman-exercising-with-a-barbell-40292-large.mp4',
    instructions: 'Bisagra de cadera. Empujá la cadera hacia atrás con mínima flexión de rodillas y columna perfectamente alineada.',
    difficulty: 'Intermedio'
  },
  {
    id: 'ex-leg-press',
    name: 'Prensa 45° de Piernas',
    muscleGroup: 'piernas',
    equipment: 'Máquina Prensa 45°',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-athlete-lifting-weights-on-a-bench-press-40286-large.mp4',
    instructions: 'Colocá los pies al centro de la plataforma. Bajá profundo sin despegar la zona lumbar del respaldo.',
    difficulty: 'Principiante'
  },
  {
    id: 'ex-lat-pulldown',
    name: 'Jalón al Pecho en Polea',
    muscleGroup: 'espalda',
    equipment: 'Polea Alta con Barra Ancha',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-exercising-on-parallel-bars-40291-large.mp4',
    instructions: 'Agarre prono más ancho que hombros. Llevá la barra a la parte superior del pecho juntando las escápulas.',
    difficulty: 'Principiante'
  },
  {
    id: 'ex-barbell-row',
    name: 'Remo con Barra Inclinado (Pendlay / 45°)',
    muscleGroup: 'espalda',
    equipment: 'Barra Olímpica con Discos',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-athletic-woman-exercising-with-a-barbell-40292-large.mp4',
    instructions: 'Torso inclinado a 45-60°, espalda recta. Traccioná con los codos pegados al cuerpo hacia el ombligo.',
    difficulty: 'Intermedio'
  },
  {
    id: 'ex-military-press',
    name: 'Press Militar de Pie con Barra (OHP)',
    muscleGroup: 'hombros',
    equipment: 'Barra Olímpica',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-athlete-lifting-weights-on-a-bench-press-40286-large.mp4',
    instructions: 'Core y glúteos apretados. Empujá verticalmente hasta bloquear codos arriba de la cabeza.',
    difficulty: 'Avanzado'
  },
  {
    id: 'ex-lateral-raises',
    name: 'Elevaciones Laterales con Mancuernas',
    muscleGroup: 'hombros',
    equipment: 'Mancuernas Ligeras',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-working-out-with-dumbbells-in-a-gym-40289-large.mp4',
    instructions: 'Codos ligeramente flexionados. Elevá hasta la horizontal manteniendo muñecas neutras y controlando la bajada.',
    difficulty: 'Principiante'
  },
  {
    id: 'ex-bicep-curl',
    name: 'Curl de Bíceps con Barra Z',
    muscleGroup: 'brazos',
    equipment: 'Barra W / Z',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-working-out-with-dumbbells-in-a-gym-40289-large.mp4',
    instructions: 'Codos pegados a los costados. Flexioná sin balancear la espalda y apretá el bíceps en el punto máximo.',
    difficulty: 'Principiante'
  },
  {
    id: 'ex-tricep-pushdown',
    name: 'Extensión de Tríceps en Polea Alta',
    muscleGroup: 'brazos',
    equipment: 'Polea Alta con Cuerda o Barra Recta',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-exercising-on-parallel-bars-40291-large.mp4',
    instructions: 'Codos fijos a los laterales. Extendé por completo los antebrazos separando la cuerda al final.',
    difficulty: 'Principiante'
  },
  {
    id: 'ex-plank',
    name: 'Plancha Abdominal Isométrica (Core)',
    muscleGroup: 'core',
    equipment: 'Colchoneta',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-athletic-woman-exercising-with-a-barbell-40292-large.mp4',
    instructions: 'Cuerpo en línea recta desde la cabeza a los talones. Contraé abdomen y glúteos sin arquear la zona lumbar.',
    difficulty: 'Principiante'
  }
];

export const INITIAL_ROUTINES: Routine[] = [
  {
    id: 'rt-base-fuerza',
    title: 'Rutina Base de Adaptación General',
    description: 'Rutina integral cuerpo completo (Full-Body) diseñada para las primeras 4 semanas.',
    level: 'principiante',
    goal: 'fuerza',
    assignedUserIds: [],
    isTemplate: true,
    creatorName: 'Staff FuerzaFit',
    createdAt: new Date().toISOString(),
    days: [
      {
        id: 'day-1',
        name: 'Día 1: Empuje & Cuádriceps',
        blocks: [
          {
            id: 'blk-1',
            name: 'Fuerza Principal',
            exercises: [
              {
                id: 'rex-1',
                exerciseId: 'ex-squat',
                name: 'Sentadilla Libre con Barra (Squat)',
                muscleGroup: 'piernas',
                targetSets: 3,
                targetReps: '10-12',
                restSeconds: 90
              },
              {
                id: 'rex-2',
                exerciseId: 'ex-bench-press',
                name: 'Press de Pecho Plano con Barra',
                muscleGroup: 'pecho',
                targetSets: 3,
                targetReps: '10-12',
                restSeconds: 90
              }
            ]
          }
        ]
      },
      {
        id: 'day-2',
        name: 'Día 2: Tracción & Brazos',
        blocks: [
          {
            id: 'blk-2',
            name: 'Tracción',
            exercises: [
              {
                id: 'rex-3',
                exerciseId: 'ex-lat-pulldown',
                name: 'Jalón al Pecho en Polea Alta',
                muscleGroup: 'espalda',
                targetSets: 3,
                targetReps: '10-12',
                restSeconds: 75
              },
              {
                id: 'rex-4',
                exerciseId: 'ex-bicep-curl',
                name: 'Curl de Bíceps con Barra W',
                muscleGroup: 'brazos',
                targetSets: 3,
                targetReps: '12',
                restSeconds: 60
              }
            ]
          }
        ]
      }
    ]
  }
];

export const INITIAL_CLASSES: GroupClass[] = [
  {
    id: 'cls-1',
    title: 'Entrenamiento Funcional & HIIT',
    instructorName: 'Profesor de Turno',
    instructorId: 'usr-admin',
    category: 'Funcional',
    date: new Date().toISOString().split('T')[0],
    startTime: '19:00',
    endTime: '20:00',
    capacity: 20,
    branchId: 'branch-1',
    room: 'Sala Principal',
    enrolledUserIds: [],
    waitingListUserIds: [],
    colorTag: 'emerald'
  },
  {
    id: 'cls-2',
    title: 'Spinning / Indoor Cycling',
    instructorName: 'Profesor de Turno',
    instructorId: 'usr-admin',
    category: 'Spinning',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:30',
    endTime: '09:20',
    capacity: 15,
    branchId: 'branch-1',
    room: 'Sala Ciclo',
    enrolledUserIds: [],
    waitingListUserIds: [],
    colorTag: 'amber'
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

export const INITIAL_PROGRESS: UserProgressMetric[] = [];

export const INITIAL_WORKOUT_LOGS: WorkoutSessionLog[] = [];

export const INITIAL_NOTIFICATIONS: GymNotification[] = [];

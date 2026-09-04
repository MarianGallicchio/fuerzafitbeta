export type UserRole = 'superadmin' | 'admin' | 'reception' | 'trainer' | 'member';

export interface GymTenant {
  id: string;
  name: string;
  slug: string;
  ownerUserId?: string;
  plan: 'free' | 'beta' | 'pro';
  status: 'active' | 'suspended' | 'trial';
  createdAt: string;
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface User {
  id: string;
  gymId?: string;
  name: string;
  email: string;
  phone: string;
  dni?: string;
  role: UserRole;
  avatarUrl?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  birthDate?: string;
  medicalClearance?: boolean; // Apto físico
  medicalClearanceExpiry?: string;
  branchId: string;
  createdAt: string;
  notes?: string;
  isEmailVerified?: boolean;
}

export type BillingCycle = 'monthly' | 'quarterly' | 'biannual' | 'annual' | 'single_pass';

export interface SubscriptionPlan {
  id: string;
  gymId?: string;
  name: string;
  description: string;
  durationMonths: number;
  billingCycle: BillingCycle;
  priceARS: number;
  benefits: string[];
  gracePeriodDays: number;
  maxClassesPerWeek?: number; // Unlimited if undefined
  isPopular?: boolean;
  branchIds: string[];
  active: boolean;
}

export type MembershipStatus = 'active' | 'expired' | 'suspended' | 'pending_payment';

export interface Membership {
  id: string;
  gymId?: string;
  userId: string;
  planId: string;
  status: MembershipStatus;
  startDate: string; // ISO date
  endDate: string; // ISO date
  autoRenew: boolean;
  qrToken: string;
  graceUntil?: string;
  branchId: string;
  lastPaymentId?: string;
}

export type PaymentMethod = 'mercadopago' | 'cash' | 'transfer' | 'debit_card';
export type PaymentStatus = 'approved' | 'pending' | 'rejected' | 'refunded';

// Motivos de descuento (primera cuota, promos, convenios). Se guarda el texto libre.
export const DISCOUNT_REASONS = [
  'Primera cuota / Bienvenida',
  'Promo / Referido',
  'Plan familiar',
  'Empleado / Convenio',
  'Beca deportiva',
  'Ajuste comercial'
] as const;

export interface Payment {
  id: string;
  gymId?: string;
  userId: string;
  userName: string;
  userEmail: string;
  planId: string;
  planName: string;
  amountARS: number;
  currency: 'ARS';
  method: PaymentMethod;
  status: PaymentStatus;
  discountARS?: number; // Monto descontado (0 si no hubo). amountARS = neto cobrado.
  discountReason?: string; // Motivo del descuento (ver DISCOUNT_REASONS)
  paymentDate: string;
  transactionId: string;
  idempotencyKey: string;
  mpPaymentId?: string;
  mpPreferenceId?: string;
  rawGatewayPayload?: any;
  receiptUrl?: string;
  notes?: string;
}

export type MuscleGroup = 'pecho' | 'espalda' | 'piernas' | 'hombros' | 'brazos' | 'core' | 'cardio';

export interface ExerciseLibraryItem {
  id: string;
  gymId?: string;
  isGlobal?: boolean;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: string;
  videoUrl: string;
  thumbnailUrl?: string;
  instructions: string;
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzado';
}

export interface SetLog {
  setNumber: number;
  reps: number;
  weightKg: number;
  completed: boolean;
}

export interface RoutineExercise {
  id: string;
  exerciseId: string;
  name: string;
  muscleGroup: MuscleGroup;
  targetSets: number;
  targetReps: string; // e.g. "10-12" or "Fallo"
  weightKgSuggested?: number;
  restSeconds: number;
  videoUrl?: string;
  instructions?: string;
  notes?: string;
  completedSets?: SetLog[];
}

export interface RoutineBlock {
  id: string;
  name: string; // e.g., "Calentamiento", "Fuerza Principal", "Accesorios", "Metcon"
  exercises: RoutineExercise[];
}

export interface RoutineDay {
  id: string;
  name: string; // e.g. "Día 1: Empuje (Pecho / Tríceps)", "Día 2: Piernas"
  dayOfWeek?: string;
  blocks: RoutineBlock[];
}

export type FitnessGoal = 'hipertrofia' | 'fuerza' | 'perdida_grasa' | 'funcional' | 'resistencia' | 'salud';
export type ExperienceLevel = 'principiante' | 'intermedio' | 'avanzado';

export interface Routine {
  id: string;
  gymId?: string;
  title: string;
  goal: FitnessGoal;
  level: ExperienceLevel;
  assignedUserIds: string[];
  days: RoutineDay[];
  isTemplate: boolean;
  createdAt: string;
  creatorName: string;
  description?: string;
}

export type ClassCategory = 'CrossFit' | 'Spinning' | 'Funcional' | 'Yoga' | 'Pilates' | 'Musculación' | 'HIIT' | 'Boxeo';

export interface GroupClass {
  id: string;
  gymId?: string;
  title: string;
  instructorName: string;
  instructorId: string;
  category: ClassCategory;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  capacity: number;
  branchId: string;
  room: string;
  enrolledUserIds: string[];
  waitingListUserIds: string[];
  colorTag: string;
}

export interface ClassBooking {
  id: string;
  gymId?: string;
  classId: string;
  userId: string;
  status: 'confirmed' | 'cancelled' | 'attended' | 'absent';
  bookedAt: string;
}

export interface AttendanceRecord {
  id: string;
  gymId?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  timestamp: string;
  accessMethod: 'qr_scanner' | 'manual_checkin' | 'turnstile';
  status: 'granted' | 'denied';
  reason?: string;
  branchId: string;
  planName?: string;
}

export interface UserProgressMetric {
  id: string;
  gymId?: string;
  userId: string;
  date: string;
  weightKg: number;
  bodyFatPercent?: number;
  chestCm?: number;
  waistCm?: number;
  armsCm?: number;
  legsCm?: number;
  notes?: string;
  photoUrl?: string;
}

export interface WorkoutSessionLog {
  id: string;
  gymId?: string;
  userId: string;
  routineId: string;
  routineName: string;
  dayName: string;
  date: string;
  durationMinutes: number;
  totalVolumeKg: number;
  completedExercisesCount: number;
  notes?: string;
  rating?: number; // 1-5
  caloriesBurned?: number;
}

export interface GymNotification {
  id: string;
  gymId?: string;
  userId: string | 'all';
  title: string;
  message: string;
  type: 'membership' | 'class' | 'routine' | 'announcement' | 'payment';
  read: boolean;
  createdAt: string;
  actionLink?: string;
}

export interface GymBranch {
  id: string;
  gymId?: string;
  code: string; // Unique invitation/affiliation code, e.g. "FZF-PALERMO-2026"
  name: string;
  address: string;
  city: string;
  phone: string;
  isOpen: boolean;
  currentOccupancy: number;
  maxCapacity: number;
  openingHours: string;
}

// Analytics interfaces for Retention & Occupancy
export interface MonthlyRetentionData {
  monthKey: string; // "YYYY-MM"
  monthLabel: string; // "Ene 2026", "Feb 2026", etc.
  startActive: number; // Socios activos al inicio de mes
  newMembers: number; // Nuevas altas en el mes
  endActive: number; // Socios activos al cierre de mes
  retainedMembers: number; // Socios que continuaron activos (endActive - newMembers)
  retentionRate: number; // % retención: (endActive - newMembers) / startActive * 100
  churnRate: number; // % fuga: 100 - retentionRate
}

export interface HourlyOccupancyData {
  timeSlot: string; // "07:00 - 08:00"
  hour: number; // 7, 8, 9...
  avgOccupancyRate: number; // % promedio de ocupación
  totalCapacity: number; // Capacidad sumada de las clases en esa franja
  totalEnrolled: number; // Inscriptos totales sumados
  classCount: number; // Cantidad de clases dictadas en esa franja
}

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  User,
  GymTenant,
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
  WorkoutSessionLog,
  PaymentMethod,
  UserRole
} from '../types';
import {
  getGymTenant,
  getAllGyms,
  createGymTenant,
  loadGymData,
  persistNewMember,
  persistPaymentAndMembership,
  persistManualPaymentRecord,
  approvePendingPaymentInSupabase,
  rejectPendingPaymentInSupabase,
  recordAttendanceCheckin,
  persistPlan,
  persistRoutine,
  persistNotification,
  persistClassBooking,
  persistNewClass,
  signUpMemberAuthAccount
} from '../services/supabaseService';
import { isDemoModeEnabled } from '../lib/appMode';
import { normalizePhoneE164 } from '../lib/phone';
import {
  INITIAL_BRANCHES,
  INITIAL_USERS,
  INITIAL_PLANS,
  INITIAL_MEMBERSHIPS,
  INITIAL_PAYMENTS,
  EXERCISE_LIBRARY,
  INITIAL_ROUTINES,
  INITIAL_CLASSES,
  INITIAL_ATTENDANCE,
  INITIAL_PROGRESS,
  INITIAL_WORKOUT_LOGS,
  INITIAL_NOTIFICATIONS
} from '../data/mockData';

interface QrValidationResult {
  allowed: boolean;
  user?: User;
  membership?: Membership;
  plan?: SubscriptionPlan;
  message: string;
  reasonCode?: 'ACTIVE' | 'EXPIRED_GRACE' | 'EXPIRED_BLOCKED' | 'NOT_FOUND' | 'SUSPENDED' | 'NO_BRANCH_ACCESS' | 'DUPLICATE_SCAN';
}

interface GymContextType {
  currentUser: User | null;
  currentRole: UserRole;
  currentGym: GymTenant | null;
  allGyms: GymTenant[];
  switchGym: (gymId: string) => Promise<void>;
  createNewGym: (data: {
    name: string;
    slug: string;
    contactEmail?: string;
    contactPhone?: string;
    initialBranchName?: string;
    initialBranchAddress?: string;
  }) => Promise<{ success: boolean; gym?: GymTenant; error?: string }>;
  isLoadingData: boolean;
  syncError: string | null;
  refreshGymData: () => Promise<void>;
  selectedBranchId: string;
  branches: GymBranch[];
  users: User[];
  plans: SubscriptionPlan[];
  memberships: Membership[];
  payments: Payment[];
  exerciseLibrary: ExerciseLibraryItem[];
  routines: Routine[];
  classes: GroupClass[];
  attendanceRecords: AttendanceRecord[];
  progressMetrics: UserProgressMetric[];
  workoutLogs: WorkoutSessionLog[];
  notifications: GymNotification[];
  lastSimulatedEmailNotification: { email: string; code: string; type: 'login' | 'register' | 'activation'; timestamp: string } | null;
  clearSimulatedEmailNotification: () => void;
  isAuthLoading: boolean;
  authError: string | null;
  
  // Auth & Roles (Supabase Auth Async)
  switchUser: (userId: string) => void;
  loginWithEmail: (email: string, role?: UserRole) => Promise<boolean>;
  requestLoginOtp: (email: string) => Promise<{ success: boolean; message: string; otpCode?: string; userExists?: boolean; userName?: string }>;
  verifyLoginOtp: (email: string, otp: string) => Promise<{ success: boolean; message: string; user?: User }>;
  requestPhoneOtp: (phone: string) => Promise<{ success: boolean; message: string; phoneE164?: string }>;
  verifyPhoneOtp: (phoneE164: string, otp: string) => Promise<{ success: boolean; message: string; user?: User }>;
  loginWithPassword: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: User }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; message: string }>;
  registerMemberSelf: (data: {
    name: string;
    email: string;
    phone: string;
    dni?: string;
    password?: string;
    planId: string;
    branchId?: string;
    initialPaymentMethod: PaymentMethod;
  }) => Promise<{ success: boolean; message: string; otpCode?: string; tempUser?: User }>;
  confirmRegistration: (email: string, otp: string) => Promise<{ success: boolean; message: string; user?: User }>;
  logout: () => Promise<void>;
  setSelectedBranchId: (branchId: string) => void;
  
  // Membership & Payments
  getMembershipForUser: (userId: string) => Membership | undefined;
  getPlanById: (planId: string) => SubscriptionPlan | undefined;
  getUserById: (userId: string) => User | undefined;
  processPayment: (params: {
    userId: string;
    planId: string;
    method: PaymentMethod;
    amountARS: number;
    notes?: string;
    discountARS?: number;
    discountReason?: string;
  }) => Promise<{ success: boolean; payment: Payment; membership: Membership }>;
  recordManualPayment: (params: {
    userId: string;
    planId: string;
    method: PaymentMethod;
    amountARS: number;
    notes?: string;
    transactionReference?: string;
    discountARS?: number;
    discountReason?: string;
  }) => Promise<{
    success: boolean;
    payment: Payment;
    message: string;
    hasExistingPending?: boolean;
    existingMembership?: Membership;
  }>;
  approveManualPayment: (paymentId: string) => Promise<{ success: boolean; message: string }>;
  rejectManualPayment: (paymentId: string, reason?: string) => Promise<{ success: boolean; message: string }>;
  registerGymOwnerAccount: (data: {
    gymName: string;
    slug: string;
    ownerName: string;
    email: string;
    password?: string;
    phone: string;
    branchAddress?: string;
  }) => Promise<{ success: boolean; message: string; gym?: GymTenant; user?: User }>;
  sendWhatsAppReminder: (userId: string) => void;
  
  // Access Control & QR
  validateQrAccess: (qrToken: string, branchId?: string) => QrValidationResult;
  validateDniAccess: (dni: string, branchId?: string) => QrValidationResult;
  simulateQuickCheckin: (userId: string, statusOverride?: 'granted' | 'denied') => AttendanceRecord;
  
  // User Management
  createMember: (data: Omit<User, 'id' | 'createdAt'> & {
    planId: string;
    initialPaymentMethod: PaymentMethod;
    amountARS?: number;
    discountARS?: number;
    discountReason?: string;
  }) => Promise<{ success: boolean; user: User; membership: Membership; payment: Payment; tempPassword: string; activationOtp: string; loginReady: boolean; loginHint?: string }>;
  createStaff: (data: { name: string; email: string; phone?: string; role: UserRole; branchId?: string }) => Promise<{ success: boolean; user?: User; tempPassword?: string; loginReady?: boolean; message?: string }>;
  updateMember: (userId: string, data: Partial<User>) => void;
  deleteMember: (userId: string) => void;
  toggleMembershipSuspension: (userId: string) => void;
  
  // Plans
  createPlan: (plan: Omit<SubscriptionPlan, 'id'>) => void;
  updatePlan: (planId: string, plan: Partial<SubscriptionPlan>) => void;
  
  // Routines & Workout
  createRoutine: (routine: Omit<Routine, 'id' | 'createdAt'>) => void;
  updateRoutine: (routineId: string, routine: Partial<Routine>) => void;
  assignRoutineToUsers: (routineId: string, userIds: string[]) => void;
  logWorkoutSession: (log: Omit<WorkoutSessionLog, 'id'>) => void;
  updateRoutineExerciseSet: (routineId: string, dayId: string, blockId: string, exerciseId: string, setIndex: number, completed: boolean, actualWeight?: number, actualReps?: number) => void;
  
  // Classes & Bookings
  bookClass: (classId: string, userId: string) => { success: boolean; message: string };
  cancelClassBooking: (classId: string, userId: string) => { success: boolean; message: string };
  createGroupClass: (classData: Omit<GroupClass, 'id' | 'enrolledUserIds' | 'waitingListUserIds'>) => void;
  checkInClassAttendee: (classId: string, userId: string) => void;
  
  // Progress
  addProgressMetric: (metric: Omit<UserProgressMetric, 'id'>) => void;
  
  // Notifications
  markNotificationRead: (notificationId: string) => void;
  sendBroadcastNotification: (title: string, message: string, type?: GymNotification['type']) => void;
  
  // Data Reset & Testing
  resetToDemoData: () => void;
  loginAsAdmin: () => void;
  createQuickTestMember: () => Promise<User | null>;
}

const GymContext = createContext<GymContextType | null>(null);

const STORAGE_PREFIX = 'fuerzafit_prod_v1_';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn(`Error reading ${key} from storage, using fallback`, e);
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to storage`, e);
  }
}

export const GymProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Multi-tenant Gym / Tenant state
  const [currentGymId, setCurrentGymId] = useState<string>(() => loadFromStorage('current_gym_id', '00000000-0000-0000-0000-000000000001'));
  const [currentGym, setCurrentGym] = useState<GymTenant | null>(null);
  const [allGyms, setAllGyms] = useState<GymTenant[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [users, setUsers] = useState<User[]>(() => loadFromStorage('users', INITIAL_USERS));
  const [branches, setBranches] = useState<GymBranch[]>(() => loadFromStorage('branches', INITIAL_BRANCHES));
  const [plans, setPlans] = useState<SubscriptionPlan[]>(() => loadFromStorage('plans', INITIAL_PLANS));
  const [memberships, setMemberships] = useState<Membership[]>(() => loadFromStorage('memberships', INITIAL_MEMBERSHIPS));
  const [payments, setPayments] = useState<Payment[]>(() => loadFromStorage('payments', INITIAL_PAYMENTS));
  const [exerciseLibrary, setExerciseLibrary] = useState<ExerciseLibraryItem[]>(() => loadFromStorage('exercises', EXERCISE_LIBRARY));
  const [routines, setRoutines] = useState<Routine[]>(() => loadFromStorage('routines', INITIAL_ROUTINES));
  const [classes, setClasses] = useState<GroupClass[]>(() => loadFromStorage('classes', INITIAL_CLASSES));
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => loadFromStorage('attendance', INITIAL_ATTENDANCE));
  const [progressMetrics, setProgressMetrics] = useState<UserProgressMetric[]>(() => loadFromStorage('progress', INITIAL_PROGRESS));
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutSessionLog[]>(() => loadFromStorage('workout_logs', INITIAL_WORKOUT_LOGS));
  const [notifications, setNotifications] = useState<GymNotification[]>(() => loadFromStorage('notifications', INITIAL_NOTIFICATIONS));
  
  // Auth states & Supabase integration
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Refresh Gym Data from real Supabase database
  const refreshGymData = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    setIsLoadingData(true);
    setSyncError(null);
    try {
      const [gym, gymsList, loadedData] = await Promise.all([
        getGymTenant(currentGymId),
        getAllGyms(),
        loadGymData(currentGymId)
      ]);

      if (gym) setCurrentGym(gym);
      if (gymsList && gymsList.length > 0) setAllGyms(gymsList);

      if (loadedData) {
        // BETA FIX: reemplazar siempre (aunque venga vacío) para no mezclar
        // datos del gimnasio anterior con el actual al cambiar de tenant.
        // Branches se conserva si viene vacío para no romper selectores.
        setUsers(loadedData.users);
        if (loadedData.branches.length > 0) setBranches(loadedData.branches);
        setPlans(loadedData.plans);
        setMemberships(loadedData.memberships);
        setPayments(loadedData.payments);
        setRoutines(loadedData.routines);
        setClasses(loadedData.classes);
        setAttendanceRecords(loadedData.attendance);
        setProgressMetrics(loadedData.progress);
        setWorkoutLogs(loadedData.workoutLogs);
        setNotifications(loadedData.notifications);
        if (loadedData.exercises.length > 0) setExerciseLibrary(loadedData.exercises);
      }
    } catch (err: any) {
      console.error('Error refreshing gym data:', err);
      setSyncError(err.message || 'Error al conectar con base de datos.');
    } finally {
      setIsLoadingData(false);
    }
  }, [currentGymId]);

  useEffect(() => {
    refreshGymData();
  }, [refreshGymData]);

  const switchGym = async (gymId: string) => {
    // BETA FIX: limpiar colecciones del tenant anterior antes de cargar el nuevo,
    // así nunca se muestran socios/pagos del gimnasio anterior mezclados.
    setUsers([]);
    setMemberships([]);
    setPayments([]);
    setRoutines([]);
    setClasses([]);
    setAttendanceRecords([]);
    setProgressMetrics([]);
    setWorkoutLogs([]);
    setNotifications([]);
    setCurrentGymId(gymId);
    saveToStorage('current_gym_id', gymId);
    const gym = await getGymTenant(gymId);
    if (gym) setCurrentGym(gym);
    await refreshGymData();
  };

  const createNewGym = async (data: {
    name: string;
    slug: string;
    contactEmail?: string;
    contactPhone?: string;
    initialBranchName?: string;
    initialBranchAddress?: string;
  }) => {
    const res = await createGymTenant(data);
    if (res.success && res.gym) {
      setAllGyms(prev => [res.gym!, ...prev]);
    }
    return res;
  };

  // Pending verification OTPs and email notifications (for demo / fallback)
  const [pendingOtps, setPendingOtps] = useState<Record<string, { code: string; expiresAt: number; tempUserData?: any }>>({});
  const [lastSimulatedEmailNotification, setLastSimulatedEmailNotification] = useState<{
    email: string;
    code: string;
    type: 'login' | 'register' | 'activation';
    timestamp: string;
  } | null>(null);

  const clearSimulatedEmailNotification = useCallback(() => {
    setLastSimulatedEmailNotification(null);
  }, []);

  // Current session state: null by default for real operational web experience (visitor lands on public portal)
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => loadFromStorage('current_user_id', null));
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => loadFromStorage('selected_branch_id', 'branch-1'));

  // Listen to Supabase Auth State Change if configured — FIX doble login
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const authUser = session.user;
        // Setear ID inmediato para evitar segundo login, luego hidratar perfil
        setCurrentUserId(authUser.id);
        // Si ya está en memoria, no hacer fetch
        let exists = false;
        setUsers(prev => {
          exists = !!prev.find(u => u.id === authUser.id);
          return prev;
        });
        if (exists) return;

        // Fetch profile en background
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profile) {
          const mappedUser: User = {
            id: profile.id,
            gymId: profile.gym_id,
            name: profile.name,
            email: profile.email,
            phone: profile.phone || '',
            dni: profile.dni,
            role: profile.role || 'member',
            avatarUrl: profile.avatar_url,
            branchId: profile.branch_id || 'branch-1',
            createdAt: profile.created_at || new Date().toISOString(),
            isEmailVerified: true
          };
          setUsers(prev => {
            if (prev.find(u => u.id === mappedUser.id)) return prev;
            return [mappedUser, ...prev];
          });
        } else {
          // Fallback: crear perfil mínimo si no existe (evita null)
          const fallback: User = {
            id: authUser.id,
            name: (authUser.user_metadata?.name as string) || authUser.email?.split('@')[0] || 'Usuario',
            email: authUser.email || '',
            phone: (authUser.user_metadata?.phone as string) || '',
            role: (authUser.user_metadata?.role as UserRole) || 'member',
            branchId: (authUser.user_metadata?.branch_id as string) || selectedBranchId,
            createdAt: new Date().toISOString(),
            isEmailVerified: true
          };
          setUsers(prev => [fallback, ...prev.filter(u => u.id !== fallback.id)]);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUserId(null);
      }
    });

    // Hidratar sesión inicial al montar (evita login doble en refresh)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setCurrentUserId(data.session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync to local storage
  useEffect(() => saveToStorage('users', users), [users]);
  useEffect(() => saveToStorage('branches', branches), [branches]);
  useEffect(() => saveToStorage('plans', plans), [plans]);
  useEffect(() => saveToStorage('memberships', memberships), [memberships]);
  useEffect(() => saveToStorage('payments', payments), [payments]);
  useEffect(() => saveToStorage('routines', routines), [routines]);
  useEffect(() => saveToStorage('classes', classes), [classes]);
  useEffect(() => saveToStorage('attendance', attendanceRecords), [attendanceRecords]);
  useEffect(() => saveToStorage('progress', progressMetrics), [progressMetrics]);
  useEffect(() => saveToStorage('workout_logs', workoutLogs), [workoutLogs]);
  useEffect(() => saveToStorage('notifications', notifications), [notifications]);
  useEffect(() => saveToStorage('current_user_id', currentUserId), [currentUserId]);
  useEffect(() => saveToStorage('selected_branch_id', selectedBranchId), [selectedBranchId]);

  const currentUser = currentUserId ? (users.find(u => u.id === currentUserId) || null) : null;
  const currentRole = currentUser?.role || 'member';

  // BETA FIX CRÍTICO: la sesión manda. Al loguearse, operar siempre sobre el gym
  // del usuario. Sin esto la app cargaba el gym seed vacío: sin planes/sedes el
  // "Cobrar cuota" reventaba y el alta de socios quedaba colgada.
  useEffect(() => {
    const userGym = currentUser?.gymId;
    if (userGym && userGym !== currentGymId) {
      switchGym(userGym).catch(err => console.error('Error switching to user gym:', err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.gymId]);

  const switchUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUserId(target.id);
      if (target.branchId) {
        setSelectedBranchId(target.branchId);
      }
    }
  };

  // 1. Request Login OTP by Email (Supabase Auth signInWithOtp + fallback)
  const requestLoginOtp = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
    setIsAuthLoading(true);
    setAuthError(null);

    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            shouldCreateUser: true
          }
        });

        if (error) {
          console.warn('Supabase signInWithOtp error:', error.message);
          // Fallback to local OTP if Supabase network or config issue
        } else {
          setIsAuthLoading(false);
          return {
            success: true,
            message: `Te enviamos un código de 6 dígitos a ${cleanEmail}. Revisá tu bandeja de entrada o spam.`,
            userExists: !!existing,
            userName: existing?.name
          };
        }
      }

      // Fallback / Local simulation mode
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      setPendingOtps(prev => ({
        ...prev,
        [cleanEmail]: { code: otpCode, expiresAt }
      }));

      const notif = {
        email: cleanEmail,
        code: otpCode,
        type: 'login' as const,
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      setLastSimulatedEmailNotification(notif);

      const gymNotif: GymNotification = {
        id: `notif-otp-${Date.now()}`,
        userId: existing ? existing.id : 'all',
        title: 'Código de acceso por correo',
        message: `Tu código de verificación para ${cleanEmail} es: ${otpCode}. Válido por 10 minutos.`,
        type: 'announcement',
        read: false,
        createdAt: new Date().toISOString()
      };
      setNotifications(prev => [gymNotif, ...prev]);

      setIsAuthLoading(false);
      return {
        success: true,
        message: `Código de confirmación enviado a ${cleanEmail}`,
        otpCode,
        userExists: !!existing,
        userName: existing?.name
      };
    } catch (err: any) {
      setIsAuthLoading(false);
      const msg = err.message || 'Error al enviar código OTP.';
      setAuthError(msg);
      return {
        success: false,
        message: msg
      };
    }
  };

  // 2. Verify Login OTP (Supabase verifyOtp + fallback)
  const verifyLoginOtp = async (email: string, otp: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();
    setIsAuthLoading(true);
    setAuthError(null);

    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanOtp,
          type: 'email'
        });

        if (!error && data.user) {
          const authUser = data.user;
          // BETA FIX: buscar perfil real primero (antes inventaba un socio nuevo
          // con plan starter aunque la cuenta ya existiera).
          let userObj = users.find(u => u.id === authUser.id || u.email.toLowerCase() === cleanEmail);
          if (!userObj) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', authUser.id)
              .single();
            if (profile) {
              userObj = {
                id: profile.id,
                gymId: profile.gym_id,
                name: profile.name,
                email: profile.email,
                phone: profile.phone || '',
                dni: profile.dni,
                role: profile.role || 'member',
                avatarUrl: profile.avatar_url,
                branchId: profile.branch_id || selectedBranchId,
                createdAt: profile.created_at || new Date().toISOString(),
                isEmailVerified: true
              };
              setUsers(prev => [userObj!, ...prev.filter(u => u.id !== userObj!.id)]);
            }
          }
          if (!userObj) {
            userObj = {
              id: authUser.id,
              name: (authUser.user_metadata?.name || cleanEmail.split('@')[0]).replace(/[._-]/g, ' '),
              email: cleanEmail,
              phone: authUser.user_metadata?.phone || '+54 9 11 0000-0000',
              dni: authUser.user_metadata?.dni,
              role: (authUser.user_metadata?.role as UserRole) || 'member',
              avatarUrl: authUser.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
              branchId: selectedBranchId,
              createdAt: new Date().toISOString(),
              isEmailVerified: true
            };
            setUsers(prev => [userObj!, ...prev]);
          }

          setCurrentUserId(userObj.id);
          setIsAuthLoading(false);
          return {
            success: true,
            message: `¡Bienvenido/a, ${userObj.name}!`,
            user: userObj
          };
        }
      }

      // Local / Fallback verification
      const pending = pendingOtps[cleanEmail];
      // BETA FIX: códigos universales 123456/000000 solo en modo demo local.
      // Con Supabase real (beta productiva) se exige el OTP enviado.
      const allowUniversalCode = isDemoModeEnabled() && !isSupabaseConfigured;
      const isValid = (pending && pending.code === cleanOtp) || (allowUniversalCode && (cleanOtp === '123456' || cleanOtp === '000000'));

      if (!isValid) {
        setIsAuthLoading(false);
        return {
          success: false,
          message: 'El código de verificación ingresado es incorrecto o ha expirado.'
        };
      }

      const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        setUsers(prev => prev.map(u => u.id === existing.id ? { ...u, isEmailVerified: true } : u));
        setCurrentUserId(existing.id);
        if (existing.branchId) setSelectedBranchId(existing.branchId);

        setPendingOtps(prev => {
          const copy = { ...prev };
          delete copy[cleanEmail];
          return copy;
        });

        setIsAuthLoading(false);
        return {
          success: true,
          message: `¡Bienvenido de nuevo, ${existing.name}!`,
          user: existing
        };
      }

      // New member auto-created via OTP
      const newId = `usr-${Date.now()}`;
      const starterPlan = plans[0] || INITIAL_PLANS[0];
      const newUser: User = {
        id: newId,
        name: cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        email: cleanEmail,
        phone: '+54 9 11 0000-0000',
        dni: `${Math.floor(30000000 + Math.random() * 15000000)}`,
        role: 'member',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
        branchId: selectedBranchId,
        createdAt: new Date().toISOString(),
        isEmailVerified: true
      };

      const newMembership: Membership = {
        id: `mem-${Date.now()}`,
        userId: newId,
        planId: starterPlan.id,
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        autoRenew: true,
        qrToken: `FF-QR-${newId.slice(-5).toUpperCase()}-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
        branchId: selectedBranchId
      };

      setUsers(prev => [newUser, ...prev]);
      setMemberships(prev => [newMembership, ...prev]);
      setCurrentUserId(newId);

      setPendingOtps(prev => {
        const copy = { ...prev };
        delete copy[cleanEmail];
        return copy;
      });

      setIsAuthLoading(false);
      return {
        success: true,
        message: `¡Cuenta creada y confirmada exitosamente!`,
        user: newUser
      };
    } catch (err: any) {
      setIsAuthLoading(false);
      return {
        success: false,
        message: err.message || 'Error al verificar código OTP.'
      };
    }
  };

        // Errores de Auth traducidos a lenguaje del gym
  const friendlyAuthError = (raw: string): string => {
    const msg = (raw || '').toLowerCase();
    if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('user already')) {
      return 'Ese email ya tiene cuenta. Iniciá sesión o usá otro correo.';
    }
    if (msg.includes('at least 6 characters') || msg.includes('password')) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (msg.includes('rate limit') || msg.includes('too many') || msg.includes('email rate')) {
      return 'Límite de envíos de Supabase: esperá unos minutos y reintentá.';
    }
    if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
      return 'Falta confirmar el email: revisá tu correo (y spam) y abrí el link.';
    }
    if (msg.includes('invalid login credentials')) {
      return 'Email o contraseña incorrectos.';
    }
    if (msg.includes('signup is disabled') || msg.includes('signups')) {
      return 'El registro está deshabilitado en Supabase. Habilitá "Allow new users" en Auth.';
    }
    return raw || 'Error de autenticación.';
  };

  // 2b. Login con teléfono + código SMS (Supabase Auth nativo, requiere
  // proveedor SMS configurado en el proyecto: Auth > Sign In/Up > Phone).
  const mapPhoneError = (raw: string): string => {
    const msg = (raw || '').toLowerCase();
    if (msg.includes('unsupported phone provider') || msg.includes('phone signups are disabled') || msg.includes('phone provider is not enabled')) {
      return 'Tu gimnasio aún no tiene SMS activado. Pedí en recepción que lo habiliten o ingresá con código por email.';
    }
    if (msg.includes('rate limit') || msg.includes('too many')) {
      return 'Demasiados intentos por SMS. Esperá unos minutos e intentá de nuevo.';
    }
    if (msg.includes('invalid phone') || msg.includes('phone number')) {
      return 'Ese número no tiene formato válido. Revisalo (ej: 11 2333 3343).';
    }
    if (msg.includes('expired') || msg.includes('invalid token') || msg.includes('incorrect')) {
      return 'El código SMS es incorrecto o venció. Pedí uno nuevo.';
    }
    return raw || 'Error al enviar el SMS.';
  };

  const requestPhoneOtp = async (phone: string) => {
    const e164 = normalizePhoneE164(phone);
    setIsAuthLoading(true);
    setAuthError(null);

    if (!e164) {
      setIsAuthLoading(false);
      return {
        success: false,
        message: 'Ingresá un número válido de 10 dígitos con código de área (ej: 11 2333 3343).'
      };
    }

    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signInWithOtp({ phone: e164 });
        setIsAuthLoading(false);
        if (!error) {
          return {
            success: true,
            message: `Te enviamos un código por SMS al ${e164}.`,
            phoneE164: e164
          };
        }
        const friendly = mapPhoneError(error.message);
        setAuthError(friendly);
        return { success: false, message: friendly, phoneE164: e164 };
      }

      setIsAuthLoading(false);
      return {
        success: false,
        message: 'El ingreso por SMS necesita Supabase con proveedor de SMS configurado. Usá el código por email.',
        phoneE164: e164
      };
    } catch (err: any) {
      setIsAuthLoading(false);
      const msg = mapPhoneError(err.message || '');
      setAuthError(msg);
      return { success: false, message: msg, phoneE164: e164 };
    }
  };

  const verifyPhoneOtp = async (phoneE164: string, otp: string) => {
    const cleanOtp = (otp || '').trim();
    setIsAuthLoading(true);
    setAuthError(null);

    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.verifyOtp({
          phone: phoneE164,
          token: cleanOtp,
          type: 'sms'
        });

        if (!error && data.user) {
          const authUser = data.user;
          const digitsOnly = phoneE164.replace(/[^0-9]/g, '');
          let userObj = users.find(u =>
            u.id === authUser.id ||
            (u.phone && u.phone.replace(/[^0-9]/g, '').endsWith(digitsOnly.slice(-10)))
          );
          if (!userObj) {
            // Socio nuevo por teléfono: alta mínima + membresía inicial
            const newId = authUser.id;
            const starterPlan = plans[0] || INITIAL_PLANS[0];
            userObj = {
              id: newId,
              gymId: currentGymId,
              name: (authUser.user_metadata?.name as string) || `Socio ${digitsOnly.slice(-4)}`,
              email: authUser.email || `${digitsOnly.slice(-10)}@telefono.fuerzafit`,
              phone: phoneE164,
              role: 'member',
              avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
              branchId: selectedBranchId,
              createdAt: new Date().toISOString(),
              isEmailVerified: false
            };
            const newMembership: Membership = {
              id: `mem-${Date.now()}`,
              gymId: currentGymId,
              userId: newId,
              planId: starterPlan.id,
              status: 'active',
              startDate: new Date().toISOString(),
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              autoRenew: true,
              qrToken: `FF-QR-${newId.slice(-5).toUpperCase()}-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
              branchId: selectedBranchId
            };
            setUsers(prev => [userObj!, ...prev]);
            setMemberships(prev => [newMembership, ...prev]);
          }
          setCurrentUserId(userObj.id);
          if (userObj.branchId) setSelectedBranchId(userObj.branchId);
          setIsAuthLoading(false);
          return { success: true, message: `¡Bienvenido/a, ${userObj.name}!`, user: userObj };
        }

        if (error) {
          const friendly = mapPhoneError(error.message);
          setIsAuthLoading(false);
          setAuthError(friendly);
          return { success: false, message: friendly };
        }
      }

      setIsAuthLoading(false);
      return {
        success: false,
        message: 'El ingreso por SMS necesita Supabase con proveedor de SMS configurado. Usá el código por email.'
      };
    } catch (err: any) {
      setIsAuthLoading(false);
      const msg = mapPhoneError(err.message || '');
      setAuthError(msg);
      return { success: false, message: msg };
    }
  };

  // 3. Login with Email + Password (Supabase signInWithPassword + fallback)
  const loginWithPassword = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    setIsAuthLoading(true);
    setAuthError(null);

    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });

        if (!error && data.user) {
          const authUser = data.user;
          let userObj = users.find(u => u.id === authUser.id || u.email.toLowerCase() === cleanEmail);
          // BETA FIX: si el usuario existe en Auth pero aún no está en memoria,
          // traer su perfil real de Supabase (antes se lo rechazaba).
          if (!userObj) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', authUser.id)
              .single();
            if (profile) {
              userObj = {
                id: profile.id,
                gymId: profile.gym_id,
                name: profile.name,
                email: profile.email,
                phone: profile.phone || '',
                dni: profile.dni,
                role: profile.role || 'member',
                avatarUrl: profile.avatar_url,
                branchId: profile.branch_id || selectedBranchId,
                createdAt: profile.created_at || new Date().toISOString(),
                isEmailVerified: true
              };
              setUsers(prev => [userObj!, ...prev.filter(u => u.id !== userObj!.id)]);
            }
          }
          if (userObj) {
            setCurrentUserId(userObj.id);
            if (userObj.branchId) setSelectedBranchId(userObj.branchId);
            setIsAuthLoading(false);
            return {
              success: true,
              message: `¡Bienvenido/a, ${userObj.name}!`,
              user: userObj
            };
          }
          // Auth OK pero sin perfil: no inventar nada, avisar.
          setIsAuthLoading(false);
          return {
            success: false,
            message: 'Tu login es válido pero no tenés perfil en este gimnasio. Pedí en recepción que te den de alta.'
          };
        }
      }

      // Local / Fallback check
      const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
      if (!existing) {
        setIsAuthLoading(false);
        return {
          success: false,
          message: 'No existe ninguna cuenta registrada con este correo electrónico.'
        };
      }

      // BETA FIX: en beta con Supabase real NO aceptar contraseñas universales
      // ni login sin contraseña. Solo modo demo local.
      const allowDemoPasswords = isDemoModeEnabled() && !isSupabaseConfigured;
      const storedPassword = (existing as any).password as string | undefined;
      const isPasswordCorrect = allowDemoPasswords
        ? (
          password === 'admin123' ||
          password === 'admin' ||
          password === 'socio123' ||
          password === '123456' ||
          !password ||
          storedPassword === password
        )
        : (!!storedPassword && storedPassword === password);
      if (!isPasswordCorrect) {
        setIsAuthLoading(false);
        return {
          success: false,
          message: allowDemoPasswords
            ? 'Contraseña incorrecta. Podés ingresar con el código de confirmación por mail.'
            : 'Contraseña incorrecta o cuenta creada con otro método. Usá el código por mail o pedí recupero en recepción.'
        };
      }

      setCurrentUserId(existing.id);
      if (existing.branchId) setSelectedBranchId(existing.branchId);
      setIsAuthLoading(false);
      return {
        success: true,
        message: `¡Bienvenido/a, ${existing.name}!`,
        user: existing
      };
    } catch (err: any) {
      setIsAuthLoading(false);
      return {
        success: false,
        message: err.message || 'Error en inicio de sesión.'
      };
    }
  };

  // 3b. Olvidé mi contraseña / Recuperar cuenta
  const requestPasswordReset = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes('@')) return { success: false, message: 'Ingresá un email válido.' };
    setIsAuthLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        setIsAuthLoading(false);
        if (error) return { success: false, message: error.message };
        return { success: true, message: `Te enviamos un link para restablecer tu contraseña a ${cleanEmail}. Revisá tu correo.` };
      }
      // Fallback demo local
      setIsAuthLoading(false);
      return { success: true, message: `Simulación: se enviaría email a ${cleanEmail}. En demo usá OTP 123456.` };
    } catch (e: any) {
      setIsAuthLoading(false);
      return { success: false, message: e.message || 'Error al enviar email.' };
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!newPassword || newPassword.length < 6) return { success: false, message: 'La contraseña debe tener al menos 6 caracteres.' };
    setIsAuthLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        setIsAuthLoading(false);
        if (error) return { success: false, message: error.message };
        return { success: true, message: 'Contraseña actualizada. Ya podés ingresar.' };
      }
      setIsAuthLoading(false);
      return { success: false, message: 'No hay Supabase configurado.' };
    } catch (e: any) {
      setIsAuthLoading(false);
      return { success: false, message: e.message || 'Error al actualizar.' };
    }
  };

  // 4. Member Self Registration Flow
  const registerMemberSelf = async (data: {
    name: string;
    email: string;
    phone: string;
    dni?: string;
    password?: string;
    planId: string;
    branchId?: string;
    initialPaymentMethod: PaymentMethod;
  }) => {
    const cleanEmail = data.email.trim().toLowerCase();
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
    setIsAuthLoading(true);
    setAuthError(null);

    if (existing) {
      setIsAuthLoading(false);
      return {
        success: false,
        message: 'Este correo electrónico ya está registrado. Podés iniciar sesión.',
        tempUser: existing
      };
    }

    try {
      if (isSupabaseConfigured && supabase) {
        // Sign up with Supabase Auth
        const { data: authData, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: data.password || 'socio123',
          options: {
            data: {
              name: data.name.trim(),
              phone: data.phone.trim(),
              dni: data.dni?.trim(),
              branch_id: data.branchId || selectedBranchId,
              role: 'member'
            }
          }
        });

        if (error) {
          console.warn('Supabase signUp error:', error.message);
        }
      }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 15 * 60 * 1000;

      const tempUser: User = {
        id: `usr-${Date.now()}`,
        name: data.name.trim(),
        email: cleanEmail,
        phone: data.phone.trim(),
        dni: data.dni?.trim() || `${Math.floor(30000000 + Math.random() * 15000000)}`,
        role: 'member',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
        branchId: data.branchId || selectedBranchId,
        createdAt: new Date().toISOString(),
        isEmailVerified: false
      };

      setPendingOtps(prev => ({
        ...prev,
        [cleanEmail]: {
          code: otpCode,
          expiresAt,
          tempUserData: {
            user: tempUser,
            planId: data.planId,
            initialPaymentMethod: data.initialPaymentMethod
          }
        }
      }));

      setLastSimulatedEmailNotification({
        email: cleanEmail,
        code: otpCode,
        type: 'register',
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });

      setIsAuthLoading(false);
      return {
        success: true,
        message: `Código de confirmación enviado a ${cleanEmail}`,
        otpCode,
        tempUser
      };
    } catch (err: any) {
      setIsAuthLoading(false);
      return {
        success: false,
        message: err.message || 'Error en registro.'
      };
    }
  };

  // 5. Confirm Self Registration with OTP
  const confirmRegistration = async (email: string, otp: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();
    setIsAuthLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanOtp,
          type: 'signup'
        });
      }

      const pending = pendingOtps[cleanEmail];
      // BETA FIX: igual que login — sin universales en beta real.
      const allowUniversalCode = isDemoModeEnabled() && !isSupabaseConfigured;
      const isValid = (pending && pending.code === cleanOtp) || (allowUniversalCode && (cleanOtp === '123456' || cleanOtp === '000000'));

      if (!isValid || !pending?.tempUserData) {
        setIsAuthLoading(false);
        return {
          success: false,
          message: 'Código de confirmación inválido o datos de registro no encontrados.'
        };
      }

      const { user: tempUser, planId, initialPaymentMethod } = pending.tempUserData;
      const plan = getPlanById(planId) || plans[0];
      const durationDays = plan.durationMonths > 0 ? plan.durationMonths * 30 : 1;
      const now = new Date();
      const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

      const finalizedUser: User = {
        ...tempUser,
        isEmailVerified: true
      };

      const newPayment: Payment = {
        id: `pay-${Date.now()}`,
        userId: finalizedUser.id,
        userName: finalizedUser.name,
        userEmail: finalizedUser.email,
        planId: plan.id,
        planName: plan.name,
        amountARS: plan.priceARS,
        currency: 'ARS',
        method: initialPaymentMethod,
        status: 'approved',
        paymentDate: now.toISOString(),
        transactionId: `REG-${Math.floor(100000 + Math.random() * 900000)}`,
        idempotencyKey: `idem-reg-${finalizedUser.id}-${Date.now()}`
      };

      const newMembership: Membership = {
        id: `mem-${Date.now()}`,
        userId: finalizedUser.id,
        planId: plan.id,
        status: 'active',
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        autoRenew: true,
        qrToken: `FF-QR-${finalizedUser.name.split(' ')[0].toUpperCase()}-${now.getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
        branchId: finalizedUser.branchId || selectedBranchId,
        lastPaymentId: newPayment.id
      };

      setUsers(prev => [finalizedUser, ...prev]);
      setMemberships(prev => [newMembership, ...prev]);
      setPayments(prev => [newPayment, ...prev]);
      setCurrentUserId(finalizedUser.id);

      // Welcome Notification
      const notif: GymNotification = {
        id: `notif-welcome-${Date.now()}`,
        userId: finalizedUser.id,
        title: '¡Bienvenido/a a FuerzaFit!',
        message: `Tu cuenta fue confirmada y tu membresía para ${plan.name} está activa. Tu pase QR ya está disponible en tu panel.`,
        type: 'membership',
        read: false,
        createdAt: now.toISOString()
      };
      setNotifications(prev => [notif, ...prev]);

      setPendingOtps(prev => {
        const copy = { ...prev };
        delete copy[cleanEmail];
        return copy;
      });

      setIsAuthLoading(false);
      return {
        success: true,
        message: '¡Registro completado y membresía activada!',
        user: finalizedUser
      };
    } catch (err: any) {
      setIsAuthLoading(false);
      return {
        success: false,
        message: err.message || 'Error al confirmar registro.'
      };
    }
  };

  const loginWithEmail = async (email: string, role: UserRole = 'member'): Promise<boolean> => {
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      setCurrentUserId(existing.id);
      return true;
    }
    // Create new user on the fly if not found
    const newId = `usr-${Date.now()}`;
    const newUser: User = {
      id: newId,
      name: email.split('@')[0],
      email: email,
      phone: '+54 9 11 0000-0000',
      dni: `${Math.floor(30000000 + Math.random() * 15000000)}`,
      role: role,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
      branchId: selectedBranchId,
      createdAt: new Date().toISOString(),
      isEmailVerified: true
    };
    
    // Assign starter membership if member
    if (role === 'member') {
      const starterPlan = plans[0] || INITIAL_PLANS[0];
      const newMembership: Membership = {
        id: `mem-${Date.now()}`,
        userId: newId,
        planId: starterPlan.id,
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        autoRenew: true,
        qrToken: `FF-QR-${newId}-${Date.now().toString().slice(-5)}`,
        branchId: selectedBranchId
      };
      setMemberships(prev => [newMembership, ...prev]);
    }

    setUsers(prev => [newUser, ...prev]);
    setCurrentUserId(newId);
    return true;
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUserId(null);
    saveToStorage('current_user_id', null);
  };

  const getMembershipForUser = useCallback((userId: string) => {
    return memberships.find(m => m.userId === userId);
  }, [memberships]);

  const getPlanById = useCallback((planId: string) => {
    return plans.find(p => p.id === planId);
  }, [plans]);

  const getUserById = useCallback((userId: string) => {
    return users.find(u => u.id === userId);
  }, [users]);

  // Robust Mercado Pago and payment processing with idempotency & atomic membership extension
  // Soporta descuento de primera cuota u otras promos: discountARS + discountReason
  const processPayment = async ({
    userId,
    planId,
    method,
    amountARS,
    notes,
    discountARS,
    discountReason
  }: {
    userId: string;
    planId: string;
    method: PaymentMethod;
    amountARS: number;
    notes?: string;
    discountARS?: number;
    discountReason?: string;
  }) => {
    const user = getUserById(userId);
    const plan = getPlanById(planId);
    if (!user || !plan) {
      throw new Error('Usuario o Plan no encontrado para el pago');
    }

    const idempotencyKey = `idem-${method}-${userId}-${Date.now()}`;
    const transactionId = method === 'mercadopago' 
      ? `MP-TRX-${Math.floor(100000000 + Math.random() * 900000000)}` 
      : `${method.toUpperCase()}-${Math.floor(1000000 + Math.random() * 9000000)}`;

    const safeDiscount = Math.max(0, Math.min(Number(discountARS) || 0, plan.priceARS - 1));
    const netAmount = Math.max(1, Number(amountARS) || 0);
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      gymId: currentGymId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      planId: plan.id,
      planName: plan.name,
      amountARS: netAmount,
      currency: 'ARS',
      method,
      status: 'approved',
      paymentDate: new Date().toISOString(),
      transactionId,
      idempotencyKey,
      mpPaymentId: method === 'mercadopago' ? transactionId : undefined,
      discountARS: safeDiscount > 0 ? safeDiscount : undefined,
      discountReason: safeDiscount > 0 ? (discountReason || 'Descuento aplicado') : undefined,
      notes,
      receiptUrl: method === 'mercadopago' ? `https://www.mercadopago.com.ar/receipt/${transactionId}` : undefined
    };

    // Calculate new expiration date
    const existingMembership = getMembershipForUser(userId);
    const now = new Date();
    let startDate = now;
    
    // If user has an active membership that hasn't expired yet, extend from existing end date
    if (existingMembership && new Date(existingMembership.endDate) > now && existingMembership.status === 'active') {
      startDate = new Date(existingMembership.endDate);
    }

    const durationDays = plan.durationMonths > 0 ? plan.durationMonths * 30 : 1; // single pass = 1 day
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const updatedMembership: Membership = {
      id: existingMembership ? existingMembership.id : `mem-${Date.now()}`,
      gymId: currentGymId,
      userId: user.id,
      planId: plan.id,
      status: 'active',
      startDate: (existingMembership && new Date(existingMembership.endDate) > now) ? existingMembership.startDate : now.toISOString(),
      endDate: endDate.toISOString(),
      autoRenew: true,
      qrToken: `FF-QR-${user.name.split(' ')[0].toUpperCase()}-${now.getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      branchId: user.branchId || selectedBranchId,
      lastPaymentId: newPayment.id
    };

    // Update state atomically
    setPayments(prev => [newPayment, ...prev]);
    setMemberships(prev => {
      const filtered = prev.filter(m => m.userId !== userId);
      return [updatedMembership, ...filtered];
    });

    // Persist to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      persistPaymentAndMembership({
        gymId: currentGymId,
        payment: newPayment,
        membership: updatedMembership
      }).catch(err => console.error('Error persisting payment to Supabase:', err));
    }

    // Create confirmation notification
    const newNotif: GymNotification = {
      id: `notif-${Date.now()}`,
      userId: user.id,
      title: '¡Pago acreditado con éxito!',
      message: `Tu pago de $${amountARS.toLocaleString('es-AR')} para ${plan.name} fue procesado por ${method === 'mercadopago' ? 'Mercado Pago' : 'caja'}. Tu membresía está activa hasta el ${endDate.toLocaleDateString('es-AR')}.`,
      type: 'payment',
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev]);

    return { success: true, payment: newPayment, membership: updatedMembership };
  };

  // ==============================================================================
  // REGISTRO DE PAGOS MANUALES CON AUDITORÍA Y VALIDACIÓN DE MEMBRESÍA
  // ==============================================================================
  const recordManualPayment = async ({
    userId,
    planId,
    method,
    amountARS,
    notes,
    transactionReference,
    discountARS,
    discountReason
  }: {
    userId: string;
    planId: string;
    method: PaymentMethod;
    amountARS: number;
    notes?: string;
    transactionReference?: string;
    discountARS?: number;
    discountReason?: string;
  }) => {
    const user = getUserById(userId);
    const plan = getPlanById(planId);
    if (!user || !plan) {
      throw new Error('Usuario o Plan no encontrado para registrar el cobro');
    }

    // 1. VALIDACIÓN CONTRA EL HISTORIAL DE LA MEMBRESÍA
    const existingMembership = getMembershipForUser(userId);
    const userPayments = payments.filter(p => p.userId === userId);
    
    // Verificar si ya existe un pago pendiente de auditoría para este socio (prevención de duplicados)
    const existingPendingPayment = userPayments.find(p => p.status === 'pending');

    const transactionId = transactionReference?.trim() || `MANUAL-${method.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const idempotencyKey = `idem-manual-${method}-${userId}-${Date.now()}`;

    const safeDiscountManual = Math.max(0, Math.min(Number(discountARS) || 0, plan.priceARS - 1));
    const netManual = Math.max(1, Number(amountARS) || 0);
    // REGLA FUNDAMENTAL: Los pagos manuales NO se marcan como 'approved' automáticamente. Se crean como 'pending'.
    const newManualPayment: Payment = {
      id: `pay-manual-${Date.now()}`,
      gymId: currentGymId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      planId: plan.id,
      planName: plan.name,
      amountARS: netManual,
      currency: 'ARS',
      method,
      status: 'pending', // No aprobado automáticamente
      paymentDate: new Date().toISOString(),
      transactionId,
      idempotencyKey,
      discountARS: safeDiscountManual > 0 ? safeDiscountManual : undefined,
      discountReason: safeDiscountManual > 0 ? (discountReason || 'Descuento aplicado') : undefined,
      notes: notes || (transactionReference ? `Comprobante/Ref: ${transactionReference}` : undefined)
    };

    // Actualizar lista de pagos en memoria
    setPayments(prev => [newManualPayment, ...prev]);

    // Persistir en tabla 'payments' de Supabase como 'pending'
    if (isSupabaseConfigured && supabase) {
      persistManualPaymentRecord({
        gymId: currentGymId,
        payment: newManualPayment
      }).catch(err => console.error('Error persisting manual payment to Supabase:', err));
    }

    // Notificación interna para administración
    const discountNoteManual = safeDiscountManual > 0 ? ` (Desc. $${safeDiscountManual.toLocaleString('es-AR')} — ${discountReason || 'promo'})` : '';
    const notif: GymNotification = {
      id: `notif-manual-pay-${Date.now()}`,
      userId: 'all',
      title: 'Pago manual registrado (Pendiente de Auditoría)',
      message: `Se ingresó cobro manual de $${netManual.toLocaleString('es-AR')}${discountNoteManual} (${method}) para ${user.name}. Requiere confirmación de caja para extender pase.`,
      type: 'payment',
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [notif, ...prev]);

    return {
      success: true,
      payment: newManualPayment,
      message: 'Pago manual registrado en la tabla de pagos con estado PENDIENTE. Requiere auditoría para activar o extender la membresía.',
      hasExistingPending: !!existingPendingPayment,
      existingMembership
    };
  };

  // APROBACIÓN DE PAGO MANUAL (AUDITORÍA & EXTENSIÓN EFECTIVA DE MEMBRESÍA)
  const approveManualPayment = async (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) {
      return { success: false, message: 'Pago no encontrado en el sistema.' };
    }
    if (payment.status === 'approved') {
      return { success: false, message: 'El pago ya fue aprobado previamente.' };
    }

    const user = getUserById(payment.userId);
    const plan = getPlanById(payment.planId) || plans[0];
    if (!user) {
      return { success: false, message: 'El socio asociado a este cobro no existe.' };
    }

    // Validar contra el historial de membresía para calcular la extensión de forma correcta
    const existingMembership = getMembershipForUser(user.id);
    const now = new Date();
    let startDate = now;

    // Si la membresía actual está activa y vigente hacia el futuro, se extiende a partir de su fecha de fin
    if (existingMembership && new Date(existingMembership.endDate) > now && existingMembership.status === 'active') {
      startDate = new Date(existingMembership.endDate);
    }

    const durationDays = (plan?.durationMonths && plan.durationMonths > 0) ? plan.durationMonths * 30 : 1;
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const updatedMembership: Membership = {
      id: existingMembership ? existingMembership.id : `mem-${Date.now()}`,
      gymId: currentGymId,
      userId: user.id,
      planId: plan?.id || 'plan-1',
      status: 'active',
      startDate: (existingMembership && new Date(existingMembership.endDate) > now) ? existingMembership.startDate : now.toISOString(),
      endDate: endDate.toISOString(),
      autoRenew: true,
      qrToken: existingMembership?.qrToken || `FF-QR-${user.name.split(' ')[0].toUpperCase()}-${now.getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      branchId: user.branchId || selectedBranchId,
      lastPaymentId: payment.id
    };

    // Actualizar estado en memoria
    setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: 'approved' } : p));
    setMemberships(prev => {
      const filtered = prev.filter(m => m.userId !== user.id);
      return [updatedMembership, ...filtered];
    });

    // Persistir aprobación en Supabase
    if (isSupabaseConfigured && supabase) {
      approvePendingPaymentInSupabase({
        gymId: currentGymId,
        paymentId,
        updatedMembership
      }).catch(err => console.error('Error approving payment in Supabase:', err));
    }

    // Notificar al socio
    const userNotif: GymNotification = {
      id: `notif-appr-${Date.now()}`,
      userId: user.id,
      title: '¡Pago aprobado y pase extendido!',
      message: `Tu pago manual de $${payment.amountARS.toLocaleString('es-AR')} fue verificado por recepción. Tu membresía está activa hasta el ${endDate.toLocaleDateString('es-AR')}.`,
      type: 'payment',
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [userNotif, ...prev]);

    return {
      success: true,
      message: `Pago de $${payment.amountARS.toLocaleString('es-AR')} aprobado. Membresía de ${user.name} extendida hasta el ${endDate.toLocaleDateString('es-AR')}.`
    };
  };

  // RECHAZO DE PAGO MANUAL
  const rejectManualPayment = async (paymentId: string, reason?: string) => {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return { success: false, message: 'Pago no encontrado.' };

    const notesExtra = reason ? ` [Rechazado: ${reason}]` : ' [Rechazado por auditoría]';
    setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: 'rejected', notes: (p.notes || '') + notesExtra } : p));

    if (isSupabaseConfigured && supabase) {
      rejectPendingPaymentInSupabase({
        gymId: currentGymId,
        paymentId,
        reason
      }).catch(err => console.error('Error rejecting payment in Supabase:', err));
    }

    return { success: true, message: 'El pago ha sido marcado como rechazado.' };
  };

  // ==============================================================================
  // REGISTRO DE NUEVO GIMNASIO (CREAR CUENTA / TENANT EN TABLA 'GYMS')
  // ==============================================================================
  const registerGymOwnerAccount = async (data: {
    gymName: string;
    slug: string;
    ownerName: string;
    email: string;
    password?: string;
    phone: string;
    branchAddress?: string;
  }) => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const cleanEmail = data.email.trim().toLowerCase();

      // Si Supabase está disponible, registrar usuario y tenant en Supabase.
      // BETA FIX: si algo falla acá se devuelve el error REAL (nunca un gym
      // fantasma local): el fallback local solo corre sin Supabase.
      if (isSupabaseConfigured && supabase) {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: data.password || 'admin123',
          options: {
            data: {
              name: data.ownerName.trim(),
              role: 'admin',
              phone: data.phone.trim()
            }
          }
        });

        if (signUpError) {
          setIsAuthLoading(false);
          const msg = signUpError.message || 'Error al crear el usuario.';
          setAuthError(msg);
          return { success: false, message: friendlyAuthError(msg) };
        }

        if (!authData.user) {
          setIsAuthLoading(false);
          const msg = 'Revisá tu correo y confirmá la cuenta para terminar el alta del gimnasio.';
          setAuthError(msg);
          return { success: false, message: msg };
        }

        const authUserId = authData.user.id;

        const gymRes = await createGymTenant({
          name: data.gymName.trim(),
          slug: data.slug.trim(),
          ownerUserId: authUserId,
          ownerName: data.ownerName.trim(),
          contactEmail: cleanEmail,
          contactPhone: data.phone.trim(),
          initialBranchName: `${data.gymName.trim()} Sede Central`,
          initialBranchAddress: data.branchAddress || 'Av. Principal 1234'
        });

        if (!gymRes.success || !gymRes.gym) {
          setIsAuthLoading(false);
          const msg = gymRes.error?.includes('row-level security')
            ? 'Supabase rechazó la creación (RLS). Corré supabase_beta_onboarding.sql en el SQL Editor y reintentá.'
            : gymRes.error || 'Error al crear el gimnasio en Supabase.';
          setAuthError(msg);
          return { success: false, message: msg };
        }

        // Éxito real en Supabase (gymRes ya validado arriba)
        {
          setCurrentGymId(gymRes.gym.id);
          const newAdminUser: User = {
            id: authUserId,
            gymId: gymRes.gym.id,
            name: data.ownerName.trim(),
            email: cleanEmail,
            phone: data.phone.trim(),
            role: 'admin',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
            branchId: `br-${gymRes.gym.id.slice(0, 8)}-1`,
            createdAt: new Date().toISOString(),
            isEmailVerified: true
          };

          setUsers(prev => [newAdminUser, ...prev]);
          setCurrentUserId(newAdminUser.id);
          await refreshGymData();
          setIsAuthLoading(false);
          return { success: true, message: `¡Gimnasio ${data.gymName} creado con éxito!`, gym: gymRes.gym, user: newAdminUser };
        }
      }

      // Modo local / Fallback (solo sin Supabase)
      const adminId = `usr-admin-${Date.now().toString().slice(-4)}`;
      const newGymId = `gym-${Date.now().toString().slice(-6)}`;
      const branchId = `branch-${newGymId}-1`;
      const branchCode = `GYM-${data.slug.toUpperCase().slice(0, 4)}-${new Date().getFullYear()}`;

      const newGym: GymTenant = {
        id: newGymId,
        name: data.gymName.trim(),
        slug: data.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        ownerUserId: adminId,
        plan: 'beta',
        status: 'active',
        createdAt: new Date().toISOString(),
        contactEmail: cleanEmail,
        contactPhone: data.phone.trim()
      };

      const newAdminUser: User = {
        id: adminId,
        gymId: newGymId,
        name: data.ownerName.trim(),
        email: cleanEmail,
        phone: data.phone.trim(),
        role: 'admin',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        branchId,
        createdAt: new Date().toISOString(),
        isEmailVerified: true
      };

      const newBranch: GymBranch = {
        id: branchId,
        gymId: newGymId,
        code: branchCode,
        name: `${data.gymName.trim()} Sede Central`,
        address: data.branchAddress || 'Av. Principal 1234',
        city: 'Buenos Aires',
        phone: data.phone.trim(),
        isOpen: true,
        currentOccupancy: 0,
        maxCapacity: 150,
        openingHours: 'Lun a Vie 07:00 - 22:00'
      };

      const newPlan: SubscriptionPlan = {
        id: `plan-${newGymId}-1`,
        gymId: newGymId,
        name: 'Pase Libre Musculación & Cardio',
        description: 'Acceso total a la sala de musculación y clases.',
        durationMonths: 1,
        billingCycle: 'monthly',
        priceARS: 35000,
        benefits: ['Musculación libre', 'Pase libre', 'Rutina personalizada'],
        gracePeriodDays: 3,
        branchIds: [branchId],
        active: true
      };

      setCurrentGymId(newGymId);
      setUsers([newAdminUser]);
      setBranches([newBranch]);
      setPlans([newPlan]);
      setMemberships([]);
      setPayments([]);
      setCurrentUserId(adminId);
      setSelectedBranchId(branchId);
      setIsAuthLoading(false);

      return {
        success: true,
        message: `¡Gimnasio ${data.gymName} creado con éxito! Bienvenido al Panel de Administración.`,
        gym: newGym,
        user: newAdminUser
      };
    } catch (err: any) {
      setIsAuthLoading(false);
      return { success: false, message: err.message || 'Error al registrar gimnasio.' };
    }
  };

  const sendWhatsAppReminder = (userId: string) => {
    const user = getUserById(userId);
    const mem = getMembershipForUser(userId);
    const plan = mem ? getPlanById(mem.planId) : undefined;
    if (!user) return;

    const cleanPhone = user.phone.replace(/[^0-9]/g, '');
    const expDate = mem ? new Date(mem.endDate).toLocaleDateString('es-AR') : 'próximamente';
    const amount = plan ? `$${plan.priceARS.toLocaleString('es-AR')}` : '';

    const text = encodeURIComponent(
      `¡Hola ${user.name}! Te escribimos de FuerzaFit Gym 💪\n\nTe recordamos que tu membresía (${plan?.name || 'Pase'}) vence el ${expDate}.\nValor cuota: ${amount}\n\nPodés renovar al instante con Mercado Pago desde la app o respondernos para abonar por transferencia.\n¡Te esperamos en el gym!`
    );

    const waUrl = `https://wa.me/${cleanPhone}?text=${text}`;
    window.open(waUrl, '_blank');
  };

  // Real-time Access Control & QR Verification
  const validateQrAccess = (qrToken: string, branchId: string = selectedBranchId): QrValidationResult => {
    const membership = memberships.find(m => m.qrToken.trim().toLowerCase() === qrToken.trim().toLowerCase());
    
    if (!membership) {
      // Record denied attendance
      const record: AttendanceRecord = {
        id: `att-${Date.now()}`,
        gymId: currentGymId,
        userId: 'unknown',
        userName: 'Código QR No Reconocido',
        timestamp: new Date().toISOString(),
        accessMethod: 'qr_scanner',
        status: 'denied',
        reason: 'Código QR inexistente o no registrado en el sistema.',
        branchId
      };
      setAttendanceRecords(prev => [record, ...prev]);
      return {
        allowed: false,
        message: 'Código QR inválido o expirado.',
        reasonCode: 'NOT_FOUND'
      };
    }

    const user = getUserById(membership.userId);
    const plan = getPlanById(membership.planId);
    const now = new Date();
    const expiry = new Date(membership.endDate);
    const graceDays = plan?.gracePeriodDays || 0;
    const graceExpiry = new Date(expiry.getTime() + graceDays * 24 * 60 * 60 * 1000);

    if (membership.status === 'suspended') {
      const record: AttendanceRecord = {
        id: `att-${Date.now()}`,
        gymId: currentGymId,
        userId: membership.userId,
        userName: user?.name || 'Socio',
        userAvatar: user?.avatarUrl,
        timestamp: new Date().toISOString(),
        accessMethod: 'qr_scanner',
        status: 'denied',
        reason: 'Membresía suspendida temporalmente por administración.',
        branchId,
        planName: plan?.name
      };
      setAttendanceRecords(prev => [record, ...prev]);
      return {
        allowed: false,
        user,
        membership,
        plan,
        message: 'Acceso Denegado: Tu membresía se encuentra suspendida.',
        reasonCode: 'SUSPENDED'
      };
    }

    // Check Multi-Sede permissions
    if (plan && plan.branchIds && !plan.branchIds.includes(branchId)) {
      const targetBranch = branches.find(b => b.id === branchId);
      const record: AttendanceRecord = {
        id: `att-${Date.now()}`,
        gymId: currentGymId,
        userId: membership.userId,
        userName: user?.name || 'Socio',
        userAvatar: user?.avatarUrl,
        timestamp: new Date().toISOString(),
        accessMethod: 'qr_scanner',
        status: 'denied',
        reason: `Plan sin habilitación para sede ${targetBranch?.name || 'seleccionada'}.`,
        branchId,
        planName: plan?.name
      };
      setAttendanceRecords(prev => [record, ...prev]);
      return {
        allowed: false,
        user,
        membership,
        plan,
        message: `Acceso restringido: Tu plan no incluye acceso a la sede ${targetBranch?.name || ''}.`,
        reasonCode: 'NO_BRANCH_ACCESS'
      };
    }

    // Check expiration and grace period
    if (now > expiry) {
      if (now <= graceExpiry) {
        // In grace period! Allowed with warning
        const record: AttendanceRecord = {
          id: `att-${Date.now()}`,
          userId: membership.userId,
          userName: user?.name || 'Socio',
          userAvatar: user?.avatarUrl,
          timestamp: new Date().toISOString(),
          accessMethod: 'qr_scanner',
          status: 'granted',
          reason: `Ingreso en período de gracia (Venció el ${expiry.toLocaleDateString('es-AR')})`,
          branchId,
          planName: plan?.name
        };
        setAttendanceRecords(prev => [record, ...prev]);
        return {
          allowed: true,
          user,
          membership,
          plan,
          message: `Acceso Permitido (Período de Gracia). Tu cuota venció el ${expiry.toLocaleDateString('es-AR')}. ¡Por favor renová hoy!`,
          reasonCode: 'EXPIRED_GRACE'
        };
      } else {
        // Blocked!
        const record: AttendanceRecord = {
          id: `att-${Date.now()}`,
          userId: membership.userId,
          userName: user?.name || 'Socio',
          userAvatar: user?.avatarUrl,
          timestamp: new Date().toISOString(),
          accessMethod: 'qr_scanner',
          status: 'denied',
          reason: `Membresía vencida el ${expiry.toLocaleDateString('es-AR')}. Período de gracia finalizado.`,
          branchId,
          planName: plan?.name
        };
        setAttendanceRecords(prev => [record, ...prev]);
        return {
          allowed: false,
          user,
          membership,
          plan,
          message: `Acceso Bloqueado: Membresía vencida el ${expiry.toLocaleDateString('es-AR')}. Renovación requerida.`,
          reasonCode: 'EXPIRED_BLOCKED'
        };
      }
    }

    // Anti-Fraud: 2-minute duplicate scan check
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const recentDuplicate = attendanceRecords.find(r => 
      r.userId === membership.userId && 
      r.status === 'granted' && 
      new Date(r.timestamp) > twoMinutesAgo
    );

    if (recentDuplicate) {
      const record: AttendanceRecord = {
        id: `att-${Date.now()}`,
        gymId: currentGymId,
        userId: membership.userId,
        userName: user?.name || 'Socio',
        userAvatar: user?.avatarUrl,
        timestamp: new Date().toISOString(),
        accessMethod: 'qr_scanner',
        status: 'denied',
        reason: 'Ingreso duplicado: Ya registraste un acceso en los últimos 2 minutos.',
        branchId,
        planName: plan?.name
      };
      setAttendanceRecords(prev => [record, ...prev]);
      if (isSupabaseConfigured && supabase) {
        recordAttendanceCheckin({ gymId: currentGymId, attendance: record }).catch(console.error);
      }
      return {
        allowed: false,
        user,
        membership,
        plan,
        message: 'Acceso Duplicado: Ya registraste un ingreso hace instantes. Por favor aguardá 2 minutos.',
        reasonCode: 'DUPLICATE_SCAN'
      };
    }

    // Normal active access
    const record: AttendanceRecord = {
      id: `att-${Date.now()}`,
      gymId: currentGymId,
      userId: membership.userId,
      userName: user?.name || 'Socio',
      userAvatar: user?.avatarUrl,
      timestamp: new Date().toISOString(),
      accessMethod: 'qr_scanner',
      status: 'granted',
      branchId,
      planName: plan?.name
    };
    setAttendanceRecords(prev => [record, ...prev]);

    if (isSupabaseConfigured && supabase) {
      recordAttendanceCheckin({ gymId: currentGymId, attendance: record }).catch(console.error);
    }

    return {
      allowed: true,
      user,
      membership,
      plan,
      message: `¡Bienvenido/a ${user?.name || 'Socio'}! Acceso concedido a FuerzaFit.`,
      reasonCode: 'ACTIVE'
    };
  };

  // BETA: acceso diario por DNI (el QR queda solo para el alta de nuevos socios).
  // Normaliza (solo dígitos) y delega en la misma validación de membresía del QR.
  const validateDniAccess = (dni: string, branchId: string = selectedBranchId): QrValidationResult => {
    const cleanDni = (dni || '').replace(/[^0-9]/g, '');
    if (!cleanDni) {
      return {
        allowed: false,
        message: 'Ingresá un DNI válido para validar el acceso.',
        reasonCode: 'NOT_FOUND'
      };
    }
    const user = users.find(u => (u.dni || '').replace(/[^0-9]/g, '') === cleanDni);
    if (!user) {
      const record: AttendanceRecord = {
        id: `att-${Date.now()}`,
        gymId: currentGymId,
        userId: 'unknown',
        userName: `DNI ${cleanDni} no registrado`,
        timestamp: new Date().toISOString(),
        accessMethod: 'manual_checkin',
        status: 'denied',
        reason: 'DNI inexistente en el padrón de socios de este gimnasio.',
        branchId
      };
      setAttendanceRecords(prev => [record, ...prev]);
      return {
        allowed: false,
        message: 'DNI no encontrado en este gimnasio. Verificá el número o dalo de alta en Socios.',
        reasonCode: 'NOT_FOUND'
      };
    }
    const membership = memberships.find(m => m.userId === user.id);
    if (!membership) {
      const record: AttendanceRecord = {
        id: `att-${Date.now()}`,
        gymId: currentGymId,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatarUrl,
        timestamp: new Date().toISOString(),
        accessMethod: 'manual_checkin',
        status: 'denied',
        reason: 'Socio sin membresía asignada.',
        branchId
      };
      setAttendanceRecords(prev => [record, ...prev]);
      return {
        allowed: false,
        user,
        message: `${user.name} no tiene membresía asignada. Asignale un plan desde Socios.`,
        reasonCode: 'NOT_FOUND'
      };
    }
    // Reutiliza expiración, gracia, suspensión, sede y anti-duplicado del QR
    return validateQrAccess(membership.qrToken, branchId);
  };

  const simulateQuickCheckin = (userId: string, statusOverride: 'granted' | 'denied' = 'granted') => {
    const user = getUserById(userId);
    const mem = getMembershipForUser(userId);
    const plan = mem ? getPlanById(mem.planId) : undefined;

    const record: AttendanceRecord = {
      id: `att-${Date.now()}`,
      gymId: currentGymId,
      userId,
      userName: user?.name || 'Socio',
      userAvatar: user?.avatarUrl,
      timestamp: new Date().toISOString(),
      accessMethod: 'manual_checkin',
      status: statusOverride,
      reason: statusOverride === 'denied' ? 'Revisión administrativa en recepción' : undefined,
      branchId: selectedBranchId,
      planName: plan?.name
    };
    setAttendanceRecords(prev => [record, ...prev]);
    return record;
  };

  // User management (Caja / Recepción / Admin member registration)
  // BETA FIX: crea credencial Auth real (para que el socio pueda loguearse) y
  // usa ese id en perfil/membresía/pago (la FK profiles.id lo exige).
  const createMember = async (data: Omit<User, 'id' | 'createdAt'> & {
    planId: string;
    initialPaymentMethod: PaymentMethod;
    amountARS?: number;
    discountARS?: number;
    discountReason?: string;
  }) => {
    const plan = getPlanById(data.planId) || plans[0];
    const tempPassword = `socio${Math.floor(1000 + Math.random() * 9000)}`;
    const activationOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const memberEmail = data.email.trim().toLowerCase();
    const memberBranchId = data.branchId || selectedBranchId;

    let newId = `usr-${Date.now()}`;
    let loginReady = false;
    let loginHint: string | undefined;

    if (isSupabaseConfigured && supabase) {
      const authRes = await signUpMemberAuthAccount({
        email: memberEmail,
        password: tempPassword,
        name: data.name.trim(),
        phone: data.phone.trim(),
        dni: data.dni?.trim(),
        branchId: memberBranchId
      });
      if (authRes.success && authRes.userId) {
        newId = authRes.userId;
        loginReady = true;
      } else {
        loginHint = authRes.error?.toLowerCase().includes('already')
          ? 'Ese email ya tenía cuenta: el socio puede ingresar con OTP o su clave.'
          : `No se pudo crear el login (${authRes.error || 'error'}). El socio puede activarse con código por email.`;
      }
    }
    
    const newUser: User = {
      id: newId,
      gymId: currentGymId,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      dni: data.dni?.trim() || `${Math.floor(30000000 + Math.random() * 15000000)}`,
      role: 'member',
      avatarUrl: data.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
      birthDate: data.birthDate,
      medicalClearance: data.medicalClearance || false,
      medicalClearanceExpiry: data.medicalClearance ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
      emergencyContact: data.emergencyContact,
      branchId: data.branchId || selectedBranchId,
      createdAt: new Date().toISOString(),
      notes: data.notes,
      isEmailVerified: true
    };

    const durationDays = plan.durationMonths > 0 ? plan.durationMonths * 30 : 1;
    const now = new Date();
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const safeDiscountAlta = Math.max(0, Math.min(Number(data.discountARS) || 0, plan.priceARS - 1));
    const grossAlta = plan.priceARS;
    const netAlta = data.amountARS !== undefined ? Math.max(1, Number(data.amountARS)) : Math.max(1, grossAlta - safeDiscountAlta);
    // Si viene amountARS explícito, derivar discount implícito si no se pasó
    const finalDiscountAlta = safeDiscountAlta > 0 ? safeDiscountAlta : (grossAlta > netAlta ? grossAlta - netAlta : 0);
    const chargeAmount = netAlta;

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      gymId: currentGymId,
      userId: newId,
      userName: newUser.name,
      userEmail: newUser.email,
      planId: plan.id,
      planName: plan.name,
      amountARS: chargeAmount,
      currency: 'ARS',
      method: data.initialPaymentMethod,
      status: 'approved',
      paymentDate: now.toISOString(),
      transactionId: `ALTA-${Math.floor(100000 + Math.random() * 900000)}`,
      idempotencyKey: `idem-alta-${newId}-${Date.now()}`,
      discountARS: finalDiscountAlta > 0 ? finalDiscountAlta : undefined,
      discountReason: finalDiscountAlta > 0 ? (data.discountReason || 'Primera cuota / Bienvenida') : undefined,
    };

    const newMembership: Membership = {
      id: `mem-${Date.now()}`,
      gymId: currentGymId,
      userId: newId,
      planId: plan.id,
      status: 'active',
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      autoRenew: true,
      qrToken: `FF-QR-${newUser.name.split(' ')[0].toUpperCase()}-${now.getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      branchId: data.branchId || selectedBranchId,
      lastPaymentId: newPayment.id
    };

    setUsers(prev => [newUser, ...prev]);
    setMemberships(prev => [newMembership, ...prev]);
    setPayments(prev => [newPayment, ...prev]);

    // Persist real member, membership and payment to Supabase.
    // Solo con id Auth real: la FK profiles.id → auth.users.id rechaza ids locales.
    if (isSupabaseConfigured && supabase && loginReady) {
      persistNewMember({
        gymId: currentGymId,
        user: newUser,
        membership: newMembership,
        payment: newPayment
      }).catch(err => console.error('Error persisting new member to Supabase:', err));
    }

    // Send activation simulated email notification
    setLastSimulatedEmailNotification({
      email: newUser.email,
      code: activationOtp,
      type: 'activation',
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });

    // Add reception log notification
    const discountNoteAlta = finalDiscountAlta > 0 ? ` (Desc. $${finalDiscountAlta.toLocaleString('es-AR')} — ${data.discountReason || 'Primera cuota'})` : '';
    const adminNotif: GymNotification = {
      id: `notif-alta-${Date.now()}`,
      userId: 'all',
      title: `Nuevo socio ingresado en caja: ${newUser.name}`,
      message: `Plan ${plan.name} abonado con ${data.initialPaymentMethod === 'mercadopago' ? 'Mercado Pago' : data.initialPaymentMethod === 'cash' ? 'Efectivo en Caja' : data.initialPaymentMethod === 'transfer' ? 'Transferencia' : 'Débito'}. Total: $${chargeAmount.toLocaleString('es-AR')}${discountNoteAlta}.`,
      type: 'payment',
      read: false,
      createdAt: now.toISOString()
    };
    setNotifications(prev => [adminNotif, ...prev]);

    return {
      success: true,
      user: newUser,
      membership: newMembership,
      payment: newPayment,
      tempPassword,
      activationOtp,
      loginReady,
      loginHint
    };
  };

  // Staff creation (recepción / entrenador) — sin membresía, acceso limitado
  const createStaff = async (data: { name: string; email: string; phone?: string; role: UserRole; branchId?: string; }) => {
    const cleanEmail = data.email.trim().toLowerCase();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'Ya existe un usuario con ese email.' } as any;
    }
    const tempPassword = `staff${Math.floor(1000 + Math.random() * 9000)}`;
    const branch = data.branchId || selectedBranchId;
    let newId = `usr-${Date.now()}`;
    let loginReady = false;
    if (isSupabaseConfigured && supabase) {
      const res: any = await (supabase.auth as any).signUp({
        email: cleanEmail,
        password: tempPassword,
        options: { data: { name: data.name.trim(), role: data.role, phone: data.phone || '', branch_id: branch } }
      });
      // Supabase v2 signUp returns { data, error }
      const authData = res?.data;
      const signUpError = res?.error;
      if (!signUpError && authData?.user?.id) {
        newId = authData.user.id;
        loginReady = true;
      }
    }
    const newUser: User = {
      id: newId,
      gymId: currentGymId,
      name: data.name.trim(),
      email: cleanEmail,
      phone: data.phone || '',
      role: data.role,
      branchId: branch,
      createdAt: new Date().toISOString(),
      isEmailVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
    };
    setUsers(prev => [newUser, ...prev]);
    if (isSupabaseConfigured && supabase && loginReady) {
      await supabase.from('profiles').upsert({
        id: newId,
        gym_id: currentGymId,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        branch_id: branch
      } as any);
    }
    const notif: GymNotification = {
      id: `notif-staff-${Date.now()}`,
      userId: 'all',
      title: `Nuevo empleado: ${newUser.name} (${data.role})`,
      message: `Cuenta creada para ${data.role}. Ingreso por /admin con email ${cleanEmail}.`,
      type: 'announcement',
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [notif, ...prev]);
    return { success: true, user: newUser, tempPassword, loginReady };
  };

  const updateMember = (userId: string, data: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
  };

  const deleteMember = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    setMemberships(prev => prev.filter(m => m.userId !== userId));
  };

  const toggleMembershipSuspension = (userId: string) => {
    setMemberships(prev => prev.map(m => {
      if (m.userId === userId) {
        const nextStatus = m.status === 'suspended' ? 'active' : 'suspended';
        return { ...m, status: nextStatus };
      }
      return m;
    }));
  };

  // Plans management
  const createPlan = (planData: Omit<SubscriptionPlan, 'id'>) => {
    const newPlan: SubscriptionPlan = {
      ...planData,
      id: `plan-${Date.now()}`,
      gymId: currentGymId
    };
    setPlans(prev => [...prev, newPlan]);
    if (isSupabaseConfigured && supabase) {
      persistPlan(currentGymId, newPlan).catch(console.error);
    }
  };

  const updatePlan = (planId: string, planData: Partial<SubscriptionPlan>) => {
    setPlans(prev => prev.map(p => {
      if (p.id === planId) {
        const updated = { ...p, ...planData };
        if (isSupabaseConfigured && supabase) {
          persistPlan(currentGymId, updated).catch(console.error);
        }
        return updated;
      }
      return p;
    }));
  };

  // Routine management
  const createRoutine = (routineData: Omit<Routine, 'id' | 'createdAt'>) => {
    const newRoutine: Routine = {
      ...routineData,
      id: `rt-${Date.now()}`,
      gymId: currentGymId,
      createdAt: new Date().toISOString()
    };
    setRoutines(prev => [newRoutine, ...prev]);
    if (isSupabaseConfigured && supabase) {
      persistRoutine(currentGymId, newRoutine).catch(console.error);
    }
  };

  const updateRoutine = (routineId: string, routineData: Partial<Routine>) => {
    setRoutines(prev => prev.map(r => {
      if (r.id === routineId) {
        const updated = { ...r, ...routineData };
        if (isSupabaseConfigured && supabase) {
          persistRoutine(currentGymId, updated).catch(console.error);
        }
        return updated;
      }
      return r;
    }));
  };

  const assignRoutineToUsers = (routineId: string, userIds: string[]) => {
    setRoutines(prev => prev.map(r => {
      if (r.id === routineId) {
        const combined = Array.from(new Set([...r.assignedUserIds, ...userIds]));
        return { ...r, assignedUserIds: combined };
      }
      return r;
    }));

    // Notify assigned users
    userIds.forEach(uid => {
      const routine = routines.find(r => r.id === routineId);
      const notif: GymNotification = {
        id: `notif-${Date.now()}-${uid}`,
        userId: uid,
        title: '¡Nueva rutina asignada por tu entrenador!',
        message: `Se te asignó el plan de entrenamiento: "${routine?.title || 'Nueva Rutina'}". Ingresá a la sección Rutinas para ver los ejercicios y videos.`,
        type: 'routine',
        read: false,
        createdAt: new Date().toISOString()
      };
      setNotifications(prev => [notif, ...prev]);
    });
  };

  const logWorkoutSession = (logData: Omit<WorkoutSessionLog, 'id'>) => {
    const newLog: WorkoutSessionLog = {
      ...logData,
      id: `wlog-${Date.now()}`
    };
    setWorkoutLogs(prev => [newLog, ...prev]);
  };

  const updateRoutineExerciseSet = (
    routineId: string,
    dayId: string,
    blockId: string,
    exerciseId: string,
    setIndex: number,
    completed: boolean,
    actualWeight?: number,
    actualReps?: number
  ) => {
    setRoutines(prev => prev.map(routine => {
      if (routine.id !== routineId) return routine;
      return {
        ...routine,
        days: routine.days.map(day => {
          if (day.id !== dayId) return day;
          return {
            ...day,
            blocks: day.blocks.map(block => {
              if (block.id !== blockId) return block;
              return {
                ...block,
                exercises: block.exercises.map(ex => {
                  if (ex.id !== exerciseId) return ex;
                  const currentSets = ex.completedSets ? [...ex.completedSets] : [];
                  while (currentSets.length <= setIndex) {
                    currentSets.push({
                      setNumber: currentSets.length + 1,
                      reps: 10,
                      weightKg: ex.weightKgSuggested || 0,
                      completed: false
                    });
                  }
                  currentSets[setIndex] = {
                    ...currentSets[setIndex],
                    completed,
                    reps: actualReps !== undefined ? actualReps : currentSets[setIndex].reps,
                    weightKg: actualWeight !== undefined ? actualWeight : currentSets[setIndex].weightKg
                  };
                  return {
                    ...ex,
                    completedSets: currentSets
                  };
                })
              };
            })
          };
        })
      };
    }));
  };

  // Class bookings
  const bookClass = (classId: string, userId: string): { success: boolean; message: string } => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return { success: false, message: 'Clase no encontrada.' };

    const mem = getMembershipForUser(userId);
    if (!mem || mem.status !== 'active') {
      return { success: false, message: 'Tu membresía no está activa. Por favor regularizá tu cuota para reservar.' };
    }

    if (cls.enrolledUserIds.includes(userId)) {
      return { success: false, message: 'Ya tenés una reserva confirmada para esta clase.' };
    }

    const isFull = cls.enrolledUserIds.length >= cls.capacity;

    if (isFull) {
      if (cls.waitingListUserIds.includes(userId)) {
        return { success: false, message: 'Ya estás en la lista de espera para esta clase.' };
      }
      setClasses(prev => prev.map(c => c.id === classId ? { ...c, waitingListUserIds: [...c.waitingListUserIds, userId] } : c));
      return { success: true, message: 'Cupo completo. Te añadimos a la lista de espera. Si alguien cancela, ingresarás automáticamente.' };
    }

    setClasses(prev => prev.map(c => {
      if (c.id === classId) {
        const updated = { ...c, enrolledUserIds: [...c.enrolledUserIds, userId] };
        if (isSupabaseConfigured && supabase) {
          persistClassBooking(currentGymId, updated).catch(console.error);
        }
        return updated;
      }
      return c;
    }));

    // Send notification
    const notif: GymNotification = {
      id: `notif-${Date.now()}`,
      userId,
      title: `Reserva confirmada: ${cls.title}`,
      message: `Tenés tu lugar asegurado para el ${new Date(cls.date).toLocaleDateString('es-AR')} a las ${cls.startTime} hs con ${cls.instructorName}.`,
      type: 'class',
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [notif, ...prev]);
    if (isSupabaseConfigured && supabase) {
      persistNotification(currentGymId, notif).catch(console.error);
    }

    return { success: true, message: `¡Reserva confirmada con éxito para ${cls.title}!` };
  };

  const cancelClassBooking = (classId: string, userId: string): { success: boolean; message: string } => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return { success: false, message: 'Clase no encontrada.' };

    let newEnrolled = cls.enrolledUserIds.filter(id => id !== userId);
    let newWaiting = cls.waitingListUserIds.filter(id => id !== userId);

    // If a spot opened up, promote the first from waiting list
    let promotedUserId: string | null = null;
    if (newEnrolled.length < cls.capacity && newWaiting.length > 0) {
      promotedUserId = newWaiting[0];
      newWaiting = newWaiting.slice(1);
      newEnrolled.push(promotedUserId);
    }

    setClasses(prev => prev.map(c => {
      if (c.id === classId) {
        const updated = { ...c, enrolledUserIds: newEnrolled, waitingListUserIds: newWaiting };
        if (isSupabaseConfigured && supabase) {
          persistClassBooking(currentGymId, updated).catch(console.error);
        }
        return updated;
      }
      return c;
    }));

    if (promotedUserId) {
      const notif: GymNotification = {
        id: `notif-${Date.now()}-promo`,
        userId: promotedUserId,
        title: `¡Se liberó un cupo en ${cls.title}!`,
        message: `Avanzaste de la lista de espera y tu reserva quedó confirmada automáticamente para el ${cls.date} ${cls.startTime} hs.`,
        type: 'class',
        read: false,
        createdAt: new Date().toISOString()
      };
      setNotifications(prev => [notif, ...prev]);
      if (isSupabaseConfigured && supabase) {
        persistNotification(currentGymId, notif).catch(console.error);
      }
    }

    return { success: true, message: 'Reserva cancelada correctamente.' };
  };

  const createGroupClass = (classData: Omit<GroupClass, 'id' | 'enrolledUserIds' | 'waitingListUserIds'>) => {
    const newClass: GroupClass = {
      ...classData,
      id: `cls-${Date.now()}`,
      gymId: currentGymId,
      enrolledUserIds: [],
      waitingListUserIds: []
    };
    setClasses(prev => [...prev, newClass]);
    if (isSupabaseConfigured && supabase) {
      // BETA FIX: insertar (antes hacía update y la clase nueva nunca se guardaba)
      persistNewClass(currentGymId, newClass).catch(console.error);
    }
  };

  const checkInClassAttendee = (classId: string, userId: string) => {
    simulateQuickCheckin(userId, 'granted');
  };

  // Progress metrics
  const addProgressMetric = (metricData: Omit<UserProgressMetric, 'id'>) => {
    const newMetric: UserProgressMetric = {
      ...metricData,
      id: `prog-${Date.now()}`
    };
    setProgressMetrics(prev => [...prev, newMetric]);
  };

  // Notifications
  const markNotificationRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
  };

  const sendBroadcastNotification = (title: string, message: string, type: GymNotification['type'] = 'announcement') => {
    const newNotif: GymNotification = {
      id: `notif-${Date.now()}`,
      userId: 'all',
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev]);
    if (isSupabaseConfigured && supabase) {
      persistNotification(currentGymId, newNotif).catch(console.error);
    }
  };

  const loginAsAdmin = () => {
    const admin = users.find(u => u.role === 'admin') || INITIAL_USERS[0];
    if (admin) {
      setCurrentUserId(admin.id);
      if (admin.branchId) setSelectedBranchId(admin.branchId);
    }
  };

  const createQuickTestMember = async (): Promise<User | null> => {
    const existing = users.find(u => u.role === 'member');
    if (existing) {
      setCurrentUserId(existing.id);
      return existing;
    }

    const testId = `usr-test-socio-${Date.now().toString().slice(-4)}`;
    const plan = plans[0] || INITIAL_PLANS[0];
    const branch = branches[0] || INITIAL_BRANCHES[0];

    const newMember: User = {
      id: testId,
      name: 'Carlos Benítez (Socio Test)',
      email: 'socio.demo@fuerzafit.com',
      phone: '+54 9 11 4455-6677',
      dni: '38990123',
      role: 'member',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      branchId: branch.id,
      createdAt: new Date().toISOString(),
      isEmailVerified: true
    };

    const newMem: Membership = {
      id: `mem-${Date.now()}`,
      userId: testId,
      planId: plan.id,
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      autoRenew: true,
      qrToken: `FF-QR-CARLOS-${Date.now().toString().slice(-5)}`,
      branchId: branch.id
    };

    setUsers(prev => [newMember, ...prev]);
    setMemberships(prev => [newMem, ...prev]);
    setCurrentUserId(testId);
    return newMember;
  };

  const resetToDemoData = () => {
    localStorage.clear();
    setUsers(INITIAL_USERS);
    setBranches(INITIAL_BRANCHES);
    setPlans(INITIAL_PLANS);
    setMemberships(INITIAL_MEMBERSHIPS);
    setPayments(INITIAL_PAYMENTS);
    setRoutines(INITIAL_ROUTINES);
    setClasses(INITIAL_CLASSES);
    setAttendanceRecords(INITIAL_ATTENDANCE);
    setProgressMetrics(INITIAL_PROGRESS);
    setWorkoutLogs(INITIAL_WORKOUT_LOGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setCurrentUserId('usr-admin');
    setSelectedBranchId('branch-1');
  };

  return (
    <GymContext.Provider
      value={{
        currentUser,
        currentRole,
        currentGym,
        allGyms,
        switchGym,
        createNewGym,
        isLoadingData,
        syncError,
        refreshGymData,
        isAuthLoading,
        authError,
        selectedBranchId,
        branches,
        users,
        plans,
        memberships,
        payments,
        exerciseLibrary,
        routines,
        classes,
        attendanceRecords,
        progressMetrics,
        workoutLogs,
        notifications,
        lastSimulatedEmailNotification,
        clearSimulatedEmailNotification,
        switchUser,
        loginWithEmail,
        requestLoginOtp,
        verifyLoginOtp,
        requestPhoneOtp,
        verifyPhoneOtp,
        loginWithPassword,
        requestPasswordReset,
        updatePassword,
        registerMemberSelf,
        confirmRegistration,
        logout,
        setSelectedBranchId,
        getMembershipForUser,
        getPlanById,
        getUserById,
        processPayment,
        recordManualPayment,
        approveManualPayment,
        rejectManualPayment,
        registerGymOwnerAccount,
        sendWhatsAppReminder,
        validateQrAccess,
        validateDniAccess,
        simulateQuickCheckin,
        createMember,
        createStaff,
        updateMember,
        deleteMember,
        toggleMembershipSuspension,
        createPlan,
        updatePlan,
        createRoutine,
        updateRoutine,
        assignRoutineToUsers,
        logWorkoutSession,
        updateRoutineExerciseSet,
        bookClass,
        cancelClassBooking,
        createGroupClass,
        checkInClassAttendee,
        addProgressMetric,
        markNotificationRead,
        sendBroadcastNotification,
        resetToDemoData,
        loginAsAdmin,
        createQuickTestMember
      }}
    >
      {children}
    </GymContext.Provider>
  );
};

export const useGym = () => {
  const context = useContext(GymContext);
  if (!context) {
    throw new Error('useGym must be used within a GymProvider');
  }
  return context;
};

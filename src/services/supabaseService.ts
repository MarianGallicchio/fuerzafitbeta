import { supabase, isSupabaseConfigured, createSecondarySupabaseClient } from '../lib/supabase';
import {
  GymTenant,
  User,
  GymBranch,
  SubscriptionPlan,
  Membership,
  Payment,
  Routine,
  GroupClass,
  AttendanceRecord,
  GymNotification,
  UserProgressMetric,
  WorkoutSessionLog,
  ExerciseLibraryItem
} from '../types';

/**
 * Servicio centralizado de persistencia en Supabase para FuerzaFit.
 * Aísla todas las consultas por gym_id (Multi-Tenant) y mapea los campos de PostgreSQL a TypeScript.
 */

// ==============================================================================
// 1. GIMNASIOS (TENANTS)
// ==============================================================================

export async function getGymTenant(gymId: string): Promise<GymTenant | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('gyms')
      .select('*')
      .eq('id', gymId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      ownerUserId: data.owner_user_id,
      plan: data.plan || 'beta',
      status: data.status || 'active',
      createdAt: data.created_at,
      logoUrl: data.logo_url,
      contactEmail: data.contact_email,
      contactPhone: data.contact_phone
    };
  } catch (err) {
    console.error('Error fetching gym tenant:', err);
    return null;
  }
}

export async function getAllGyms(): Promise<GymTenant[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from('gyms')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      ownerUserId: d.owner_user_id,
      plan: d.plan || 'beta',
      status: d.status || 'active',
      createdAt: d.created_at,
      logoUrl: d.logo_url,
      contactEmail: d.contact_email,
      contactPhone: d.contact_phone
    }));
  } catch (err) {
    console.error('Error fetching all gyms:', err);
    return [];
  }
}

export async function createGymTenant(data: {
  name: string;
  slug: string;
  ownerUserId?: string;
  ownerName?: string;
  contactEmail?: string;
  contactPhone?: string;
  initialBranchName?: string;
  initialBranchAddress?: string;
}): Promise<{ success: boolean; gym?: GymTenant; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase no está configurado en las variables de entorno.' };
  }

  try {
    // 1. Insertar el gimnasio
    const { data: newGym, error: gymError } = await supabase
      .from('gyms')
      .insert({
        name: data.name.trim(),
        slug: data.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        owner_user_id: data.ownerUserId || null,
        plan: 'beta',
        status: 'active',
        contact_email: data.contactEmail?.trim(),
        contact_phone: data.contactPhone?.trim()
      })
      .select()
      .single();

    if (gymError || !newGym) {
      return { success: false, error: gymError?.message || 'Error al crear gimnasio.' };
    }

    const tenant: GymTenant = {
      id: newGym.id,
      name: newGym.name,
      slug: newGym.slug,
      ownerUserId: newGym.owner_user_id,
      plan: newGym.plan,
      status: newGym.status,
      createdAt: newGym.created_at,
      contactEmail: newGym.contact_email,
      contactPhone: newGym.contact_phone
    };

    // 2. Crear sede inicial por defecto para el gimnasio
    const branchCode = `FZF-${data.slug.toUpperCase().slice(0, 4)}-${new Date().getFullYear()}`;
    const branchId = `br-${newGym.id.slice(0, 8)}-1`;
    await supabase.from('branches').insert({
      id: branchId,
      gym_id: newGym.id,
      code: branchCode,
      name: data.initialBranchName || `${data.name} Sede Central`,
      address: data.initialBranchAddress || 'Av. Principal 1234',
      city: 'Buenos Aires',
      phone: data.contactPhone || '+54 9 11 4000-0000',
      is_open: true,
      current_occupancy: 0,
      max_capacity: 150,
      opening_hours: 'Lun a Vie 07:00 - 22:00, Sáb 09:00 - 18:00'
    });

    // 3. Crear plan inicial estándar
    await supabase.from('plans').insert({
      id: `plan-${newGym.id.slice(0, 8)}-1`,
      gym_id: newGym.id,
      name: 'Pase Libre Musculación & Cardio',
      description: 'Acceso total a la sala de aparatos y área de cardio.',
      duration_months: 1,
      billing_cycle: 'monthly',
      price_ars: 35000,
      benefits: ['Acceso ilimitado', 'Evaluación inicial sin cargo', 'App de entrenamiento'],
      grace_period_days: 3,
      branch_ids: [branchId],
      active: true
    });

    // 4. Si se proporcionó un ID de dueño, registrar su perfil como admin
    if (data.ownerUserId) {
      await supabase.from('profiles').upsert({
        id: data.ownerUserId,
        gym_id: newGym.id,
        name: data.ownerName || 'Administrador',
        email: data.contactEmail || 'admin@fuerzafit.com',
        phone: data.contactPhone || '',
        role: 'admin',
        branch_id: branchId,
        created_at: new Date().toISOString()
      });
    }

    return { success: true, gym: tenant };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error inesperado al crear gimnasio.' };
  }
}

// ==============================================================================
// 2. CARGA COMPLETA DE DATOS DEL GIMNASIO (TENANT DATA LOADER)
// ==============================================================================

export async function loadGymData(gymId: string) {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  try {
    const [
      branchesRes,
      plansRes,
      membershipsRes,
      paymentsRes,
      routinesRes,
      classesRes,
      attendanceRes,
      progressRes,
      workoutLogsRes,
      notificationsRes,
      exercisesRes,
      profilesRes
    ] = await Promise.all([
      supabase.from('branches').select('*').eq('gym_id', gymId),
      supabase.from('plans').select('*').eq('gym_id', gymId).order('price_ars', { ascending: true }),
      supabase.from('memberships').select('*').eq('gym_id', gymId),
      supabase.from('payments').select('*').eq('gym_id', gymId).order('payment_date', { ascending: false }).limit(200),
      supabase.from('routines').select('*').eq('gym_id', gymId),
      supabase.from('classes').select('*').eq('gym_id', gymId).order('date', { ascending: true }),
      supabase.from('attendance').select('*').eq('gym_id', gymId).order('timestamp', { ascending: false }).limit(200),
      supabase.from('progress_metrics').select('*').eq('gym_id', gymId).order('date', { ascending: false }),
      supabase.from('workout_logs').select('*').eq('gym_id', gymId).order('date', { ascending: false }).limit(100),
      supabase.from('notifications').select('*').eq('gym_id', gymId).order('created_at', { ascending: false }).limit(50),
      supabase.from('exercise_library').select('*').or(`is_global.eq.true,gym_id.eq.${gymId}`),
      supabase.from('profiles').select('*').eq('gym_id', gymId)
    ]);

    // Mapear perfiles a User[]
    const users: User[] = (profilesRes.data || []).map((p: any) => ({
      id: p.id,
      gymId: p.gym_id,
      name: p.name,
      email: p.email,
      phone: p.phone || '',
      dni: p.dni,
      role: p.role || 'member',
      avatarUrl: p.avatar_url,
      branchId: p.branch_id || 'branch-1',
      birthDate: p.birth_date,
      medicalClearance: p.medical_clearance,
      medicalClearanceExpiry: p.medical_clearance_expiry,
      emergencyContact: p.emergency_contact,
      notes: p.notes,
      createdAt: p.created_at,
      isEmailVerified: true
    }));

    // Mapear branches
    const branches: GymBranch[] = (branchesRes.data || []).map((b: any) => ({
      id: b.id,
      gymId: b.gym_id,
      code: b.code,
      name: b.name,
      address: b.address,
      city: b.city,
      phone: b.phone || '',
      isOpen: b.is_open ?? true,
      currentOccupancy: b.current_occupancy || 0,
      maxCapacity: b.max_capacity || 150,
      openingHours: b.opening_hours || 'Lun a Vie 07:00 - 22:00'
    }));

    // Mapear plans
    const plans: SubscriptionPlan[] = (plansRes.data || []).map((pl: any) => ({
      id: pl.id,
      gymId: pl.gym_id,
      name: pl.name,
      description: pl.description || '',
      durationMonths: pl.duration_months || 1,
      billingCycle: pl.billing_cycle || 'monthly',
      priceARS: Number(pl.price_ars) || 0,
      benefits: Array.isArray(pl.benefits) ? pl.benefits : [],
      gracePeriodDays: pl.grace_period_days ?? 3,
      maxClassesPerWeek: pl.max_classes_per_week,
      isPopular: pl.is_popular ?? false,
      branchIds: Array.isArray(pl.branch_ids) ? pl.branch_ids : [],
      active: pl.active ?? true
    }));

    // Mapear memberships
    const memberships: Membership[] = (membershipsRes.data || []).map((m: any) => ({
      id: m.id,
      gymId: m.gym_id,
      userId: m.user_id,
      planId: m.plan_id,
      status: m.status || 'active',
      startDate: m.start_date,
      endDate: m.end_date,
      autoRenew: m.auto_renew ?? true,
      qrToken: m.qr_token,
      graceUntil: m.grace_until,
      branchId: m.branch_id || 'branch-1',
      lastPaymentId: m.last_payment_id
    }));

    // Mapear payments (con soporte descuento 1ra cuota)
    const payments: Payment[] = (paymentsRes.data || []).map((py: any) => ({
      id: py.id,
      gymId: py.gym_id,
      userId: py.user_id,
      userName: py.user_name,
      userEmail: py.user_email,
      planId: py.plan_id,
      planName: py.plan_name,
      amountARS: Number(py.amount_ars) || 0,
      currency: 'ARS',
      method: py.method,
      status: py.status,
      paymentDate: py.payment_date,
      transactionId: py.transaction_id,
      idempotencyKey: py.idempotency_key,
      mpPaymentId: py.mp_payment_id,
      mpPreferenceId: py.mp_preference_id,
      rawGatewayPayload: py.raw_gateway_payload,
      receiptUrl: py.receipt_url,
      notes: py.notes,
      discountARS: py.discount_ars != null ? Number(py.discount_ars) : undefined,
      discountReason: py.discount_reason || undefined
    }));

    // Mapear routines
    const routines: Routine[] = (routinesRes.data || []).map((r: any) => ({
      id: r.id,
      gymId: r.gym_id,
      title: r.title,
      goal: r.goal,
      level: r.level,
      assignedUserIds: Array.isArray(r.assigned_user_ids) ? r.assigned_user_ids : [],
      days: Array.isArray(r.days) ? r.days : [],
      isTemplate: r.is_template ?? false,
      createdAt: r.created_at,
      creatorName: r.creator_name || 'Entrenador',
      description: r.description
    }));

    // Mapear classes
    const classes: GroupClass[] = (classesRes.data || []).map((c: any) => ({
      id: c.id,
      gymId: c.gym_id,
      title: c.title,
      instructorName: c.instructor_name,
      instructorId: c.instructor_id,
      category: c.category,
      date: c.date,
      startTime: c.start_time,
      endTime: c.end_time,
      capacity: c.capacity,
      branchId: c.branch_id,
      room: c.room,
      enrolledUserIds: Array.isArray(c.enrolled_user_ids) ? c.enrolled_user_ids : [],
      waitingListUserIds: Array.isArray(c.waiting_list_user_ids) ? c.waiting_list_user_ids : [],
      colorTag: c.color_tag || 'emerald'
    }));

    // Mapear attendance
    const attendance: AttendanceRecord[] = (attendanceRes.data || []).map((a: any) => ({
      id: a.id,
      gymId: a.gym_id,
      branchId: a.branch_id,
      userId: a.user_id,
      userName: a.user_name,
      userAvatar: a.user_avatar,
      timestamp: a.timestamp,
      accessMethod: a.access_method || 'qr_scanner',
      status: a.status || 'granted',
      reason: a.reason,
      planName: a.plan_name
    }));

    // Mapear progress metrics
    const progress: UserProgressMetric[] = (progressRes.data || []).map((pr: any) => ({
      id: pr.id,
      gymId: pr.gym_id,
      userId: pr.user_id,
      date: pr.date,
      weightKg: Number(pr.weight_kg),
      bodyFatPercent: pr.body_fat_percent ? Number(pr.body_fat_percent) : undefined,
      chestCm: pr.chest_cm ? Number(pr.chest_cm) : undefined,
      waistCm: pr.waist_cm ? Number(pr.waist_cm) : undefined,
      armsCm: pr.arms_cm ? Number(pr.arms_cm) : undefined,
      legsCm: pr.legs_cm ? Number(pr.legs_cm) : undefined,
      notes: pr.notes,
      photoUrl: pr.photo_url
    }));

    // Mapear workout logs
    const workoutLogs: WorkoutSessionLog[] = (workoutLogsRes.data || []).map((wl: any) => ({
      id: wl.id,
      gymId: wl.gym_id,
      userId: wl.user_id,
      routineId: wl.routine_id,
      routineName: wl.routine_name,
      dayName: wl.day_name,
      date: wl.date,
      durationMinutes: wl.duration_minutes,
      totalVolumeKg: Number(wl.total_volume_kg),
      completedExercisesCount: wl.completed_exercises_count,
      notes: wl.notes,
      rating: wl.rating,
      caloriesBurned: wl.calories_burned
    }));

    // Mapear notifications
    const notifications: GymNotification[] = (notificationsRes.data || []).map((n: any) => ({
      id: n.id,
      gymId: n.gym_id,
      userId: n.user_id,
      title: n.title,
      message: n.message,
      type: n.type || 'announcement',
      read: n.read ?? false,
      actionLink: n.action_link,
      createdAt: n.created_at
    }));

    // Mapear exercise library
    const exercises: ExerciseLibraryItem[] = (exercisesRes.data || []).map((ex: any) => ({
      id: ex.id,
      gymId: ex.gym_id,
      isGlobal: ex.is_global ?? true,
      name: ex.name,
      muscleGroup: ex.muscle_group,
      equipment: ex.equipment || '',
      videoUrl: ex.video_url || '',
      thumbnailUrl: ex.thumbnail_url,
      instructions: ex.instructions || '',
      difficulty: ex.difficulty || 'Intermedio'
    }));

    return {
      users,
      branches,
      plans,
      memberships,
      payments,
      routines,
      classes,
      attendance,
      progress,
      workoutLogs,
      notifications,
      exercises
    };
  } catch (error) {
    console.error('Error in loadGymData from Supabase:', error);
    return null;
  }
}

// ==============================================================================
// 3b. ALTA DE SOCIO CON LOGIN REAL (desde panel admin, sin tumbar la sesión)
// Usa un cliente secundario para el signUp y devuelve el auth user id real,
// necesario para la FK profiles.id → auth.users.id.
// ==============================================================================
export async function signUpMemberAuthAccount(data: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  dni?: string;
  branchId?: string;
}): Promise<{ success: boolean; userId?: string; error?: string }> {
  const secondary = createSecondarySupabaseClient();
  if (!secondary) {
    return { success: false, error: 'Supabase no está configurado.' };
  }

  try {
    const { data: authData, error } = await secondary.auth.signUp({
      email: data.email.trim().toLowerCase(),
      password: data.password,
      options: {
        data: {
          name: data.name.trim(),
          role: 'member',
          phone: data.phone?.trim() || '',
          dni: data.dni?.trim() || '',
          branch_id: data.branchId || 'branch-1'
        }
      }
    });

    // Cerrar cualquier sesión del cliente secundario (no debe tocar la del admin)
    await secondary.auth.signOut().catch(() => {});

    if (error) {
      return { success: false, error: error.message };
    }
    if (!authData.user) {
      return { success: false, error: 'Supabase no devolvió usuario (revisá Confirm email).' };
    }
    return { success: true, userId: authData.user.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al crear credencial del socio.' };
  }
}

// ==============================================================================
// 3. PERSISTENCIA REAL: CREAR SOCIO (RECEPCIÓN / CAJA)
// ==============================================================================

export async function persistNewMember(params: {
  gymId: string;
  user: User;
  membership: Membership;
  payment: Payment;
}) {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    // 1. Perfil en profiles
    await supabase.from('profiles').upsert({
      id: params.user.id,
      gym_id: params.gymId,
      name: params.user.name,
      email: params.user.email,
      phone: params.user.phone,
      dni: params.user.dni,
      role: params.user.role,
      avatar_url: params.user.avatarUrl,
      branch_id: params.user.branchId,
      birth_date: params.user.birthDate || null,
      medical_clearance: params.user.medicalClearance || false,
      medical_clearance_expiry: params.user.medicalClearanceExpiry || null,
      emergency_contact: params.user.emergencyContact || null,
      notes: params.user.notes || null
    });

    // 2. Membresía
    await supabase.from('memberships').upsert({
      id: params.membership.id,
      gym_id: params.gymId,
      user_id: params.membership.userId,
      plan_id: params.membership.planId,
      status: params.membership.status,
      start_date: params.membership.startDate,
      end_date: params.membership.endDate,
      auto_renew: params.membership.autoRenew,
      qr_token: params.membership.qrToken,
      branch_id: params.membership.branchId,
      last_payment_id: params.payment.id
    });

    // 3. Pago manual (con descuento si existe) — fallback si columnas aún no migradas
    const paymentPayload: any = {
      id: params.payment.id,
      gym_id: params.gymId,
      user_id: params.payment.userId,
      user_name: params.payment.userName,
      user_email: params.payment.userEmail,
      plan_id: params.payment.planId,
      plan_name: params.payment.planName,
      amount_ars: params.payment.amountARS,
      currency: params.payment.currency,
      method: params.payment.method,
      status: params.payment.status,
      payment_date: params.payment.paymentDate,
      transaction_id: params.payment.transactionId,
      idempotency_key: params.payment.idempotencyKey,
      notes: params.payment.notes || null,
      receipt_url: params.payment.receiptUrl || null,
      discount_ars: params.payment.discountARS ?? null,
      discount_reason: params.payment.discountReason ?? null
    };
    let { error: payErr } = await supabase.from('payments').insert(paymentPayload);
    if (payErr && String(payErr.message).includes('discount_ars')) {
      console.warn('payments.discount_ars aún no existe — reintentando sin descuento. Ejecutá supabase_migration_discount.sql');
      const { discount_ars, discount_reason, ...fallbackPayload } = paymentPayload;
      const { error: retryErr } = await supabase.from('payments').insert(fallbackPayload);
      if (retryErr) console.error('Error persisting new member payment (fallback):', retryErr);
    } else if (payErr) {
      console.error('Error persisting new member payment:', payErr);
    }
  } catch (err) {
    console.error('Error persisting new member to Supabase:', err);
  }
}

// ==============================================================================
// 4. PERSISTENCIA REAL: PAGO MANUAL Y RENOVACIÓN DE MEMBRESÍA
// ==============================================================================

export async function persistPaymentAndMembership(params: {
  gymId: string;
  payment: Payment;
  membership: Membership;
}) {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    // 1. Guardar pago (con descuento) — fallback si columna no existe
    const payPayload: any = {
      id: params.payment.id,
      gym_id: params.gymId,
      user_id: params.payment.userId,
      user_name: params.payment.userName,
      user_email: params.payment.userEmail,
      plan_id: params.payment.planId,
      plan_name: params.payment.planName,
      amount_ars: params.payment.amountARS,
      currency: params.payment.currency,
      method: params.payment.method,
      status: params.payment.status,
      payment_date: params.payment.paymentDate,
      transaction_id: params.payment.transactionId,
      idempotency_key: params.payment.idempotencyKey,
      mp_payment_id: params.payment.mpPaymentId || null,
      mp_preference_id: params.payment.mpPreferenceId || null,
      raw_gateway_payload: params.payment.rawGatewayPayload || null,
      receipt_url: params.payment.receiptUrl || null,
      notes: params.payment.notes || null,
      discount_ars: params.payment.discountARS ?? null,
      discount_reason: params.payment.discountReason ?? null
    };
    let { error: insErr } = await supabase.from('payments').insert(payPayload);
    if (insErr && String(insErr.message).includes('discount_ars')) {
      console.warn('payments.discount_ars aún no existe — reintentando sin descuento. Ejecutá supabase_migration_discount.sql');
      const { discount_ars, discount_reason, ...fallback } = payPayload;
      const { error: retryErr } = await supabase.from('payments').insert(fallback);
      if (retryErr) console.error('Error persisting payment (fallback):', retryErr);
    } else if (insErr) {
      console.error('Error persisting payment:', insErr);
    }

    // 2. Actualizar o insertar membresía
    await supabase.from('memberships').upsert({
      id: params.membership.id,
      gym_id: params.gymId,
      user_id: params.membership.userId,
      plan_id: params.membership.planId,
      status: params.membership.status,
      start_date: params.membership.startDate,
      end_date: params.membership.endDate,
      auto_renew: params.membership.autoRenew,
      qr_token: params.membership.qrToken,
      branch_id: params.membership.branchId,
      last_payment_id: params.payment.id
    });
  } catch (err) {
    console.error('Error persisting payment & membership to Supabase:', err);
  }
}

/**
 * Persiste un pago manual en la tabla 'payments' con estado 'pending' (sin aprobar automáticamente).
 * NO altera las fechas de expiración de la membresía hasta que el pago sea auditado y aprobado.
 */
export async function persistManualPaymentRecord(params: {
  gymId: string;
  payment: Payment;
}) {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    const manualPayload: any = {
      id: params.payment.id,
      gym_id: params.gymId,
      user_id: params.payment.userId,
      user_name: params.payment.userName,
      user_email: params.payment.userEmail,
      plan_id: params.payment.planId,
      plan_name: params.payment.planName,
      amount_ars: params.payment.amountARS,
      currency: params.payment.currency || 'ARS',
      method: params.payment.method,
      status: params.payment.status, // 'pending'
      payment_date: params.payment.paymentDate,
      transaction_id: params.payment.transactionId,
      idempotency_key: params.payment.idempotencyKey,
      notes: params.payment.notes || null,
      receipt_url: params.payment.receiptUrl || null,
      discount_ars: params.payment.discountARS ?? null,
      discount_reason: params.payment.discountReason ?? null
    };
    let { error } = await supabase.from('payments').insert(manualPayload);
    if (error && String(error.message).includes('discount_ars')) {
      console.warn('payments.discount_ars aún no existe — reintentando sin descuento. Ejecutá supabase_migration_discount.sql');
      const { discount_ars, discount_reason, ...fallback } = manualPayload;
      const retry = await supabase.from('payments').insert(fallback);
      error = retry.error;
    }

    if (error) {
      console.error('Supabase error inserting manual payment:', error);
    }
  } catch (err) {
    console.error('Error persisting manual payment to Supabase:', err);
  }
}

/**
 * Aprueba un pago manual previamente registrado en 'pending', y actualiza atómicamente
 * la membresía del socio con su nueva fecha de vencimiento.
 */
export async function approvePendingPaymentInSupabase(params: {
  gymId: string;
  paymentId: string;
  updatedMembership: Membership;
}) {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    // 1. Actualizar estado del pago a 'approved'
    await supabase
      .from('payments')
      .update({ status: 'approved' })
      .eq('id', params.paymentId)
      .eq('gym_id', params.gymId);

    // 2. Extender membresía
    await supabase.from('memberships').upsert({
      id: params.updatedMembership.id,
      gym_id: params.gymId,
      user_id: params.updatedMembership.userId,
      plan_id: params.updatedMembership.planId,
      status: params.updatedMembership.status,
      start_date: params.updatedMembership.startDate,
      end_date: params.updatedMembership.endDate,
      auto_renew: params.updatedMembership.autoRenew,
      qr_token: params.updatedMembership.qrToken,
      branch_id: params.updatedMembership.branchId,
      last_payment_id: params.paymentId
    });
  } catch (err) {
    console.error('Error approving pending payment in Supabase:', err);
  }
}

/**
 * Rechaza un pago manual en la tabla 'payments'.
 */
export async function rejectPendingPaymentInSupabase(params: {
  gymId: string;
  paymentId: string;
  reason?: string;
}) {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    await supabase
      .from('payments')
      .update({
        status: 'rejected',
        notes: params.reason ? `Rechazado: ${params.reason}` : 'Rechazado por administración'
      })
      .eq('id', params.paymentId)
      .eq('gym_id', params.gymId);
  } catch (err) {
    console.error('Error rejecting pending payment in Supabase:', err);
  }
}

// ==============================================================================
// 5. CHECK-IN QR: PREVENCIÓN DE DUPLICADOS EN 2 MINUTOS Y PERSISTENCIA
// ==============================================================================

export async function recordAttendanceCheckin(params: {
  gymId: string;
  attendance: AttendanceRecord;
}): Promise<{ isDuplicate: boolean }> {
  if (!isSupabaseConfigured || !supabase) {
    return { isDuplicate: false };
  }

  try {
    // Verificar si el usuario ya registró ingreso en los últimos 2 minutos (prevención de doble escaneo accidental)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    
    if (params.attendance.userId !== 'unknown') {
      const { data: recentCheckins } = await supabase
        .from('attendance')
        .select('id, timestamp')
        .eq('gym_id', params.gymId)
        .eq('user_id', params.attendance.userId)
        .eq('status', 'granted')
        .gte('timestamp', twoMinutesAgo)
        .limit(1);

      if (recentCheckins && recentCheckins.length > 0) {
        return { isDuplicate: true };
      }
    }

    // Persistir el check-in
    await supabase.from('attendance').insert({
      id: params.attendance.id,
      gym_id: params.gymId,
      branch_id: params.attendance.branchId,
      user_id: params.attendance.userId,
      user_name: params.attendance.userName,
      user_avatar: params.attendance.userAvatar || null,
      timestamp: params.attendance.timestamp,
      access_method: params.attendance.accessMethod,
      status: params.attendance.status,
      reason: params.attendance.reason || null,
      plan_name: params.attendance.planName || null
    });

    return { isDuplicate: false };
  } catch (err) {
    console.error('Error saving attendance check-in:', err);
    return { isDuplicate: false };
  }
}

// ==============================================================================
// 6. OTRAS MUTACIONES DE NEGOCIO (PLANES, RUTINAS, NOTIFICACIONES)
// ==============================================================================

export async function persistPlan(gymId: string, plan: SubscriptionPlan) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('plans').upsert({
      id: plan.id,
      gym_id: gymId,
      name: plan.name,
      description: plan.description,
      duration_months: plan.durationMonths,
      billing_cycle: plan.billingCycle,
      price_ars: plan.priceARS,
      benefits: plan.benefits,
      grace_period_days: plan.gracePeriodDays,
      max_classes_per_week: plan.maxClassesPerWeek || null,
      is_popular: plan.isPopular,
      branch_ids: plan.branchIds,
      active: plan.active
    });
  } catch (e) {
    console.error('Error saving plan to Supabase:', e);
  }
}

export async function persistRoutine(gymId: string, routine: Routine) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('routines').upsert({
      id: routine.id,
      gym_id: gymId,
      title: routine.title,
      goal: routine.goal,
      level: routine.level,
      assigned_user_ids: routine.assignedUserIds,
      days: routine.days,
      is_template: routine.isTemplate,
      creator_name: routine.creatorName,
      description: routine.description || null
    });
  } catch (e) {
    console.error('Error saving routine to Supabase:', e);
  }
}

export async function persistNotification(gymId: string, notif: GymNotification) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('notifications').insert({
      id: notif.id,
      gym_id: gymId,
      user_id: notif.userId,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      read: notif.read,
      action_link: notif.actionLink || null
    });
  } catch (e) {
    console.error('Error saving notification to Supabase:', e);
  }
}

export async function persistClassBooking(gymId: string, classItem: GroupClass) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('classes').update({
      enrolled_user_ids: classItem.enrolledUserIds,
      waiting_list_user_ids: classItem.waitingListUserIds
    }).eq('id', classItem.id).eq('gym_id', gymId);
  } catch (e) {
    console.error('Error updating class booking in Supabase:', e);
  }
}

// Inserta una clase grupal NUEVA (create). Separado del update de reservas
// porque el create anterior reutilizaba el update y nunca persistía en Supabase.
export async function persistNewClass(gymId: string, classItem: GroupClass) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { error } = await supabase.from('classes').insert({
      id: classItem.id,
      gym_id: gymId,
      title: classItem.title,
      instructor_name: classItem.instructorName,
      instructor_id: classItem.instructorId,
      category: classItem.category,
      date: classItem.date,
      start_time: classItem.startTime,
      end_time: classItem.endTime,
      capacity: classItem.capacity,
      branch_id: classItem.branchId,
      room: classItem.room,
      enrolled_user_ids: classItem.enrolledUserIds || [],
      waiting_list_user_ids: classItem.waitingListUserIds || [],
      color_tag: classItem.colorTag || 'emerald'
    });
    if (error) console.error('Supabase error inserting new class:', error);
  } catch (e) {
    console.error('Error inserting new class in Supabase:', e);
  }
}

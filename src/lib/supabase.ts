import { createClient } from '@supabase/supabase-js';

// Strict Environment Variable Resolution: No hardcoded fallback keys or URLs
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseAnonKey.includes('placeholder') &&
  supabaseUrl.startsWith('https://')
);

// Lazy initialized client with graceful fallback
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;

// Cliente secundario sin persistencia de sesión: para crear usuarios (ej: alta de
// socio desde el panel) sin cerrar la sesión actual del admin/staff.
export function createSecondarySupabaseClient() {
  if (!isSupabaseConfigured) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
}

export const supabaseConfigDetails = {
  hasUrl: Boolean(supabaseUrl),
  hasAnonKey: Boolean(supabaseAnonKey),
  urlPreview: supabaseUrl ? `${supabaseUrl.slice(0, 20)}...` : 'No configurada'
};


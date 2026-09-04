// Normalización de teléfonos Argentina → E.164 para OTP por SMS (Supabase Auth).
// Acepta: 1123333343, 01123333343, +5491123333343, 5491123333343.
// Devuelve null si el número no tiene formato válido.

export function normalizePhoneE164(raw: string): string | null {
  const d = (raw || '').replace(/[^0-9]/g, '');
  if (!d) return null;

  // Ya con código país 54: +54 9 + 10 dígitos = 12 dígitos mínimo
  if (d.startsWith('54')) {
    return d.length >= 12 ? `+${d}` : null;
  }

  // Con 0 inicial (ej 01123333343): se saca el 0 y se agrega el 9 de móvil
  if (d.startsWith('0')) {
    const rest = d.slice(1);
    if (rest.length === 10) return `+549${rest}`;
    return null;
  }

  // Sin prefijos: 10 dígitos = área + número (ej 1123333343)
  if (d.length === 10) return `+549${d}`;

  return null;
}

export function phoneE164Display(e164: string): string {
  // +5491123333343 → +54 9 11 2333-3343 (best effort)
  const d = e164.replace(/[^0-9]/g, '');
  if (d.startsWith('549') && d.length === 12) {
    return `+54 9 ${d.slice(3, 5)} ${d.slice(5, 9)}-${d.slice(9)}`;
  }
  return e164;
}

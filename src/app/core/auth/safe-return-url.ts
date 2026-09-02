const INTERNAL_URL_ORIGIN = 'https://smartclinic.internal';

export function safeInternalReturnUrl(value: string | null | undefined): string | null {
  if (!value || value !== value.trim() || !value.startsWith('/') || value.startsWith('//')) {
    return null;
  }
  if (value.includes('\\') || /[\u0000-\u001f\u007f]/.test(value)) return null;

  try {
    const parsed = new URL(value, INTERNAL_URL_ORIGIN);
    return parsed.origin === INTERNAL_URL_ORIGIN ? value : null;
  } catch {
    return null;
  }
}

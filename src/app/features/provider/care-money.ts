export function currencyFractionDigits(currency: string): number {
  try {
    return (
      new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
        .maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}
export function majorToMinor(value: string, currency: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(?:\.\d+)?$/.test(trimmed)) return null;
  const digits = currencyFractionDigits(currency);
  const [whole, fraction = ''] = trimmed.split('.');
  if (fraction.length > digits) return null;
  const raw = `${whole}${fraction.padEnd(digits, '0')}`.replace(/^0+(?=\d)/, '');
  const amount = Number(raw || '0');
  return Number.isSafeInteger(amount) ? amount : null;
}
export function minorToMajor(value: string | null, currency: string | null): string {
  if (value == null || !currency) return '';
  const digits = currencyFractionDigits(currency);
  const raw = value.padStart(digits + 1, '0');
  return digits ? `${raw.slice(0, -digits)}.${raw.slice(-digits)}` : raw;
}
export function formatMinor(value: string | null, currency: string | null): string {
  if (value == null || !currency) return 'Price on request';
  const major = minorToMajor(value, currency);
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(Number(major));
}

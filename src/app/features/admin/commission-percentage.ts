export function percentageToBasisPoints(value: string): number | null {
  const normalized = value.trim();
  if (!/^(?:100(?:\.0{1,2})?|\d{1,2}(?:\.\d{1,2})?)$/.test(normalized)) return null;
  const [whole, decimal = ''] = normalized.split('.');
  const basisPoints = Number(whole) * 100 + Number(decimal.padEnd(2, '0'));
  return Number.isSafeInteger(basisPoints) && basisPoints <= 10000 ? basisPoints : null;
}

export function basisPointsToPercentage(value: number): string {
  const whole = Math.floor(value / 100);
  const fraction = String(value % 100).padStart(2, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : String(whole);
}

export function formatCommission(value: number | null): string {
  return value === null ? 'Not configured' : `${basisPointsToPercentage(value)}%`;
}

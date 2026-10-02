export type SmartClinicMarketCode = 'NG' | 'GH' | 'RW';
export type RwandaLocale = 'en' | 'rw' | 'fr' | 'sw';

export interface SmartClinicMarket {
  readonly code: SmartClinicMarketCode;
  readonly countryName: string;
  readonly callingCode: string;
  readonly currency: string;
  readonly timezone: string;
  /** A sample local phone number for placeholders. */
  readonly examplePhone: string;
}

export const SMARTCLINIC_MARKETS: Readonly<Record<SmartClinicMarketCode, SmartClinicMarket>> = {
  NG: { code: 'NG', countryName: 'Nigeria', callingCode: '+234', currency: 'NGN', timezone: 'Africa/Lagos', examplePhone: '+234 801 234 5678' },
  GH: { code: 'GH', countryName: 'Ghana', callingCode: '+233', currency: 'GHS', timezone: 'Africa/Accra', examplePhone: '+233 24 123 4567' },
  RW: { code: 'RW', countryName: 'Rwanda', callingCode: '+250', currency: 'RWF', timezone: 'Africa/Kigali', examplePhone: '+250 788 123 456' },
};

export const RWANDA_LOCALES: readonly { readonly code: RwandaLocale; readonly label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'rw', label: 'Kinyarwanda' },
  { code: 'fr', label: 'Français' },
  { code: 'sw', label: 'Kiswahili' },
];

export function rwandaLocale(value: string | null | undefined): RwandaLocale {
  return RWANDA_LOCALES.some((locale) => locale.code === value) ? (value as RwandaLocale) : 'en';
}

/** The country asked for in a link; without one, the remembered country (Nigeria if nothing else is known). */
export function requestedMarket(value: string | null | undefined, fallback: SmartClinicMarketCode = 'NG'): SmartClinicMarketCode {
  const code = value?.trim().toUpperCase();
  return code === 'RW' || code === 'GH' || code === 'NG' ? code : fallback;
}

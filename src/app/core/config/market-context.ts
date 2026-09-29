export type SmartClinicMarketCode = 'NG' | 'RW';
export type RwandaLocale = 'en' | 'rw' | 'fr' | 'sw';

export interface SmartClinicMarket {
  readonly code: SmartClinicMarketCode;
  readonly countryName: string;
  readonly callingCode: string;
  readonly currency: string;
  readonly timezone: string;
}

export const SMARTCLINIC_MARKETS: Readonly<Record<SmartClinicMarketCode, SmartClinicMarket>> = {
  NG: { code: 'NG', countryName: 'Nigeria', callingCode: '+234', currency: 'NGN', timezone: 'Africa/Lagos' },
  RW: { code: 'RW', countryName: 'Rwanda', callingCode: '+250', currency: 'RWF', timezone: 'Africa/Kigali' },
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

export function requestedMarket(value: string | null | undefined): SmartClinicMarketCode {
  return value?.trim().toUpperCase() === 'RW' ? 'RW' : 'NG';
}

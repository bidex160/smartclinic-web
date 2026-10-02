import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';

import { API_CONFIG } from '../config/api-config.token';
import { SmartClinicMarketCode } from '../config/market-context';

/** Languages the companion can speak and answer in. App screens stay in English for now. */
export type AppLanguage = 'en' | 'pcm' | 'yo' | 'ha' | 'ig' | 'rw' | 'fr' | 'sw' | 'tw';

export interface AppLanguageOption {
  readonly code: AppLanguage;
  /** The language's own name, so people recognise it. */
  readonly label: string;
  readonly english: string;
}

export const APP_LANGUAGES: Readonly<Record<AppLanguage, AppLanguageOption>> = {
  en: { code: 'en', label: 'English', english: 'English' },
  pcm: { code: 'pcm', label: 'Naijá (Pidgin)', english: 'Nigerian Pidgin' },
  yo: { code: 'yo', label: 'Yorùbá', english: 'Yoruba' },
  ha: { code: 'ha', label: 'Hausa', english: 'Hausa' },
  ig: { code: 'ig', label: 'Igbo', english: 'Igbo' },
  tw: { code: 'tw', label: 'Twi', english: 'Twi (Akan)' },
  rw: { code: 'rw', label: 'Ikinyarwanda', english: 'Kinyarwanda' },
  fr: { code: 'fr', label: 'Français', english: 'French' },
  sw: { code: 'sw', label: 'Kiswahili', english: 'Swahili' },
};

/** Languages offered first in each country, most common first. */
export const MARKET_LANGUAGES: Readonly<Record<SmartClinicMarketCode, readonly AppLanguage[]>> = {
  NG: ['en', 'pcm', 'yo', 'ha', 'ig'],
  GH: ['en', 'tw'],
  RW: ['rw', 'en', 'fr', 'sw'],
};

export const MARKET_LABELS: Readonly<Record<SmartClinicMarketCode, { name: string; flag: string }>> = {
  NG: { name: 'Nigeria', flag: '🇳🇬' },
  GH: { name: 'Ghana', flag: '🇬🇭' },
  RW: { name: 'Rwanda', flag: '🇷🇼' },
};

/** How we know the country: picked by the person, from their account, or guessed from the phone's clock. */
export type LocaleSource = 'chosen' | 'account' | 'clock';

const STORAGE_KEY = 'smartclinic-locale-v1';
const OLD_GUIDE_KEY = 'smartclinic-guide-preferences-v1';

export function marketFromTimezone(timezone: string | undefined): SmartClinicMarketCode {
  if (timezone === 'Africa/Kigali') return 'RW';
  if (timezone === 'Africa/Accra') return 'GH';
  return 'NG';
}

export function isMarket(value: unknown): value is SmartClinicMarketCode {
  return value === 'NG' || value === 'GH' || value === 'RW';
}

export function isLanguage(value: unknown): value is AppLanguage {
  return typeof value === 'string' && value in APP_LANGUAGES;
}

/**
 * One answer to "where is this person and what language do they want", shared by every screen.
 * Order: what they picked > their account's country > their phone's time zone.
 */
@Injectable({ providedIn: 'root' })
export class LocalePreferencesService {
  private readonly state = signal(this.initial());

  readonly market = computed(() => this.state().market);
  readonly language = computed(() => this.state().language);
  readonly source = computed(() => this.state().source);
  readonly languages = computed(() => {
    const first = MARKET_LANGUAGES[this.market()];
    const rest = (Object.keys(APP_LANGUAGES) as AppLanguage[]).filter((code) => !first.includes(code));
    return { local: first.map((c) => APP_LANGUAGES[c]), other: rest.map((c) => APP_LANGUAGES[c]) };
  });

  /** The person picked a country (and maybe a language). This always wins. */
  choose(market: SmartClinicMarketCode, language?: AppLanguage): void {
    const lang = language ?? (MARKET_LANGUAGES[market].includes(this.language()) ? this.language() : MARKET_LANGUAGES[market][0]);
    this.set({ market, language: lang, source: 'chosen' });
  }

  chooseLanguage(language: AppLanguage): void {
    this.set({ ...this.state(), language, source: 'chosen' });
  }

  /** Links like /register?market=RW&lang=rw carry an explicit choice. */
  applyQuery(market: string | null | undefined, lang: string | null | undefined): void {
    const m = market?.trim().toUpperCase();
    if (isMarket(m)) this.choose(m, isLanguage(lang) ? lang : undefined);
    else if (isLanguage(lang)) this.chooseLanguage(lang);
  }

  /** After sign-in: the country on the account beats a guess, but never the person's own pick. */
  applyAccountCountry(countryCode: string | null | undefined): void {
    const m = countryCode?.trim().toUpperCase();
    if (!isMarket(m) || this.source() === 'chosen' || (this.source() === 'account' && this.market() === m)) return;
    const language = MARKET_LANGUAGES[m].includes(this.language()) ? this.language() : MARKET_LANGUAGES[m][0];
    this.set({ market: m, language, source: 'account' });
  }

  private set(next: { market: SmartClinicMarketCode; language: AppLanguage; source: LocaleSource }): void {
    this.state.set(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* private mode: keep it for this visit */
    }
    try {
      document.documentElement.lang = next.language === 'pcm' ? 'en-NG' : next.language;
    } catch {
      /* no DOM */
    }
  }

  private initial(): { market: SmartClinicMarketCode; language: AppLanguage; source: LocaleSource } {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
      if (saved && isMarket(saved.market) && isLanguage(saved.language)) {
        return { market: saved.market, language: saved.language, source: saved.source === 'chosen' || saved.source === 'account' ? saved.source : 'clock' };
      }
    } catch {
      /* fall through */
    }
    let timezone: string | undefined;
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      timezone = undefined;
    }
    const market = marketFromTimezone(timezone);
    let language: AppLanguage = MARKET_LANGUAGES[market][0];
    try {
      // People who already chose Pidgin for the old guide keep it.
      const old = JSON.parse(localStorage.getItem(OLD_GUIDE_KEY) ?? 'null');
      if (old?.language === 'pcm') language = 'pcm';
    } catch {
      /* ignore */
    }
    return { market, language, source: 'clock' };
  }
}

/**
 * Once per visit, after a patient signs in, read the country on their account so a Rwandan patient
 * keeps seeing Rwanda even on a new phone. Quietly does nothing if the profile can't be read.
 */
@Injectable({ providedIn: 'root' })
export class AccountLocaleSync {
  private readonly http = inject(HttpClient, { optional: true });
  private readonly base = inject(API_CONFIG, { optional: true })?.baseUrl ?? '';
  private readonly locale = inject(LocalePreferencesService);
  private done = false;

  sync(): void {
    if (this.done || !this.http || !this.base || this.locale.source() === 'chosen') return;
    this.done = true;
    this.http
      .get<{ patient?: { countryCode?: string | null } }>(`${this.base}/me/profile`)
      .subscribe({ next: (p) => this.locale.applyAccountCountry(p.patient?.countryCode), error: () => undefined });
  }
}

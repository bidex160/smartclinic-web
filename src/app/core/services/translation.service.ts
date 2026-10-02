import { computed, effect, inject, Injectable, Pipe, PipeTransform, signal } from '@angular/core';

import EN from '../../i18n/en';
import { AppLanguage, LocalePreferencesService } from './locale-preferences.service';

export type { Dictionary } from '../../i18n/types';
import type { Dictionary } from '../../i18n/types';
export type TranslationParams = Readonly<Record<string, string | number | null | undefined>>;

/** Each language is its own small download, fetched only when someone picks it. */
const LOADERS: Readonly<Record<Exclude<AppLanguage, 'en'>, () => Promise<{ default: Dictionary }>>> = {
  pcm: () => import('../../i18n/pcm'),
  yo: () => import('../../i18n/yo'),
  ha: () => import('../../i18n/ha'),
  ig: () => import('../../i18n/ig'),
  rw: () => import('../../i18n/rw'),
  fr: () => import('../../i18n/fr'),
  sw: () => import('../../i18n/sw'),
  tw: () => import('../../i18n/tw'),
};

/** "Hello {name}" + { name: 'Ada' } → "Hello Ada". Unknown placeholders are left visible so mistakes are easy to spot. */
export function interpolate(text: string, params?: TranslationParams): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (whole, key: string) => (params[key] === undefined || params[key] === null ? whole : String(params[key])));
}

/**
 * Screen text in the person's language. English is built in; other languages load on demand.
 * Any line not yet translated falls back to English, so a screen is never blank.
 */
@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly locale = inject(LocalePreferencesService);
  private readonly dictionaries = signal<Partial<Record<AppLanguage, Dictionary>>>({ en: EN });
  readonly language = this.locale.language;
  /** True once the chosen language's text has arrived. */
  readonly ready = computed(() => Boolean(this.dictionaries()[this.language()]));

  constructor() {
    effect(() => {
      const lang = this.language();
      if (lang !== 'en' && !this.dictionaries()[lang]) void this.load(lang);
    });
  }

  t(key: string, params?: TranslationParams): string {
    const lang = this.language();
    const text = this.dictionaries()[lang]?.[key] ?? EN[key] ?? key;
    return interpolate(text, params);
  }

  private async load(lang: Exclude<AppLanguage, 'en'>): Promise<void> {
    try {
      const module = await LOADERS[lang]();
      this.dictionaries.update((all) => ({ ...all, [lang]: module.default }));
    } catch {
      /* offline or failed: English stays on screen */
    }
  }
}

/** {{ 'home.hero.title' | t }} or {{ 'dashboard.greeting' | t: { name: firstName } }} */
@Pipe({ name: 't', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(TranslationService);
  transform(key: string, params?: TranslationParams): string {
    return this.i18n.t(key, params);
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';

import { SmartClinicMarketCode } from '../../../core/config/market-context';
import { AppLanguage, LocalePreferencesService, MARKET_LABELS } from '../../../core/services/locale-preferences.service';
import { TranslatePipe } from '../../../core/services/translation.service';

/** "🇷🇼 Rwanda · Ikinyarwanda" — tap to change country and language. */
@Component({
  selector: 'app-locale-picker',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative inline-block text-left">
      <button type="button" (click)="open.set(!open())" [attr.aria-expanded]="open()" [attr.aria-controls]="panelId"
        class="inline-flex min-h-10 items-center gap-2 rounded-full px-3.5 text-sm font-semibold {{ tone() === 'dark' ? 'bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/15' : 'bg-white text-ink ring-1 ring-ink/10 hover:ring-ink/25' }}" data-locale-button>
        <span aria-hidden="true">{{ marketLabel().flag }}</span>
        <span>{{ marketLabel().name }} · {{ languageLabel() }}</span>
        <svg aria-hidden="true" class="size-3.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      @if (open()) {
        <div [id]="panelId" role="dialog" aria-label="Country and language"
          class="absolute z-50 w-[min(20rem,calc(100vw-2rem))] rounded-2xl bg-white p-4 text-ink shadow-lift ring-1 ring-ink/10 {{ align() === 'right' ? 'right-0' : 'left-0' }} {{ direction() === 'up' ? 'bottom-full mb-2' : 'mt-2' }}" data-locale-panel>
          <p class="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">{{ 'common.locale.country' | t }}</p>
          <div class="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Country">
            @for (m of markets; track m) {
              <button type="button" role="radio" [attr.aria-checked]="locale.market() === m" (click)="pickMarket(m)"
                class="flex min-h-14 flex-col items-center justify-center rounded-xl text-xs font-semibold {{ locale.market() === m ? 'bg-brand-50 text-brand-800 ring-2 ring-brand-600' : 'ring-1 ring-ink/10 hover:bg-sand-50' }}" [attr.data-market]="m">
                <span class="text-xl" aria-hidden="true">{{ labels[m].flag }}</span>{{ labels[m].name }}
              </button>
            }
          </div>
          <p class="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">{{ 'common.locale.language' | t }}</p>
          <div class="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Language">
            @for (l of locale.languages().local; track l.code) {
              <button type="button" role="radio" [attr.aria-checked]="locale.language() === l.code" (click)="pickLanguage(l.code)" [attr.lang]="l.code"
                class="min-h-10 rounded-full px-3.5 text-sm font-semibold {{ locale.language() === l.code ? 'bg-ink text-white' : 'ring-1 ring-ink/10 hover:bg-sand-50' }}" [attr.data-language]="l.code">{{ l.label }}</button>
            }
          </div>
          <details class="mt-2">
            <summary class="cursor-pointer py-1 text-xs font-semibold text-brand-700">{{ 'common.locale.more' | t }}</summary>
            <div class="mt-2 flex flex-wrap gap-2">
              @for (l of locale.languages().other; track l.code) {
                <button type="button" (click)="pickLanguage(l.code)" [attr.lang]="l.code" class="min-h-9 rounded-full px-3 text-xs font-semibold ring-1 ring-ink/10 hover:bg-sand-50" [attr.data-language]="l.code">{{ l.label }}</button>
              }
            </div>
          </details>
          <p class="mt-3 text-xs leading-5 text-ink-muted">{{ 'common.locale.note' | t }}</p>
        </div>
      }
    </div>
  `,
})
export class LocalePickerComponent {
  readonly locale = inject(LocalePreferencesService);
  readonly tone = input<'light' | 'dark'>('light');
  readonly align = input<'left' | 'right'>('left');
  readonly direction = input<'down' | 'up'>('down');
  readonly open = signal(false);
  readonly markets: readonly SmartClinicMarketCode[] = ['NG', 'GH', 'RW'];
  readonly labels = MARKET_LABELS;
  private static next = 0;
  readonly panelId = `locale-${++LocalePickerComponent.next}`;
  readonly marketLabel = computed(() => MARKET_LABELS[this.locale.market()]);
  readonly languageLabel = computed(() => {
    const all = [...this.locale.languages().local, ...this.locale.languages().other];
    return all.find((l) => l.code === this.locale.language())?.label ?? 'English';
  });

  pickMarket(market: SmartClinicMarketCode): void {
    this.locale.choose(market);
  }

  pickLanguage(language: AppLanguage): void {
    this.locale.chooseLanguage(language);
    this.open.set(false);
  }
}

import { ChangeDetectionStrategy, Component, computed, ElementRef, HostListener, inject, input, signal } from '@angular/core';

import { SmartClinicMarketCode } from '../../../core/config/market-context';
import { AppLanguage, LocalePreferencesService, MARKET_LABELS } from '../../../core/services/locale-preferences.service';
import { TranslatePipe, TranslationService } from '../../../core/services/translation.service';
import { LanguageFeedbackApiService } from '../../../core/services/language-feedback-api.service';
import { DOCUMENT } from '@angular/common';

/** "🇷🇼 Rwanda · Ikinyarwanda" — tap to change country and language. */
@Component({
  selector: 'app-locale-picker',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative inline-block text-left">
      <button type="button" (click)="open.set(!open())" [attr.aria-expanded]="open()" [attr.aria-controls]="panelId"
        class="inline-flex min-h-10 items-center gap-2 rounded-full px-3.5 text-sm font-semibold {{ tone() === 'dark' ? 'bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/15' : 'bg-white text-ink ring-1 ring-ink/10 hover:ring-ink/25' }}" data-locale-button>
        @if (compact()) {
          <svg aria-hidden="true" class="size-4 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>
          <span class="uppercase sm:hidden">{{ locale.language() === 'pcm' ? 'PCM' : locale.language() }}</span>
          <span class="hidden max-w-[7.5rem] truncate sm:inline">{{ languageLabel() }}</span>
          <span class="sr-only">{{ 'common.locale.language' | t }}: {{ marketLabel().name }}</span>
        } @else {
          <span aria-hidden="true">{{ marketLabel().flag }}</span>
          <span>{{ marketLabel().name }} · {{ languageLabel() }}</span>
        }
        <svg aria-hidden="true" class="size-3.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      @if (open()) {
        <div [id]="panelId" role="dialog" aria-label="Country and language"
          class="z-50 rounded-2xl bg-white p-4 text-ink shadow-lift ring-1 ring-ink/10 {{ compact() ? 'fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:top-auto sm:w-[20rem]' : 'absolute w-[min(20rem,calc(100vw-1.5rem))]' }} {{ align() === 'right' ? 'sm:right-0' + (compact() ? '' : ' right-0') : 'left-0' }} {{ direction() === 'up' ? 'bottom-full mb-2' : 'sm:mt-2' + (compact() ? '' : ' mt-2') }}" data-locale-panel>
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
          @if (!reporting()) {
            <button type="button" (click)="startReport()" class="mt-2 text-xs font-semibold text-brand-700 underline underline-offset-2" data-report-open>{{ 'common.locale.report' | t }}</button>
          } @else if (sent()) {
            <p role="status" class="mt-3 rounded-xl bg-leaf-50 p-3 text-sm font-semibold text-leaf-700" data-report-thanks>{{ 'common.locale.reportThanks' | t }}</p>
          } @else {
            <form class="mt-3 grid gap-2 rounded-xl bg-sand-50 p-3" (submit)="$event.preventDefault(); sendReport()" data-report-form>
              <label class="text-xs font-semibold text-ink">{{ 'common.locale.reportShown' | t }}
                <textarea [value]="shown()" (input)="shown.set($any($event.target).value)" maxlength="300" rows="2" class="mt-1 w-full rounded-lg border border-ink/15 bg-white p-2 text-sm font-normal" data-report-shown></textarea>
              </label>
              <label class="text-xs font-semibold text-ink">{{ 'common.locale.reportBetter' | t }}
                <input [value]="better()" (input)="better.set($any($event.target).value)" maxlength="300" class="mt-1 min-h-10 w-full rounded-lg border border-ink/15 bg-white px-2 text-sm font-normal" data-report-better />
              </label>
              <button type="submit" [disabled]="sending() || shown().trim().length < 1" class="min-h-10 rounded-full bg-ink px-4 text-sm font-semibold text-white disabled:opacity-40" data-report-send>{{ 'common.locale.reportSend' | t }}</button>
            </form>
          }
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
  /** A small globe-and-language button for headers. */
  readonly compact = input(false);
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

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly feedback = inject(LanguageFeedbackApiService);
  private readonly i18n = inject(TranslationService);
  private readonly doc = inject(DOCUMENT);
  readonly reporting = signal(false);
  readonly sent = signal(false);
  readonly sending = signal(false);
  readonly shown = signal('');
  readonly better = signal('');
  /** Words the person highlighted before opening the menu, so they don't have to type them. */
  private selection = '';

  @HostListener('document:selectionchange')
  rememberSelection(): void {
    const text = this.doc.getSelection?.()?.toString().trim() ?? '';
    if (text && !this.host.nativeElement.contains(this.doc.getSelection?.()?.anchorNode ?? null)) this.selection = text.slice(0, 300);
  }

  startReport(): void {
    this.shown.set(this.selection);
    this.better.set('');
    this.sent.set(false);
    this.reporting.set(true);
  }

  sendReport(): void {
    const shownText = this.shown().trim();
    if (!shownText) return;
    this.sending.set(true);
    this.feedback
      .send({
        language: this.locale.language(),
        shownText,
        ...(this.better().trim() ? { suggestion: this.better().trim() } : {}),
        page: (this.doc.location?.pathname ?? '/').slice(0, 199),
        catalogKeys: this.i18n.findKeys(shownText),
      })
      .subscribe({
        next: () => { this.sending.set(false); this.sent.set(true); this.selection = ''; },
        error: () => { this.sending.set(false); this.sent.set(true); },
      });
  }

  @HostListener('document:keydown.escape')
  close(): void {
    this.open.set(false);
  }

  /** Tapping anywhere else closes it. */
  @HostListener('document:click', ['$event'])
  outside(event: Event): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) this.open.set(false);
  }

  pickLanguage(language: AppLanguage): void {
    this.locale.chooseLanguage(language);
    this.reporting.set(false);
    this.open.set(false);
  }
}

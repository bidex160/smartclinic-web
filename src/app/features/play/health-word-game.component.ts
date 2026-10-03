import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { clock, HealthWordView, LetterMark, letterStates, PlayApiService, shareGrid } from '../../core/services/play-api.service';
import { TranslatePipe, TranslationService } from '../../core/services/translation.service';
import { ShareButtonsComponent } from './share-buttons.component';

const KEY_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

/**
 * Health Word: guess today's five-letter health word in six tries, against the clock.
 * The server checks every guess, so the answer is never in the page.
 */
@Component({
  selector: 'app-health-word-game',
  imports: [TranslatePipe, ShareButtonsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .tile { transition: background-color .25s ease, transform .12s ease; }
    @keyframes flip { 0% { transform: rotateX(0) } 50% { transform: rotateX(90deg) } 100% { transform: rotateX(0) } }
    .flip { animation: flip .5s ease both; }
    @keyframes shake { 10%, 90% { transform: translateX(-2px) } 20%, 80% { transform: translateX(4px) } 30%, 50%, 70% { transform: translateX(-6px) } 40%, 60% { transform: translateX(6px) } }
    .shake { animation: shake .45s ease; }
    @keyframes rise { from { transform: translateY(8px); opacity: 0 } to { transform: none; opacity: 1 } }
    .rise { animation: rise .4s ease both; }
    @media (prefers-reduced-motion: reduce) { .flip, .shake, .rise { animation: none; } .tile { transition: none; } }
  `,
  template: `
    <section class="overflow-hidden rounded-[1.75rem] bg-white shadow-card ring-1 ring-ink/[0.06]" aria-labelledby="word-heading" data-health-word>
      <header class="flex flex-wrap items-center justify-between gap-3 bg-brand-900 px-5 py-4 text-white">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-ochre-300">{{ 'play.word.eyebrow' | t }}</p>
          <h2 id="word-heading" class="font-display text-2xl font-semibold">{{ 'play.word.title' | t: { n: game()?.puzzleNumber ?? '' } }}</h2>
        </div>
        @if (game(); as g) {
          <div class="flex items-center gap-2">
            @if (g.stats.streak) { <span class="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold" data-word-streak>🔥 {{ g.stats.streak }}</span> }
            <span class="min-w-16 rounded-full bg-ochre-300 px-3 py-1 text-center font-mono text-sm font-bold text-ink" role="timer" [attr.aria-label]="'play.word.timeLabel' | t: { time: time() }" data-word-timer>⏱ {{ time() }}</span>
          </div>
        }
      </header>

      @if (error()) {
        <p role="alert" class="m-5 rounded-xl bg-clay-50 p-4 text-sm text-clay-700">{{ error() }}</p>
      }

      @if (game(); as g) {
        <div class="px-4 pb-5 pt-4 sm:px-6">
          <p class="text-center text-sm text-ink-soft">{{ 'play.word.hint' | t: { category: ('play.category.' + g.category) | t } }}</p>

          @if (!g.started) {
            <div class="mx-auto mt-5 max-w-sm text-center">
              <p class="text-ink-soft">{{ 'play.word.rules' | t: { tries: g.maxGuesses } }}</p>
              <div class="mt-4 flex justify-center gap-1.5" aria-hidden="true">
                <span class="grid size-10 place-items-center rounded-lg bg-leaf-500 font-bold text-white">H</span>
                <span class="grid size-10 place-items-center rounded-lg bg-ochre-300 font-bold text-ink">E</span>
                <span class="grid size-10 place-items-center rounded-lg bg-ink/30 font-bold text-white">A</span>
              </div>
              <p class="mt-2 text-xs text-ink-muted">{{ 'play.word.legend' | t }}</p>
              <button type="button" (click)="start()" [disabled]="busy()" class="mt-5 inline-flex min-h-12 items-center rounded-full bg-brand-700 px-8 text-base font-semibold text-white shadow-card disabled:opacity-50" data-word-start>
                {{ 'play.word.start' | t }}
              </button>
            </div>
          } @else {
            <div class="mx-auto mt-3 grid w-full max-w-[15.5rem] gap-1.5 sm:mt-4 sm:max-w-[19rem]" role="grid" [attr.aria-label]="'play.word.boardLabel' | t">
              @for (row of grid(); track $index; let r = $index) {
                <div class="grid grid-cols-5 gap-1.5 {{ r === g.rows.length && shake() ? 'shake' : '' }}" role="row">
                  @for (cell of row; track $index; let c = $index) {
                    <div
                      role="gridcell"
                      class="tile grid aspect-square place-items-center rounded-lg font-display text-xl font-bold uppercase sm:text-2xl {{ tileClass(cell.mark, !!cell.letter) }} {{ cell.mark && r === g.rows.length - 1 && justGuessed() ? 'flip' : '' }}"
                      [style.animation-delay.ms]="c * 90"
                      [attr.aria-label]="cell.letter ? cell.letter + (cell.mark ? ', ' + (('play.mark.' + cell.mark) | t) : '') : null"
                      data-word-tile
                    >{{ cell.letter }}</div>
                  }
                </div>
              }
            </div>
            <p class="sr-only" aria-live="polite">{{ announce() }}</p>

            @if (!g.finished) {
              <div class="mx-auto mt-5 grid max-w-lg gap-1.5" [attr.aria-label]="'play.word.keyboard' | t" data-word-keyboard>
                @for (row of keyRows; track row; let last = $last) {
                  <div class="flex justify-center gap-1">
                    @if (last) {
                      <button type="button" (click)="submit()" [disabled]="busy() || typed().length !== g.length" class="h-12 rounded-md bg-brand-700 px-2.5 text-xs font-bold uppercase text-white disabled:opacity-40 sm:px-3" data-word-enter>{{ 'play.word.enter' | t }}</button>
                    }
                    @for (k of row.split(''); track k) {
                      <button type="button" (click)="press(k)" class="h-12 min-w-0 flex-1 rounded-md text-sm font-bold sm:max-w-11 {{ keyClass(k) }}" [attr.data-key]="k">{{ k }}</button>
                    }
                    @if (last) {
                      <button type="button" (click)="back()" class="h-12 rounded-md bg-sand-100 px-3 text-base font-bold text-ink" [attr.aria-label]="'play.word.delete' | t" data-word-back>⌫</button>
                    }
                  </div>
                }
              </div>
            } @else {
              <div class="rise mx-auto mt-6 max-w-xl rounded-2xl p-5 {{ g.solved ? 'bg-leaf-50' : 'bg-sand-50' }}" role="status" data-word-result>
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <p class="font-display text-xl font-semibold {{ g.solved ? 'text-leaf-700' : 'text-ink' }}">
                    {{ (g.solved ? 'play.word.solved' : 'play.word.notSolved') | t: { tries: g.rows.length, time: time(), word: g.answer } }}
                  </p>
                  @if (g.pointsEarned) { <span class="rounded-full bg-ochre-300 px-3 py-1 text-sm font-bold text-ink" data-word-points>+{{ g.pointsEarned }} {{ 'play.points' | t }}</span> }
                </div>
                @if (g.fact) {
                  <p class="mt-3 text-[15px] leading-6 text-ink"><span class="font-semibold">{{ g.answer }}:</span> {{ g.fact }}</p>
                }
                <p class="mt-4 text-sm font-semibold text-ink">{{ 'play.word.shareAsk' | t }}</p>
                <pre class="mt-2 inline-block rounded-xl bg-white px-3 py-2 font-sans text-lg leading-6 ring-1 ring-ink/[0.06]" aria-hidden="true">{{ grid2() }}</pre>
                <div class="mt-3"><app-share-buttons [text]="shareText()" [url]="shareUrl()" /></div>
                <dl class="mt-5 grid grid-cols-3 gap-2 text-center">
                  <div class="rounded-xl bg-white p-3"><dt class="text-xs text-ink-muted">{{ 'play.stats.played' | t }}</dt><dd class="font-display text-2xl font-semibold">{{ g.stats.played }}</dd></div>
                  <div class="rounded-xl bg-white p-3"><dt class="text-xs text-ink-muted">{{ 'play.stats.solved' | t }}</dt><dd class="font-display text-2xl font-semibold">{{ g.stats.solved }}</dd></div>
                  <div class="rounded-xl bg-white p-3"><dt class="text-xs text-ink-muted">{{ 'play.stats.streak' | t }}</dt><dd class="font-display text-2xl font-semibold">{{ g.stats.streak }}</dd></div>
                </dl>
                <p class="mt-4 text-sm text-ink-soft">{{ 'play.word.tomorrow' | t }}</p>
              </div>
            }
          }
        </div>
      } @else if (!error()) {
        <p class="p-6 text-center text-ink-muted" role="status">{{ 'play.loading' | t }}</p>
      }
    </section>
  `,
})
export class HealthWordGameComponent {
  private readonly api = inject(PlayApiService);
  private readonly i18n = inject(TranslationService);
  private readonly doc = inject(DOCUMENT);
  readonly keyRows = KEY_ROWS;

  readonly game = signal<HealthWordView | null>(null);
  readonly typed = signal('');
  readonly busy = signal(false);
  readonly error = signal('');
  readonly shake = signal(false);
  readonly justGuessed = signal(false);
  readonly announce = signal('');
  private readonly now = signal(Date.now());

  readonly states = computed(() => letterStates(this.game()?.rows ?? []));
  readonly grid = computed(() => {
    const g = this.game();
    if (!g) return [];
    const rows: { letter: string; mark: LetterMark | null }[][] = [];
    for (let r = 0; r < g.maxGuesses; r += 1) {
      const done = g.rows[r];
      const letters = done ? done.guess : r === g.rows.length && !g.finished ? this.typed() : '';
      rows.push(Array.from({ length: g.length }, (_, i) => ({ letter: letters[i] ?? '', mark: done ? done.marks[i] : null })));
    }
    return rows;
  });
  readonly time = computed(() => {
    const g = this.game();
    if (!g?.started) return '0:00';
    if (g.finished || !g.startedAt) return clock(g.seconds);
    return clock((this.now() - Date.parse(g.startedAt)) / 1000);
  });
  readonly grid2 = computed(() => shareGrid(this.game()?.rows ?? []));
  readonly shareUrl = computed(() => {
    const code = this.game()?.inviteCode;
    return `${this.doc.location?.origin ?? ''}/play${code ? `?ref=${encodeURIComponent(code)}` : ''}`;
  });
  readonly shareText = computed(() => {
    const g = this.game();
    if (!g) return '';
    const score = g.solved ? `${g.rows.length}/${g.maxGuesses}` : `X/${g.maxGuesses}`;
    return `${this.i18n.t('play.share.wordLine', { n: g.puzzleNumber, score, time: this.time() })}\n${this.grid2()}\n${this.i18n.t('play.share.wordInvite')}`;
  });

  constructor() {
    this.load();
    const timer = setInterval(() => {
      const g = this.game();
      if (g?.started && !g.finished) this.now.set(Date.now());
    }, 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  load(): void {
    this.api.word().subscribe({ next: (g) => this.game.set(g), error: (e) => this.fail(e) });
  }

  start(): void {
    this.busy.set(true);
    this.api.startWord().pipe(finalize(() => this.busy.set(false))).subscribe({
      next: (g) => {
        this.now.set(Date.now());
        this.game.set(g);
      },
      error: (e) => this.fail(e),
    });
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    const g = this.game();
    if (!g?.started || g.finished || e.ctrlKey || e.metaKey || e.altKey) return;
    const target = e.target as HTMLElement | null;
    if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
    if (e.key === 'Enter') { e.preventDefault(); this.submit(); }
    else if (e.key === 'Backspace') { e.preventDefault(); this.back(); }
    else if (/^[a-zA-Z]$/.test(e.key)) this.press(e.key.toUpperCase());
  }

  press(k: string): void {
    const g = this.game();
    if (!g || g.finished || this.typed().length >= g.length) return;
    this.typed.update((t) => t + k);
  }

  back(): void {
    this.typed.update((t) => t.slice(0, -1));
  }

  submit(): void {
    const g = this.game();
    if (!g || this.busy() || g.finished) return;
    if (this.typed().length !== g.length) {
      this.nudge(this.i18n.t('play.word.tooShort', { n: g.length }));
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.api.guess(this.typed()).pipe(finalize(() => this.busy.set(false))).subscribe({
      next: (next) => {
        this.typed.set('');
        this.justGuessed.set(true);
        this.game.set(next);
        const last = next.rows[next.rows.length - 1];
        const near = last?.marks.filter((m) => m === 'near').length ?? 0;
        const hit = last?.marks.filter((m) => m === 'hit').length ?? 0;
        this.announce.set(next.finished ? (next.solved ? this.i18n.t('play.word.solvedShort') : this.i18n.t('play.word.answerWas', { word: next.answer })) : this.i18n.t('play.word.feedback', { hit, near }));
        setTimeout(() => this.justGuessed.set(false), 700);
      },
      error: (e) => this.fail(e),
    });
  }

  tileClass(mark: LetterMark | null, filled: boolean): string {
    if (mark === 'hit') return 'bg-leaf-500 text-white';
    if (mark === 'near') return 'bg-ochre-300 text-ink';
    if (mark === 'miss') return 'bg-ink/30 text-white';
    return filled ? 'bg-white text-ink ring-2 ring-ink/40 scale-[1.03]' : 'bg-white ring-2 ring-ink/10';
  }

  keyClass(k: string): string {
    const s = this.states()[k];
    if (s === 'hit') return 'bg-leaf-500 text-white';
    if (s === 'near') return 'bg-ochre-300 text-ink';
    if (s === 'miss') return 'bg-ink/25 text-white';
    return 'bg-sand-100 text-ink';
  }

  private nudge(message: string): void {
    this.announce.set(message);
    this.shake.set(true);
    setTimeout(() => this.shake.set(false), 500);
  }

  private fail(e: unknown): void {
    const message = e instanceof HttpErrorResponse && typeof e.error?.message === 'string' ? e.error.message : this.i18n.t('play.error');
    this.error.set(message);
  }
}

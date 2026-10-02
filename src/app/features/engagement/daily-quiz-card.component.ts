import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { EngagementApiService } from '../../core/services/engagement-api.service';

/**
 * One health question a day: tap an answer, see why, collect points.
 * Reads from the shared engagement signal, so it never loads twice on a page.
 */
@Component({
  selector: 'app-daily-quiz-card',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    @keyframes sc-pop { 0% { transform: translateY(6px) scale(.8); opacity: 0 } 60% { transform: translateY(-2px) scale(1.08); opacity: 1 } 100% { transform: none; opacity: 1 } }
    .sc-pop { animation: sc-pop .45s cubic-bezier(.2,.9,.3,1.3) both }
    @media (prefers-reduced-motion: reduce) { .sc-pop { animation: none } }
  `,
  template: `
    @if (quiz(); as q) {
      <section class="overflow-hidden rounded-[1.5rem] bg-white shadow-card ring-1 ring-ink/[0.06]" aria-labelledby="daily-quiz-heading" data-daily-quiz>
        <div class="flex items-center justify-between gap-3 bg-brand-900 px-5 py-3 text-white">
          <p id="daily-quiz-heading" class="flex items-center gap-2 text-sm font-semibold">
            <span aria-hidden="true" class="grid size-7 place-items-center rounded-full bg-ochre-300 text-ink">?</span>
            Today’s health question
          </p>
          <span class="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/80">{{ q.topic }}</span>
        </div>
        <div class="p-5">
          <p class="font-display text-lg font-semibold leading-snug text-ink">{{ q.question }}</p>
          <div class="mt-4 grid gap-2" role="group" aria-label="Answers">
            @for (option of q.options; track $index) {
              <button
                type="button"
                (click)="answer($index)"
                [disabled]="!!q.answered || sending()"
                [attr.aria-pressed]="q.answered ? q.answered.choiceIndex === $index : null"
                class="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-[15px] font-medium transition {{ optionClass($index) }}"
                data-quiz-option
              >
                <span aria-hidden="true" class="grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold {{ markerClass($index) }}">{{ marker($index) }}</span>
                <span>{{ option }}</span>
              </button>
            }
          </div>

          @if (q.answered; as a) {
            <div class="mt-4 rounded-xl p-4 {{ a.correct ? 'bg-leaf-50' : 'bg-sand-50' }}" role="status">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="font-semibold {{ a.correct ? 'text-leaf-700' : 'text-ink' }}">{{ a.correct ? 'Correct!' : 'Good try — here’s the answer.' }}</p>
                @if (earned()) {
                  <span class="sc-pop rounded-full bg-ochre-300 px-3 py-1 text-sm font-bold text-ink" data-quiz-points>+{{ earned() }} points</span>
                }
              </div>
              <p class="mt-2 text-sm leading-6 text-ink-soft">{{ a.explanation }}</p>
              <p class="mt-2 text-xs text-ink-muted">Source: {{ a.source }}</p>
              <p class="mt-3 text-sm font-semibold text-ink">A new question tomorrow. @if (compact()) { <a routerLink="/me/progress" class="text-brand-700 underline underline-offset-2">See your progress</a> }</p>
            </div>
          } @else {
            <p class="mt-3 text-xs text-ink-muted">Answer to earn 5 points, 10 if you’re right. For learning only — not medical advice.</p>
          }
          @if (error()) { <p role="alert" class="mt-3 text-sm font-semibold text-clay-700">{{ error() }}</p> }
        </div>
      </section>
    } @else if (loadFailed()) {
      <!-- Quiz is a bonus: if it can't load, the page carries on without it. -->
    } @else {
      <div class="h-56 animate-pulse rounded-[1.5rem] bg-sand-100" role="status"><span class="sr-only">Loading today’s question…</span></div>
    }
  `,
})
export class DailyQuizCardComponent {
  private readonly api = inject(EngagementApiService);
  /** On the dashboard, link through to the progress page after answering. */
  readonly compact = input(true);

  readonly quiz = computed(() => this.api.latest()?.quiz ?? null);
  readonly sending = signal(false);
  readonly error = signal('');
  readonly earned = signal(0);
  readonly loadFailed = signal(false);

  constructor() {
    if (!this.api.latest()) this.api.overview().subscribe({ error: () => this.loadFailed.set(true) });
  }

  answer(index: number): void {
    const q = this.quiz();
    if (!q || q.answered || this.sending()) return;
    this.sending.set(true);
    this.error.set('');
    this.api
      .answerQuiz(q.questionId, index)
      .pipe(finalize(() => this.sending.set(false)))
      .subscribe({
        next: (r) => this.earned.set(r.pointsEarned),
        error: (e: HttpErrorResponse) => {
          if (e.status === 409 || e.status === 400) {
            this.api.overview().subscribe();
            this.error.set(e.status === 409 ? 'You already answered today’s question.' : 'A new day, a new question — here it is.');
          } else {
            this.error.set('That didn’t go through. Check your connection and try again.');
          }
        },
      });
  }

  marker(i: number): string {
    const a = this.quiz()?.answered;
    if (a && i === a.correctIndex) return '✓';
    if (a && i === a.choiceIndex) return '✕';
    return String.fromCharCode(65 + i);
  }
  markerClass(i: number): string {
    const a = this.quiz()?.answered;
    if (a && i === a.correctIndex) return 'bg-leaf-700 text-white';
    if (a && i === a.choiceIndex) return 'bg-clay-700 text-white';
    return 'bg-sand-100 text-ink-soft';
  }
  optionClass(i: number): string {
    const a = this.quiz()?.answered;
    if (!a) return 'bg-white ring-1 ring-ink/10 hover:ring-brand-500 hover:bg-brand-50 active:scale-[.99] disabled:opacity-60';
    if (i === a.correctIndex) return 'bg-leaf-50 ring-2 ring-leaf-500 text-ink';
    if (i === a.choiceIndex) return 'bg-clay-50 ring-1 ring-clay-300 text-ink';
    return 'bg-white ring-1 ring-ink/[0.06] text-ink-muted';
  }
}

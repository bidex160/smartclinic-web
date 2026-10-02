import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { FamilyKidsApiService, KID_QUIZ_EMOJI, KID_TASKS, KidTaskKey, KidView } from '../../core/services/family-kids-api.service';
import { TranslatePipe, TranslationService } from '../../core/services/translation.service';

const EMOJI: Record<string, string> = Object.fromEntries(KID_TASKS.map((t) => [t.key, t.emoji]));

/**
 * A child's own corner, made to be handed to the child: huge picture buttons, a star jar,
 * and one picture question a day from Kito. The parent's controls sit at the bottom.
 */
@Component({
  selector: 'app-kids-corner-page',
  imports: [RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .sky { background: radial-gradient(circle at 15% 10%, #fff6d8 0, transparent 40%), radial-gradient(circle at 90% 0%, #e3f2ff 0, transparent 45%), linear-gradient(180deg, #fffaf0, #f3fbf4); }
    .tile { transition: transform .15s ease, box-shadow .15s ease, background-color .2s ease; }
    .tile:active { transform: scale(.96); }
    @keyframes pop { 0% { transform: scale(.4) translateY(0); opacity: 0 } 40% { transform: scale(1.25) translateY(-12px); opacity: 1 } 100% { transform: scale(1) translateY(-26px); opacity: 0 } }
    .pop { animation: pop .9s ease-out forwards; }
    @keyframes wiggle { 0%,100% { transform: rotate(0) } 25% { transform: rotate(-6deg) } 75% { transform: rotate(6deg) } }
    .wiggle { animation: wiggle .5s ease-in-out 2; }
    @media (prefers-reduced-motion: reduce) { .pop, .wiggle { animation: none; } .tile { transition: none; } }
  `,
  template: `
    <main class="sky min-h-screen px-4 pb-16 pt-5 sm:px-8">
      <div class="mx-auto max-w-3xl">
        <a routerLink="/me/family" class="inline-flex min-h-10 items-center text-sm font-semibold text-brand-700">{{ 'kids.page.back' | t }}</a>

        @if (kid(); as k) {
          @if (!k.kidsCorner) {
            <p class="mt-6 rounded-2xl bg-white p-6 text-ink-soft ring-1 ring-ink/[0.06]">{{ 'kids.page.notKid' | t }}</p>
          } @else {
            <header class="mt-3 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 class="font-display text-4xl font-semibold text-ink sm:text-5xl" data-kid-hello>{{ 'kids.page.hello' | t: { name: k.firstName } }}</h1>
                <p class="mt-1 text-lg text-ink-soft">{{ 'kids.page.today' | t }}: <strong class="text-ochre-700" data-stars-today>{{ k.stars?.today ?? 0 }} ⭐</strong></p>
              </div>
              <!-- Star jar -->
              <div class="flex items-center gap-3 rounded-[1.5rem] bg-white/80 px-4 py-3 shadow-card ring-1 ring-ochre-100" data-star-jar>
                <div class="relative h-16 w-12 overflow-hidden rounded-b-2xl rounded-t-lg border-2 border-ochre-300 bg-ochre-50" aria-hidden="true">
                  <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ochre-500 to-ochre-300 transition-[height] duration-700" [style.height.%]="jarPercent()"></div>
                  <span class="absolute inset-0 grid place-items-center text-lg">⭐</span>
                </div>
                <div>
                  <p class="font-display text-2xl font-semibold text-ink">{{ k.stars?.total ?? 0 }}</p>
                  <p class="text-xs font-semibold text-ink-muted">{{ 'kids.page.level' | t: { n: k.stars?.level ?? 1 } }}</p>
                  <p class="text-xs text-ink-muted">{{ k.stars?.nextAt ? ('kids.page.toNext' | t: { n: (k.stars?.nextAt ?? 0) - (k.stars?.total ?? 0) }) : ('kids.page.maxLevel' | t) }}</p>
                </div>
              </div>
            </header>

            <section class="mt-6" aria-labelledby="tasks-title">
              <h2 id="tasks-title" class="text-lg font-semibold text-ink">{{ 'kids.page.tasksTitle' | t }}</h2>
              @if (allDone()) { <p class="wiggle mt-2 inline-block rounded-full bg-leaf-100 px-4 py-1.5 font-semibold text-leaf-700" role="status">{{ 'kids.page.allDone' | t }}</p> }
              <ul class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                @for (task of k.tasks; track task.id) {
                  <li class="relative">
                    <button type="button" (click)="toggle(task.id, task.doneToday)" [disabled]="busy() === task.id"
                      [attr.aria-pressed]="task.doneToday"
                      class="tile flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-[1.5rem] p-3 text-center shadow-card ring-2 {{ task.doneToday ? 'bg-leaf-100 ring-leaf-500' : 'bg-white ring-transparent hover:ring-ochre-300' }}"
                      [attr.data-task]="task.key">
                      <span class="text-5xl sm:text-6xl" aria-hidden="true">{{ emoji(task.key) }}</span>
                      <span class="text-sm font-semibold leading-tight text-ink">{{ ('kids.task.' + task.key) | t }}</span>
                      @if (task.doneToday) { <span class="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-leaf-500 text-white" aria-hidden="true">✓</span> }
                    </button>
                    @if (popped() === task.id) { <span class="pop pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 text-4xl" aria-hidden="true">⭐</span> }
                  </li>
                }
              </ul>
            </section>

            @if (k.quiz; as q) {
              <section class="mt-8 rounded-[1.75rem] bg-white p-5 shadow-card ring-1 ring-brand-100 sm:p-6" aria-labelledby="quiz-title" data-kid-quiz>
                <div class="flex items-center gap-3">
                  <span class="grid size-12 place-items-center rounded-full bg-leaf-50 text-3xl" aria-hidden="true">🐢</span>
                  <div>
                    <h2 id="quiz-title" class="font-semibold text-ink">{{ 'kids.page.questionTitle' | t }}</h2>
                    <p class="text-xs text-ink-muted">{{ 'kids.page.questionHint' | t }}</p>
                  </div>
                </div>
                <p class="font-display mt-4 text-2xl font-semibold leading-snug text-ink">{{ ('kids.quiz.' + q.questionId + '.question') | t }}</p>
                <div class="mt-4 grid grid-cols-3 gap-3">
                  @for (i of [0, 1, 2]; track i) {
                    <button type="button" (click)="answer(q.questionId, i)" [disabled]="!!q.answered || answering()"
                      class="tile flex min-h-36 flex-col items-center justify-center gap-2 rounded-[1.25rem] p-2 text-center ring-2 {{ optionClass(i) }}"
                      [attr.data-kid-option]="i">
                      <span class="text-5xl" aria-hidden="true">{{ quizEmoji(q.questionId, i) }}</span>
                      <span class="text-sm font-semibold leading-tight text-ink">{{ ('kids.quiz.' + q.questionId + '.a' + i) | t }}</span>
                    </button>
                  }
                </div>
                @if (q.answered; as a) {
                  <p class="mt-4 text-lg font-semibold {{ a.correct ? 'text-leaf-700' : 'text-ink' }}" role="status">{{ (a.correct ? 'kids.page.right' : 'kids.page.wrong') | t }}</p>
                  <p class="text-sm text-ink-muted">{{ 'kids.page.tomorrow' | t }}</p>
                }
              </section>
            }

            @if (k.nextVisit; as v) {
              <section class="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] bg-brand-50 p-5 ring-1 ring-brand-100" data-next-visit>
                <div class="min-w-0">
                  <p class="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">🩺 {{ 'kids.visit.title' | t }}</p>
                  <p class="mt-1 font-semibold text-ink">{{ ('kids.visit.' + v.key) | t }} · {{ when(v.daysAway) }} ({{ i18n.formatDate(v.dueDate + 'T12:00:00Z', { day: 'numeric', month: 'long' }) }})</p>
                  <p class="mt-1 text-sm text-ink-soft">{{ 'kids.visit.body' | t: { name: k.firstName } }}</p>
                </div>
                <a routerLink="/me/request-care" class="inline-flex min-h-11 items-center rounded-full bg-brand-700 px-5 text-sm font-semibold text-white">{{ 'kids.visit.book' | t }}</a>
              </section>
            }

            <details class="mt-8 rounded-[1.25rem] bg-white/80 p-5 ring-1 ring-ink/[0.06]" data-grown-ups>
              <summary class="min-h-10 cursor-pointer font-semibold text-ink">👨‍👩‍👧 {{ 'kids.page.grownUps' | t }}</summary>
              <p class="mt-2 text-sm text-ink-soft">{{ 'kids.page.grownUpsHint' | t }}</p>
              <ul class="mt-3 grid gap-2 sm:grid-cols-2">
                @for (t of allTasks; track t.key) {
                  <li class="flex items-center justify-between gap-3 rounded-xl bg-sand-50 px-3 py-2">
                    <span class="flex items-center gap-2 text-sm text-ink"><span aria-hidden="true">{{ t.emoji }}</span>{{ ('kids.task.' + t.key) | t }}</span>
                    @if (activeId(t.key); as id) {
                      <button type="button" (click)="remove(id)" [disabled]="busy() === id" class="min-h-9 rounded-full px-3 text-sm font-semibold text-clay-700 ring-1 ring-clay-300">{{ 'kids.page.remove' | t }}</button>
                    } @else {
                      <button type="button" (click)="add(t.key)" [disabled]="busy() === t.key" class="min-h-9 rounded-full bg-ink px-3 text-sm font-semibold text-white" [attr.data-add-task]="t.key">{{ 'kids.page.add' | t }}</button>
                    }
                  </li>
                }
              </ul>
            </details>
            @if (saveError()) { <p role="alert" class="mt-3 text-sm font-semibold text-clay-700">{{ saveError() }}</p> }
          }
        } @else if (loadError()) {
          <div role="alert" class="mt-6 rounded-2xl bg-clay-50 p-5 text-clay-700">
            {{ 'kids.page.loadError' | t }} <button type="button" (click)="load()" class="font-semibold underline">{{ 'kids.page.tryAgain' | t }}</button>
          </div>
        } @else {
          <div class="mt-6 h-64 animate-pulse rounded-[1.5rem] bg-white/70" role="status"></div>
        }
      </div>
    </main>
  `,
})
export class KidsCornerPageComponent {
  private readonly api = inject(FamilyKidsApiService);
  private readonly route = inject(ActivatedRoute);
  readonly i18n = inject(TranslationService);

  readonly ref = this.route.snapshot.paramMap.get('ref') ?? '';
  readonly kid = signal<KidView | null>(null);
  readonly loadError = signal(false);
  readonly saveError = signal('');
  readonly busy = signal<string | null>(null);
  readonly answering = signal(false);
  readonly popped = signal<string | null>(null);
  readonly allTasks = KID_TASKS;

  readonly allDone = computed(() => {
    const t = this.kid()?.tasks ?? [];
    return t.length > 0 && t.every((x) => x.doneToday);
  });
  readonly jarPercent = computed(() => {
    const s = this.kid()?.stars;
    if (!s) return 0;
    if (!s.nextAt) return 100;
    const prevMin = [0, 10, 30, 60, 100, 150, 220, 300][s.level - 1] ?? 0;
    return Math.max(6, Math.min(100, ((s.total - prevMin) / (s.nextAt - prevMin)) * 100));
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loadError.set(false);
    this.api.child(this.ref).subscribe({ next: (k) => this.kid.set(k), error: () => this.loadError.set(true) });
  }

  emoji(key: string): string {
    return EMOJI[key] ?? '⭐';
  }
  quizEmoji(id: string, i: number): string {
    return KID_QUIZ_EMOJI[id]?.[i] ?? '❓';
  }
  activeId(key: KidTaskKey): string | null {
    return this.kid()?.tasks.find((t) => t.key === key)?.id ?? null;
  }

  optionClass(i: number): string {
    const a = this.kid()?.quiz?.answered;
    if (!a) return 'bg-sand-50 ring-transparent hover:ring-brand-300';
    if (i === a.correctIndex) return 'bg-leaf-100 ring-leaf-500';
    if (i === a.choiceIndex) return 'bg-clay-50 ring-clay-300';
    return 'bg-sand-50 ring-transparent opacity-60';
  }

  when(daysAway: number): string {
    if (daysAway === 0) return this.i18n.t('kids.visit.today');
    return daysAway > 0 ? this.i18n.t('kids.visit.inDays', { n: daysAway }) : this.i18n.t('kids.visit.missed', { n: -daysAway });
  }

  toggle(taskId: string, done: boolean): void {
    this.busy.set(taskId);
    const call = done ? this.api.undo(this.ref, taskId) : this.api.done(this.ref, taskId);
    call.pipe(finalize(() => this.busy.set(null))).subscribe({
      next: (k) => {
        this.kid.set(k);
        if (!done) {
          this.popped.set(taskId);
          setTimeout(() => this.popped.set(null), 950);
        }
      },
      error: () => this.saveError.set(this.i18n.t('kids.page.saveError')),
    });
  }

  answer(questionId: string, choiceIndex: number): void {
    this.answering.set(true);
    this.api
      .answer(this.ref, questionId, choiceIndex)
      .pipe(finalize(() => this.answering.set(false)))
      .subscribe({ next: (k) => this.kid.set(k), error: (e: HttpErrorResponse) => (e.status === 409 || e.status === 400 ? this.load() : this.saveError.set(this.i18n.t('kids.page.saveError'))) });
  }

  add(key: KidTaskKey): void {
    this.mutate(key, this.api.addTask(this.ref, key));
  }
  remove(taskId: string): void {
    this.mutate(taskId, this.api.removeTask(this.ref, taskId));
  }

  private mutate(busyKey: string, call: ReturnType<FamilyKidsApiService['addTask']>): void {
    this.busy.set(busyKey);
    this.saveError.set('');
    call.pipe(finalize(() => this.busy.set(null))).subscribe({
      next: (k) => this.kid.set(k),
      error: (e: HttpErrorResponse) => this.saveError.set(typeof e.error?.message === 'string' ? e.error.message : this.i18n.t('kids.page.saveError')),
    });
  }
}

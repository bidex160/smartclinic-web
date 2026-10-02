import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EngagementBadge } from '../../core/models/engagement.model';
import { EngagementApiService } from '../../core/services/engagement-api.service';
import { LocalePreferencesService } from '../../core/services/locale-preferences.service';
import { SMARTCLINIC_MARKETS } from '../../core/config/market-context';
import { DailyQuizCardComponent } from './daily-quiz-card.component';
import { PassportMeterComponent } from './passport-meter.component';

const BADGE_ICON: Record<string, string> = {
  FIRST_CHECK_IN: 'M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z',
  STREAK_7: 'M12 2s5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 1-3.5S9 11 11 11c0-4 1-9 1-9z',
  STREAK_30: 'M12 2s5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 1-3.5S9 11 11 11c0-4 1-9 1-9z',
  QUIZ_10: 'M9 9a3 3 0 1 1 4 2.8c-.6.3-1 .8-1 1.5V14M12 18h.01',
  QUIZ_SHARP: 'M13 2 4 14h7l-1 8 9-12h-7z',
  KNOW_YOUR_NUMBERS: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
  FIRST_HEALTH_CHECK: 'M20 6 9 17l-5-5',
  ROUTINE_BUILDER: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  FAMILY_GUARDIAN: 'M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z',
  PASSPORT_COMPLETE: 'M5 3h12a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2V5a2 2 0 0 1 2-2zM9 9h6M9 13h4',
};

const EARN: readonly { key: string; label: string }[] = [
  { key: 'quizAnswered', label: 'Answer the daily question' },
  { key: 'quizCorrect', label: 'Extra when you get it right' },
  { key: 'checkInDay', label: 'Tell us how you feel today' },
  { key: 'routineDay', label: 'Tick off a daily routine' },
  { key: 'passportItem', label: 'Fill in a page of your passport' },
  { key: 'selfCheck', label: 'Complete a Guided Self-Check' },
  { key: 'healthCheck', label: 'Complete a Smart Health Check' },
];

/** "My progress": level, points, streak, badges and passport completion in one place. */
@Component({
  selector: 'app-progress-page',
  imports: [RouterLink, DailyQuizCardComponent, PassportMeterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-5xl px-4 pb-12 pt-6 sm:px-8 sm:pt-10">
      @if (summary(); as s) {
        <section class="relative overflow-hidden rounded-[2rem] bg-ink p-6 text-white shadow-lift sm:p-8" aria-labelledby="progress-heading" data-progress-hero>
          <div class="sc-motif pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden="true"></div>
          <div class="relative grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-ochre-300">My progress</p>
              <h1 id="progress-heading" class="font-display mt-2 text-4xl font-semibold">Level {{ s.level.number }} · {{ s.level.name }}</h1>
              <p class="mt-2 text-white/70">
                <span class="font-display text-2xl font-semibold text-white" data-points>{{ s.points }}</span> points
                @if (s.level.nextAt !== null) { · {{ s.level.nextAt - s.points }} to {{ s.level.nextName }} }
              </p>
              <div class="mt-3 h-2.5 max-w-md overflow-hidden rounded-full bg-white/10" role="progressbar" [attr.aria-valuenow]="levelPercent()" aria-valuemin="0" aria-valuemax="100" aria-label="Progress to next level">
                <div class="h-full rounded-full bg-gradient-to-r from-ochre-300 to-leaf-300 transition-[width] duration-700" [style.width.%]="levelPercent()"></div>
              </div>
            </div>
            <div class="flex gap-3">
              <div class="rounded-2xl bg-white/[0.07] px-4 py-3 text-center ring-1 ring-white/10">
                <p class="font-display text-3xl font-semibold" data-streak>{{ s.streak.current }}</p>
                <p class="text-xs text-white/60">day streak</p>
              </div>
              <div class="rounded-2xl bg-white/[0.07] px-4 py-3 text-center ring-1 ring-white/10">
                <p class="font-display text-3xl font-semibold">{{ earnedCount() }}<span class="text-lg text-white/50">/{{ s.badges.length }}</span></p>
                <p class="text-xs text-white/60">badges</p>
              </div>
            </div>
          </div>
          <div class="relative mt-6 border-t border-white/10 pt-5">
            <app-passport-meter [summary]="s" tone="dark" />
          </div>
        </section>

        <div class="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <app-daily-quiz-card [compact]="false" />
          <section class="rounded-[1.5rem] bg-white p-5 ring-1 ring-ink/[0.06]" aria-labelledby="earn-heading">
            <h2 id="earn-heading" class="font-display text-xl font-semibold text-ink">Ways to earn</h2>
            <ul class="mt-3 divide-y divide-ink/[0.06]">
              @for (row of earn; track row.key) {
                <li class="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span class="text-ink">{{ row.label }}</span>
                  <span class="shrink-0 rounded-full bg-ochre-50 px-2.5 py-0.5 font-semibold text-ochre-700">+{{ s.pointsRules[row.key] }}</span>
                </li>
              }
            </ul>
            @if (spend(); as sp) {
              <div class="mt-4 rounded-xl bg-leaf-50 p-4 ring-1 ring-leaf-100" data-spendable>
                <p class="text-sm font-semibold text-ink"><span class="font-display text-2xl">{{ sp.available }}</span> points to spend</p>
                @if (sp.paused) {
                  <p class="mt-1 text-sm font-semibold text-clay-700" data-points-paused>Using points is paused for a short while. Your points are safe and you keep earning.</p>
                }
                <p class="mt-1 text-sm text-ink-soft">
                  Worth {{ sp.value }} off a Smart Health Check — up to {{ sp.maxPercent }}% of the price, from {{ sp.minPoints }} points.
                  @if (sp.used) { <span>You’ve used {{ sp.used }} so far.</span> }
                </p>
                <a routerLink="/me/book" class="mt-2 inline-flex min-h-10 items-center text-sm font-semibold text-leaf-700 underline underline-offset-2">Book a Health Check →</a>
              </div>
            }
            <p class="mt-3 text-xs leading-5 text-ink-muted">Points show your healthy habits. Your level never goes down when you spend them. They aren’t cash and can’t be withdrawn.</p>
          </section>
        </div>

        <section class="mt-8" aria-labelledby="badges-heading">
          <h2 id="badges-heading" class="font-display text-2xl font-semibold text-ink">Badges</h2>
          <ul class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            @for (b of s.badges; track b.code) {
              <li class="flex flex-col items-center rounded-2xl p-4 text-center ring-1 {{ b.earned ? 'bg-white ring-ochre-300 shadow-card' : 'bg-sand-50 ring-ink/[0.05]' }}" [attr.data-badge]="b.code" [attr.data-earned]="b.earned">
                <span aria-hidden="true" class="grid size-14 place-items-center rounded-full {{ b.earned ? 'bg-gradient-to-br from-ochre-300 to-ochre-500 text-ink shadow-lift' : 'bg-sand-200 text-ink-muted' }}">
                  <svg class="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path [attr.d]="icon(b.code)" /></svg>
                </span>
                <p class="mt-2 text-sm font-semibold {{ b.earned ? 'text-ink' : 'text-ink-soft' }}">{{ b.name }}</p>
                <p class="mt-0.5 text-xs leading-4 text-ink-muted">{{ b.description }}</p>
                @if (b.progress; as p) {
                  <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sand-200" aria-hidden="true"><div class="h-full rounded-full bg-brand-600" [style.width.%]="(p.current / p.target) * 100"></div></div>
                  <p class="mt-1 text-[11px] font-semibold text-ink-muted">{{ p.current }} / {{ p.target }}</p>
                } @else if (b.earned) {
                  <p class="mt-2 text-[11px] font-bold uppercase tracking-wider text-ochre-700">Earned</p>
                }
              </li>
            }
          </ul>
        </section>

        <section class="mt-8 rounded-[1.5rem] bg-white p-5 ring-1 ring-ink/[0.06]" aria-labelledby="passport-list-heading">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 id="passport-list-heading" class="font-display text-xl font-semibold text-ink">Complete your Health Passport</h2>
            <a routerLink="/me/health-passport" class="text-sm font-semibold text-brand-700">Open passport →</a>
          </div>
          <ul class="mt-3 grid gap-1 sm:grid-cols-2">
            @for (item of s.passport.items; track item.key) {
              <li>
                <a [routerLink]="item.route" class="flex min-h-11 items-center gap-3 rounded-xl px-2 text-sm hover:bg-sand-50">
                  <span aria-hidden="true" class="grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold {{ item.done ? 'bg-leaf-700 text-white' : 'ring-2 ring-sand-200 text-transparent' }}">✓</span>
                  <span class="{{ item.done ? 'text-ink-muted line-through decoration-ink/20' : 'font-medium text-ink' }}">{{ item.label }}</span>
                  <span class="sr-only">{{ item.done ? '(done)' : '(to do)' }}</span>
                </a>
              </li>
            }
          </ul>
        </section>
      } @else if (error()) {
        <p role="alert" class="rounded-2xl bg-clay-50 p-5 text-clay-700">Your progress couldn’t load. <button type="button" (click)="load()" class="font-semibold underline">Try again</button></p>
      } @else {
        <div class="h-64 animate-pulse rounded-[2rem] bg-sand-200" role="status"><span class="sr-only">Loading your progress…</span></div>
      }
    </main>
  `,
})
export class ProgressPageComponent {
  private readonly api = inject(EngagementApiService);
  readonly summary = this.api.latest;
  readonly error = signal(false);
  readonly earn = EARN;
  private readonly locale = inject(LocalePreferencesService);
  /** What the spendable points are worth in the person's currency. */
  readonly spend = computed(() => {
    const s = this.summary();
    if (!s?.wallet || !s.redeem) return null;
    const currency = SMARTCLINIC_MARKETS[this.locale.market()].currency;
    const perPoint = s.redeem.valuePerPointMinor[currency];
    if (!perPoint) return null;
    return {
      available: s.wallet.availablePoints,
      used: s.wallet.usedPoints,
      // The API counts every currency in hundredths (RWF too), so divide by 100 here.
      value: new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format((s.wallet.availablePoints * perPoint) / 100),
      maxPercent: s.redeem.maxPercent,
      paused: Boolean(s.redeem.paused),
      minPoints: s.redeem.minPoints,
    };
  });
  readonly earnedCount = computed(() => this.summary()?.badges.filter((b) => b.earned).length ?? 0);
  readonly levelPercent = computed(() => {
    const s = this.summary();
    if (!s || s.level.nextAt === null) return 100;
    return Math.round(((s.points - s.level.min) / (s.level.nextAt - s.level.min)) * 100);
  });

  constructor() {
    this.load();
  }
  load(): void {
    this.error.set(false);
    this.api.overview().subscribe({ error: () => this.error.set(true) });
  }
  icon(code: EngagementBadge['code']): string {
    return BADGE_ICON[code] ?? 'M12 2l3 7h7l-5.5 4 2 7-6.5-4.5L5.5 20l2-7L2 9h7z';
  }
}

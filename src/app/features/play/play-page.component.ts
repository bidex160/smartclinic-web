import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { CHALLENGE_DAYS, CHALLENGE_THEMES, ChallengeMode, ChallengeTheme, FriendsWeek, MyChallenge, PlayApiService } from '../../core/services/play-api.service';
import { TranslatePipe, TranslationService } from '../../core/services/translation.service';
import { HealthWordGameComponent } from './health-word-game.component';
import { LeaderboardComponent } from './leaderboard.component';

export const THEME_EMOJI: Record<ChallengeTheme, string> = Object.fromEntries(CHALLENGE_THEMES.map((t) => [t.theme, t.emoji])) as Record<ChallengeTheme, string>;

/** Play: today's Health Word, your challenges, and this week's board with friends. */
@Component({
  selector: 'app-play-page',
  imports: [RouterLink, TranslatePipe, HealthWordGameComponent, LeaderboardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-8 sm:pt-10">
      <header>
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">{{ 'play.page.eyebrow' | t }}</p>
        <h1 class="font-display mt-1 text-4xl font-semibold text-ink sm:text-5xl">{{ 'play.page.title' | t }}</h1>
        <p class="mt-2 max-w-2xl text-lg text-ink-soft">{{ 'play.page.intro' | t }}</p>
      </header>

      <div class="mt-6 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <app-health-word-game />

        <div class="grid content-start gap-6">
          <section class="rounded-[1.75rem] bg-gradient-to-br from-brand-900 via-brand-800 to-ink p-5 text-white shadow-lift sm:p-6" aria-labelledby="challenge-heading" data-challenges>
            <div class="flex items-start justify-between gap-3">
              <div>
                <h2 id="challenge-heading" class="font-display text-2xl font-semibold">{{ 'play.challenges.title' | t }}</h2>
                <p class="mt-1 text-sm text-white/70">{{ 'play.challenges.intro' | t }}</p>
              </div>
              <span class="text-4xl" aria-hidden="true">🏆</span>
            </div>

            @for (c of challenges(); track c.code) {
              <a [routerLink]="['/me/play/challenges', c.code]" class="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-white/10 p-4 transition hover:bg-white/15" [attr.data-challenge]="c.code">
                <span class="flex min-w-0 items-center gap-3">
                  <span class="text-2xl" aria-hidden="true">{{ emoji[c.theme] }}</span>
                  <span class="min-w-0">
                    <span class="block truncate font-semibold">{{ ('play.theme.' + c.theme) | t }} · {{ (c.mode === 'DUEL' ? 'play.mode.duelShort' : 'play.mode.groupShort') | t }}</span>
                    <span class="block text-sm text-white/70">{{ statusLine(c) }}</span>
                  </span>
                </span>
                @if (c.myRank) {
                  <span class="shrink-0 rounded-full {{ c.myRank === 1 ? 'bg-ochre-300 text-ink' : 'bg-white/15 text-white' }} px-3 py-1 text-sm font-bold">#{{ c.myRank }} · {{ c.myScore }}</span>
                }
              </a>
            } @empty {
              @if (loaded()) { <p class="mt-4 rounded-2xl bg-white/10 p-4 text-sm text-white/80">{{ 'play.challenges.none' | t }}</p> }
            }

            @if (!creating()) {
              <button type="button" (click)="creating.set(true)" class="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ochre-300 px-6 font-semibold text-ink shadow-card" data-challenge-new>
                ⚡ {{ 'play.challenges.start' | t }}
              </button>
            } @else {
              <form class="mt-4 grid gap-4 rounded-2xl bg-white p-4 text-ink" (submit)="$event.preventDefault(); create()" data-challenge-form>
                <fieldset>
                  <legend class="text-sm font-semibold">{{ 'play.form.what' | t }}</legend>
                  <div class="mt-2 grid grid-cols-2 gap-2">
                    @for (t of themes; track t.theme) {
                      <button type="button" (click)="theme.set(t.theme)" [attr.aria-pressed]="theme() === t.theme" class="rounded-xl p-3 text-left text-sm ring-1 transition {{ theme() === t.theme ? 'bg-brand-50 ring-2 ring-brand-600' : 'bg-sand-50 ring-ink/10' }}" [attr.data-theme]="t.theme">
                        <span class="text-xl" aria-hidden="true">{{ t.emoji }}</span>
                        <span class="mt-1 block font-semibold">{{ ('play.theme.' + t.theme) | t }}</span>
                        <span class="block text-xs text-ink-muted">{{ ('play.themeHint.' + t.theme) | t }}</span>
                      </button>
                    }
                  </div>
                </fieldset>
                <fieldset>
                  <legend class="text-sm font-semibold">{{ 'play.form.who' | t }}</legend>
                  <div class="mt-2 grid grid-cols-2 gap-2">
                    @for (m of modes; track m) {
                      <button type="button" (click)="mode.set(m)" [attr.aria-pressed]="mode() === m" class="min-h-11 rounded-xl px-3 text-sm font-semibold ring-1 {{ mode() === m ? 'bg-brand-50 ring-2 ring-brand-600' : 'bg-sand-50 ring-ink/10' }}" [attr.data-mode]="m">
                        {{ (m === 'DUEL' ? 'play.mode.duel' : 'play.mode.group') | t }}
                      </button>
                    }
                  </div>
                </fieldset>
                <fieldset>
                  <legend class="text-sm font-semibold">{{ 'play.form.howLong' | t }}</legend>
                  <div class="mt-2 flex flex-wrap gap-2">
                    @for (d of dayOptions; track d) {
                      <button type="button" (click)="days.set(d)" [attr.aria-pressed]="days() === d" class="min-h-11 rounded-full px-4 text-sm font-semibold ring-1 {{ days() === d ? 'bg-brand-700 text-white ring-brand-700' : 'bg-sand-50 ring-ink/10' }}" [attr.data-days]="d">{{ 'play.form.days' | t: { n: d } }}</button>
                    }
                  </div>
                  <label class="mt-3 flex items-center gap-2 text-sm">
                    <input type="checkbox" [checked]="tomorrow()" (change)="tomorrow.set($any($event.target).checked)" class="size-4 accent-brand-700" />
                    {{ 'play.form.tomorrow' | t }}
                  </label>
                </fieldset>
                <p class="rounded-xl bg-sand-50 p-3 text-xs leading-5 text-ink-soft">{{ 'play.form.privacy' | t }}</p>
                @if (createError()) { <p role="alert" class="text-sm text-clay-700">{{ createError() }}</p> }
                <div class="flex gap-2">
                  <button type="submit" [disabled]="saving()" class="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-brand-700 px-5 font-semibold text-white disabled:opacity-50" data-challenge-create>{{ 'play.form.create' | t }}</button>
                  <button type="button" (click)="creating.set(false)" class="min-h-12 rounded-full px-4 text-sm font-semibold text-ink-soft">{{ 'play.form.cancel' | t }}</button>
                </div>
              </form>
            }
          </section>

          <section class="rounded-[1.75rem] bg-white p-5 shadow-card ring-1 ring-ink/[0.06] sm:p-6" aria-labelledby="week-heading" data-friends-week>
            <h2 id="week-heading" class="font-display text-2xl font-semibold text-ink">{{ 'play.week.title' | t }}</h2>
            <p class="mt-1 text-sm text-ink-soft">{{ 'play.week.intro' | t }}</p>
            @if (week(); as w) {
              @if (w.friends) {
                <app-leaderboard class="mt-4 block" [rows]="w.board" />
              } @else {
                <p class="mt-4 rounded-2xl bg-sand-50 p-4 text-sm text-ink-soft">{{ 'play.week.noFriends' | t }}</p>
              }
            }
          </section>

          <p class="text-xs leading-5 text-ink-muted">{{ 'play.page.fairPlay' | t }}</p>
        </div>
      </div>
    </main>
  `,
})
export class PlayPageComponent {
  private readonly api = inject(PlayApiService);
  private readonly router = inject(Router);
  private readonly i18n = inject(TranslationService);
  readonly emoji = THEME_EMOJI;
  readonly themes = CHALLENGE_THEMES;
  readonly modes: readonly ChallengeMode[] = ['DUEL', 'GROUP'];
  readonly dayOptions = CHALLENGE_DAYS;

  readonly challenges = signal<readonly MyChallenge[]>([]);
  readonly loaded = signal(false);
  readonly week = signal<FriendsWeek | null>(null);
  readonly creating = signal(false);
  readonly theme = signal<ChallengeTheme>('ALL_ROUND');
  readonly mode = signal<ChallengeMode>('DUEL');
  readonly days = signal<number>(7);
  readonly tomorrow = signal(false);
  readonly saving = signal(false);
  readonly createError = signal('');

  constructor() {
    this.api.challenges().subscribe({ next: (r) => { this.challenges.set(r.challenges); this.loaded.set(true); }, error: () => this.loaded.set(true) });
    this.api.friendsWeek().subscribe({ next: (w) => this.week.set(w), error: () => undefined });
  }

  statusLine(c: MyChallenge): string {
    if (c.status === 'upcoming') return this.i18n.t('play.status.upcoming', { date: this.i18n.formatDate(`${c.startDate}T12:00:00`, { day: 'numeric', month: 'short' }) });
    if (c.status === 'ended') return this.i18n.t('play.status.ended');
    const left = this.i18n.t(c.daysLeft === 1 ? 'play.status.lastDay' : 'play.status.daysLeft', { n: c.daysLeft });
    return c.doneToday ? `${left} · ${this.i18n.t('play.status.doneToday')}` : left;
  }

  create(): void {
    this.saving.set(true);
    this.createError.set('');
    this.api
      .createChallenge({ theme: this.theme(), mode: this.mode(), days: this.days(), startsOn: this.tomorrow() ? 'tomorrow' : 'today' })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (c) => void this.router.navigate(['/me/play/challenges', c.code], { queryParams: { invite: 1 } }),
        error: (e: unknown) => this.createError.set(e instanceof HttpErrorResponse && typeof e.error?.message === 'string' ? e.error.message : this.i18n.t('play.error')),
      });
  }
}

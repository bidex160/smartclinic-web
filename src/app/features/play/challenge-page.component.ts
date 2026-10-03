import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ChallengeDetail, PlayApiService } from '../../core/services/play-api.service';
import { TranslatePipe, TranslationService } from '../../core/services/translation.service';
import { LocalePreferencesService } from '../../core/services/locale-preferences.service';
import { LeaderboardComponent } from './leaderboard.component';
import { THEME_EMOJI } from './play-page.component';
import { ShareButtonsComponent } from './share-buttons.component';

/** One challenge: the board, the rules, an invite to share, and join or leave. */
@Component({
  selector: 'app-challenge-page',
  imports: [RouterLink, TranslatePipe, LeaderboardComponent, ShareButtonsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-8 sm:pt-10">
      <a routerLink="/me/play" class="inline-flex min-h-10 items-center text-sm font-semibold text-brand-700">← {{ 'play.challenge.back' | t }}</a>

      @if (error()) {
        <p role="alert" class="mt-4 rounded-2xl bg-clay-50 p-5 text-clay-700">{{ error() }}</p>
      }

      @if (c(); as c) {
        <header class="mt-3 overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-brand-900 via-brand-800 to-ink p-6 text-white shadow-lift">
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-ochre-300">{{ (c.mode === 'DUEL' ? 'play.mode.duel' : 'play.mode.group') | t }}</p>
          <h1 class="font-display mt-1 flex items-center gap-3 text-3xl font-semibold sm:text-4xl"><span aria-hidden="true">{{ emoji[c.theme] }}</span> {{ ('play.theme.' + c.theme) | t }}</h1>
          <p class="mt-2 text-white/75">{{ 'play.challenge.by' | t: { name: c.creatorName } }} · {{ dates() }}</p>
          <div class="mt-4 flex flex-wrap gap-2 text-sm">
            <span class="rounded-full bg-white/10 px-3 py-1 font-semibold">{{ status() }}</span>
            <span class="rounded-full bg-white/10 px-3 py-1">{{ 'play.challenge.players' | t: { n: c.participants, max: c.maxParticipants } }}</span>
          </div>
        </header>

        @if (c.joined) {
          @if (c.status !== 'ended' && c.participants < c.maxParticipants) {
            <section class="mt-5 rounded-[1.5rem] bg-ochre-50 p-5 ring-1 ring-ochre-100 {{ inviteFirst() ? 'ring-2 ring-ochre-300' : '' }}" aria-labelledby="invite-heading" data-invite>
              <h2 id="invite-heading" class="font-display text-xl font-semibold text-ink">{{ (c.mode === 'DUEL' ? 'play.invite.titleDuel' : 'play.invite.titleGroup') | t }}</h2>
              <p class="mt-1 text-sm text-ink-soft">{{ 'play.invite.body' | t }}</p>
              <div class="mt-3"><app-share-buttons [text]="inviteText()" [url]="inviteUrl()" /></div>
            </section>
          }

          <section class="mt-5 rounded-[1.5rem] bg-white p-5 shadow-card ring-1 ring-ink/[0.06]" aria-labelledby="board-heading">
            <div class="flex items-center justify-between gap-3">
              <h2 id="board-heading" class="font-display text-xl font-semibold text-ink">{{ (c.status === 'ended' ? 'play.challenge.final' : 'play.challenge.board') | t }}</h2>
              @if (c.status === 'live') { <a routerLink="/me/play" class="text-sm font-semibold text-brand-700">{{ 'play.challenge.scoreNow' | t }} →</a> }
            </div>
            @if (c.board?.length) { <app-leaderboard class="mt-3 block" [rows]="c.board!" /> }
            @if (c.participants < 2 && c.status !== 'ended') { <p class="mt-3 text-sm text-ink-muted">{{ 'play.challenge.waiting' | t }}</p> }
          </section>

          <section class="mt-5 rounded-[1.5rem] bg-sand-50 p-5" aria-labelledby="rules-heading">
            <h2 id="rules-heading" class="font-semibold text-ink">{{ 'play.challenge.howScored' | t }}</h2>
            <p class="mt-1 text-sm leading-6 text-ink-soft">{{ ('play.rules.' + c.theme) | t }}</p>
            <p class="mt-2 text-xs text-ink-muted">{{ 'play.form.privacy' | t }}</p>
          </section>

          @if (c.status === 'ended') {
            <a routerLink="/me/play" class="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-brand-700 px-6 font-semibold text-white">{{ 'play.challenge.again' | t }}</a>
          } @else {
            <button type="button" (click)="leave()" [disabled]="busy()" class="mt-6 text-sm font-semibold text-ink-muted underline underline-offset-2" data-leave>{{ 'play.challenge.leave' | t }}</button>
          }
        } @else {
          <section class="mt-5 rounded-[1.5rem] bg-white p-6 text-center shadow-card ring-1 ring-ink/[0.06]" data-join-panel>
            <p class="font-display text-2xl font-semibold text-ink">{{ 'play.join.title' | t: { name: c.creatorName } }}</p>
            <p class="mt-2 text-ink-soft">{{ ('play.rules.' + c.theme) | t }}</p>
            @if (c.joinable) {
              <button type="button" (click)="join()" [disabled]="busy()" class="mt-5 inline-flex min-h-12 items-center rounded-full bg-brand-700 px-8 font-semibold text-white shadow-card disabled:opacity-50" data-join>{{ 'play.join.cta' | t }}</button>
            } @else {
              <p class="mt-4 rounded-xl bg-sand-50 p-3 text-sm text-ink-soft">{{ (c.status === 'ended' ? 'play.join.ended' : 'play.join.full') | t }}</p>
            }
          </section>
        }
      } @else if (!error()) {
        <p class="mt-8 text-center text-ink-muted" role="status">{{ 'play.loading' | t }}</p>
      }
    </main>
  `,
})
export class ChallengePageComponent {
  private readonly api = inject(PlayApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly i18n = inject(TranslationService);
  private readonly doc = inject(DOCUMENT);
  private readonly locale = inject(LocalePreferencesService);
  readonly emoji = THEME_EMOJI;
  readonly code = this.route.snapshot.paramMap.get('code') ?? '';
  readonly inviteFirst = signal(this.route.snapshot.queryParamMap.has('invite'));

  readonly c = signal<ChallengeDetail | null>(null);
  readonly busy = signal(false);
  readonly error = signal('');
  private readonly referral = signal<string | null>(null);

  readonly dates = computed(() => {
    const c = this.c();
    if (!c) return '';
    const f = (d: string) => this.i18n.formatDate(`${d}T12:00:00`, { day: 'numeric', month: 'short' });
    return `${f(c.startDate)} – ${f(c.endDate)}`;
  });
  readonly status = computed(() => {
    const c = this.c();
    if (!c) return '';
    if (c.status === 'upcoming') return this.i18n.t('play.status.upcoming', { date: this.i18n.formatDate(`${c.startDate}T12:00:00`, { day: 'numeric', month: 'short' }) });
    if (c.status === 'ended') return this.i18n.t('play.status.ended');
    return this.i18n.t(c.daysLeft === 1 ? 'play.status.lastDay' : 'play.status.daysLeft', { n: c.daysLeft });
  });
  readonly inviteUrl = computed(() => {
    const ref = this.referral();
    return `${this.doc.location?.origin ?? ''}/play/c/${this.code}?${ref ? `ref=${encodeURIComponent(ref)}&` : ''}${this.locale.shareParams()}`;
  });
  readonly inviteText = computed(() => {
    const c = this.c();
    if (!c) return '';
    return this.i18n.t(c.mode === 'DUEL' ? 'play.share.duel' : 'play.share.group', { theme: this.i18n.t(`play.theme.${c.theme}`), days: c.days });
  });

  constructor() {
    this.load();
    // The Health Word response carries my invite code; reuse it so friends who join SmartClinic count as my referral.
    this.api.word().subscribe({ next: (w) => this.referral.set(w.inviteCode), error: () => undefined });
  }

  load(): void {
    this.api.challenge(this.code).subscribe({ next: (c) => this.c.set(c), error: (e) => this.fail(e) });
  }

  join(): void {
    this.busy.set(true);
    this.api.join(this.code).pipe(finalize(() => this.busy.set(false))).subscribe({ next: (c) => this.c.set(c), error: (e) => this.fail(e) });
  }

  leave(): void {
    if (!confirm(this.i18n.t('play.challenge.leaveConfirm'))) return;
    this.busy.set(true);
    this.api.leave(this.code).pipe(finalize(() => this.busy.set(false))).subscribe({ next: () => void this.router.navigate(['/me/play']), error: (e) => this.fail(e) });
  }

  private fail(e: unknown): void {
    if (e instanceof HttpErrorResponse && e.status === 404) this.error.set(this.i18n.t('play.challenge.notFound'));
    else this.error.set(e instanceof HttpErrorResponse && typeof e.error?.message === 'string' ? e.error.message : this.i18n.t('play.error'));
  }
}

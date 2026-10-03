import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthStateService } from '../../core/services/auth-state.service';
import { ChallengePreview, PlayApiService } from '../../core/services/play-api.service';
import { TranslatePipe, TranslationService } from '../../core/services/translation.service';
import { THEME_EMOJI } from './play-page.component';

/**
 * Where shared links land: /play (a Health Word share) and /play/c/:code (a challenge invite).
 * Works before sign-in; shows only the inviter's first name and what the challenge is.
 */
@Component({
  selector: 'app-play-invite-page',
  imports: [RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="min-h-[70vh] bg-gradient-to-b from-sand-50 to-white px-4 pb-16 pt-10 sm:px-8">
      <div class="mx-auto max-w-xl text-center">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">{{ 'play.landing.eyebrow' | t }}</p>

        @if (code) {
          @if (preview(); as p) {
            <p class="mt-6 text-6xl" aria-hidden="true">{{ emoji[p.theme] }}</p>
            <h1 class="font-display mt-3 text-4xl font-semibold text-ink">{{ 'play.landing.challengeTitle' | t: { name: p.creatorName } }}</h1>
            <p class="mt-3 text-lg text-ink-soft">{{ 'play.landing.challengeBody' | t: { theme: ('play.theme.' + p.theme) | t, days: p.days } }}</p>
            <p class="mt-2 text-sm text-ink-muted">{{ ('play.rules.' + p.theme) | t }}</p>
            @if (!p.joinable) { <p class="mt-5 rounded-xl bg-sand-100 p-3 text-sm text-ink-soft">{{ (p.status === 'ended' ? 'play.join.ended' : 'play.join.full') | t }}</p> }
          } @else if (missing()) {
            <h1 class="font-display mt-6 text-3xl font-semibold text-ink">{{ 'play.challenge.notFound' | t }}</h1>
          }
        } @else {
          <div class="mx-auto mt-6 flex justify-center gap-1.5" aria-hidden="true">
            @for (l of demo; track $index) { <span class="grid size-12 place-items-center rounded-lg font-display text-2xl font-bold {{ l[1] }}">{{ l[0] }}</span> }
          </div>
          <h1 class="font-display mt-5 text-4xl font-semibold text-ink">{{ 'play.landing.wordTitle' | t }}</h1>
          <p class="mt-3 text-lg text-ink-soft">{{ 'play.landing.wordBody' | t }}</p>
        }

        <div class="mx-auto mt-8 grid max-w-sm gap-3">
          @if (auth.authenticated()) {
            <a [routerLink]="target()" class="inline-flex min-h-12 items-center justify-center rounded-full bg-brand-700 px-6 font-semibold text-white shadow-card" data-landing-go>{{ (code ? 'play.landing.open' : 'play.landing.play') | t }}</a>
          } @else {
            <a routerLink="/register" [queryParams]="authParams()" class="inline-flex min-h-12 items-center justify-center rounded-full bg-brand-700 px-6 font-semibold text-white shadow-card" data-landing-register>{{ 'play.landing.join' | t }}</a>
            <a routerLink="/login" [queryParams]="authParams()" class="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 font-semibold text-ink ring-1 ring-ink/15" data-landing-login>{{ 'play.landing.signIn' | t }}</a>
          }
        </div>
        <p class="mt-6 text-sm text-ink-muted">{{ 'play.landing.free' | t }}</p>
      </div>
    </main>
  `,
})
export class PlayInvitePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(PlayApiService);
  readonly auth = inject(AuthStateService);
  readonly i18n = inject(TranslationService);
  readonly emoji = THEME_EMOJI;
  readonly code = this.route.snapshot.paramMap.get('code')?.toUpperCase() ?? '';
  private readonly ref = this.route.snapshot.queryParamMap.get('ref')?.trim() ?? '';
  readonly preview = signal<ChallengePreview | null>(null);
  readonly missing = signal(false);
  readonly demo: readonly [string, string][] = [['H', 'bg-leaf-500 text-white'], ['E', 'bg-ochre-300 text-ink'], ['A', 'bg-ink/30 text-white'], ['L', 'bg-leaf-500 text-white'], ['T', 'bg-white text-ink ring-2 ring-ink/15']];

  readonly target = computed(() => (this.code ? `/me/play/challenges/${this.code}` : '/me/play'));
  readonly authParams = computed(() => ({ returnUrl: this.target(), ...(/^SC-[A-Z0-9]{4,10}$/i.test(this.ref) ? { ref: this.ref } : {}) }));

  constructor() {
    if (this.code) this.api.preview(this.code).subscribe({ next: (p) => this.preview.set(p), error: () => this.missing.set(true) });
    // Already signed in? Go straight there.
    if (this.auth.authenticated()) void inject(Router).navigateByUrl(this.target(), { replaceUrl: true });
  }
}

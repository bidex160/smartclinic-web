import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';

import { TeamInvitationPreview } from '../../../core/models/provider-team.model';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { ProviderMembershipService } from '../../../core/services/provider-membership.service';
import { ProviderTeamApiService } from '../../../core/services/provider-team-api.service';

/** Opened from a team invitation: shows who invited you and lets you join once signed in. */
@Component({
  selector: 'app-provider-join-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="flex min-h-screen items-center justify-center bg-sand-50 px-4 py-10">
      <section class="sc-card w-full max-w-md overflow-hidden" aria-labelledby="join-heading">
        <div class="relative bg-ink p-6 text-white sm:p-8">
          <div class="sc-motif pointer-events-none absolute inset-0 opacity-[0.08]" aria-hidden="true"></div>
          <div class="relative">
            <img src="/assets/fanvico.png" alt="" class="size-10 rounded-xl bg-white/10 p-1" />
            @if (preview(); as p) {
              <p class="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-ochre-300">Team invitation</p>
              <h1 id="join-heading" class="font-display mt-1 text-2xl font-semibold">Join {{ p.providerDisplayName }}</h1>
              <p class="mt-1 text-white/80">as <strong class="font-semibold text-white">{{ p.roleLabel }}</strong></p>
            } @else {
              <h1 id="join-heading" class="font-display mt-4 text-2xl font-semibold">Team invitation</h1>
            }
          </div>
        </div>

        <div class="p-6 sm:p-8">
          @if (loading()) {
            <p role="status" class="text-ink-muted">Checking your invitation…</p>
          } @else if (problem()) {
            <p role="alert" class="rounded-2xl bg-clay-50 p-4 text-clay-700">{{ problem() }}</p>
            <a routerLink="/" class="mt-4 inline-flex min-h-11 items-center font-semibold text-brand-700">Go to SmartClinic</a>
          } @else if (preview(); as p) {
            <p class="text-ink-soft">This invitation is for <strong class="text-ink">{{ p.invitedEmail }}</strong>. You’ll get your own login to see your facility’s work.</p>
            @if (auth.authenticated()) {
              @if (acceptError()) { <p role="alert" class="mt-4 rounded-2xl bg-clay-50 p-4 text-sm text-clay-700">{{ acceptError() }}</p> }
              <button type="button" (click)="accept()" [disabled]="accepting()" class="mt-5 min-h-12 w-full rounded-full bg-brand-700 px-6 font-semibold text-white hover:bg-brand-800 disabled:opacity-50" data-accept>
                {{ accepting() ? 'Joining…' : 'Join ' + p.providerDisplayName }}
              </button>
              <p class="mt-3 text-center text-xs text-ink-muted">Signed in as {{ auth.currentUser()?.email }}. Not you? Sign out and sign in with the invited email.</p>
            } @else {
              <div class="mt-5 grid gap-2">
                <a routerLink="/login" [queryParams]="{ returnUrl: here }" class="inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-6 font-semibold text-white hover:bg-brand-900" data-sign-in>Sign in</a>
                <a routerLink="/register" [queryParams]="{ returnUrl: here }" class="inline-flex min-h-12 items-center justify-center rounded-full border border-ink/15 bg-white px-6 font-semibold text-ink hover:bg-sand-50">Create an account</a>
              </div>
              <p class="mt-3 text-center text-xs text-ink-muted">Use the email address the invitation was sent to. You’ll come back here to join.</p>
            }
          }
        </div>
      </section>
    </main>
  `,
})
export class ProviderJoinPageComponent {
  private readonly api = inject(ProviderTeamApiService);
  private readonly session = inject(AuthSessionService);
  private readonly membership = inject(ProviderMembershipService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthStateService);

  readonly token = inject(ActivatedRoute).snapshot.paramMap.get('token') ?? '';
  readonly here = `/provider/join/${encodeURIComponent(this.token)}`;
  readonly preview = signal<TeamInvitationPreview | null>(null);
  readonly loading = signal(true);
  readonly problem = signal('');
  readonly accepting = signal(false);
  readonly acceptError = signal('');

  constructor() {
    this.api
      .inspectInvitation(this.token)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (preview) => this.preview.set(preview),
        error: (error) =>
          this.problem.set(
            error?.status === 410
              ? 'This invitation has expired. Ask your facility to send a new one.'
              : 'This invitation link isn’t valid, or it has already been used.',
          ),
      });
  }

  accept(): void {
    this.accepting.set(true);
    this.acceptError.set('');
    this.api
      .acceptInvitation(this.token)
      .pipe(
        // The account now has provider access; refresh the session so the app knows.
        switchMap((membership) => {
          this.membership.set(membership);
          return this.session.refreshSession();
        }),
        finalize(() => this.accepting.set(false)),
      )
      .subscribe({
        next: () => void this.router.navigateByUrl('/provider/dashboard'),
        error: (error) =>
          this.acceptError.set(
            error?.status === 403
              ? 'This invitation was sent to a different email. Sign in with that email to join.'
              : typeof error?.error?.message === 'string'
                ? error.error.message
                : 'We couldn’t add you to the team. Try again.',
          ),
      });
  }
}

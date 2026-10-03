import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ClaimPreview, FacilityOutreachApiService } from '../../core/services/facility-outreach-api.service';

/**
 * Where a facility's invite link lands (/claim/<token>): who they are, how many patients asked
 * for them, and one button to set up their account with the details already filled in.
 */
@Component({
  selector: 'app-facility-claim-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="min-h-[70vh] bg-gradient-to-b from-sand-50 to-white px-4 pb-16 pt-10 sm:px-8">
      <div class="mx-auto max-w-xl">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">SmartClinic for facilities</p>
        @if (preview(); as p) {
          <h1 class="font-display mt-3 text-4xl font-semibold text-ink">{{ p.displayName }}</h1>
          <p class="mt-1 text-ink-soft">{{ place() }}</p>
          @if (p.claimed) {
            <p class="mt-6 rounded-2xl bg-sand-100 p-5 text-ink" data-claimed>This facility has already been claimed. If that wasn’t you, contact SmartClinic and we’ll sort it out.</p>
            <a routerLink="/login" class="mt-4 inline-flex min-h-12 items-center rounded-full bg-ink px-6 font-semibold text-white">Sign in</a>
          } @else {
            @if (p.interestedPatients) {
              <p class="mt-6 rounded-2xl bg-ochre-50 p-5 text-lg font-semibold text-ink ring-1 ring-ochre-100" data-demand>{{ p.interestedPatients }} patient{{ p.interestedPatients === 1 ? ' has' : 's have' }} asked to book or register with you on SmartClinic.</p>
            }
            <ul class="mt-6 grid gap-3 text-ink">
              <li class="flex gap-3"><span aria-hidden="true">✅</span><span>Free to join. Patients find you, book, and pay through SmartClinic.</span></li>
              <li class="flex gap-3"><span aria-hidden="true">💸</span><span>Payouts to your bank account. You see every booking and payment.</span></li>
              <li class="flex gap-3"><span aria-hidden="true">🛡️</span><span>We check your licence before you go live, so patients can trust the Verified badge.</span></li>
              <li class="flex gap-3"><span aria-hidden="true">⏱️</span><span>About five minutes. Your name and place are already filled in.</span></li>
            </ul>
            <a [routerLink]="['/provider/register']" [queryParams]="registerParams()" class="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-brand-700 px-6 font-semibold text-white shadow-card" data-claim-start>Claim {{ p.displayName }}</a>
            <p class="mt-3 text-center text-sm text-ink-muted">Already on SmartClinic? <a routerLink="/login" class="font-semibold text-brand-700 underline">Sign in</a> and contact us to link this listing.</p>
          }
        } @else if (missing()) {
          <h1 class="font-display mt-3 text-3xl font-semibold text-ink" data-missing>This link isn’t valid any more</h1>
          <p class="mt-2 text-ink-soft">It may have been replaced by a newer one. Ask the person who sent it for a fresh link, or set up your account directly.</p>
          <a routerLink="/provider/register" class="mt-6 inline-flex min-h-12 items-center rounded-full bg-brand-700 px-6 font-semibold text-white">Join SmartClinic</a>
        } @else {
          <p class="mt-8 text-ink-muted" role="status">Loading…</p>
        }
      </div>
    </main>
  `,
})
export class FacilityClaimPageComponent {
  private readonly api = inject(FacilityOutreachApiService);
  readonly token = inject(ActivatedRoute).snapshot.paramMap.get('token') ?? '';
  readonly preview = signal<ClaimPreview | null>(null);
  readonly missing = signal(false);
  readonly place = computed(() => [this.preview()?.city, this.preview()?.stateOrRegion].filter((x) => !!x).join(', '));
  readonly registerParams = computed(() => {
    const p = this.preview();
    return p ? { claim: this.token, type: p.providerType } : { claim: this.token };
  });

  constructor() {
    this.api.preview(this.token).subscribe({ next: (p) => this.preview.set(p), error: () => this.missing.set(true) });
  }
}

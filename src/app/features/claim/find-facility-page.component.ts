import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ClaimSearchItem, FacilityOutreachApiService } from '../../core/services/facility-outreach-api.service';
import { ClaimCodeStepComponent } from './claim-code-step.component';

const TYPE_LABEL: Record<string, string> = { HOSPITAL: 'Hospital or clinic', PHARMACY: 'Pharmacy', LABORATORY: 'Laboratory', RADIOLOGY: 'Imaging centre' };

/**
 * /claim: "Is your facility already on SmartClinic?" Hospitals, clinics, pharmacies and labs from
 * the national registry are already listed. Find yours, confirm with a code sent to your
 * registered phone or email, and finish sign-up with everything filled in.
 */
@Component({
  selector: 'app-find-facility-page',
  imports: [RouterLink, ClaimCodeStepComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="min-h-[70vh] bg-gradient-to-b from-sand-50 to-white px-4 pb-16 pt-10 sm:px-8">
      <div class="mx-auto max-w-2xl">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">SmartClinic for facilities</p>
        <h1 class="font-display mt-3 text-4xl font-semibold text-ink">Claim your facility</h1>
        <p class="mt-2 text-ink-soft">Hospitals, clinics, pharmacies and labs in the national Health Facility Registry are already listed on SmartClinic. Find yours, confirm with a code, and start receiving patients. It’s free.</p>

        <form class="mt-6 flex gap-2" role="search" (submit)="$event.preventDefault(); search()">
          <label class="sr-only" for="facility-search">Facility name</label>
          <input id="facility-search" [value]="q()" (input)="q.set($any($event.target).value)" placeholder="Your facility’s name, e.g. St Jude Hospital" autocomplete="organization"
            class="min-h-12 min-w-0 flex-1 rounded-full border border-ink/20 bg-white px-5 focus:border-brand-600 focus:ring-4 focus:ring-brand-100" data-facility-search />
          <button type="submit" [disabled]="q().trim().length < 3 || searching()" class="min-h-12 shrink-0 rounded-full bg-ink px-5 font-semibold text-white disabled:opacity-50" data-search-go>Search</button>
        </form>
        @if (q().trim().length > 0 && q().trim().length < 3) { <p class="mt-2 text-sm text-ink-muted">Type at least 3 letters.</p> }

        @if (searching()) {
          <p class="mt-6 text-ink-muted" role="status">Searching…</p>
        } @else if (error()) {
          <p class="mt-6 rounded-xl bg-red-50 p-4 text-red-800" role="alert">{{ error() }}</p>
        } @else if (searched() && !results().length) {
          <div class="mt-6 rounded-2xl bg-sand-100 p-5" data-no-results>
            <p class="font-semibold text-ink">We couldn’t find “{{ lastQuery() }}”.</p>
            <p class="mt-1 text-ink-soft">Try a shorter part of the name, or join directly. We’ll check your licence and add you.</p>
            <a routerLink="/provider/register" class="mt-4 inline-flex min-h-11 items-center rounded-full bg-brand-700 px-5 font-semibold text-white">Join SmartClinic</a>
          </div>
        } @else if (results().length) {
          <ul class="mt-6 grid gap-3" aria-label="Matching facilities">
            @for (f of results(); track f.id) {
              <li class="rounded-2xl bg-white p-4 shadow-card ring-1 ring-ink/[0.06]" [attr.data-result]="f.id">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-brand-700">{{ typeLabel(f.facilityType) }}</p>
                    <p class="text-lg font-semibold text-ink">{{ f.displayName }}</p>
                    <p class="text-sm text-ink-soft">{{ place(f) }}</p>
                    @if (f.registryListed) { <p class="mt-1 text-xs font-semibold text-emerald-800">✓ In the national Health Facility Registry</p> }
                  </div>
                  @if (f.claimed) {
                    <span class="rounded-full bg-sand-100 px-3 py-1 text-sm font-semibold text-ink-soft">Already claimed</span>
                  } @else if (selected()?.id !== f.id) {
                    <button type="button" (click)="selected.set(f)" class="min-h-11 rounded-full bg-brand-700 px-5 font-semibold text-white" [attr.data-claim]="f.id">This is us</button>
                  }
                </div>
                @if (selected()?.id === f.id) {
                  <div class="mt-4 grid gap-3">
                    <app-claim-code-step [listingId]="f.id" [displayName]="f.displayName" [initialOptions]="f.channels" (verified)="continueWith($event)" />
                    <a [routerLink]="['/provider/register']" class="text-center text-sm font-semibold text-brand-700 underline" data-skip-code>Join without a code (we’ll check your licence)</a>
                  </div>
                }
                @if (f.claimed) { <p class="mt-2 text-sm text-ink-muted">If that wasn’t you, contact SmartClinic and we’ll sort it out.</p> }
              </li>
            }
          </ul>
        }

        <p class="mt-10 text-sm text-ink-muted">Already have an account? <a routerLink="/login" class="font-semibold text-brand-700 underline">Sign in</a>. Not in the registry? <a routerLink="/provider/register" class="font-semibold text-brand-700 underline">Join directly</a>.</p>
      </div>
    </main>
  `,
})
export class FindFacilityPageComponent {
  private readonly api = inject(FacilityOutreachApiService);
  private readonly router = inject(Router);
  readonly q = signal(inject(ActivatedRoute).snapshot.queryParamMap.get('q')?.slice(0, 120) ?? '');
  readonly results = signal<readonly ClaimSearchItem[]>([]);
  readonly selected = signal<ClaimSearchItem | null>(null);
  readonly searching = signal(false);
  readonly searched = signal(false);
  readonly error = signal('');
  readonly lastQuery = signal('');

  constructor() {
    if (this.q().trim().length >= 3) this.search();
  }

  typeLabel(t: string) { return TYPE_LABEL[t] ?? t; }
  place(f: ClaimSearchItem) { return [f.address, f.city, f.stateOrRegion].filter((x) => !!x).join(', '); }

  search(): void {
    const q = this.q().trim();
    if (q.length < 3 || this.searching()) return;
    this.searching.set(true);
    this.error.set('');
    this.selected.set(null);
    this.api.searchClaimable(q).subscribe({
      next: (r) => {
        this.results.set(r.items);
        this.lastQuery.set(q);
        this.searched.set(true);
        this.searching.set(false);
        // One unclaimed match: open it straight away.
        const open = r.items.filter((i) => !i.claimed);
        if (open.length === 1 && r.items.length === 1) this.selected.set(open[0]);
      },
      error: (e) => { this.error.set(e?.status === 429 ? 'Too many searches. Please wait a few minutes.' : 'We couldn’t search just now. Please try again.'); this.searching.set(false); },
    });
  }

  continueWith(token: string): void {
    void this.router.navigate(['/provider/register'], { queryParams: { claim: token } });
  }
}

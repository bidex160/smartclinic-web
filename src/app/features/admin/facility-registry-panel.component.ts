import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';

import { FacilityOutreachApiService, RegistryStatus } from '../../core/services/facility-outreach-api.service';

const ERRORS: Record<string, string> = {
  NOT_CONFIGURED: 'No registry key yet. Add HFR_API_KEY to the server settings.',
  KEY_REJECTED: 'The registry rejected our key (inactive or expired). Request a new one.',
  RATE_LIMITED: 'The registry kept asking us to slow down. It will try again tonight.',
  NETWORK: 'The registry could not be reached. It will try again tonight.',
  ALREADY_RUNNING: 'Another sync was already running.',
  INTERRUPTED: 'The server restarted during the sync. It will run again tonight.',
};

/** The nightly import from the national Health Facility Registry: is it set up, and how did it go. */
@Component({
  selector: 'app-facility-registry-panel',
  imports: [DatePipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mt-5 rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="registry-heading" data-registry-panel>
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="registry-heading" class="text-lg font-bold text-slate-900">National Health Facility Registry</h2>
          <p class="text-sm text-slate-600">Facilities, licence status and registered contacts update by themselves every night.</p>
        </div>
        @if (status()?.configured) {
          <button type="button" (click)="syncNow()" [disabled]="status()?.running || starting()" class="min-h-11 rounded-lg border border-brand-700 px-4 font-semibold text-brand-800 disabled:opacity-50" data-sync-now>{{ status()?.running ? 'Syncing…' : 'Sync now' }}</button>
        }
      </div>
      @if (status(); as s) {
        @if (!s.configured) {
          <p class="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900" data-registry-setup>Not set up yet. Request a free API key at hfr.fmohconnect.gov.ng/developers, then add it to the server settings as HFR_API_KEY.</p>
        } @else {
          <dl class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div class="rounded-xl bg-slate-50 p-3"><dt class="text-xs font-semibold uppercase text-slate-500">Listed</dt><dd class="text-2xl font-bold text-slate-900" data-registry-active>{{ s.totals.active | number }}</dd></div>
            <div class="rounded-xl bg-slate-50 p-3"><dt class="text-xs font-semibold uppercase text-slate-500">Licensed in registry</dt><dd class="text-2xl font-bold text-slate-900">{{ s.totals.registryVerified | number }}</dd></div>
            <div class="rounded-xl bg-slate-50 p-3"><dt class="text-xs font-semibold uppercase text-slate-500">Reachable</dt><dd class="text-2xl font-bold text-slate-900">{{ s.totals.reachable | number }}</dd><dd class="text-xs text-slate-500">have a phone or email</dd></div>
            <div class="rounded-xl bg-slate-50 p-3"><dt class="text-xs font-semibold uppercase text-slate-500">Claimed</dt><dd class="text-2xl font-bold text-slate-900">{{ s.totals.claimed | number }}</dd></div>
          </dl>
          @if (last(); as r) {
            <p class="mt-3 text-sm {{ r.status === 'FAILED' ? 'text-red-700' : 'text-slate-600' }}" data-registry-last>
              Last run {{ r.startedAt | date: 'd MMM, HH:mm' }}:
              @if (r.status === 'RUNNING') { in progress ({{ r.counts['pages'] || 0 }} pages so far). }
              @else if (r.status === 'SUCCEEDED') { {{ r.counts['created'] || 0 }} added, {{ r.counts['updated'] || 0 }} updated, {{ (r.counts['closed'] || 0) + (r.counts['removed'] || 0) }} closed. }
              @else { failed. {{ errorText(r.error) }} }
            </p>
          } @else {
            <p class="mt-3 text-sm text-slate-600">No sync yet. The first one runs tonight, or press Sync now.</p>
          }
          @if (!s.googlePlaces.configured) { <p class="mt-2 text-xs text-slate-500">Google reviews links use a name search until GOOGLE_PLACES_API_KEY is set.</p> }
        }
      } @else if (failed()) {
        <p class="mt-3 text-sm text-red-700" role="alert">Couldn’t load the registry status.</p>
      }
    </section>
  `,
})
export class FacilityRegistryPanelComponent {
  private readonly api = inject(FacilityOutreachApiService);
  readonly status = signal<RegistryStatus | null>(null);
  readonly failed = signal(false);
  readonly starting = signal(false);
  readonly last = computed(() => this.status()?.recent[0] ?? null);
  private poll: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.load();
    inject(DestroyRef).onDestroy(() => { if (this.poll) clearTimeout(this.poll); });
  }

  errorText(code: string | null) { return (code && ERRORS[code]) || 'It will try again tonight.'; }

  load(): void {
    this.api.registryStatus().subscribe({
      next: (s) => {
        this.status.set(s);
        this.failed.set(false);
        if (s.running) this.poll = setTimeout(() => this.load(), 5000);
      },
      error: () => this.failed.set(true),
    });
  }

  syncNow(): void {
    if (this.starting()) return;
    this.starting.set(true);
    this.api.startRegistrySync().subscribe({
      next: () => { this.starting.set(false); setTimeout(() => this.load(), 1000); },
      error: () => { this.starting.set(false); this.load(); },
    });
  }
}

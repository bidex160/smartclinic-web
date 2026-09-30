import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { PartnerFacilityDemandItem, PartnerFacilityDirectoryApiService } from '../../core/services/partner-facility-directory-api.service';

@Component({
  selector: 'app-partner-facility-demand-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-6xl px-5 py-8 sm:px-8">
    <p class="text-sm font-bold uppercase tracking-wider text-brand-700">Partner outreach</p>
    <h1 class="mt-2 text-3xl font-black">Facility demand</h1>
    <p class="mt-2 text-slate-600">Counts show distinct patients who asked SmartClinic to contact a listed facility. This view contains no patient identities.</p>
    @if (loading()) { <p role="status" class="mt-6">Loading demand…</p> }
    @else if (error()) { <p role="alert" class="mt-6 rounded-xl bg-red-50 p-4">Demand could not be loaded. <button type="button" class="font-bold underline" (click)="load()">Retry</button></p> }
    @else { <div class="mt-6 overflow-x-auto rounded-2xl border bg-white"><table class="min-w-full text-left"><thead class="bg-slate-50 text-xs uppercase text-slate-600"><tr><th class="p-4">Facility</th><th class="p-4">Type</th><th class="p-4">Location</th><th class="p-4">Interested patients</th><th class="p-4">Latest request</th></tr></thead><tbody>@for (row of rows(); track row.displayName) {<tr class="border-t"><td class="p-4 font-bold">{{ row.displayName }}</td><td class="p-4">{{ typeLabel(row.facilityType) }}</td><td class="p-4">{{ location(row) }}</td><td class="p-4 font-bold">{{ row.interestedPatients }}</td><td class="p-4">{{ row.latestInterestAt ? date(row.latestInterestAt) : '—' }}</td></tr>} @if (!rows().length) {<tr><td colspan="5" class="p-8 text-center text-slate-500">No facility requests yet.</td></tr>}</tbody></table></div> }
  </main>`,
})
export class PartnerFacilityDemandPageComponent {
  private readonly api = inject(PartnerFacilityDirectoryApiService);
  private readonly route = inject(ActivatedRoute);
  readonly rows = signal<readonly PartnerFacilityDemandItem[]>([]);
  readonly loading = signal(false); readonly error = signal(false);
  constructor() { this.load(); }
  load() {
    this.loading.set(true); this.error.set(false);
    const request = this.route.snapshot.data['scope'] === 'provider' ? this.api.providerDemand() : this.api.adminDemand();
    request.pipe(finalize(() => this.loading.set(false))).subscribe({ next: rows => this.rows.set(rows), error: () => this.error.set(true) });
  }
  typeLabel(type: string) { return type === 'LABORATORY' ? 'Laboratory' : type[0] + type.slice(1).toLowerCase(); }
  location(row: PartnerFacilityDemandItem) { return [row.city, row.stateOrRegion].filter(value => !!value).join(', ') || '—'; }
  date(value: string) { return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(new Date(value)); }
}

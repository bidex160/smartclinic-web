import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CareRequest } from '../../core/models/find-care.model';
import { ProviderCareOperationsApiService } from '../../core/services/provider-care-operations-api.service';
import { UtilsService } from '../../core/services/utils.service';
import { careDeliveryModeLabel } from '../care/care-delivery-mode';
@Component({
  selector: 'app-provider-care-requests-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-6xl px-5 py-10 sm:px-8">
    <p class="text-sm font-bold uppercase tracking-wider text-brand-600">Care operations</p>
    <h1 class="mt-2 text-3xl font-bold">Care Requests</h1>
    <p class="mt-2 text-slate-600">
      Review requests assigned to your authenticated provider workspace.
    </p>
    @if (loading()) {
      <p role="status" class="mt-8 rounded-2xl border bg-white p-6">Loading Care Requests…</p>
    } @else if (error()) {
      <div role="alert" class="mt-8 rounded-2xl bg-red-50 p-6">
        {{ error() }}
        <button type="button" (click)="load()" class="font-bold underline">Try again</button>
      </div>
    } @else if (!items().length) {
      <section class="mt-8 rounded-2xl border bg-white p-8 text-center">
        <h2 class="text-xl font-bold">No Care Requests</h2>
        <p class="mt-2 text-slate-600">Assigned requests will appear here.</p>
      </section>
    } @else {
      <div class="mt-8 overflow-x-auto rounded-2xl border bg-white">
        <table class="min-w-[900px] w-full text-left">
          <thead class="bg-slate-50">
            <tr>
              <th class="p-4">Reference</th>
              <th class="p-4">Service</th>
              <th class="p-4">Delivery</th>
              <th class="p-4">Requested location</th>
              <th class="p-4">Requested appointment</th>
              <th class="p-4">Status</th>
              <th class="p-4">Created</th>
              <th class="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            @for (item of items(); track item.reference) {
              <tr class="border-t">
                <td class="p-4 font-semibold break-all">{{ item.reference }}</td>
                <td class="p-4">{{ item.service.name }}</td>
                <td class="p-4">{{ deliveryModeLabel(item.deliveryMode) }}</td>
                <td class="p-4">
                  @if (item.geography; as geography) {
                    {{ geography.city }}, {{ geography.stateOrRegion }},
                    {{ geography.countryCode }}
                  } @else {
                    Virtual care
                  }
                </td>
                <td class="p-4">
                  {{
                    item.preferredDate
                      ? utils.formatAppointment(item.preferredDate, item.preferredTime)
                      : 'Not specified'
                  }}
                </td>
                <td class="p-4">
                  <span class="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold">{{
                    label(item.status)
                  }}</span>
                </td>
                <td class="p-4">{{ utils.formatDateTime(item.createdAt) }}</td>
                <td class="p-4">
                  <a
                    [routerLink]="['/provider/care-requests', item.reference]"
                    class="font-bold text-brand-700 underline"
                    >View request</a
                  >
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <nav class="mt-5 flex items-center justify-between" aria-label="Care Request pages">
        <button
          type="button"
          (click)="changePage(-1)"
          [disabled]="page() <= 1"
          class="rounded-xl border px-4 py-2 font-bold disabled:opacity-50"
        >
          Previous</button
        ><span>Page {{ page() }} of {{ totalPages() || 1 }}</span
        ><button
          type="button"
          (click)="changePage(1)"
          [disabled]="page() >= totalPages()"
          class="rounded-xl border px-4 py-2 font-bold disabled:opacity-50"
        >
          Next
        </button>
      </nav>
    }
  </main>`,
})
export class ProviderCareRequestsPageComponent {
  private readonly api = inject(ProviderCareOperationsApiService);
  readonly utils = inject(UtilsService);
  readonly items = signal<readonly CareRequest[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly deliveryModeLabel = careDeliveryModeLabel;
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .getCareRequests(this.page(), 20)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (r) => {
          this.items.set(r.items);
          this.totalPages.set(r.totalPages);
        },
        error: () => this.error.set('Care Requests could not be loaded right now.'),
      });
  }
  changePage(delta: number) {
    const next = this.page() + delta;
    if (next < 1 || next > this.totalPages()) return;
    this.page.set(next);
    this.load();
  }
  label(s: string) {
    return (
      (
        {
          AWAITING_PROVIDER_RESPONSE: 'Awaiting your response',
          PROVIDER_ACCEPTED: 'Accepted',
          CANCELLED: 'Cancelled',
          DECLINED: 'Declined',
        } as Record<string, string>
      )[s] ??
      s
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/^./, (c) => c.toUpperCase())
    );
  }
}

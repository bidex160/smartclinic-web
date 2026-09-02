import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CareRequest } from '../../core/models/find-care.model';
import { CareRequestsApiService } from '../../core/services/care-requests-api.service';
import { UtilsService } from '../../core/services/utils.service';
import { careDeliveryModeLabel } from './care-delivery-mode';
@Component({
  selector: 'app-my-care-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-6xl px-5 py-10 sm:px-8">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-sm font-bold uppercase text-brand-600">Patient Portal</p>
        <h1 class="mt-2 text-3xl font-bold">My Care</h1>
        <p class="mt-2 text-slate-600">
          Track care coordination requests made through SmartClinic.
        </p>
      </div>
      <div class="flex flex-wrap gap-3">
        <a routerLink="/me/request-care" class="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white"
          >Find Care</a
        ><a routerLink="/me/fasttrack" class="rounded-xl border px-5 py-3 font-bold"
          >FastTrack requests</a
        >
      </div>
    </div>
    @if (loading()) {
      <p role="status" class="mt-8 rounded-2xl border bg-white p-6">Loading your Care Requests…</p>
    } @else if (error()) {
      <div role="alert" class="mt-8 rounded-2xl bg-red-50 p-6">
        We couldn't load your Care Requests.
        <button type="button" (click)="load()" class="font-bold underline">Try again</button>
      </div>
    } @else if (!items().length) {
      <section class="mt-8 rounded-2xl border bg-white p-8 text-center">
        <h2 class="text-xl font-bold">No Care Requests yet</h2>
        <p class="mt-2 text-slate-600">
          Find an eligible provider or ask SmartClinic to help match you.
        </p>
        <a routerLink="/me/request-care" class="mt-5 inline-block font-bold text-brand-700 underline"
          >Find Care</a
        >
      </section>
    } @else {
      <div class="mt-8 overflow-x-auto rounded-2xl border bg-white">
        <table class="min-w-[760px] w-full text-left">
          <thead class="bg-slate-50">
            <tr>
              <th class="p-4">Service</th>
              <th class="p-4">Provider</th>
              <th class="p-4">Delivery</th>
              <th class="p-4">Location</th>
              <th class="p-4">Status</th>
              <th class="p-4">Payment</th>
              <th class="p-4">Created</th>
              <th class="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            @for (item of items(); track item.reference) {
              <tr class="border-t">
                <td class="p-4 font-semibold">{{ item.service.name }}</td>
                <td class="p-4">
                  {{
                    item.assignedProvider?.displayName ||
                      item.preferredProvider?.displayName ||
                      'SmartClinic matching'
                  }}
                </td>
                <td class="p-4">{{ deliveryModeLabel(item.deliveryMode) }}</td>
                <td class="p-4">{{ item.geography.city }}, {{ item.geography.stateOrRegion }}</td>
                <td class="p-4">{{ label(item.status) }}</td>
                <td class="p-4">{{ fundingLabel(item) }}</td>
                <td class="p-4">{{ utils.formatDateTime(item.createdAt) }}</td>
                <td class="p-4">
                  <a
                    [routerLink]="['/me/care', item.reference]"
                    class="font-bold text-brand-700 underline"
                    >View request</a
                  >
                  @if (item.appointment) {
                    <a
                      [routerLink]="['/me/care/appointments', item.appointment.reference]"
                      class="mt-2 block font-bold text-brand-700 underline"
                      >View appointment</a
                    >
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  </main>`,
})
export class MyCarePageComponent {
  private readonly api = inject(CareRequestsApiService);
  readonly utils = inject(UtilsService);
  readonly items = signal<readonly CareRequest[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.error.set(false);
    this.api
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (requests) => {
          this.items.set(requests.items);
        },
        error: () => {
          this.error.set(true);
        },
      });
  }
  deliveryModeLabel = careDeliveryModeLabel;
  fundingLabel(request: CareRequest) {
    if (!request.funding) return '—';
    if (request.funding.status === 'PAID') return 'Paid';
    if (request.funding.status === 'SATISFIED_FREE') return 'Free';
    return 'Awaiting payment';
  }
  label(s: string) {
    return (
      (
        {
          MATCHING: 'Finding a provider',
          AWAITING_PROVIDER_RESPONSE: 'Waiting for provider',
          PROVIDER_ACCEPTED: 'Provider accepted',
          UNFULFILLABLE: 'Needs review',
        } as Record<string, string>
      )[s] ??
      s
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/^./, (c) => c.toUpperCase())
    );
  }
}

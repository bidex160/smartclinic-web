import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ClinicalOrder } from '../../core/models/pharmacy-fulfillment.model';
import { DirectOrdersApiService } from '../../core/services/direct-orders-api.service';

/** Home card: prescriptions and tests a provider sent that are waiting for the patient. */
@Component({
  selector: 'app-pending-requests-card',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (pending().length) {
      <section class="mt-5 rounded-[1.75rem] bg-white p-5 shadow-sm ring-1 ring-ochre-100 sm:p-6" aria-labelledby="pending-requests-heading" data-pending-requests>
        <p class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ochre-700"><span class="size-1.5 rounded-full bg-ochre-500"></span>Waiting for you</p>
        <h2 id="pending-requests-heading" class="font-display mt-1 text-xl font-semibold text-ink">
          {{ pending().length === 1 ? 'A request from your care provider' : pending().length + ' requests from your care providers' }}
        </h2>
        <ul class="mt-3 divide-y divide-ink/[0.06]">
          @for (o of pending(); track o.reference) {
            <li>
              <a [routerLink]="link(o)" class="flex min-h-14 items-center justify-between gap-3 py-2">
                <span class="min-w-0">
                  <strong class="block font-semibold text-ink">{{ label(o.type) }}</strong>
                  <span class="block truncate text-sm text-ink-muted">From {{ o.orderingProvider.displayName }}@if (o.patient?.displayName) { · for {{ o.patient?.displayName }} }</span>
                </span>
                <span class="shrink-0 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">Choose {{ o.type === 'PRESCRIPTION' ? 'pharmacy' : 'lab' }}</span>
              </a>
            </li>
          }
        </ul>
      </section>
    }
  `,
})
export class PendingRequestsCardComponent {
  private readonly api = inject(DirectOrdersApiService);
  readonly pending = signal<readonly ClinicalOrder[]>([]);

  constructor() {
    this.api.listMine(30).subscribe({
      next: (page) => this.pending.set(page.items.filter((o) => o.origin === 'DIRECT' && o.patientResponse === 'PENDING' && o.status === 'ISSUED').slice(0, 3)),
      // Home must never break because requests are unavailable.
      error: () => this.pending.set([]),
    });
  }

  link(o: ClinicalOrder): unknown[] {
    return o.type === 'PRESCRIPTION' ? ['/me/prescriptions', o.reference] : ['/me/orders', o.reference];
  }

  label(type: string): string {
    return type === 'PRESCRIPTION' ? 'Prescription' : type === 'IMAGING' ? 'Imaging request' : 'Lab test request';
  }
}

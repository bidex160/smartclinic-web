import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { ClinicalOrder } from '../../core/models/pharmacy-fulfillment.model';
import { DirectOrdersApiService } from '../../core/services/direct-orders-api.service';

/**
 * Shown on a request a provider sent by SmartClinic ID. Choosing a pharmacy
 * or lab approves it; the patient can also decline it here.
 */
@Component({
  selector: 'app-direct-request-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (order(); as o) {
      @if (pending()) {
        <section class="mt-5 rounded-2xl bg-ochre-50 p-5 ring-1 ring-ochre-100" aria-labelledby="direct-request-heading" data-direct-request>
          <h2 id="direct-request-heading" class="font-semibold text-ink">{{ o.orderingProvider.displayName }} sent you this {{ noun() }}</h2>
          <p class="mt-1 text-sm text-ink-soft">They used your SmartClinic ID. To go ahead, choose a {{ place() }} below — that’s where you’ll see the price and pay.</p>
          @if (confirming()) {
            <div class="mt-3 flex flex-wrap items-center gap-2">
              <span class="text-sm font-semibold text-ink">Decline this {{ noun() }}?</span>
              <button type="button" (click)="decline()" [disabled]="busy()" class="min-h-10 rounded-full bg-clay-700 px-4 text-sm font-semibold text-white disabled:opacity-50">Yes, decline</button>
              <button type="button" (click)="confirming.set(false)" class="min-h-10 rounded-full px-3 text-sm font-semibold text-ink-soft hover:bg-white">Keep it</button>
            </div>
          } @else {
            <button type="button" (click)="confirming.set(true)" class="mt-3 min-h-10 rounded-full px-3 text-sm font-semibold text-ink-soft underline underline-offset-2 hover:bg-white">Not expecting this? Decline</button>
          }
          @if (error()) { <p role="alert" class="mt-2 text-sm font-semibold text-clay-700">{{ error() }}</p> }
        </section>
      } @else if (o.patientResponse === 'DECLINED') {
        <p class="mt-5 rounded-2xl bg-sand-100 p-4 text-sm text-ink-soft" role="status">You declined this {{ noun() }}. {{ o.orderingProvider.displayName }} can see that.</p>
      }
    }
  `,
})
export class DirectRequestBannerComponent {
  private readonly api = inject(DirectOrdersApiService);

  readonly order = input.required<ClinicalOrder>();
  readonly changed = output<ClinicalOrder>();
  readonly confirming = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');

  readonly pending = computed(() => {
    const o = this.order();
    return o.origin === 'DIRECT' && o.patientResponse === 'PENDING' && o.status === 'ISSUED';
  });
  readonly noun = computed(() => (this.order().type === 'PRESCRIPTION' ? 'prescription' : this.order().type === 'REFERRAL' ? 'referral' : 'request'));
  readonly place = computed(() => {
    const type = this.order().type;
    return type === 'PRESCRIPTION' ? 'pharmacy' : type === 'IMAGING' ? 'imaging centre' : type === 'REFERRAL' ? 'specialist service' : 'lab';
  });

  decline(): void {
    this.busy.set(true);
    this.error.set('');
    this.api
      .decline(this.order().reference)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (updated) => {
          this.confirming.set(false);
          this.changed.emit(updated);
        },
        error: () => this.error.set('This couldn’t be declined. Try again.'),
      });
  }
}

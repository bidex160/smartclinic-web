import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { FulfillmentDirectoryItem, ProviderOrderFulfillment } from '../../../core/models/pharmacy-fulfillment.model';
import { PharmacyFulfillmentApiService } from '../../../core/services/pharmacy-fulfillment-api.service';

/**
 * For a lab or pharmacy that can't do a request (a test it doesn't run, a
 * medicine out of stock): pass it to another provider on SmartClinic. The
 * patient confirms the new place; you can follow it to results.
 */
@Component({
  selector: 'app-refer-onward-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mt-5 rounded-2xl bg-white p-5 ring-1 ring-ink/10 sm:p-6" aria-labelledby="refer-heading" data-refer-onward>
      @if (!open()) {
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="min-w-0">
            <h2 id="refer-heading" class="font-semibold text-ink">Can’t do this one?</h2>
            <p class="mt-0.5 text-sm text-ink-muted">Refer it to another {{ place() }} on SmartClinic. The patient confirms, and you’ll see {{ isPrescription() ? 'when it’s dispensed' : 'the results' }}.</p>
          </div>
          <button type="button" (click)="start()" class="min-h-11 rounded-full border border-ink/15 bg-white px-5 text-sm font-semibold text-ink hover:bg-sand-50">Refer to another {{ place() }}</button>
        </div>
      } @else {
        <h2 id="refer-heading" class="font-display text-xl font-semibold text-ink">Refer to another {{ place() }}</h2>
        <form (submit)="$event.preventDefault(); search()" class="mt-3 flex gap-2">
          <label class="min-w-0 flex-1"><span class="sr-only">Search {{ place() }}s</span>
            <input #q [value]="query()" (input)="query.set(q.value)" [placeholder]="'Search by name or city'" class="min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink" />
          </label>
          <button type="submit" class="min-h-11 rounded-full border border-ink/15 bg-white px-4 text-sm font-semibold text-ink hover:bg-sand-50">Search</button>
        </form>
        @if (searching()) {
          <p role="status" class="mt-3 text-sm text-ink-muted">Finding {{ place() }}s…</p>
        } @else if (!options().length) {
          <p class="mt-3 rounded-xl bg-sand-100 p-3 text-sm text-ink-soft">No other {{ place() }}s found. Try a different name or city.</p>
        } @else {
          <ul class="mt-3 grid gap-2" role="radiogroup" aria-label="Choose where to refer">
            @for (option of options(); track option.providerServiceUnitReference) {
              <li>
                <button type="button" role="radio" [attr.aria-checked]="chosen()?.providerServiceUnitReference === option.providerServiceUnitReference" (click)="chosen.set(option)"
                  class="w-full rounded-2xl p-3 text-left ring-1 transition {{ chosen()?.providerServiceUnitReference === option.providerServiceUnitReference ? 'bg-brand-700 text-white ring-brand-700' : 'bg-white text-ink ring-ink/10 hover:ring-brand-300' }}">
                  <span class="block font-semibold">{{ option.displayName }}</span>
                  <span class="block text-xs {{ chosen()?.providerServiceUnitReference === option.providerServiceUnitReference ? 'text-white/80' : 'text-ink-muted' }}">{{ option.unitName }} · {{ option.location.city }}, {{ option.location.stateOrRegion }}</span>
                </button>
              </li>
            }
          </ul>
        }
        <label class="mt-4 block text-sm font-medium text-ink-soft">Note for them <span class="font-normal text-ink-muted">(optional)</span>
          <input #n [value]="note()" (input)="note.set(n.value)" maxlength="500" [placeholder]="isPrescription() ? 'e.g. Out of stock of item 2' : 'e.g. We don’t run HbA1c'" class="mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink" />
        </label>
        @if (error()) { <p role="alert" class="mt-3 text-sm font-semibold text-clay-700">{{ error() }}</p> }
        <div class="mt-4 flex flex-wrap gap-2">
          <button type="button" (click)="refer()" [disabled]="!chosen() || sending()" class="min-h-11 rounded-full bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50" data-refer-confirm>
            {{ sending() ? 'Referring…' : chosen() ? 'Refer to ' + chosen()!.displayName : 'Choose a ' + place() }}
          </button>
          <button type="button" (click)="open.set(false)" class="min-h-11 rounded-full px-4 text-sm font-semibold text-ink-soft hover:bg-sand-50">Cancel</button>
        </div>
      }
    </section>
  `,
})
export class ReferOnwardPanelComponent {
  private readonly api = inject(PharmacyFulfillmentApiService);

  readonly fulfillment = input.required<ProviderOrderFulfillment>();
  readonly referred = output<ProviderOrderFulfillment>();

  readonly open = signal(false);
  readonly query = signal('');
  readonly note = signal('');
  readonly options = signal<readonly FulfillmentDirectoryItem[]>([]);
  readonly chosen = signal<FulfillmentDirectoryItem | null>(null);
  readonly searching = signal(false);
  readonly sending = signal(false);
  readonly error = signal('');

  readonly isPrescription = computed(() => this.fulfillment().clinicalOrder.type === 'PRESCRIPTION');
  readonly place = computed(() => (this.isPrescription() ? 'pharmacy' : this.fulfillment().clinicalOrder.type === 'IMAGING' ? 'imaging centre' : 'lab'));

  start(): void {
    this.open.set(true);
    this.search();
  }

  search(): void {
    const type = this.fulfillment().clinicalOrder.type;
    if (type !== 'PRESCRIPTION' && type !== 'LABORATORY' && type !== 'IMAGING') return;
    this.searching.set(true);
    this.api
      .searchFulfillmentProvidersForProvider(type, { q: this.query().trim() || undefined, page: 1, limit: 20 })
      .pipe(finalize(() => this.searching.set(false)))
      .subscribe({
        // Never offer this same facility.
        next: (page) => this.options.set(page.items.filter((item) => item.providerReference !== this.fulfillment().fulfiller.providerReference)),
        error: () => this.error.set('Providers couldn’t be loaded. Try again.'),
      });
  }

  refer(): void {
    const target = this.chosen();
    if (!target || this.sending()) return;
    this.sending.set(true);
    this.error.set('');
    this.api
      .referOnward(this.fulfillment().reference, target.providerServiceUnitReference, this.note().trim() || null)
      .pipe(finalize(() => this.sending.set(false)))
      .subscribe({
        next: (next) => this.referred.emit(next),
        error: (error) => this.error.set(typeof error?.error?.message === 'string' ? error.error.message : 'This request couldn’t be referred. Try again.'),
      });
  }
}

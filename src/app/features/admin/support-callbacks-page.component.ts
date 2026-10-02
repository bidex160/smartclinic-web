import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { SupportApiService, SupportCallbackStatus, SupportCallbackView } from '../../core/services/support-api.service';

const TOPIC: Record<string, string> = {
  BOOK_CHECKUP: 'Booking a checkup', SEE_DOCTOR: 'Seeing a doctor', TEST_OR_RESULTS: 'A test or results',
  MEDICINE: 'Medicines', PAYMENT: 'A payment', ACCOUNT: 'Account', OTHER: 'Other',
};
const TIME: Record<string, string> = { ANYTIME: 'Any time', MORNING: 'Morning', AFTERNOON: 'Afternoon', EVENING: 'Evening' };

/** Operations work through people who asked to be phoned, oldest first. */
@Component({
  selector: 'app-support-callbacks-page',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <h1 class="font-display text-3xl font-semibold text-ink">Call-back requests</h1>
      <p class="mt-1 text-ink-soft">People who asked SmartClinic to phone them. Oldest open requests come first.</p>
      <div class="mt-5 inline-flex rounded-full bg-sand-100 p-1" role="group" aria-label="Show">
        @for (s of filters; track s.value) {
          <button type="button" (click)="show(s.value)" [attr.aria-pressed]="status() === s.value" class="min-h-10 rounded-full px-4 text-sm font-semibold {{ status() === s.value ? 'bg-white text-ink shadow-sm' : 'text-ink-soft' }}">{{ s.label }}</button>
        }
      </div>
      @if (loading()) {
        <p role="status" class="mt-6 text-ink-soft">Loading…</p>
      } @else if (error()) {
        <p role="alert" class="mt-6 rounded-xl bg-clay-50 p-4 text-clay-700">Requests couldn't be loaded. <button type="button" (click)="load()" class="font-semibold underline">Try again</button></p>
      } @else if (!items().length) {
        <p class="mt-6 rounded-2xl bg-white p-6 text-ink-soft ring-1 ring-ink/[0.06]">Nothing here.</p>
      } @else {
        <ul class="mt-6 grid gap-3">
          @for (r of items(); track r.reference) {
            <li class="rounded-2xl bg-white p-5 ring-1 ring-ink/[0.06]">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="font-semibold text-ink">{{ r.name }} · <a [href]="'tel:' + r.phone" class="text-brand-700 underline">{{ r.phone }}</a></p>
                  <p class="mt-1 text-sm text-ink-soft">{{ topic(r.topic) }} · Best time: {{ time(r.preferredTime) }}@if (r.countryCode) { · {{ r.countryCode }} }@if (r.hasAccount) { · Has an account }</p>
                  @if (r.message) { <p class="mt-2 text-sm text-ink">{{ r.message }}</p> }
                  <p class="mt-2 text-xs text-ink-muted">{{ r.reference }} · {{ r.createdAt | date: 'd MMM, HH:mm' }}@if (r.staffNote) { · Note: {{ r.staffNote }} }</p>
                </div>
                <div class="flex flex-wrap gap-2">
                  @if (r.status === 'OPEN') {
                    <button type="button" (click)="mark(r, 'CALLED')" [disabled]="busy() === r.reference" class="min-h-10 rounded-full bg-brand-700 px-4 text-sm font-semibold text-white disabled:opacity-60">Mark called</button>
                  }
                  @if (r.status !== 'CLOSED') {
                    <button type="button" (click)="mark(r, 'CLOSED')" [disabled]="busy() === r.reference" class="min-h-10 rounded-full border border-ink/15 px-4 text-sm font-semibold text-ink disabled:opacity-60">Close</button>
                  } @else {
                    <button type="button" (click)="mark(r, 'OPEN')" [disabled]="busy() === r.reference" class="min-h-10 rounded-full border border-ink/15 px-4 text-sm font-semibold text-ink disabled:opacity-60">Reopen</button>
                  }
                </div>
              </div>
            </li>
          }
        </ul>
      }
    </main>
  `,
})
export class SupportCallbacksPageComponent {
  private readonly api = inject(SupportApiService);
  readonly filters: readonly { value: SupportCallbackStatus | ''; label: string }[] = [
    { value: 'OPEN', label: 'Open' }, { value: 'CALLED', label: 'Called' }, { value: 'CLOSED', label: 'Closed' }, { value: '', label: 'All' },
  ];
  readonly status = signal<SupportCallbackStatus | ''>('OPEN');
  readonly items = signal<readonly SupportCallbackView[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly busy = signal<string | null>(null);

  constructor() {
    this.load();
  }
  show(status: SupportCallbackStatus | ''): void {
    this.status.set(status);
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.api.listCallbacks(this.status()).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (page) => this.items.set(page.items),
      error: () => this.error.set(true),
    });
  }
  mark(r: SupportCallbackView, status: SupportCallbackStatus): void {
    this.busy.set(r.reference);
    this.api.updateCallback(r.reference, status).pipe(finalize(() => this.busy.set(null))).subscribe({ next: () => this.load(), error: () => this.error.set(true) });
  }
  topic(code: string) {
    return TOPIC[code] ?? code;
  }
  time(code: string) {
    return TIME[code] ?? code;
  }
}

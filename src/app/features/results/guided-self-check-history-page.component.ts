import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { GuidedSelfCheck } from '../../core/models/guided-self-check.model';
import { GuidedSelfChecksApiService } from '../../core/services/guided-self-checks-api.service';
@Component({
  selector: 'app-guided-self-check-history-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-6xl px-5 py-10 sm:px-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="font-bold uppercase text-brand-700">Smart Health Passport</p>
        <h1 class="mt-2 text-3xl font-bold">My Self-Checks</h1>
        <p class="mt-2 text-slate-600">Resume an open Self-Check or revisit a completed summary.</p>
      </div>
      <a
        routerLink="/me/self-checks/start"
        class="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white"
        >Start Self-Check</a
      >
    </header>
    @if (loading()) {
      <p role="status" class="mt-8 rounded-xl border bg-white p-5">Loading Self-Checks…</p>
    } @else if (error()) {
      <div role="alert" class="mt-8 rounded-xl bg-red-50 p-5">
        <p>We couldn't load your Self-Checks.</p>
        <button type="button" (click)="load()" class="mt-2 font-bold text-brand-700 underline">
          Try again
        </button>
      </div>
    } @else if (!items().length) {
      <div class="mt-8 rounded-2xl border bg-white p-8">
        <h2 class="text-xl font-bold">No Self-Checks yet</h2>
        <p class="mt-2 text-slate-600">Start from home with guided questions when you're ready.</p>
      </div>
    } @else {
      <ul class="mt-8 grid gap-4">
        @for (item of items(); track item.reference) {
          <li class="rounded-2xl border bg-white p-5">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 class="font-bold">Guided Self-Check</h2>
                <p class="mt-1 text-sm text-slate-600">
                  Started {{ date(item.createdAt) }} · {{ workflow(item) }}
                </p>
              </div>
              <a [routerLink]="['/me/self-checks', item.reference]" class="font-bold text-brand-700"
                >{{ item.canResume ? 'Resume' : 'View' }} →</a
              >
            </div>
          </li>
        }
      </ul>
    }
  </main>`,
})
export class GuidedSelfCheckHistoryPageComponent {
  private readonly api = inject(GuidedSelfChecksApiService);
  readonly items = signal<readonly GuidedSelfCheck[]>([]);
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
      .subscribe({ next: (v) => this.items.set(v.items), error: () => this.error.set(true) });
  }
  date(v: string) {
    return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(new Date(v));
  }
  workflow(v: GuidedSelfCheck) {
    if (v.workflowStatus === 'COMPLETED') return 'Completed';
    if (v.workflowStatus === 'IN_PROGRESS') return 'In progress';
    if (v.fundingStatus === 'UNPAID' || v.fundingStatus === 'PAYMENT_PENDING')
      return 'Payment required';
    return 'Ready to begin';
  }
}

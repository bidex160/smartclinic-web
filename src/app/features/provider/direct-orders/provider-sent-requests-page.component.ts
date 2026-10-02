import { isAwaitingProviderApproval, ProviderApprovalNoticeComponent } from '../../../shared/components/provider-approval-notice/provider-approval-notice';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { DirectOrder } from '../../../core/models/direct-order.model';
import { DirectOrdersApiService } from '../../../core/services/direct-orders-api.service';

type Tone = 'wait' | 'go' | 'done' | 'stop';

interface StatusView {
  readonly label: string;
  readonly tone: Tone;
}

const TONE_CLASS: Record<Tone, string> = {
  wait: 'bg-ochre-50 text-ochre-700 ring-ochre-100',
  go: 'bg-brand-50 text-brand-800 ring-brand-100',
  done: 'bg-leaf-50 text-leaf-700 ring-leaf-100',
  stop: 'bg-sand-100 text-ink-muted ring-ink/10',
};

/** Everything this provider has sent by SmartClinic ID, with where each one is now. */
@Component({
  selector: 'app-provider-sent-requests-page',
  imports: [ProviderApprovalNoticeComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Your patients</p>
          <h1 class="font-display mt-1 text-3xl font-semibold text-ink sm:text-4xl">Sent requests</h1>
          <p class="mt-1 text-ink-soft">Prescriptions and tests you sent by SmartClinic ID, and where each one is now.</p>
        </div>
        <a routerLink="/provider/send-request" class="inline-flex min-h-12 items-center rounded-full bg-brand-700 px-6 font-semibold text-white hover:bg-brand-800">+ New request</a>
      </div>

      @if (loading()) {
        <div role="status" class="mt-6 grid gap-3"><div class="h-28 animate-pulse rounded-2xl bg-sand-200"></div><div class="h-28 animate-pulse rounded-2xl bg-sand-200"></div><span class="sr-only">Loading sent requests…</span></div>
      } @else if (error()) {
        @if (awaitingApproval()) { <app-provider-approval-notice feature="Sending prescriptions and tests" /> } @else {
        <p role="alert" class="mt-6 rounded-2xl bg-clay-50 p-5 text-clay-700">Sent requests couldn’t be loaded. <button type="button" (click)="load()" class="font-semibold underline">Try again</button></p>
        }
      } @else if (!items().length) {
        <section class="sc-card mt-6 p-8 text-center">
          <h2 class="font-display text-xl font-semibold text-ink">Nothing sent yet</h2>
          <p class="mx-auto mt-2 max-w-md text-ink-soft">Ask your patient for their SmartClinic ID, or scan their card, and send a prescription or test in under a minute.</p>
          <a routerLink="/provider/send-request" class="mt-5 inline-flex min-h-12 items-center rounded-full bg-ink px-6 font-semibold text-white hover:bg-brand-900">Send your first request</a>
        </section>
      } @else {
        <ul class="mt-6 grid gap-3">
          @for (order of items(); track order.reference) {
            <li class="sc-card p-5" data-sent-request>
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">{{ typeLabel(order.type) }} · {{ date(order.issuedAt ?? order.createdAt) }}</p>
                  <h2 class="mt-1 font-semibold text-ink">{{ order.patient?.displayName }} <span class="font-mono text-sm font-normal text-ink-muted">{{ order.patient?.patientReference }}</span></h2>
                  <p class="mt-1 text-sm text-ink-soft">{{ itemSummary(order) }}</p>
                </div>
                @let s = status(order);
                <span class="shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 {{ toneClass[s.tone] }}" data-status>{{ s.label }}</span>
              </div>

              @if (hasResults(order)) {
                <details class="group mt-4 rounded-2xl bg-leaf-50 p-4 ring-1 ring-leaf-100" data-results>
                  <summary class="cursor-pointer list-none font-semibold text-leaf-700">Results <span class="float-right transition group-open:rotate-45" aria-hidden="true">+</span></summary>
                  <dl class="mt-3 grid gap-2 text-sm">
                    @for (item of order.diagnosticItems ?? []; track item.sortOrder) {
                      <div class="rounded-xl bg-white p-3">
                        <dt class="font-semibold text-ink">{{ item.name }}</dt>
                        <dd class="mt-0.5 text-ink-soft">
                          @if (item.resultedAt) {
                            {{ item.resultValue || item.resultText || 'Result recorded' }} {{ item.resultUnit ?? '' }}
                            @if (item.referenceRange) { <span class="text-ink-muted"> · ref {{ item.referenceRange }}</span> }
                            @if (item.resultFlag) { <strong class="ml-1 text-clay-700">{{ item.resultFlag }}</strong> }
                          } @else { Waiting }
                        </dd>
                      </div>
                    }
                  </dl>
                </details>
              }

              @if (canCancel(order)) {
                <div class="mt-3 flex justify-end">
                  @if (confirming() === order.reference) {
                    <span class="mr-2 self-center text-sm text-ink-soft">Cancel this request?</span>
                    <button type="button" (click)="cancel(order)" [disabled]="cancelling()" class="min-h-10 rounded-full bg-clay-700 px-4 text-sm font-semibold text-white disabled:opacity-50">Yes, cancel</button>
                    <button type="button" (click)="confirming.set(null)" class="min-h-10 rounded-full px-3 text-sm font-semibold text-ink-soft hover:bg-sand-50">Keep</button>
                  } @else {
                    <button type="button" (click)="confirming.set(order.reference)" class="min-h-10 rounded-full px-3 text-sm font-semibold text-ink-soft hover:bg-sand-50">Cancel request</button>
                  }
                </div>
              }
            </li>
          }
        </ul>
        @if (actionError()) { <p role="alert" class="mt-3 text-sm font-semibold text-clay-700">{{ actionError() }}</p> }
      }
    </main>
  `,
})
export class ProviderSentRequestsPageComponent {
  private readonly api = inject(DirectOrdersApiService);

  readonly toneClass = TONE_CLASS;
  readonly items = signal<readonly DirectOrder[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly awaitingApproval = signal(false);
  readonly confirming = signal<string | null>(null);
  readonly cancelling = signal(false);
  readonly actionError = signal('');

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.awaitingApproval.set(false);
    this.api
      .listSent(1, 50)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({ next: (page) => this.items.set(page.items), error: (e: unknown) => { this.awaitingApproval.set(isAwaitingProviderApproval(e)); this.error.set(true); } });
  }

  status(order: DirectOrder): StatusView {
    const place = order.type === 'PRESCRIPTION' ? 'pharmacy' : order.type === 'REFERRAL' ? 'specialist' : 'lab';
    if (order.status === 'CANCELLED') return { label: order.patientResponse === 'DECLINED' ? 'Declined by patient' : 'Cancelled', tone: 'stop' };
    if (this.hasResults(order) && (order.diagnosticItems ?? []).every((item) => item.resultedAt)) return { label: 'Results ready', tone: 'done' };
    if (this.hasResults(order)) return { label: 'Some results ready', tone: 'done' };
    switch (order.fulfillment?.status) {
      case 'ACCEPTED': return { label: `Accepted by ${place}`, tone: 'go' };
      case 'SELECTED': return { label: `Patient chose a ${place}`, tone: 'go' };
    }
    if (order.patientResponse === 'APPROVED') return { label: `Approved — choosing a ${place}`, tone: 'wait' };
    return { label: 'Waiting for patient', tone: 'wait' };
  }

  hasResults(order: DirectOrder): boolean {
    return (order.diagnosticItems ?? []).some((item) => !!item.resultedAt);
  }

  canCancel(order: DirectOrder): boolean {
    return order.status === 'ISSUED' && order.fulfillment?.status !== 'ACCEPTED';
  }

  cancel(order: DirectOrder): void {
    this.cancelling.set(true);
    this.actionError.set('');
    this.api
      .cancel(order.reference)
      .pipe(finalize(() => this.cancelling.set(false)))
      .subscribe({
        next: (updated) => {
          this.confirming.set(null);
          this.items.update((items) => items.map((item) => (item.reference === order.reference ? { ...item, ...updated, patient: item.patient } : item)));
        },
        error: () => this.actionError.set('This request couldn’t be cancelled. Try again.'),
      });
  }

  typeLabel(type: string): string {
    return type === 'PRESCRIPTION' ? 'Prescription' : type === 'IMAGING' ? 'Imaging' : type === 'REFERRAL' ? 'Referral' : 'Lab tests';
  }

  itemSummary(order: DirectOrder): string {
    if (order.type === 'REFERRAL') return order.clinicalNote ?? '';
    const names = order.type === 'PRESCRIPTION' ? (order.prescription?.items ?? []).map((i) => i.medicationName) : (order.diagnosticItems ?? []).map((i) => i.name);
    return names.join(', ');
  }

  date(value: string): string {
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
  }
}

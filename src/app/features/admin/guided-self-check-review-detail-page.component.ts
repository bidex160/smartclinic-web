import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  InternalClinicalProfessional,
  SelfCheckReviewDetail,
} from '../../core/models/guided-self-check-operations.model';
import { GuidedSelfCheckOperationsApiService } from '../../core/services/guided-self-check-operations-api.service';
@Component({
  selector: 'app-guided-self-check-review-detail-page',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-5xl px-5 py-8 sm:px-8">
    <a routerLink="/admin/guided-self-check" class="font-bold text-brand-700"
      >← Clinical Operations</a
    >
    @if (loading()) {
      <p role="status" class="mt-6">Loading urgent review…</p>
    } @else if (error()) {
      <div role="alert" class="mt-6 rounded-xl bg-red-50 p-5">
        {{ error() }}
        <button type="button" (click)="load()" class="font-bold underline">Retry</button>
      </div>
    } @else if (review(); as r) {
      <header class="mt-6 rounded-2xl bg-red-950 p-6 text-white">
        <p class="font-bold uppercase">Urgent RED review</p>
        <h1 class="mt-2 text-3xl font-bold">{{ r.reference }}</h1>
        <p class="mt-2">Self-Check {{ r.selfCheckReference }}</p>
      </header>
      <div class="mt-6 grid gap-5 lg:grid-cols-2">
        <section class="rounded-2xl border bg-white p-5">
          <h2 class="text-xl font-bold">Classification</h2>
          <p class="mt-3">
            <strong>{{ r.classification }}</strong> · urgent guidance remains authoritative
          </p>
          <p class="mt-2 text-sm">
            Matched governed reason codes: {{ r.matchedReasonCodes.join(', ') || 'None returned' }}
          </p>
        </section>
        <section class="rounded-2xl border bg-white p-5">
          <h2 class="text-xl font-bold">Operational status</h2>
          <p class="mt-3">{{ label(r.status) }} · {{ r.priority }}</p>
          <p class="mt-2">Acknowledged: {{ date(r.acknowledgedAt) }}</p>
        </section>
        <section class="rounded-2xl border bg-white p-5">
          <h2 class="text-xl font-bold">Assignment</h2>
          <p class="mt-3">{{ r.assignedProfessional?.displayName || 'Not assigned' }}</p>
          <label class="mt-4 block font-semibold"
            >Internal clinical professional<select
              [(ngModel)]="professionalReference"
              class="mt-1 w-full rounded-lg border p-3"
            >
              <option value="">Select an eligible professional</option>
              @for (p of professionals(); track p.reference) {
                <option [value]="p.reference">
                  {{ p.displayName }} · {{ label(p.professionalType) }}
                </option>
              }</select
            ><span class="mt-1 block text-xs font-normal"
              >Assignment gives responsibility for this review. It does not create an
              appointment.</span
            ></label
          ><button
            type="button"
            (click)="assign()"
            [disabled]="busy() || !professionalReference"
            class="mt-3 rounded-lg bg-brand-700 px-4 py-3 font-bold text-white disabled:opacity-50"
          >
            {{ busy() ? 'Assigning…' : 'Assign professional' }}
          </button>
        </section>
        <section class="rounded-2xl border bg-white p-5">
          <h2 class="text-xl font-bold">Operations actions</h2>
          @if (r.status === 'PENDING') {
            <button
              type="button"
              (click)="acknowledge()"
              [disabled]="busy()"
              class="mt-3 rounded-lg bg-brand-700 px-4 py-3 font-bold text-white"
            >
              {{ busy() ? 'Acknowledging…' : 'Acknowledge' }}
            </button>
          }
          @if (r.status === 'PENDING' || r.status === 'ACKNOWLEDGED') {
            <label class="mt-4 block font-semibold"
              >Escalation note (optional)<textarea
                [(ngModel)]="note"
                maxlength="1000"
                placeholder="Add operational context for the escalation"
                class="mt-1 w-full rounded-lg border p-3"
              ></textarea
              ><span class="text-xs font-normal"
                >Internal operational context; escalation is not a diagnosis or clinical
                completion.</span
              ></label
            ><button
              type="button"
              (click)="escalate()"
              [disabled]="busy()"
              class="mt-3 font-bold text-red-800 underline"
            >
              {{ busy() ? 'Escalating…' : 'Escalate' }}
            </button>
          }
        </section>
      </div>
      @if (r.status === 'COMPLETED') {
        <section class="mt-5 rounded-2xl border bg-white p-5">
          <h2 class="text-xl font-bold">Clinical review</h2>
          <p class="mt-3">Decision: {{ label(r.decision || '') }}</p>
          <h3 class="mt-4 font-bold">Patient-facing guidance</h3>
          <p>{{ r.patientGuidance || 'No additional guidance recorded.' }}</p>
          <h3 class="mt-4 font-bold">Internal clinical note</h3>
          <p class="whitespace-pre-line">
            {{ r.internalClinicalNote || 'No internal note recorded.' }}
          </p>
        </section>
      }
      @if (r.history.length) {
        <section class="mt-5 rounded-2xl border bg-white p-5">
          <h2 class="text-xl font-bold">History</h2>
          <ol class="mt-3 space-y-3">
            @for (h of r.history; track h.createdAt) {
              <li>
                <strong>{{ label(h.event) }}</strong> · {{ date(h.createdAt) }}
                @if (h.actor) {
                  <span>by {{ h.actor.displayName }}</span>
                }
              </li>
            }
          </ol>
        </section>
      }
      <p class="mt-5 text-sm">
        The assigned professional can open
        <a
          [routerLink]="['/internal/guided-self-check-reviews', r.reference]"
          class="font-bold text-brand-700 underline"
          >the internal clinical workspace</a
        >
        using this review reference.
      </p>
    }
    @if (actionError()) {
      <p role="alert" class="mt-5 rounded-xl bg-red-50 p-4">{{ actionError() }}</p>
    }
  </main>`,
})
export class GuidedSelfCheckReviewDetailPageComponent {
  private api = inject(GuidedSelfCheckOperationsApiService);
  private ref = inject(ActivatedRoute).snapshot.paramMap.get('reference')!;
  loading = signal(true);
  busy = signal(false);
  error = signal('');
  actionError = signal('');
  review = signal<SelfCheckReviewDetail | null>(null);
  professionals = signal<readonly InternalClinicalProfessional[]>([]);
  professionalReference = '';
  note = '';
  constructor() {
    this.load();
    this.api
      .professionals({ status: 'ACTIVE', capability: 'URGENT_SELF_CHECK_REVIEW' })
      .subscribe({ next: (r) => this.professionals.set(r.items) });
  }
  load() {
    this.loading.set(true);
    this.api
      .review(this.ref)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (r) => {
          this.review.set(r);
          this.professionalReference = r.assignedProfessional?.reference || '';
        },
        error: () => this.error.set('This urgent review could not be loaded.'),
      });
  }
  acknowledge() {
    if (
      confirm(
        'Acknowledge this urgent review? This records that Operations has seen it; it does not complete clinical review.',
      )
    )
      this.run(this.api.acknowledge(this.ref));
  }
  escalate() {
    if (confirm('Escalate this urgent review operationally?'))
      this.run(this.api.escalate(this.ref, this.note || undefined));
  }
  assign() {
    this.run(this.api.assign(this.ref, this.professionalReference));
  }
  private run(x: ReturnType<GuidedSelfCheckOperationsApiService['acknowledge']>) {
    this.busy.set(true);
    this.actionError.set('');
    x.pipe(finalize(() => this.busy.set(false))).subscribe({
      next: () => this.load(),
      error: (e) => {
        this.actionError.set(
          e.status === 409
            ? 'The review state changed. Its latest state has been reloaded.'
            : 'The operation could not be completed.',
        );
        this.load();
      },
    });
  }
  label(v: string) {
    return v
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/(^|\s)\S/g, (x) => x.toUpperCase());
  }
  date(v: string | null) {
    return v ? new Date(v).toLocaleString('en-NG') : 'Not recorded';
  }
}

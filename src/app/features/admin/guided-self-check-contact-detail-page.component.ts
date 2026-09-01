import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, Observable } from 'rxjs';
import {
  ContactWorkItemDetail,
  ContactWorkItemOutcome,
} from '../../core/models/guided-self-check-operations.model';
import { GuidedSelfCheckOperationsApiService } from '../../core/services/guided-self-check-operations-api.service';
@Component({
  selector: 'app-guided-self-check-contact-detail-page',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-4xl px-5 py-8 sm:px-8">
    <a routerLink="/admin/guided-self-check" class="font-bold text-brand-700"
      >← Clinical Operations</a
    >
    @if (loading()) {
      <p role="status" class="mt-6 rounded-xl border bg-white p-5">
        Loading professional-contact work…
      </p>
    } @else if (error()) {
      <div role="alert" class="mt-6 rounded-xl bg-red-50 p-5">
        <p>{{ error() }}</p>
        <button type="button" (click)="load()" class="mt-3 font-bold underline">Retry</button>
      </div>
    } @else if (item(); as i) {
      <header class="mt-6 rounded-2xl bg-brand-950 p-6 text-white">
        <p class="font-bold uppercase">SmartClinic Professional Contact</p>
        <h1 class="mt-2 break-all text-3xl font-bold">{{ i.reference }}</h1>
        <p class="mt-2">{{ status(i.status) }} · {{ label(i.priority) }} priority</p>
      </header>
      <div class="mt-6 grid gap-5 md:grid-cols-2">
        <section class="rounded-2xl border bg-white p-5">
          <h2 class="text-xl font-bold">Contact details</h2>
          <dl class="mt-4 space-y-3">
            <div>
              <dt class="text-sm text-slate-600">Patient</dt>
              <dd class="font-bold">{{ i.patient.displayName }}</dd>
              <dd class="text-sm">{{ i.patient.reference }}</dd>
            </div>
            <div>
              <dt class="text-sm text-slate-600">Phone</dt>
              <dd class="break-all">{{ i.patient.phone || 'Not provided' }}</dd>
            </div>
            <div>
              <dt class="text-sm text-slate-600">Email</dt>
              <dd class="break-all">{{ i.patient.email }}</dd>
            </div>
          </dl>
          <p class="mt-4 text-sm text-slate-600">
            These details are provided only for this authorized manual Operations task.
          </p>
        </section>
        <section class="rounded-2xl border bg-white p-5">
          <h2 class="text-xl font-bold">Work item</h2>
          <dl class="mt-4 space-y-2">
            <div>
              <dt class="text-sm text-slate-600">Self-Check</dt>
              <dd class="font-bold">{{ i.selfCheckReference }}</dd>
            </div>
            <div>
              <dt class="text-sm text-slate-600">Created</dt>
              <dd>{{ date(i.createdAt) }}</dd>
            </div>
            <div>
              <dt class="text-sm text-slate-600">Acknowledged</dt>
              <dd>{{ date(i.acknowledgedAt) }}</dd>
            </div>
            <div>
              <dt class="text-sm text-slate-600">Started</dt>
              <dd>{{ date(i.startedAt) }}</dd>
            </div>
            @if (i.completedAt) {
              <div>
                <dt class="text-sm text-slate-600">Completed</dt>
                <dd>{{ date(i.completedAt) }}</dd>
              </div>
            }
          </dl>
          @if (i.outcome) {
            <p class="mt-4"><strong>Outcome:</strong> {{ outcomeLabel(i.outcome) }}</p>
          }
        </section>
      </div>
      @if (i.status === 'PENDING') {
        <section class="mt-5 rounded-2xl border bg-white p-5">
          <h2 class="font-bold">Acknowledge contact request</h2>
          <p class="mt-2 text-sm">
            Acknowledgement records that SmartClinic Operations has seen this request. It does not
            contact the patient.
          </p>
          <button
            type="button"
            (click)="acknowledge()"
            [disabled]="busy()"
            class="mt-4 rounded-lg bg-brand-700 px-5 py-3 font-bold text-white"
          >
            {{ busy() ? 'Acknowledging…' : 'Acknowledge' }}
          </button>
        </section>
      }
      @if (i.status === 'ACKNOWLEDGED') {
        <section class="mt-5 rounded-2xl border bg-white p-5">
          <h2 class="font-bold">Begin manual contact work</h2>
          <p class="mt-2 text-sm">
            Starting this task records that Operations is beginning the work. It does not
            automatically call or message the patient.
          </p>
          <button
            type="button"
            (click)="start()"
            [disabled]="busy()"
            class="mt-4 rounded-lg bg-brand-700 px-5 py-3 font-bold text-white"
          >
            {{ busy() ? 'Starting contact…' : 'Start Contact' }}
          </button>
        </section>
      }
      @if (i.status === 'IN_PROGRESS') {
        <form (ngSubmit)="complete()" class="mt-5 rounded-2xl border bg-white p-5">
          <h2 class="text-xl font-bold">Complete contact work</h2>
          <label class="mt-4 block font-semibold"
            >Outcome<select
              [(ngModel)]="outcome"
              name="outcome"
              required
              class="mt-1 w-full rounded-lg border p-3"
            >
              <option value="">Select the recorded outcome</option>
              @for (o of outcomes; track o) {
                <option [value]="o">{{ outcomeLabel(o) }}</option>
              }
            </select></label
          ><label class="mt-4 block font-semibold"
            >Operational note (optional)<textarea
              [(ngModel)]="note"
              name="note"
              maxlength="1000"
              rows="4"
              placeholder="Add a brief operational note about the contact attempt"
              class="mt-1 w-full rounded-lg border p-3"
            ></textarea
            ><span class="mt-1 block text-xs font-normal text-slate-600"
              >Record operational context only, not diagnosis or treatment advice. This note is not
              shown to the patient.</span
            ></label
          ><button
            type="submit"
            [disabled]="busy() || !outcome"
            class="mt-4 rounded-lg bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-50"
          >
            {{ busy() ? 'Completing contact…' : 'Complete Contact' }}
          </button>
        </form>
      }
      @if (i.status !== 'COMPLETED' && i.status !== 'CANCELLED') {
        <section class="mt-5 rounded-2xl border bg-white p-5">
          <label class="block font-semibold"
            >Cancellation reason (optional)<textarea
              [(ngModel)]="reason"
              maxlength="500"
              placeholder="Explain why this contact work item should be cancelled"
              class="mt-1 w-full rounded-lg border p-3"
            ></textarea
            ><span class="text-xs font-normal"
              >Cancellation does not change the Self-Check classification or clinical-review
              history.</span
            ></label
          ><button
            type="button"
            (click)="cancel()"
            [disabled]="busy()"
            class="mt-3 font-bold text-red-800 underline"
          >
            {{ busy() ? 'Cancelling…' : 'Cancel contact work' }}
          </button>
        </section>
      }
      @if (actionError()) {
        <p role="alert" class="mt-4 rounded-xl bg-red-50 p-4">{{ actionError() }}</p>
      }
    }
  </main>`,
})
export class GuidedSelfCheckContactDetailPageComponent {
  private api = inject(GuidedSelfCheckOperationsApiService);
  private ref = inject(ActivatedRoute).snapshot.paramMap.get('reference')!;
  item = signal<ContactWorkItemDetail | null>(null);
  loading = signal(true);
  busy = signal(false);
  error = signal('');
  actionError = signal('');
  outcomes: ContactWorkItemOutcome[] = [
    'CONTACTED',
    'UNREACHABLE',
    'PATIENT_DECLINED',
    'REFERRED_TO_CLINICAL_REVIEW',
  ];
  outcome: ContactWorkItemOutcome | '' = '';
  note = '';
  reason = '';
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.item.set(null);
    this.error.set('');
    this.api
      .contactWorkItem(this.ref)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (i) => this.item.set(i),
        error: () =>
          this.error.set(
            'This professional-contact work item is unavailable or you are not authorized to open it.',
          ),
      });
  }
  acknowledge() {
    if (confirm('Acknowledge this professional-contact work item?'))
      this.run(this.api.acknowledgeContact(this.ref));
  }
  start() {
    if (confirm('Start this manual professional-contact task?'))
      this.run(this.api.startContact(this.ref));
  }
  complete() {
    if (!this.outcome) return;
    if (confirm('Complete this contact work item with the selected operational outcome?'))
      this.run(this.api.completeContact(this.ref, this.outcome, this.note || undefined));
  }
  cancel() {
    if (
      confirm('Cancel this contact work item? This does not change the Self-Check classification.')
    )
      this.run(this.api.cancelContact(this.ref, this.reason || undefined));
  }
  private run(x: Observable<unknown>) {
    this.busy.set(true);
    this.actionError.set('');
    x.pipe(finalize(() => this.busy.set(false))).subscribe({
      next: () => this.load(),
      error: (e) => {
        this.actionError.set(
          e.status === 409
            ? 'This contact work item changed. Its latest state has been reloaded.'
            : 'The contact operation could not be completed.',
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
  status(v: string) {
    return v === 'IN_PROGRESS' ? 'In progress' : this.label(v);
  }
  outcomeLabel(v: ContactWorkItemOutcome) {
    return (
      {
        CONTACTED: 'Contacted',
        UNREACHABLE: 'Unable to reach patient',
        PATIENT_DECLINED: 'Patient declined contact',
        REFERRED_TO_CLINICAL_REVIEW: 'Referred for clinical review',
      } as const
    )[v];
  }
  date(v: string | null) {
    return v
      ? new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(
          new Date(v),
        )
      : 'Not recorded';
  }
}

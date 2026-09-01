import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  InternalReviewDetail,
  SelfCheckReviewDecision,
} from '../../core/models/guided-self-check-operations.model';
import { GuidedSelfCheckNextActionType } from '../../core/models/guided-self-check.model';
import { GuidedSelfCheckOperationsApiService } from '../../core/services/guided-self-check-operations-api.service';
@Component({
  selector: 'app-internal-guided-self-check-review-page',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-5xl px-5 py-8">
    <a routerLink="/internal/guided-self-check-reviews" class="font-bold text-brand-700"
      >← My Reviews</a
    >
    <header>
      <p class="font-bold uppercase text-brand-800">Internal clinical workspace</p>
      <h1 class="mt-2 text-3xl font-bold">Self-Check clinical review</h1>
    </header>
    @if (loading()) {
      <p role="status" class="mt-6">Loading assigned review…</p>
    } @else if (error()) {
      <div role="alert" class="mt-6 rounded-xl bg-red-50 p-5">
        {{ error() }}
        <button type="button" (click)="load()" class="font-bold underline">Retry</button>
      </div>
    } @else if (review(); as r) {
      <section
        class="mt-6 rounded-2xl border-2 p-6"
        [class.border-red-300]="r.classification === 'RED'"
        [class.bg-red-50]="r.classification === 'RED'"
        [class.border-amber-300]="r.classification === 'AMBER'"
        [class.bg-amber-50]="r.classification === 'AMBER'"
      >
        <h2 class="text-xl font-bold">
          {{
            r.classification === 'RED'
              ? 'Original Self-Check safety guidance'
              : 'Routine AMBER clinical review'
          }}
        </h2>
        <p class="mt-2">
          {{
            r.classification === 'RED'
              ? 'This Self-Check was classified RED. Its urgent guidance remains in effect and is not replaced by a later recommendation.'
              : 'This governed classification remains AMBER. Your review determines the professional recommendation.'
          }}
        </p>
        <p class="mt-2 font-bold">{{ r.reference }} · {{ label(r.status) }}</p>
      </section>
      @if (r.analysis?.output; as output) {
        <section class="mt-5 rounded-2xl border border-amber-200 bg-white p-6">
          <h2 class="text-xl font-bold">AI decision support</h2>
          <p class="mt-2 text-sm text-slate-600">
            Decision support only. Classification remains AMBER and the clinical professional makes
            the review decision.
          </p>
          <p class="mt-4">{{ output.conciseSummary }}</p>
          <dl class="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt class="font-bold">Operational priority</dt>
              <dd>{{ label(output.suggestedOperationalPriority) }}</dd>
            </div>
            <div>
              <dt class="font-bold">Suggested next step</dt>
              <dd>
                {{ output.recommendedAction ? label(output.recommendedAction) : 'None suggested' }}
              </dd>
            </div>
          </dl>
          @if (output.notableResponses.length) {
            <h3 class="mt-4 font-bold">Notable responses</h3>
            <ul class="list-disc pl-5">
              @for (v of output.notableResponses; track v) {
                <li>{{ v }}</li>
              }
            </ul>
          }
          @if (output.informationGaps.length) {
            <h3 class="mt-4 font-bold">Information gaps</h3>
            <ul class="list-disc pl-5">
              @for (v of output.informationGaps; track v) {
                <li>{{ v }}</li>
              }
            </ul>
          }
        </section>
      }
      <section class="mt-5 rounded-2xl border bg-white p-6">
        <h2 class="text-xl font-bold">Questionnaire responses</h2>
        @for (g of r.questionnaire.groups; track g.key) {
          <h3 class="mt-5 font-bold">{{ g.title }}</h3>
          <dl class="mt-2 space-y-3">
            @for (q of g.questions; track q.key) {
              <div>
                <dt class="text-sm font-semibold">{{ q.text }}</dt>
                <dd class="whitespace-pre-wrap">{{ answer(q.answer) }}</dd>
              </div>
            }
          </dl>
        }
      </section>
      @if (r.status === 'ASSIGNED') {
        <button
          type="button"
          (click)="start()"
          [disabled]="busy()"
          class="mt-5 rounded-lg bg-brand-700 px-5 py-3 font-bold text-white"
        >
          {{ busy() ? 'Starting review…' : 'Start Review' }}
        </button>
      }
      @if (r.status === 'IN_REVIEW') {
        <form (ngSubmit)="complete()" class="mt-5 rounded-2xl border bg-white p-6">
          <h2 class="text-xl font-bold">Complete clinical review</h2>
          <label class="mt-4 block font-semibold"
            >Professional decision<select
              [(ngModel)]="decision"
              name="decision"
              required
              class="mt-1 w-full rounded-lg border p-3"
            >
              <option value="">Select a decision</option>
              @for (d of decisions; track d) {
                <option [value]="d">{{ label(d) }}</option>
              }
            </select></label
          ><label class="mt-4 block font-semibold"
            >Recommended next action<select
              [(ngModel)]="nextAction"
              name="nextAction"
              required
              [disabled]="!decision"
              class="mt-1 w-full rounded-lg border p-3"
            >
              <option value="">Select an allowed action</option>
              @for (a of allowedActions(); track a) {
                <option [value]="a">{{ label(a) }}</option>
              }</select
            ><span class="mt-1 block text-xs font-normal"
              >Options come from the backend compatibility projection for this decision.</span
            ></label
          ><label class="mt-4 block font-semibold"
            >Patient guidance (optional)<textarea
              [(ngModel)]="patientGuidance"
              name="patientGuidance"
              maxlength="1000"
              rows="4"
              placeholder="Explain the recommended next step clearly for the patient"
              class="mt-1 w-full rounded-lg border p-3"
            ></textarea
            ><span class="flex justify-between text-xs font-normal"
              ><span>This text is visible to the patient. Do not include links or HTML.</span
              ><span>{{ patientGuidance.length }} / 1000</span></span
            ></label
          ><label class="mt-4 block font-semibold"
            >Internal clinical note (optional)<textarea
              [(ngModel)]="internalNote"
              name="internalNote"
              maxlength="3000"
              rows="5"
              placeholder="Add context for the SmartClinic clinical team only"
              class="mt-1 w-full rounded-lg border p-3"
            ></textarea
            ><span class="flex justify-between text-xs font-normal"
              ><span>Internal notes are not shown to the patient.</span
              ><span>{{ internalNote.length }} / 3000</span></span
            ></label
          ><label class="mt-4 flex items-start gap-3"
            ><input
              [(ngModel)]="contactRequired"
              name="contactRequired"
              type="checkbox"
              class="mt-1"
            /><span
              ><strong>Professional contact required</strong
              ><span class="block text-sm"
                >Records the contact requirement; it does not create an appointment or call.</span
              ></span
            ></label
          ><button
            type="submit"
            [disabled]="busy() || !decision || !nextAction"
            class="mt-5 rounded-lg bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-50"
          >
            {{ busy() ? 'Completing review…' : 'Complete clinical review' }}
          </button>
        </form>
      }
      @if (r.status === 'COMPLETED') {
        <section class="mt-5 rounded-2xl border bg-white p-6">
          <h2 class="text-xl font-bold">Professional recommended next step</h2>
          <p class="mt-2">{{ r.nextAction?.title || label(r.decision || 'Completed') }}</p>
          <p class="mt-2">{{ r.patientGuidance || 'No additional patient guidance recorded.' }}</p>
        </section>
      }
      @if (actionError()) {
        <p role="alert" class="mt-4 rounded-xl bg-red-50 p-4">{{ actionError() }}</p>
      }
      @if (r.status === 'COMPLETED' || r.status === 'CANCELLED') {
        <a
          routerLink="/internal/guided-self-check-reviews"
          class="mt-5 inline-flex rounded-lg bg-brand-700 px-5 py-3 font-bold text-white"
          >Return to My Reviews</a
        >
      }
    }
  </main>`,
})
export class InternalGuidedSelfCheckReviewPageComponent {
  private api = inject(GuidedSelfCheckOperationsApiService);
  private ref = inject(ActivatedRoute).snapshot.paramMap.get('reference')!;
  loading = signal(true);
  busy = signal(false);
  error = signal('');
  actionError = signal('');
  review = signal<InternalReviewDetail | null>(null);
  decisions: SelfCheckReviewDecision[] = [
    'NO_FURTHER_REVIEW_REQUIRED',
    'FOLLOW_UP_RECOMMENDED',
    'PATIENT_CONTACT_REQUIRED',
    'URGENT_ESCALATION_CONFIRMED',
  ];
  decision: SelfCheckReviewDecision | '' = '';
  nextAction: GuidedSelfCheckNextActionType | '' = '';
  patientGuidance = '';
  internalNote = '';
  contactRequired = false;
  allowedActions() {
    const r = this.review();
    return r && this.decision ? r.allowedNextActionsByDecision[this.decision] : [];
  }
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.review.set(null);
    this.error.set('');
    this.api
      .internalReview(this.ref)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (r) => this.review.set(r),
        error: () =>
          this.error.set(
            'This assigned review is unavailable or you are not authorized to open it.',
          ),
      });
  }
  start() {
    this.run(this.api.startReview(this.ref));
  }
  complete() {
    if (!this.decision || !this.nextAction) return;
    if (!confirm('Complete this clinical review and publish the patient-safe recommendation?'))
      return;
    this.busy.set(true);
    this.api
      .completeReview(this.ref, {
        decision: this.decision,
        nextActionType: this.nextAction,
        ...(this.patientGuidance.trim() && { patientGuidance: this.patientGuidance.trim() }),
        ...(this.internalNote.trim() && { internalClinicalNote: this.internalNote.trim() }),
        contactRequired: this.contactRequired,
      })
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: () => this.load(),
        error: (e) => {
          this.actionError.set(
            e.status === 409
              ? 'This review state changed. Reloading the authoritative state.'
              : 'The clinical review could not be completed. Check the form and try again.',
          );
          this.load();
        },
      });
  }
  private run(x: ReturnType<GuidedSelfCheckOperationsApiService['startReview']>) {
    this.busy.set(true);
    x.pipe(finalize(() => this.busy.set(false))).subscribe({
      next: () => this.load(),
      error: () => {
        this.actionError.set('The review could not be started.');
        this.load();
      },
    });
  }
  answer(a: { state: string; value: unknown } | null) {
    if (!a) return 'Not answered';
    if (a.state === 'DONT_KNOW') return "Patient selected I don't know";
    if (Array.isArray(a.value)) return a.value.join(', ');
    if (a.value && typeof a.value === 'object')
      return Object.entries(a.value)
        .map(([k, v]) => `${k}: ${String(v)}`)
        .join(', ');
    return String(a.value ?? 'Not provided');
  }
  label(v: string) {
    return v
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/(^|\s)\S/g, (x) => x.toUpperCase());
  }
}

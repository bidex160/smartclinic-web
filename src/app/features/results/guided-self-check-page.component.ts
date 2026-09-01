import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import PaystackPop from '@paystack/inline-js';
import { finalize } from 'rxjs';
import {
  GuidedSelfCheckDetail,
  GuidedSelfCheckFunding,
  GuidedSelfCheckQuestion,
  GuidedSelfCheckQuestionnaire,
  GuidedSelfCheckValue,
} from '../../core/models/guided-self-check.model';
import { GuidedSelfChecksApiService } from '../../core/services/guided-self-checks-api.service';
import { formatEarningMoney } from '../provider/provider-earning-presentation';
@Component({
  selector: 'app-guided-self-check-page',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-3xl px-5 py-8 sm:px-8">
    <a routerLink="/me/self-checks" class="font-bold text-brand-700">← My Self-Checks</a>
    @if (loading()) {
      <p role="status" class="mt-6 rounded-2xl border bg-white p-6">Loading your Self-Check…</p>
    } @else if (error()) {
      <div role="alert" class="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
        <p>We couldn't load this Self-Check.</p>
        <button type="button" (click)="load()" class="mt-3 font-bold text-brand-700 underline">
          Try again
        </button>
      </div>
    } @else if (detail(); as check) {
      <header class="mt-6 rounded-2xl bg-brand-900 p-6 text-white">
        <p class="text-sm font-bold uppercase text-brand-100">Guided Self-Check</p>
        <h1 class="mt-2 text-3xl font-bold">Your health questions</h1>
        <p class="mt-2 break-all text-sm text-brand-100">{{ check.reference }}</p>
      </header>
      @if (check.workflowStatus === 'COMPLETED') {
        <section class="mt-6 rounded-2xl border bg-white p-6" aria-labelledby="result-heading">
          <h2 id="result-heading" class="text-2xl font-bold">{{ resultTitle(check) }}</h2>
          <p class="mt-3 text-slate-700">{{ resultMessage(check) }}</p>
          @if (check.classificationStatus === 'CONFIGURATION_REQUIRED') {
            <p class="mt-4 rounded-xl bg-slate-100 p-4">
              Your answers have been saved and are awaiting clinical processing.
            </p>
          }
          @if (check.professionalReview?.required) {
            <p class="mt-4 rounded-xl bg-amber-50 p-4">
              <strong>Professional review</strong
              ><span class="mt-1 block">{{ reviewLabel(check.professionalReview?.status) }}</span>
            </p>
          }
          @if (
            check.nextAction?.type === 'REQUEST_PROFESSIONAL_CONTACT' && check.professionalContact;
            as contact
          ) {
            <section class="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-4">
              <h3 class="font-bold">Professional contact requested</h3>
              <p class="mt-1">{{ contactLabel(contact.status) }}</p>
              @if (contact.status === 'COMPLETED' && contact.outcome) {
                <p class="mt-2"><strong>Outcome:</strong> {{ contactOutcome(contact.outcome) }}</p>
              }
            </section>
          }
          @if (check.classification?.classification === 'AMBER' && check.analysis) {
            <p class="mt-4 rounded-xl bg-amber-50 p-4">
              <strong>AMBER Self-Check analysis</strong>
              <span class="mt-1 block">{{ analysisLabel(check.analysis.status) }}</span>
              @if (check.analysis.humanReviewRecommended) {
                <span class="mt-1 block"
                  >Additional human review has been recommended internally.</span
                >
              }
            </p>
          }
          @if (check.classification?.classification === 'RED') {
            <section class="mt-4 rounded-xl border-2 border-red-500 bg-red-50 p-4">
              <h3 class="font-bold text-red-950">Urgent Self-Check guidance</h3>
              <p class="mt-2">{{ check.classification?.message }}</p>
            </section>
            @if (check.professionalReview?.status === 'COMPLETED') {
              <section class="mt-4 rounded-xl border bg-white p-4">
                <h3 class="font-bold">Professional recommended next step</h3>
                <p class="mt-2">
                  {{
                    check.professionalReview?.patientGuidance ||
                      'Follow the recommended next action below.'
                  }}
                </p>
              </section>
            }
          }
          @if (check.nextAction; as action) {
            <section class="mt-5 rounded-xl border border-brand-200 bg-brand-50 p-5">
              <h3 class="font-bold">{{ action.title }}</h3>
              <p class="mt-2">{{ action.message }}</p>
              @if (action.cta.type === 'HEALTH_CHECK_PACKAGE') {
                <a
                  routerLink="/me/book"
                  [queryParams]="{ package: action.cta.packageCode }"
                  class="mt-4 inline-flex rounded-lg bg-brand-700 px-4 py-3 font-bold text-white"
                  >View Health Checks</a
                >
              } @else if (action.cta.type === 'FIND_CARE') {
                <a
                  routerLink="/request-care"
                  class="mt-4 inline-flex rounded-lg bg-red-700 px-4 py-3 font-bold text-white"
                  >Find care</a
                >
              } @else if (action.cta.type === 'URGENT_ASSESSMENT') {
                <a
                  routerLink="/request-care"
                  class="mt-4 inline-flex rounded-lg bg-red-800 px-4 py-3 font-bold text-white"
                  >Find urgent assessment options</a
                >
              } @else if (action.cta.type === 'PROFESSIONAL_CONTACT') {
                <p class="mt-4 rounded-lg bg-white p-3 text-sm">
                  Professional contact has been recommended. An in-app contact-request workflow is
                  not currently available; do not delay seeking care if you are concerned.
                </p>
              } @else if (action.cta.type === 'NONE') {
                <a
                  routerLink="/me/health-passport"
                  class="mt-4 inline-flex rounded-lg bg-brand-700 px-4 py-3 font-bold text-white"
                  >View Health Passport</a
                >
              }
            </section>
          }
          <p class="mt-5 text-sm text-slate-600">A Guided Self-Check is not a diagnosis.</p>
        </section>
      } @else if (!funded(check)) {
        <section class="mt-6 rounded-2xl border bg-white p-6">
          <h2 class="text-2xl font-bold">Payment</h2>
          @if (funding(); as f) {
            <p class="mt-3">
              Self-Check price: <strong>{{ money(f.amountMinor, f.currency) }}</strong>
            </p>
            <p class="mt-2 text-slate-600">Payment status: {{ fundingLabel(f.fundingStatus) }}</p>
            <button
              type="button"
              (click)="pay()"
              [disabled]="busy()"
              class="mt-5 min-h-12 rounded-xl bg-brand-700 px-6 font-bold text-white disabled:opacity-50"
            >
              {{
                busy()
                  ? 'Checking payment…'
                  : f.fundingStatus === 'PAYMENT_PENDING'
                    ? 'Verify or continue payment'
                    : 'Pay securely'
              }}</button
            ><button
              type="button"
              (click)="verify()"
              [disabled]="busy()"
              class="ml-3 mt-5 min-h-12 rounded-xl border px-5 font-bold disabled:opacity-50"
            >
              Check status
            </button>
          }
          @if (actionError()) {
            <p role="alert" class="mt-4 text-red-800">{{ actionError() }}</p>
          }
          <p class="mt-4 text-sm text-slate-600">
            Your questionnaire becomes available only after SmartClinic confirms payment.
          </p>
        </section>
      } @else if (questionnaire(); as q) {
        <section class="mt-6 rounded-2xl border bg-white p-6 sm:p-8">
          <div class="flex items-center justify-between gap-4">
            <p class="font-bold">Question {{ index() + 1 }} of {{ questions().length }}</p>
            <p class="text-sm">{{ q.progress.percentage }}% complete</p>
          </div>
          <div class="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div class="h-full bg-brand-600" [style.width.%]="q.progress.percentage"></div>
          </div>
          @if (current(); as question) {
            <fieldset class="mt-8">
              <legend class="text-2xl font-bold">
                {{ question.text }}
                @if (question.required) {
                  <span class="text-red-700">*</span>
                }
              </legend>
              @if (question.helperText) {
                <p class="mt-2 text-slate-600">{{ question.helperText }}</p>
              }
              @switch (question.type) {
                @case ('SINGLE_CHOICE') {
                  @for (option of question.options || []; track option) {
                    <label
                      class="mt-3 flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-4"
                      ><input
                        type="radio"
                        name="single-answer"
                        [checked]="value() === option"
                        (change)="value.set(option)"
                      /><span>{{ option }}</span></label
                    >
                  }
                }
                @case ('MULTI_CHOICE') {
                  @for (option of question.options || []; track option) {
                    <label
                      class="mt-3 flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-4"
                      ><input
                        type="checkbox"
                        [checked]="selected(option)"
                        (change)="toggle(option)"
                      /><span>{{ option }}</span></label
                    >
                  }
                }
                @case ('BOOLEAN') {
                  <div class="mt-4 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      (click)="value.set(true)"
                      class="min-h-12 rounded-xl border p-3"
                      [class.bg-brand-100]="value() === true"
                    >
                      Yes</button
                    ><button
                      type="button"
                      (click)="value.set(false)"
                      class="min-h-12 rounded-xl border p-3"
                      [class.bg-brand-100]="value() === false"
                    >
                      No
                    </button>
                  </div>
                }
                @case ('SHORT_TEXT') {
                  <label class="mt-4 block font-semibold"
                    >Your answer<input
                      [(ngModel)]="textValue"
                      type="text"
                      class="mt-2 w-full rounded-xl border p-3 text-base"
                      placeholder="Add what you know"
                  /></label>
                }
                @case ('LONG_TEXT') {
                  <label class="mt-4 block font-semibold"
                    >Your answer<textarea
                      [(ngModel)]="textValue"
                      rows="5"
                      class="mt-2 w-full rounded-xl border p-3 text-base"
                      placeholder="Share relevant health information"
                    ></textarea>
                  </label>
                }
                @case ('NUMBER') {
                  <label class="mt-4 block font-semibold"
                    >Value<input
                      [(ngModel)]="numberValue"
                      type="number"
                      class="mt-2 w-full rounded-xl border p-3 text-base"
                      placeholder="e.g. 72"
                  /></label>
                }
                @case ('BLOOD_PRESSURE') {
                  <p class="mt-3 text-sm text-slate-600">
                    If you know a recent reading, add it here. Choose “I don't know” if you're
                    unsure.
                  </p>
                  <div class="mt-4 grid gap-4 sm:grid-cols-2">
                    <label class="font-semibold"
                      >Systolic<input
                        [(ngModel)]="systolic"
                        type="number"
                        class="mt-2 w-full rounded-xl border p-3 text-base"
                        placeholder="e.g. 120" /></label
                    ><label class="font-semibold"
                      >Diastolic<input
                        [(ngModel)]="diastolic"
                        type="number"
                        class="mt-2 w-full rounded-xl border p-3 text-base"
                        placeholder="e.g. 80"
                    /></label>
                  </div>
                  <p class="mt-2 text-sm">Unit: mmHg</p>
                }
                @case ('BLOOD_GLUCOSE') {
                  <div class="mt-4 grid gap-4 sm:grid-cols-2">
                    <label class="font-semibold"
                      >Blood glucose<input
                        [(ngModel)]="glucose"
                        type="number"
                        step="any"
                        class="mt-2 w-full rounded-xl border p-3 text-base"
                        placeholder="e.g. 5.5" /></label
                    ><label class="font-semibold"
                      >Unit<select
                        [(ngModel)]="glucoseUnit"
                        class="mt-2 w-full rounded-xl border p-3"
                      >
                        <option value="mmol/L">mmol/L</option>
                        <option value="mg/dL">mg/dL</option>
                      </select></label
                    >
                  </div>
                }
              }
              @if (question.allowsDontKnow) {
                <button
                  type="button"
                  (click)="saveDontKnow()"
                  [disabled]="busy()"
                  class="mt-5 font-bold text-brand-700 underline"
                >
                  I don't know
                </button>
              }
            </fieldset>
            <div class="mt-8 flex flex-wrap justify-between gap-3 border-t pt-5">
              <button
                type="button"
                (click)="back()"
                [disabled]="index() === 0 || busy()"
                class="min-h-12 rounded-xl border px-5 font-bold disabled:opacity-40"
              >
                Back</button
              ><button
                type="button"
                (click)="continue()"
                [disabled]="busy()"
                class="min-h-12 rounded-xl bg-brand-700 px-6 font-bold text-white disabled:opacity-50"
              >
                {{
                  busy()
                    ? 'Saving…'
                    : index() === questions().length - 1
                      ? 'Complete Self-Check'
                      : 'Save and continue'
                }}
              </button>
            </div>
            @if (actionError()) {
              <p role="alert" class="mt-4 text-red-800">{{ actionError() }}</p>
            }
          }
        </section>
      } @else {
        <section class="mt-6 rounded-2xl border bg-white p-6">
          <h2 class="text-xl font-bold">Ready to begin?</h2>
          <p class="mt-2 text-slate-600">
            Your answers are saved securely so you can resume later.
          </p>
          <button
            type="button"
            (click)="start()"
            [disabled]="busy()"
            class="mt-5 rounded-xl bg-brand-700 px-6 py-3 font-bold text-white"
          >
            {{ busy() ? 'Opening questionnaire…' : 'Start questionnaire' }}
          </button>
          @if (actionError()) {
            <p role="alert" class="mt-3 text-red-800">{{ actionError() }}</p>
          }
        </section>
      }
    }
  </main>`,
})
export class GuidedSelfCheckPageComponent {
  private readonly api = inject(GuidedSelfChecksApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly reference = this.route.snapshot.paramMap.get('reference') ?? '';
  readonly detail = signal<GuidedSelfCheckDetail | null>(null);
  readonly funding = signal<GuidedSelfCheckFunding | null>(null);
  readonly questionnaire = signal<GuidedSelfCheckQuestionnaire | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly busy = signal(false);
  readonly actionError = signal('');
  readonly index = signal(0);
  readonly value = signal<GuidedSelfCheckValue>(null);
  textValue = '';
  numberValue: number | null = null;
  systolic: number | null = null;
  diastolic: number | null = null;
  glucose: number | null = null;
  glucoseUnit: 'mmol/L' | 'mg/dL' = 'mmol/L';
  readonly questions = computed(
    () => this.questionnaire()?.groups.flatMap((g) => g.questions.filter((q) => q.visible)) ?? [],
  );
  readonly current = computed(() => this.questions()[this.index()] ?? null);
  readonly money = formatEarningMoney;
  private popup = new PaystackPop();
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.error.set(false);
    this.api
      .get(this.reference)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (v) => {
          this.detail.set(v);
          if (!this.funded(v)) this.loadFunding();
          else if (v.workflowStatus === 'IN_PROGRESS') this.loadQuestionnaire();
        },
        error: () => this.error.set(true),
      });
  }
  funded(v: GuidedSelfCheckDetail) {
    return v.fundingStatus === 'PAID' || v.fundingStatus === 'SATISFIED_FREE';
  }
  loadFunding() {
    this.api.funding(this.reference).subscribe({
      next: (v) => this.funding.set(v),
      error: () => this.actionError.set('We could not load payment status. Please try again.'),
    });
  }
  pay() {
    if (this.busy()) return;
    this.busy.set(true);
    this.actionError.set('');
    this.api
      .initializeFunding(this.reference)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (v) => {
          this.funding.set(v);
          if (v.paid) {
            this.load();
            return;
          }
          if (v.accessCode)
            this.popup.resumeTransaction(v.accessCode, {
              onSuccess: () => this.verify(),
              onError: () => this.actionError.set('Payment was not completed. You can try again.'),
            });
          else this.actionError.set('Secure payment could not be opened. Please try again.');
        },
        error: () => this.actionError.set('We could not start payment. Please try again.'),
      });
  }
  verify() {
    if (this.busy()) return;
    this.busy.set(true);
    this.actionError.set('');
    this.api
      .verifyFunding(this.reference)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (v) => {
          this.funding.set(v);
          if (v.paid) this.load();
          else this.actionError.set('Payment is not confirmed yet. Please check again shortly.');
        },
        error: () => this.actionError.set('We could not verify payment yet. Please try again.'),
      });
  }
  start() {
    this.busy.set(true);
    this.actionError.set('');
    this.api
      .start(this.reference)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (q) => {
          this.questionnaire.set(q);
          this.setIndex(0);
        },
        error: () =>
          this.actionError.set('The questionnaire could not be started. Please try again.'),
      });
  }
  loadQuestionnaire() {
    this.api.questionnaire(this.reference).subscribe({
      next: (q) => {
        this.questionnaire.set(q);
        const first = q.groups.flatMap((g) => g.questions).findIndex((x) => x.visible && !x.answer);
        this.setIndex(Math.max(0, first));
      },
      error: () => this.actionError.set('The questionnaire could not be loaded. Please try again.'),
    });
  }
  setIndex(i: number) {
    this.index.set(Math.min(Math.max(i, 0), Math.max(this.questions().length - 1, 0)));
    this.populate(this.current());
  }
  populate(q: GuidedSelfCheckQuestion | null) {
    const v = q?.answer?.value ?? null;
    this.value.set(v);
    this.textValue = typeof v === 'string' ? v : '';
    this.numberValue = typeof v === 'number' ? v : null;
    this.systolic = typeof v === 'object' && v !== null && 'systolic' in v ? v.systolic : null;
    this.diastolic = typeof v === 'object' && v !== null && 'diastolic' in v ? v.diastolic : null;
    this.glucose = typeof v === 'object' && v !== null && 'value' in v ? Number(v.value) : null;
    if (
      typeof v === 'object' &&
      v !== null &&
      'unit' in v &&
      (v.unit === 'mmol/L' || v.unit === 'mg/dL')
    )
      this.glucoseUnit = v.unit;
  }
  selected(v: string) {
    const current = this.value();
    return Array.isArray(current) && current.includes(v);
  }
  toggle(v: string) {
    const a = Array.isArray(this.value()) ? [...(this.value() as string[])] : [];
    this.value.set(a.includes(v) ? a.filter((x) => x !== v) : [...a, v]);
  }
  answer(q: GuidedSelfCheckQuestion): GuidedSelfCheckValue {
    if (q.type === 'SHORT_TEXT' || q.type === 'LONG_TEXT') return this.textValue.trim();
    if (q.type === 'NUMBER') return this.numberValue;
    if (q.type === 'BLOOD_PRESSURE')
      return this.systolic !== null && this.diastolic !== null
        ? { systolic: this.systolic, diastolic: this.diastolic, unit: 'mmHg' }
        : null;
    if (q.type === 'BLOOD_GLUCOSE')
      return this.glucose !== null ? { value: this.glucose, unit: this.glucoseUnit } : null;
    return this.value();
  }
  continue() {
    const q = this.current();
    if (!q) return;
    const v = this.answer(q);
    if (v === null || v === '' || (Array.isArray(v) && !v.length)) {
      this.actionError.set(
        q.required
          ? 'Answer this question or choose “I don’t know” when available.'
          : 'Add an answer before continuing.',
      );
      return;
    }
    this.save({ state: 'KNOWN', value: v });
  }
  saveDontKnow() {
    this.save({ state: 'DONT_KNOW' });
  }
  private save(payload: { state: 'KNOWN' | 'DONT_KNOW'; value?: GuidedSelfCheckValue }) {
    const q = this.current();
    if (!q || this.busy()) return;
    this.busy.set(true);
    this.actionError.set('');
    const last = this.index() === this.questions().length - 1;
    this.api
      .saveAnswer(this.reference, q.key, payload)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (projection) => {
          this.questionnaire.set(projection);
          if (last) this.finish();
          else this.setIndex(Math.min(this.index() + 1, this.questions().length - 1));
        },
        error: () =>
          this.actionError.set(
            'Your answer could not be saved. It is still shown here so you can try again.',
          ),
      });
  }
  finish() {
    this.busy.set(true);
    this.api
      .complete(this.reference)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: () => this.load(),
        error: (e: { error?: { missingQuestionKeys?: string[] } }) => {
          const missing = e.error?.missingQuestionKeys ?? [];
          this.actionError.set(
            missing.length
              ? 'Please complete the remaining required questions.'
              : 'The Self-Check could not be completed. Your saved answers are safe.',
          );
          if (missing.length) {
            const i = this.questions().findIndex((q) => missing.includes(q.key));
            if (i >= 0) this.setIndex(i);
          }
        },
      });
  }
  back() {
    this.setIndex(this.index() - 1);
  }
  fundingLabel(v: string) {
    return (
      (
        {
          UNPAID: 'Payment required',
          PAYMENT_PENDING: 'Payment pending',
          PAID: 'Paid',
          SATISFIED_FREE: 'No payment required',
        } as Record<string, string>
      )[v] ?? v
    );
  }
  resultTitle(v: GuidedSelfCheckDetail) {
    return v.classification?.title ?? v.title ?? 'Your Self-Check has been received.';
  }
  resultMessage(v: GuidedSelfCheckDetail) {
    return v.classification?.message ?? v.message ?? 'Your answers have been saved.';
  }
  reviewLabel(v: string | null | undefined) {
    return v === 'COMPLETED'
      ? 'Your clinical review is complete.'
      : v === 'IN_REVIEW'
        ? 'A SmartClinic clinical professional is reviewing your Self-Check.'
        : 'Your Self-Check has been queued for review by the SmartClinic clinical team.';
  }
  contactLabel(v: string) {
    return (
      (
        {
          PENDING: 'SmartClinic is preparing to contact you.',
          ACKNOWLEDGED: 'SmartClinic has acknowledged your contact request.',
          IN_PROGRESS: 'SmartClinic is working on your contact request.',
          COMPLETED: 'Professional contact work is complete.',
          CANCELLED: 'This contact request is no longer active.',
        } as Record<string, string>
      )[v] ?? 'Contact status is available.'
    );
  }
  contactOutcome(v: string) {
    return (
      (
        {
          CONTACTED: 'Contacted',
          UNREACHABLE: 'SmartClinic was unable to reach you.',
          PATIENT_DECLINED: 'You declined contact.',
          REFERRED_TO_CLINICAL_REVIEW: 'Referred for clinical review',
        } as Record<string, string>
      )[v] ?? v
    );
  }
  analysisLabel(v: string) {
    return (
      (
        {
          PENDING: 'Analysis is awaiting processing.',
          PROCESSING: 'Analysis is in progress.',
          COMPLETED: 'Analysis is complete. Your recommended next step is shown below.',
          FAILED: 'Analysis could not be completed yet. Your AMBER classification is unchanged.',
        } as Record<string, string>
      )[v] ?? 'Analysis status is available.'
    );
  }
}

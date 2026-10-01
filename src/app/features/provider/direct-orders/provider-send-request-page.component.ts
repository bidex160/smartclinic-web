import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { DirectOrder, DirectOrderPatient, DirectOrderType } from '../../../core/models/direct-order.model';
import { DirectOrdersApiService } from '../../../core/services/direct-orders-api.service';
import { QrCodeComponent } from '../../../shared/components/qr-code.component';
import { QrScannerComponent, qrScanningSupported } from '../../../shared/components/qr-scanner.component';
import {
  COMMON_DURATIONS,
  COMMON_FREQUENCIES,
  COMMON_IMAGING,
  COMMON_LAB_TESTS,
  COMMON_MEDICINES,
  normaliseSmartClinicId,
} from './direct-order-quick-picks';

interface TestChoice {
  readonly name: string;
  readonly instructions: string;
}

const TYPE_OPTIONS: readonly { readonly type: DirectOrderType; readonly title: string; readonly hint: string }[] = [
  { type: 'PRESCRIPTION', title: 'Prescription', hint: 'Medicines from any SmartClinic pharmacy' },
  { type: 'LABORATORY', title: 'Lab tests', hint: 'Blood, urine and other laboratory tests' },
  { type: 'IMAGING', title: 'Imaging', hint: 'X-ray, ultrasound, CT and MRI' },
  { type: 'REFERRAL', title: 'Specialist referral', hint: 'Refer to a specialist service on SmartClinic' },
];

const SPECIALTIES = [
  'Cardiology', 'Obstetrics & gynaecology', 'Paediatrics', 'Orthopaedics', 'Ear, nose & throat', 'Ophthalmology',
  'Dermatology', 'Psychiatry', 'Neurology', 'Urology', 'General surgery', 'Endocrinology',
] as const;

/**
 * Send a prescription or test request to any patient by their SmartClinic ID,
 * whatever records system (or paper) the clinic uses. The patient then picks
 * a pharmacy or lab on SmartClinic, pays, and results come back here.
 */
@Component({
  selector: 'app-provider-send-request-page',
  imports: [ReactiveFormsModule, RouterLink, QrCodeComponent, QrScannerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
      @if (sent(); as order) {
        <section class="sc-card overflow-hidden" aria-labelledby="sent-heading" data-sent>
          <div class="bg-leaf-700 p-6 text-white sm:p-8">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-ochre-300">Sent</p>
            <h1 id="sent-heading" class="font-display mt-2 text-3xl font-semibold">{{ typeTitle(order.type) }} sent to {{ patient()?.displayName }}</h1>
            <p class="mt-2 text-white/85">They’ll get a notification to choose a {{ destination(order.type) }} and pay there. You’ll see each step in Sent requests{{ order.type === 'PRESCRIPTION' ? '' : ', and results when they’re ready' }}.</p>
          </div>
          <div class="grid gap-3 p-6 sm:grid-cols-3 sm:p-8">
            <a [href]="whatsAppLink(order)" target="_blank" rel="noopener" class="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-leaf-700 px-5 text-sm font-semibold text-white hover:bg-ink" data-whatsapp>Send on WhatsApp</a>
            <button type="button" (click)="printSlip()" class="min-h-12 rounded-full border border-ink/15 bg-white px-5 text-sm font-semibold text-ink hover:bg-sand-50">Print slip</button>
            <button type="button" (click)="startAgain()" class="min-h-12 rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-brand-900">New request</button>
          </div>
          <p class="px-6 pb-6 text-sm text-ink-muted sm:px-8">Reference <span class="font-mono font-semibold text-ink">{{ order.reference }}</span> · <a routerLink="/provider/sent-requests" class="font-semibold text-brand-700 underline underline-offset-2">See all sent requests</a></p>
        </section>

        <!-- Printed on paper for patients who prefer it; hidden on screen. -->
        <article class="sc-print-slip hidden bg-white p-10 text-black" aria-hidden="true">
          <div class="flex items-start justify-between gap-6 border-b border-black/20 pb-4">
            <div>
              <p class="text-2xl font-bold">{{ typeTitle(order.type) }}</p>
              <p class="mt-1">{{ order.orderingProvider.displayName }} · {{ today }}</p>
            </div>
            <div class="w-32"><app-qr-code [value]="patientLink(order)" label="Open this request on SmartClinic" /></div>
          </div>
          <p class="mt-4"><strong>Patient:</strong> {{ patient()?.displayName }} · SmartClinic ID {{ patient()?.patientReference }}</p>
          <ol class="mt-4 list-decimal pl-6">
            @for (item of order.prescription?.items ?? []; track item.sortOrder) {
              <li class="mt-1">{{ item.medicationName }} {{ item.strength ?? '' }} — {{ item.dosage }}, {{ item.frequency }}{{ item.duration ? ', ' + item.duration : '' }}</li>
            }
            @for (item of order.diagnosticItems ?? []; track item.sortOrder) {
              <li class="mt-1">{{ item.name }}{{ item.instructions ? ' — ' + item.instructions : '' }}</li>
            }
          </ol>
          @if (order.clinicalNote) { <p class="mt-4"><strong>Clinical note:</strong> {{ order.clinicalNote }}</p> }
          <p class="mt-6 border-t border-black/20 pt-4 text-sm">Scan the code or open SmartClinic → Tests & referrals to choose a {{ destination(order.type) }}. Reference {{ order.reference }}.</p>
        </article>
      } @else {
        <a routerLink="/provider/dashboard" class="text-sm font-semibold text-brand-700">← Dashboard</a>
        <header class="mt-3">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">New request</p>
          <h1 class="font-display mt-1 text-3xl font-semibold text-ink sm:text-4xl">Send a prescription or test</h1>
          <p class="mt-2 text-ink-soft">Works for any patient with a SmartClinic ID — no appointment or records system needed. They choose a pharmacy or lab near them.</p>
        </header>

        <!-- 1. Patient -->
        <section class="sc-card mt-6 p-5 sm:p-6" aria-labelledby="who-heading">
          <h2 id="who-heading" class="font-display text-xl font-semibold text-ink"><span class="text-brand-700">1.</span> Who is it for?</h2>
          @if (patient(); as p) {
            <div class="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-leaf-50 p-4 ring-1 ring-leaf-100" data-patient-confirmed>
              <div class="min-w-0">
                <p class="font-semibold text-ink">{{ p.displayName }}</p>
                <p class="font-mono text-sm text-ink-soft">{{ p.patientReference }}</p>
              </div>
              <button type="button" (click)="clearPatient()" class="min-h-11 rounded-full px-4 text-sm font-semibold text-brand-700 hover:bg-white">Change</button>
            </div>
            <p class="mt-2 text-xs text-ink-muted">Check this is the person in front of you. You won’t see their records — only what you send.</p>
          } @else if (scanning()) {
            <div class="mt-4 max-w-sm">
              <app-qr-scanner (scanned)="onScanned($event)" (cancelled)="scanning.set(false)" />
            </div>
          } @else {
            <form (submit)="$event.preventDefault(); lookUp()" class="mt-4 flex flex-col gap-2 sm:flex-row" novalidate>
              <label class="min-w-0 flex-1 text-sm font-medium text-ink-soft">SmartClinic ID
                <input [formControl]="idControl" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="SCP-ABCD-1234" class="mt-1 min-h-12 w-full rounded-xl border border-ink/15 bg-white px-3 font-mono uppercase tracking-wider text-ink" />
              </label>
              <div class="flex gap-2 sm:self-end">
                <button type="submit" [disabled]="lookingUp()" class="min-h-12 flex-1 rounded-full bg-ink px-6 font-semibold text-white hover:bg-brand-900 disabled:opacity-50 sm:flex-none">{{ lookingUp() ? 'Checking…' : 'Find' }}</button>
                @if (canScan) {
                  <button type="button" (click)="scanning.set(true)" class="min-h-12 rounded-full border border-ink/15 bg-white px-5 font-semibold text-ink hover:bg-sand-50" data-scan>Scan card</button>
                }
              </div>
            </form>
            @if (lookupError()) { <p role="alert" class="mt-2 text-sm font-semibold text-clay-700">{{ lookupError() }}</p> }
            <p class="mt-2 text-xs text-ink-muted">The ID is on the patient’s SmartClinic card, in their app under Me → Card.</p>
          }
        </section>

        <!-- 2. Type -->
        <section class="sc-card mt-4 p-5 sm:p-6 {{ patient() ? '' : 'opacity-60' }}" aria-labelledby="what-heading">
          <h2 id="what-heading" class="font-display text-xl font-semibold text-ink"><span class="text-brand-700">2.</span> What are you sending?</h2>
          <div class="mt-4 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-labelledby="what-heading">
            @for (option of typeOptions; track option.type) {
              <button type="button" role="radio" [attr.aria-checked]="type() === option.type" [disabled]="!patient()" (click)="chooseType(option.type)"
                class="rounded-2xl p-4 text-left ring-1 transition disabled:cursor-not-allowed {{ type() === option.type ? 'bg-brand-700 text-white ring-brand-700' : 'bg-white text-ink ring-ink/10 hover:ring-brand-300' }}">
                <span class="block font-semibold">{{ option.title }}</span>
                <span class="mt-1 block text-xs {{ type() === option.type ? 'text-white/80' : 'text-ink-muted' }}">{{ option.hint }}</span>
              </button>
            }
          </div>
        </section>

        <!-- 3. Items -->
        @if (patient() && type(); as t) {
          <section class="sc-card mt-4 p-5 sm:p-6" aria-labelledby="items-heading">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <h2 id="items-heading" class="font-display text-xl font-semibold text-ink"><span class="text-brand-700">3.</span> {{ t === 'PRESCRIPTION' ? 'Medicines' : t === 'LABORATORY' ? 'Tests' : 'Studies' }}</h2>
              @if (recentOfType().length) {
                <label class="w-full min-w-0 text-sm text-ink-soft sm:w-auto sm:max-w-xs">
                  <span class="sr-only">Copy from a recent request</span>
                  <select (change)="copyFrom($any($event.target).value); $any($event.target).value = ''" class="min-h-10 w-full max-w-full truncate rounded-full border border-ink/15 bg-white px-3 text-sm font-semibold text-ink">
                    <option value="">Copy a recent request…</option>
                    @for (recent of recentOfType(); track recent.reference) {
                      <option [value]="recent.reference">{{ summary(recent) }}</option>
                    }
                  </select>
                </label>
              }
            </div>

            @if (t === 'PRESCRIPTION') {
              <datalist id="common-medicines">
                @for (name of commonMedicines; track name) { <option [value]="name"></option> }
              </datalist>
              <div [formGroup]="prescriptionForm" class="mt-4 grid gap-4">
                <div formArrayName="items" class="grid gap-4">
                  @for (row of medicines.controls; track row; let i = $index) {
                    <fieldset [formGroupName]="i" class="grid gap-3 rounded-2xl bg-sand-50 p-4 ring-1 ring-ink/[0.06] sm:grid-cols-6" data-medicine-row>
                      <legend class="sr-only">Medicine {{ i + 1 }}</legend>
                      <label class="text-sm font-medium text-ink-soft sm:col-span-4">Medicine
                        <input formControlName="medicationName" list="common-medicines" maxlength="200" class="mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink" />
                      </label>
                      <label class="text-sm font-medium text-ink-soft sm:col-span-2">Strength
                        <input formControlName="strength" maxlength="120" placeholder="e.g. 500 mg" class="mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink" />
                      </label>
                      <label class="text-sm font-medium text-ink-soft sm:col-span-2">Dose
                        <input formControlName="dosage" maxlength="200" placeholder="e.g. 1 tablet" class="mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink" />
                      </label>
                      <label class="text-sm font-medium text-ink-soft sm:col-span-2">How often
                        <select formControlName="frequency" class="mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink">
                          <option value="">Choose…</option>
                          @for (f of frequencies; track f) { <option [value]="f">{{ f }}</option> }
                        </select>
                      </label>
                      <label class="text-sm font-medium text-ink-soft sm:col-span-2">For how long
                        <select formControlName="duration" class="mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink">
                          <option value="">—</option>
                          @for (d of durations; track d) { <option [value]="d">{{ d }}</option> }
                        </select>
                      </label>
                      <label class="text-sm font-medium text-ink-soft sm:col-span-2">Quantity
                        <input formControlName="quantity" maxlength="120" placeholder="e.g. 24 tablets" class="mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink" />
                      </label>
                      <label class="text-sm font-medium text-ink-soft sm:col-span-4">Instructions
                        <input formControlName="instructions" maxlength="500" placeholder="e.g. After food" class="mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink" />
                      </label>
                      @if (medicines.length > 1) {
                        <button type="button" (click)="removeMedicine(i)" class="min-h-11 self-end rounded-full px-3 text-sm font-semibold text-clay-700 hover:bg-white sm:col-span-6 sm:justify-self-end">Remove</button>
                      }
                    </fieldset>
                  }
                </div>
                <button type="button" (click)="addMedicine()" class="min-h-11 justify-self-start rounded-full border border-dashed border-brand-300 px-5 text-sm font-semibold text-brand-700 hover:bg-brand-50">+ Add another medicine</button>
              </div>
            } @else if (t === 'REFERRAL') {
              <p class="mt-1 text-sm text-ink-muted">Pick the specialty, then say why. The patient chooses a specialist service near them.</p>
              <div class="mt-3 flex flex-wrap gap-2" aria-label="Specialty">
                @for (name of specialties; track name) {
                  <button type="button" (click)="chooseSpecialty(name)" class="min-h-10 rounded-full bg-white px-4 text-sm font-semibold text-ink ring-1 ring-ink/10 hover:ring-brand-300">{{ name }}</button>
                }
              </div>
            } @else {
              <div class="mt-4 flex flex-wrap gap-2" aria-label="Common choices">
                @for (name of visiblePicks(); track name) {
                  <button type="button" (click)="toggleTest(name)" [attr.aria-pressed]="isChosen(name)"
                    class="min-h-10 rounded-full px-4 text-sm font-semibold ring-1 transition {{ isChosen(name) ? 'bg-brand-700 text-white ring-brand-700' : 'bg-white text-ink ring-ink/10 hover:ring-brand-300' }}">{{ isChosen(name) ? '✓ ' : '' }}{{ name }}</button>
                }
              </div>
              @if (!showAllPicks() && quickPicks().length > visiblePicks().length) {
                <button type="button" (click)="showAllPicks.set(true)" class="mt-2 min-h-10 rounded-full px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">Show all {{ quickPicks().length }} common {{ t === 'LABORATORY' ? 'tests' : 'studies' }}</button>
              }
              <form (submit)="$event.preventDefault(); addCustomTest()" class="mt-3 flex gap-2" novalidate>
                <label class="min-w-0 flex-1"><span class="sr-only">Another {{ t === 'LABORATORY' ? 'test' : 'study' }}</span>
                  <input [formControl]="customTest" maxlength="200" [placeholder]="t === 'LABORATORY' ? 'Another test…' : 'Another study…'" class="min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink" />
                </label>
                <button type="submit" class="min-h-11 rounded-full border border-ink/15 bg-white px-5 text-sm font-semibold text-ink hover:bg-sand-50">Add</button>
              </form>
              @if (tests().length) {
                <ul class="mt-4 divide-y divide-ink/[0.06] rounded-2xl bg-sand-50 ring-1 ring-ink/[0.06]" data-chosen-tests>
                  @for (test of tests(); track test.name; let i = $index) {
                    <li class="grid gap-2 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                      <strong class="text-sm font-semibold text-ink">{{ test.name }}</strong>
                      <label><span class="sr-only">Instructions for {{ test.name }}</span>
                        <input [value]="test.instructions" (input)="setInstructions(i, $any($event.target).value)" maxlength="500" placeholder="Instructions (optional)" class="min-h-10 w-full rounded-lg border border-ink/15 bg-white px-3 text-sm text-ink" />
                      </label>
                      <button type="button" (click)="toggleTest(test.name)" class="min-h-10 rounded-full px-3 text-sm font-semibold text-clay-700 hover:bg-white">Remove</button>
                    </li>
                  }
                </ul>
              }
            }

            <label class="mt-5 block text-sm font-medium text-ink-soft">
              @if (t === 'REFERRAL') { Reason for referral <span class="font-normal text-ink-muted">(required)</span> } @else { Clinical note for the {{ destination(t) }} <span class="font-normal text-ink-muted">(optional)</span> }
              <textarea [formControl]="clinicalNote" rows="3" maxlength="4000" [placeholder]="t === 'REFERRAL' ? 'e.g. Cardiology: new murmur, please assess' : 'Working diagnosis, relevant history or anything they should know'" class="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-ink" data-note></textarea>
            </label>
          </section>

          <div class="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] mt-4 rounded-2xl bg-white/95 p-3 shadow-lift ring-1 ring-ink/[0.06] backdrop-blur lg:bottom-4">
            @if (sendError()) { <p role="alert" class="mb-2 text-sm font-semibold text-clay-700">{{ sendError() }}</p> }
            <button type="button" (click)="send()" [disabled]="!canSend() || sending()" class="min-h-12 w-full rounded-full bg-brand-700 px-6 font-semibold text-white hover:bg-brand-800 disabled:opacity-50" data-send>
              {{ sending() ? 'Sending…' : 'Send to ' + patient()?.displayName }}
            </button>
          </div>
        }
      }
    </main>
  `,
})
export class ProviderSendRequestPageComponent {
  private readonly api = inject(DirectOrdersApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly typeOptions = TYPE_OPTIONS;
  readonly commonMedicines = COMMON_MEDICINES;
  readonly frequencies = COMMON_FREQUENCIES;
  readonly durations = COMMON_DURATIONS;
  readonly canScan = qrScanningSupported();
  readonly today = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date());

  readonly idControl = this.fb.nonNullable.control('');
  readonly customTest = this.fb.nonNullable.control('');
  readonly clinicalNote = this.fb.nonNullable.control('', Validators.maxLength(4000));
  readonly specialties = SPECIALTIES;
  private readonly noteText = signal('');
  readonly prescriptionForm = this.fb.group({ items: this.fb.array([this.medicineRow()]) });

  readonly patient = signal<DirectOrderPatient | null>(null);
  readonly lookingUp = signal(false);
  readonly lookupError = signal('');
  readonly scanning = signal(false);
  readonly type = signal<DirectOrderType | null>(null);
  readonly tests = signal<readonly TestChoice[]>([]);
  readonly recent = signal<readonly DirectOrder[]>([]);
  readonly sending = signal(false);
  readonly sendError = signal('');
  readonly sent = signal<DirectOrder | null>(null);
  private readonly medicinesValid = signal(false);

  readonly showAllPicks = signal(false);
  readonly quickPicks = computed(() => (this.type() === 'IMAGING' ? COMMON_IMAGING : COMMON_LAB_TESTS) as readonly string[]);
  /** The first eight, plus anything already chosen, until "Show all". */
  readonly visiblePicks = computed(() => {
    const picks = this.quickPicks();
    if (this.showAllPicks()) return picks;
    return picks.filter((name, index) => index < 8 || this.tests().some((test) => test.name === name));
  });
  readonly recentOfType = computed(() => this.recent().filter((order) => order.type === this.type()).slice(0, 8));
  readonly canSend = computed(() => {
    if (!this.patient() || !this.type()) return false;
    if (this.type() === 'REFERRAL') return this.noteText().trim().length > 0;
    return this.type() === 'PRESCRIPTION' ? this.medicinesValid() : this.tests().length > 0;
  });

  constructor() {
    const subscription = this.prescriptionForm.statusChanges.subscribe(() => this.medicinesValid.set(this.prescriptionForm.valid));
    const notes = this.clinicalNote.valueChanges.subscribe((value) => this.noteText.set(value));
    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
      notes.unsubscribe();
    });
    // Recent requests power "Copy a recent request"; the page works without them.
    this.api.listSent(1, 30).subscribe({ next: (page) => this.recent.set(page.items), error: () => undefined });
  }

  get medicines(): FormArray {
    return this.prescriptionForm.controls.items;
  }

  lookUp(): void {
    const reference = normaliseSmartClinicId(this.idControl.value);
    if (!reference) {
      this.lookupError.set('Enter the 8 letters and numbers after SCP-, for example SCP-ABCD-1234.');
      return;
    }
    this.idControl.setValue(reference);
    this.lookingUp.set(true);
    this.lookupError.set('');
    this.api
      .lookupPatient(reference)
      .pipe(finalize(() => this.lookingUp.set(false)))
      .subscribe({
        next: (patient) => this.patient.set(patient),
        error: (error) =>
          this.lookupError.set(error?.status === 404 ? 'No SmartClinic patient has this ID. Check it with the patient.' : 'We couldn’t check this ID. Try again.'),
      });
  }

  onScanned(value: string): void {
    this.scanning.set(false);
    this.idControl.setValue(value);
    this.lookUp();
  }

  clearPatient(): void {
    this.patient.set(null);
    this.idControl.setValue('');
  }

  chooseType(type: DirectOrderType): void {
    if (this.type() !== type) this.tests.set([]);
    this.type.set(type);
  }

  addMedicine(): void {
    this.medicines.push(this.medicineRow());
  }

  removeMedicine(index: number): void {
    this.medicines.removeAt(index);
  }

  isChosen(name: string): boolean {
    return this.tests().some((test) => test.name === name);
  }

  toggleTest(name: string): void {
    this.tests.update((tests) => (tests.some((t) => t.name === name) ? tests.filter((t) => t.name !== name) : [...tests, { name, instructions: '' }]));
  }

  addCustomTest(): void {
    const name = this.customTest.value.trim();
    if (name && !this.isChosen(name)) this.tests.update((tests) => [...tests, { name, instructions: '' }]);
    this.customTest.setValue('');
  }

  setInstructions(index: number, instructions: string): void {
    this.tests.update((tests) => tests.map((test, i) => (i === index ? { ...test, instructions } : test)));
  }

  chooseSpecialty(name: string): void {
    const rest = this.clinicalNote.value.replace(/^[^:]*:\s*/, '');
    this.clinicalNote.setValue(`${name}: ${rest}`);
  }

  copyFrom(reference: string): void {
    const source = this.recent().find((order) => order.reference === reference);
    if (!source) return;
    if (source.type === 'REFERRAL') {
      this.clinicalNote.setValue(source.clinicalNote ?? '');
      return;
    }
    if (source.type === 'PRESCRIPTION') {
      const items = source.prescription?.items ?? [];
      if (!items.length) return;
      this.medicines.clear();
      for (const item of items) {
        this.medicines.push(
          this.medicineRow({
            medicationName: item.medicationName,
            strength: item.strength ?? '',
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration ?? '',
            quantity: item.quantity ?? '',
            instructions: item.instructions ?? '',
          }),
        );
      }
    } else {
      this.tests.set((source.diagnosticItems ?? []).map((item) => ({ name: item.name, instructions: item.instructions ?? '' })));
    }
  }

  send(): void {
    const patient = this.patient();
    const type = this.type();
    if (!patient || !type || !this.canSend() || this.sending()) return;
    const blankToNull = (value: string | null | undefined) => value?.trim() || null;
    this.sending.set(true);
    this.sendError.set('');
    this.api
      .send({
        patientReference: patient.patientReference,
        type,
        clinicalNote: blankToNull(this.clinicalNote.value),
        ...(type === 'PRESCRIPTION'
          ? {
              prescriptionItems: this.medicines.getRawValue().map((row) => ({
                medicationName: row.medicationName.trim(),
                strength: blankToNull(row.strength),
                dosage: row.dosage.trim(),
                frequency: row.frequency,
                duration: blankToNull(row.duration),
                quantity: blankToNull(row.quantity),
                route: null,
                instructions: blankToNull(row.instructions),
              })),
            }
          : type === 'REFERRAL'
            ? {}
            : { diagnosticItems: this.tests().map((test) => ({ name: test.name, instructions: blankToNull(test.instructions) })) }),
      })
      .pipe(finalize(() => this.sending.set(false)))
      .subscribe({
        next: (order) => {
          this.sent.set(order);
          window.scrollTo({ top: 0 });
          this.recent.update((recent) => [order, ...recent]);
        },
        error: (error) =>
          this.sendError.set(typeof error?.error?.message === 'string' ? error.error.message : 'This request couldn’t be sent. Check the details and try again.'),
      });
  }

  startAgain(): void {
    this.sent.set(null);
    this.clearPatient();
    this.type.set(null);
    this.tests.set([]);
    this.clinicalNote.setValue('');
    this.medicines.clear();
    this.medicines.push(this.medicineRow());
  }

  printSlip(): void {
    document.body.classList.add('sc-printing');
    try {
      window.print();
    } finally {
      document.body.classList.remove('sc-printing');
    }
  }

  patientLink(order: DirectOrder): string {
    const path = order.type === 'PRESCRIPTION' ? '/me/prescriptions/' : '/me/orders/';
    return `${window.location.origin}${path}${encodeURIComponent(order.reference)}`;
  }

  /** A message the clinician sends from their own WhatsApp. It names the request type only, never medicines or tests. */
  whatsAppLink(order: DirectOrder): string {
    const name = this.patient()?.displayName.split(' ')[0] ?? '';
    const text = `Hello ${name}, I've sent your ${this.typeTitle(order.type).toLowerCase()} to SmartClinic (ref ${order.reference}). Open it to choose a ${this.destination(order.type)} near you: ${this.patientLink(order)}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  typeTitle(type: string): string {
    return type === 'PRESCRIPTION' ? 'Prescription' : type === 'IMAGING' ? 'Imaging request' : type === 'REFERRAL' ? 'Referral' : 'Lab test request';
  }

  destination(type: string): string {
    return type === 'PRESCRIPTION' ? 'pharmacy' : type === 'IMAGING' ? 'imaging centre' : type === 'REFERRAL' ? 'specialist' : 'lab';
  }

  summary(order: DirectOrder): string {
    if (order.type === 'REFERRAL') return `${(order.clinicalNote ?? 'Referral').slice(0, 60)} · ${order.patient?.displayName ?? ''}`;
    const names = order.type === 'PRESCRIPTION' ? (order.prescription?.items ?? []).map((i) => i.medicationName) : (order.diagnosticItems ?? []).map((i) => i.name);
    const label = names.slice(0, 3).join(', ') + (names.length > 3 ? ` +${names.length - 3}` : '');
    return `${label} · ${order.patient?.displayName ?? ''}`.slice(0, 90);
  }

  private medicineRow(value?: Partial<Record<'medicationName' | 'strength' | 'dosage' | 'frequency' | 'duration' | 'quantity' | 'instructions', string>>) {
    return this.fb.nonNullable.group({
      medicationName: [value?.medicationName ?? '', [Validators.required, Validators.maxLength(200), Validators.pattern(/\S/)]],
      strength: [value?.strength ?? '', Validators.maxLength(120)],
      dosage: [value?.dosage ?? '', [Validators.required, Validators.maxLength(200), Validators.pattern(/\S/)]],
      frequency: [value?.frequency ?? '', Validators.required],
      duration: [value?.duration ?? ''],
      quantity: [value?.quantity ?? '', Validators.maxLength(120)],
      instructions: [value?.instructions ?? '', Validators.maxLength(500)],
    });
  }
}

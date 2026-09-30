import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HmoApiService } from '../../core/services/hmo-api.service';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { Hmo } from '../../core/models/hmo.model';
@Component({
  selector: 'app-patient-insurance-page',
  template: `<main class="mx-auto max-w-4xl px-5 py-10 sm:px-8">
    <p class="text-sm font-bold uppercase tracking-widest text-brand-700">Coverage</p>
    <h1 class="mt-2 text-3xl font-black text-slate-950">Health Insurance / HMO</h1>
    <p class="mt-3 max-w-2xl text-slate-600">Choose the option that describes you. SmartClinic will ask only for the details needed for that path.</p>
    <h2 class="mt-8 text-xl font-black text-brand-950">Do you already have HMO coverage?</h2>
    <section class="mt-8 grid gap-5 md:grid-cols-2">
      <button
        type="button"
        (click)="mode.set('existing')"
        [class.border-brand-700]="mode() === 'existing'"
        [class.bg-violet-50]="mode() === 'existing'"
        [attr.aria-pressed]="mode() === 'existing'"
        class="rounded-3xl border-2 border-slate-200 bg-white p-5 text-left transition hover:border-brand-600"
      >
        <div class="flex items-center gap-3"><span class="grid size-10 place-items-center rounded-xl bg-blue-100 font-black text-blue-700" aria-hidden="true">✓</span><span class="text-xl font-black">Yes, I have HMO</span></div>
        <p class="mt-2 text-sm text-slate-600">
          Add your HMO and member details so eligibility can be verified for an encounter.
        </p></button
      ><button
        type="button"
        (click)="mode.set('interest')"
        [class.border-brand-700]="mode() === 'interest'"
        [class.bg-violet-50]="mode() === 'interest'"
        [attr.aria-pressed]="mode() === 'interest'"
        class="rounded-3xl border-2 border-slate-200 bg-white p-5 text-left transition hover:border-brand-600"
      >
        <div class="flex items-center gap-3"><span class="grid size-10 place-items-center rounded-xl bg-emerald-100 font-black text-emerald-700" aria-hidden="true">+</span><span class="text-xl font-black">No, help me get coverage</span></div>
        <p class="mt-2 text-sm text-slate-600">
          Register your interest. This does not activate insurance until an HMO confirms enrollment.
        </p>
      </button>
    </section>
    @if (mode() === 'existing') {
      <section class="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
        <h2 class="text-xl font-black">Your HMO</h2>
        <label class="mt-5 block text-sm font-bold"
          >HMO<select #hmo class="mt-2 w-full rounded-xl border p-3">
            <option value="">Select HMO</option>
            @for (x of hmos(); track x.id) {
              <option [value]="x.id">{{ x.name }}</option>
            }
          </select></label
        ><label class="mt-4 block text-sm font-bold"
          >Member / Enrollee ID<input
            #member
            class="mt-2 w-full rounded-xl border p-3"
            placeholder="Enter member ID"
        /></label>
        <p class="mt-4 text-sm text-slate-600">
          Your details will remain Unverified until SmartClinic or the HMO confirms eligibility.
        </p>
        <button
          type="button"
          [disabled]="saving()"
          (click)="saveCoverage(hmo.value, member.value)"
          class="mt-5 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-50"
        >
          {{ saving() ? 'Saving…' : 'Save HMO details' }}
        </button>
        @if (feedback()) {
          <p role="status" class="mt-3 text-sm font-semibold">{{ feedback() }}</p>
        }
      </section>
    }
    @if (mode() === 'interest') {
      <section class="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
        <h2 class="text-xl font-black">Request help getting HMO coverage</h2>
        <p class="mt-3 text-slate-600">
          SmartClinic will capture an enrollment lead and route it to a participating HMO. You
          remain self-pay until enrollment is confirmed.
        </p>
        <div class="mt-5 flex gap-3 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <span aria-hidden="true">ℹ</span><span><strong>This is an enrollment request.</strong> You will continue as self-pay until an HMO confirms your coverage.</span>
        </div>
        <label class="mt-5 block text-sm font-bold"
          >Preferred HMO (optional)<select #preferredHmo class="mt-2 w-full rounded-xl border p-3">
            <option value="">No preference</option>
            @for (x of hmos(); track x.id) {
              <option [value]="x.id">{{ x.name }}</option>
            }
          </select></label
        >
        <button type="button" (click)="moreInterestDetails.update(value => !value)" [attr.aria-expanded]="moreInterestDetails()" class="mt-4 min-h-11 font-bold text-brand-700 underline">
          {{ moreInterestDetails() ? 'Hide additional details' : 'Add employer or other details (optional)' }}
        </button>
        <div class="mt-2 rounded-2xl bg-slate-50 p-4" [class.hidden]="!moreInterestDetails()">
          <label class="block text-sm font-bold">Employer or organisation (optional)<input #employer class="mt-2 w-full rounded-xl border bg-white p-3" placeholder="Organisation name" /></label>
          <label class="mt-4 block text-sm font-bold">Anything else we should know? (optional)<textarea #notes class="mt-2 w-full rounded-xl border bg-white p-3" rows="3" placeholder="Keep this brief"></textarea></label>
        </div>
        <button
          type="button"
          [disabled]="saving() || !patientReference()"
          (click)="submitInterest(preferredHmo.value, employer.value, notes.value)"
          class="mt-5 min-h-12 w-full rounded-xl bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-50 sm:w-auto"
        >
          {{ saving() ? 'Submitting…' : 'Request HMO help' }}
        </button>
        @if (feedback()) {
          <p role="status" class="mt-3 text-sm font-semibold">{{ feedback() }}</p>
        }
      </section>
    }
  </main>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientInsurancePageComponent {
  private api = inject(HmoApiService);
  private profileApi = inject(HealthCheckResultsApiService);
  patientReference = signal('');
  saving = signal(false);
  feedback = signal('');
  hmos = signal<Hmo[]>([]);
  mode = signal<'existing' | 'interest' | null>(null);
  moreInterestDetails = signal(false);
  constructor() {
    this.profileApi
      .getMyProfile()
      .subscribe({ next: (p) => this.patientReference.set(p.patient.patientReference) });
    this.api.listHmos().subscribe({ next: (v) => this.hmos.set(v) });
  }
  saveCoverage(hmoId: string, memberId: string) {
    const p = this.patientReference();
    if (!p || !hmoId || !memberId.trim()) {
      this.feedback.set('Choose an HMO and enter your member ID.');
      return;
    }
    this.saving.set(true);
    this.feedback.set('');
    this.api.addMine(p, { hmoId, memberId: memberId.trim(), memberType: 'PRINCIPAL' }).subscribe({
      next: () => {
        this.saving.set(false);
        this.feedback.set(
          'HMO details saved. Eligibility is still Unverified until it is checked for care.',
        );
      },
      error: () => {
        this.saving.set(false);
        this.feedback.set('We could not save your HMO details. Please retry.');
      },
    });
  }
  submitInterest(preferredHmoId: string, employerOrganisation: string, notes: string) {
    const patientReference = this.patientReference();
    if (!patientReference) {
      this.feedback.set('Your patient profile is still loading. Please retry.');
      return;
    }
    this.saving.set(true);
    this.feedback.set('');
    const payload = {
      ...(preferredHmoId ? { preferredHmoId } : {}),
      ...(employerOrganisation.trim() ? { employerOrganisation: employerOrganisation.trim() } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };
    this.api.createEnrollmentLead(patientReference, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.feedback.set(
          'Enrollment interest recorded. You remain self-pay and Unverified until an HMO confirms coverage.',
        );
      },
      error: () => {
        this.saving.set(false);
        this.feedback.set('We could not submit your enrollment interest. Please retry.');
      },
    });
  }
}

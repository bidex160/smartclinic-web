import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

// Documentation suggestions only; these do not advertise provider availability.
export const REFERRAL_SPECIALTIES = [
  'ENT (Ear, nose and throat)', 'Paediatrics', 'Obstetrics and gynaecology',
  'Internal medicine', 'Family medicine', 'General surgery', 'Cardiology',
  'Dermatology', 'Endocrinology', 'Gastroenterology', 'Haematology', 'Nephrology',
  'Neurology', 'Neurosurgery', 'Oncology', 'Ophthalmology (Eye care)',
  'Orthopaedics', 'Psychiatry', 'Respiratory medicine', 'Urology',
  'Dental and oral care', 'Physiotherapy and rehabilitation',
] as const;

@Component({
  selector: 'app-specialist-referral-note',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <details class="rounded-xl border border-violet-200 bg-violet-50/50 p-4">
      <summary class="min-h-11 cursor-pointer font-bold text-brand-900">Add a specialist referral note</summary>
      <p class="mt-2 text-sm text-slate-600">Document a referral in this consultation's plan. This does not send a referral or book an appointment. Save the consultation draft after adding the note.</p>
      <fieldset [formGroup]="form" [disabled]="disabled()" class="mt-4 grid gap-4">
        <legend class="sr-only">Specialist referral details</legend>
        <label class="font-semibold">Specialty
          <input formControlName="specialty" list="referral-specialties" maxlength="120" placeholder="Search, e.g. ENT, or enter another specialty" class="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3" />
          <datalist id="referral-specialties">@for (specialty of specialties; track specialty) { <option [value]="specialty"></option> }</datalist>
        </label>
        <label class="font-semibold">Hospital or specialist <span class="font-normal">(optional)</span>
          <input formControlName="destination" maxlength="200" class="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3" />
        </label>
        <label class="font-semibold">Reason for referral
          <textarea formControlName="reason" maxlength="2000" rows="3" class="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3"></textarea>
        </label>
        <label class="font-semibold">Timing and next steps <span class="font-normal">(optional)</span>
          <textarea formControlName="nextSteps" maxlength="1000" rows="2" class="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3"></textarea>
        </label>
        @if (error()) { <p role="alert" class="text-sm text-red-800">{{ error() }}</p> }
        @if (feedback()) { <p role="status" class="text-sm text-green-800">{{ feedback() }}</p> }
        <button type="button" (click)="add()" [disabled]="disabled()" class="min-h-11 rounded-xl border border-brand-300 bg-white px-4 py-2 font-bold text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700">Add to consultation plan</button>
      </fieldset>
    </details>
  `,
})
export class SpecialistReferralNoteComponent {
  readonly plan = input('');
  readonly disabled = input(false);
  readonly planChange = output<string>();
  readonly specialties = REFERRAL_SPECIALTIES;
  readonly error = signal('');
  readonly feedback = signal('');
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly form = this.fb.group({
    specialty: ['', [Validators.required, Validators.maxLength(120)]],
    destination: ['', Validators.maxLength(200)],
    reason: ['', [Validators.required, Validators.maxLength(2000)]],
    nextSteps: ['', Validators.maxLength(1000)],
  });

  add(): void {
    if (this.disabled()) return;
    this.error.set(''); this.feedback.set('');
    const value = this.form.getRawValue();
    if (this.form.invalid || !value.specialty.trim() || !value.reason.trim()) {
      this.form.markAllAsTouched();
      this.error.set('Enter a specialty and reason within the field limits.');
      return;
    }
    const note = [
      'Specialist referral note', `Specialty: ${value.specialty.trim()}`,
      ...(value.destination.trim() ? [`Destination: ${value.destination.trim()}`] : []),
      `Reason: ${value.reason.trim()}`,
      ...(value.nextSteps.trim() ? [`Timing and next steps: ${value.nextSteps.trim()}`] : []),
    ].join('\n');
    const combined = [this.plan().trimEnd(), note].filter(Boolean).join('\n\n');
    if (combined.length > 10000) {
      this.error.set('The combined consultation plan exceeds 10,000 characters. Shorten the plan or referral note before adding it.');
      return;
    }
    this.planChange.emit(combined);
    this.form.reset();
    this.feedback.set('Added to the plan below. Review it and save the consultation draft. No referral has been sent.');
  }
}

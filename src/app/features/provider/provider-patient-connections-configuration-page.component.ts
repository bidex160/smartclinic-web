import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { PatientProviderConnectionsApiService } from '../../core/services/patient-provider-connections-api.service';
import { majorToMinor, minorToMajor } from './care-money';
@Component({
  selector: 'app-provider-patient-connections-configuration-page',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-4xl px-5 py-10 sm:px-8">
    <p class="text-sm font-bold uppercase text-brand-600">Provider setup</p>
    <h1 class="mt-2 text-3xl font-bold">Patient Connections</h1>
    <p class="mt-2 text-slate-600">
      Configure how SmartClinic patients can register or link an existing local patient identity.
    </p>
    @if (loading()) {
      <p role="status" class="mt-8 rounded-2xl border p-6">Loading configuration…</p>
    } @else {
      <form
        [formGroup]="form"
        (ngSubmit)="save()"
        class="mt-8 grid gap-6 rounded-2xl border bg-white p-6"
      >
        @for (item of paths; track item.key) {
          <fieldset class="rounded-xl border p-5">
            <legend class="font-bold">{{ item.label }}</legend>
            <label class="mt-2 flex gap-3"
              ><input type="checkbox" [formControlName]="item.enabled" /> Enabled</label
            >
            @if (control(item.enabled).value) {
              <div class="mt-4 grid gap-4 sm:grid-cols-2">
                <label class="grid gap-2 font-bold"
                  >Fee<input
                    [formControlName]="item.fee"
                    inputmode="decimal"
                    placeholder="e.g. 5000"
                    class="rounded-xl border p-3"
                  /><span class="text-sm font-normal"
                    >Enter 0 for Free. Blank is invalid.</span
                  ></label
                ><label class="grid gap-2 font-bold"
                  >Currency<input
                    [formControlName]="item.currency"
                    maxlength="3"
                    placeholder="e.g. NGN"
                    class="rounded-xl border p-3 uppercase"
                />
                <span class="text-sm font-normal">&nbsp;</span>
              </label>
                
              </div>
            }
          </fieldset>
        }
        @if (error()) {
          <p role="alert" class="rounded-xl bg-red-50 p-4">{{ error() }}</p>
        }
        @if (success()) {
          <p role="status" class="rounded-xl bg-green-50 p-4">Configuration saved.</p>
        }
        <button
          type="submit"
          [disabled]="saving()"
          class="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white"
        >
          {{ saving() ? 'Saving…' : 'Save configuration' }}
        </button>
      </form>
    }
  </main>`,
})
export class ProviderPatientConnectionsConfigurationPageComponent {
  private readonly api = inject(PatientProviderConnectionsApiService);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal(false);
  readonly paths = [
    {
      key: 'new',
      label: 'New patient registration',
      enabled: 'newEnabled',
      fee: 'newFee',
      currency: 'newCurrency',
    },
    {
      key: 'existing',
      label: 'Existing patient linking',
      enabled: 'existingEnabled',
      fee: 'existingFee',
      currency: 'existingCurrency',
    },
  ] as const;
  readonly form = new FormGroup({
    newEnabled: new FormControl(false, { nonNullable: true }),
    newFee: new FormControl('', { nonNullable: true }),
    newCurrency: new FormControl('NGN', { nonNullable: true }),
    existingEnabled: new FormControl(false, { nonNullable: true }),
    existingFee: new FormControl('', { nonNullable: true }),
    existingCurrency: new FormControl('NGN', { nonNullable: true }),
  });
  constructor() {
    this.api
      .getConfiguration()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (c) =>
          this.form.patchValue({
            newEnabled: c.newPatientRegistration.enabled,
            newFee: minorToMajor(
              c.newPatientRegistration.feeMinor,
              c.newPatientRegistration.currency,
            ),
            newCurrency: c.newPatientRegistration.currency ?? 'NGN',
            existingEnabled: c.existingPatientLink.enabled,
            existingFee: minorToMajor(
              c.existingPatientLink.feeMinor,
              c.existingPatientLink.currency,
            ),
            existingCurrency: c.existingPatientLink.currency ?? 'NGN',
          }),
        error: () => this.error.set('Unable to load configuration.'),
      });
  }
  control(name: keyof typeof this.form.controls) {
    return this.form.controls[name];
  }
  save() {
    this.error.set('');
    this.success.set(false);
    const n = this.form.controls.newEnabled.value
        ? majorToMinor(this.form.controls.newFee.value, this.form.controls.newCurrency.value)
        : null,
      e = this.form.controls.existingEnabled.value
        ? majorToMinor(
            this.form.controls.existingFee.value,
            this.form.controls.existingCurrency.value,
          )
        : null;
    if (
      (this.form.controls.newEnabled.value && n == null) ||
      (this.form.controls.existingEnabled.value && e == null) ||
      (this.form.controls.newEnabled.value && !/^[A-Za-z]{3}$/.test(this.form.controls.newCurrency.value)) ||
      (this.form.controls.existingEnabled.value && !/^[A-Za-z]{3}$/.test(this.form.controls.existingCurrency.value))
    ) {
      this.error.set('Complete each enabled fee and currency. Blank is not Free.');
      return;
    }
    this.saving.set(true);
    this.api
      .updateConfiguration({
        newPatientRegistrationEnabled: this.form.controls.newEnabled.value,
        newPatientRegistrationFeeMinor: n,
        newPatientRegistrationCurrency: this.form.controls.newEnabled.value
          ? this.form.controls.newCurrency.value.toUpperCase()
          : null,
        existingPatientLinkEnabled: this.form.controls.existingEnabled.value,
        existingPatientLinkFeeMinor: e,
        existingPatientLinkCurrency: this.form.controls.existingEnabled.value
          ? this.form.controls.existingCurrency.value.toUpperCase()
          : null,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => this.success.set(true),
        error: () => this.error.set('Unable to save configuration.'),
      });
  }
}

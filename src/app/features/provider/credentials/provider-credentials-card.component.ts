import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { finalize } from 'rxjs';

import { CREDENTIAL_STATUS_LABEL, ProviderCredentialsApiService, ProviderCredentialsView, Specialty } from '../../../core/services/provider-credentials-api.service';
import { SpecialtyPickerComponent } from './specialty-picker.component';

/**
 * "Specialties and licence" on the provider profile. Patients can only find and book you once
 * SmartClinic has checked your licence with the regulator.
 */
@Component({
  selector: 'app-provider-credentials-card',
  imports: [SlicePipe, SpecialtyPickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="credentials-heading" data-credentials-card>
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="credentials-heading" class="text-xl font-bold text-slate-900">Specialties and licence</h2>
          <p class="mt-1 max-w-2xl text-sm text-slate-600">Patients can find and book you once we've checked your licence with the regulator. It usually takes one working day.</p>
        </div>
        @if (view(); as v) {
          <span class="rounded-full px-3 py-1 text-sm font-semibold {{ v.verified ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200' : v.credential?.status === 'REJECTED' ? 'bg-amber-50 text-amber-900 ring-1 ring-amber-200' : 'bg-slate-100 text-slate-700' }}" data-credential-status>
            {{ v.verified ? '✓ Verified' : label[v.credential?.status ?? 'NOT_SUBMITTED'] }}
          </span>
        }
      </div>

      @if (loadError()) { <p role="alert" class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{{ loadError() }}</p> }

      @if (view(); as v) {
        @if (v.credential?.message) {
          <p role="alert" class="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900" data-credential-message><strong>What to fix:</strong> {{ v.credential!.message }}</p>
        }

        <div class="mt-5">
          <h3 class="font-semibold text-slate-900">{{ v.specialtyRequired ? 'Your specialties' : 'Departments (optional)' }}</h3>
          <p class="text-sm text-slate-600">{{ v.specialtyRequired ? 'Choose up to ' + v.maxSpecialties + '. General Practice / Family Medicine counts.' : 'Which specialties do patients come to you for?' }}</p>
          <app-specialty-picker class="mt-2 block" [specialties]="catalogue()" [max]="v.maxSpecialties" [(selected)]="chosen" [(primary)]="primary" />
          <button type="button" (click)="saveSpecialties()" [disabled]="busy() || !specialtiesChanged()" class="mt-3 min-h-11 rounded-lg bg-brand-700 px-4 font-semibold text-white disabled:opacity-40" data-save-specialties>Save specialties</button>
        </div>

        <div class="mt-6 border-t border-slate-200 pt-5">
          <h3 class="font-semibold text-slate-900">{{ v.providerType === 'INDIVIDUAL' ? 'Your practising licence' : 'Your facility licence' }}</h3>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <label class="block text-sm font-semibold text-slate-800">Issued by
              <select [value]="regulator()" (change)="regulator.set($any($event.target).value)" [disabled]="v.verified" class="mt-1 min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal" data-regulator>
                <option value="" disabled [selected]="!regulator()">Choose the council or agency</option>
                @for (r of v.regulators; track r.code) { <option [value]="r.code" [selected]="r.code === regulator()">{{ r.name }}</option> }
              </select>
            </label>
            <label class="block text-sm font-semibold text-slate-800">Licence or registration number
              <input [value]="licence()" (input)="licence.set($any($event.target).value)" [disabled]="v.verified" maxlength="60" autocomplete="off" placeholder="As printed on your certificate" class="mt-1 min-h-12 w-full rounded-lg border border-slate-300 px-3 font-normal" data-licence />
            </label>
          </div>
          @if (!v.verified) {
            <button type="button" (click)="saveLicence()" [disabled]="busy() || !regulator() || licence().trim().length < 3" class="mt-3 min-h-11 rounded-lg bg-brand-700 px-4 font-semibold text-white disabled:opacity-40" data-save-licence>{{ v.credential ? 'Update and send for checking' : 'Send for checking' }}</button>

            <div class="mt-4 rounded-lg bg-slate-50 p-4">
              <p class="text-sm font-semibold text-slate-900">Photo or PDF of your certificate <span class="font-normal text-slate-500">(helps us check faster)</span></p>
              @if (v.uploadsAvailable) {
                <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" (change)="upload($event)" [disabled]="busy() || !v.credential" class="mt-2 block w-full text-sm" data-licence-file />
                <p class="mt-1 text-xs text-slate-500">Only SmartClinic staff see it. Up to 15 MB. {{ v.credential?.hasDocument ? '✓ A file is uploaded.' : '' }}</p>
              } @else {
                <p class="mt-1 text-xs text-slate-500">Uploads are switched off for now. We'll check your number directly with the regulator.</p>
              }
            </div>
          } @else {
            <p class="mt-3 text-sm text-slate-600">Verified{{ v.credential?.verifiedAt ? ' on ' + (v.credential!.verifiedAt | slice: 0 : 10) : '' }}. To change it, contact SmartClinic support.</p>
          }
        </div>

        @if (message()) { <p role="status" class="mt-4 text-sm font-semibold text-emerald-800">{{ message() }}</p> }
        @if (error()) { <p role="alert" class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{{ error() }}</p> }
      } @else if (!loadError()) {
        <p class="mt-4 text-sm text-slate-500" role="status">Loading…</p>
      }
    </section>
  `,
})
export class ProviderCredentialsCardComponent {
  private readonly api = inject(ProviderCredentialsApiService);
  readonly label = CREDENTIAL_STATUS_LABEL;
  /** Fires after a save, so the page can refresh its checklist. */
  readonly changed = output<void>();
  readonly view = signal<ProviderCredentialsView | null>(null);
  readonly catalogue = signal<readonly Specialty[]>([]);
  readonly chosen = signal<readonly string[]>([]);
  readonly primary = signal<string | null>(null);
  readonly busy = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  readonly loadError = signal('');
  readonly regulator = signal('');
  readonly licence = signal('');

  readonly specialtiesChanged = computed(() => {
    const v = this.view();
    if (!v) return false;
    const saved = v.specialties.map((s) => s.code);
    const savedPrimary = v.specialties.find((s) => s.isPrimary)?.code ?? null;
    return saved.join() !== this.chosen().join() || savedPrimary !== this.primary();
  });

  constructor() {
    this.api.specialties().subscribe({ next: (s) => this.catalogue.set(s), error: () => undefined });
    this.api.mine().subscribe({ next: (v) => this.apply(v), error: () => this.loadError.set('We couldn’t load your licence details. Refresh to try again.') });
  }

  saveSpecialties(): void {
    this.run(this.api.setSpecialties(this.chosen(), this.primary()), 'Specialties saved.');
  }

  saveLicence(): void {
    this.run(this.api.setLicence(this.regulator(), this.licence().trim()), 'Sent. We’ll check it with the regulator and let you know.');
  }

  upload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { this.error.set('That file is over 15 MB. Try a smaller photo.'); return; }
    this.run(this.api.uploadDocument(file), 'Certificate uploaded. Thank you.');
  }

  private run(call: ReturnType<ProviderCredentialsApiService['mine']>, done: string): void {
    this.busy.set(true);
    this.error.set('');
    this.message.set('');
    call.pipe(finalize(() => this.busy.set(false))).subscribe({
      next: (v) => { this.apply(v); this.message.set(done); this.changed.emit(); },
      error: (e: unknown) => this.error.set(e instanceof HttpErrorResponse && typeof e.error?.message === 'string' ? e.error.message : 'That didn’t save. Please try again.'),
    });
  }

  private apply(v: ProviderCredentialsView): void {
    this.view.set(v);
    this.chosen.set(v.specialties.map((s) => s.code));
    this.primary.set(v.specialties.find((s) => s.isPrimary)?.code ?? null);
    this.regulator.set(v.credential?.regulator ?? (v.regulators.length === 2 ? v.regulators[0].code : ''));
    this.licence.set(v.credential?.licenceNumber ?? '');
  }
}

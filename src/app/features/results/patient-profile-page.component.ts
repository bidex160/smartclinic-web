import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { PatientPortalProfile } from '../../core/models/patient-health-check-history.model';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
@Component({
  selector: 'app-patient-profile-page',
  template: `<main class="mx-auto max-w-4xl px-5 py-10 sm:px-8">
    <h1 class="text-3xl font-bold text-brand-900">Profile</h1>
    @if (loading()) {
      <p role="status" class="mt-6">Loading your profile…</p>
    }
    @if (error()) {
      <p role="alert" class="mt-6 rounded-xl bg-red-50 p-5 text-red-900">
        Your profile is unavailable right now.
      </p>
    }
    @if (profile(); as p) {
      <dl class="mt-7 grid gap-5 rounded-2xl border border-brand-100 bg-white p-6 sm:grid-cols-2">
        <div>
          <dt class="text-sm font-semibold text-slate-600">First name</dt>
          <dd class="mt-1 font-bold">{{ p.patient.givenName }}</dd>
        </div>
        <div>
          <dt class="text-sm font-semibold text-slate-600">Last name</dt>
          <dd class="mt-1 font-bold">{{ p.patient.familyName }}</dd>
        </div>
        <div>
          <dt class="text-sm font-semibold text-slate-600">Email</dt>
          <dd class="mt-1 font-bold">{{ p.user.email ?? 'Not provided' }}</dd>
        </div>
        <div>
          <dt class="text-sm font-semibold text-slate-600">Phone</dt>
          <dd class="mt-1 font-bold">{{ p.patient.phone ?? 'Not available' }}</dd>
        </div>
        <div class="sm:col-span-2">
          <dt class="text-sm font-semibold text-slate-600">SmartClinic Patient ID</dt>
          <dd class="mt-1 font-mono text-xl font-bold">{{ p.patient.patientReference }}</dd>
          <button
            type="button"
            (click)="copy()"
            class="mt-3 rounded-xl border border-brand-600 px-4 py-2 font-bold text-brand-700"
          >
            Copy Patient ID
          </button>
          <p aria-live="polite" class="mt-2 text-sm">{{ feedback() }}</p>
        </div>
      </dl>
      <p class="mt-5 text-sm text-slate-600">Profile editing is not available yet.</p>
    }
  </main>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientProfilePageComponent {
  private readonly api = inject(HealthCheckResultsApiService);
  readonly profile = signal<PatientPortalProfile | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly feedback = signal('');
  constructor() {
    this.api
      .getMyProfile()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({ next: (p) => this.profile.set(p), error: () => this.error.set(true) });
  }
  async copy() {
    const value = this.profile()?.patient.patientReference;
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      this.feedback.set('Patient ID copied');
    } catch {
      this.feedback.set('Copy was unavailable.');
    }
  }
}

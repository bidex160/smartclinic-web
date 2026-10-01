import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PatientPortalProfile } from '../../core/models/patient-health-check-history.model';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
@Component({
  selector: 'app-patient-profile-page',
  imports: [RouterLink],
  template: `<main class="mx-auto max-w-4xl px-5 py-10 sm:px-8">
    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Me</p>
    <h1 class="font-display mt-1 text-3xl font-semibold text-ink">Profile</h1>
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
          <dt class="text-sm font-semibold text-ink-soft">First name</dt>
          <dd class="mt-1 font-bold">{{ p.patient.givenName }}</dd>
        </div>
        <div>
          <dt class="text-sm font-semibold text-ink-soft">Last name</dt>
          <dd class="mt-1 font-bold">{{ p.patient.familyName }}</dd>
        </div>
        <div>
          <dt class="text-sm font-semibold text-ink-soft">Email</dt>
          <dd class="mt-1 font-bold">{{ p.user.email ?? 'Not provided' }}</dd>
        </div>
        <div>
          <dt class="text-sm font-semibold text-ink-soft">Phone</dt>
          <dd class="mt-1 font-bold">{{ p.patient.phone ?? 'Not available' }}</dd>
        </div>
        <div class="sm:col-span-2">
          <dt class="text-sm font-semibold text-ink-soft">SmartClinic Patient ID</dt>
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
      <p class="mt-5 text-sm text-ink-soft">Profile editing is not available yet.</p>
    }

    <nav class="mt-8" aria-labelledby="me-more-heading">
      <h2 id="me-more-heading" class="font-display text-xl font-semibold text-ink">More for you</h2>
      <ul class="sc-card mt-3 divide-y divide-ink/[0.06] overflow-hidden">
        @for (link of links; track link.route) {
          <li>
            <a [routerLink]="link.route" class="flex min-h-16 items-center gap-4 px-5 py-3 transition hover:bg-sand-50">
              <span class="min-w-0 flex-1">
                <strong class="block font-semibold text-ink">{{ link.label }}</strong>
                <span class="block text-sm text-ink-muted">{{ link.hint }}</span>
              </span>
              <span class="text-ink-muted" aria-hidden="true">›</span>
            </a>
          </li>
        }
      </ul>
    </nav>
  </main>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientProfilePageComponent {
  private readonly api = inject(HealthCheckResultsApiService);
  readonly profile = signal<PatientPortalProfile | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly feedback = signal('');
  readonly links = [
    { label: 'Family & dependants', hint: 'People whose care you manage', route: '/me/family' },
    { label: 'My Impact & referrals', hint: 'Invite people and see your community impact', route: '/me/impact' },
    { label: 'Health Insurance / HMO', hint: 'Add cover or ask for enrollment help', route: '/me/insurance' },
    { label: 'Healthy Families', hint: 'School, employer and family programmes', route: '/healthy-families' },
    { label: 'Notifications', hint: 'Updates about your care and reminders', route: '/me/notifications' },
  ] as const;
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

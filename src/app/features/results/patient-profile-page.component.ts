import { ReminderSettingsCardComponent } from '../family/reminder-settings-card.component';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PatientPortalProfile } from '../../core/models/patient-health-check-history.model';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { PatientDashboardApiService } from '../../core/services/patient-dashboard-api.service';
import { HealthBasicsCardComponent } from './health-basics-card.component';

const PHONE_PATTERN = /^\+?[0-9][0-9 ()-]{6,29}$/;

@Component({
  selector: 'app-patient-profile-page',
  imports: [ReminderSettingsCardComponent, RouterLink, ReactiveFormsModule, HealthBasicsCardComponent],
  template: `<main class="mx-auto max-w-4xl px-5 py-10 sm:px-8">
    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Me</p>
    <div class="mt-1 flex flex-wrap items-end justify-between gap-3">
      <h1 class="font-display text-3xl font-semibold text-ink">Profile</h1>
      <a routerLink="/me/card" class="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-brand-900" data-card-link>
        <svg aria-hidden="true" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z"/><path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20h2M20 14v2"/></svg>
        Show my SmartClinic card
      </a>
    </div>
    @if (loading()) {
      <p role="status" class="mt-6">Loading your profile…</p>
    }
    @if (error()) {
      <p role="alert" class="mt-6 rounded-xl bg-clay-50 p-5 text-clay-700">
        Your profile is unavailable right now.
      </p>
    }
    @if (profile(); as p) {
      <section class="sc-card mt-6 p-5 sm:p-6" aria-labelledby="profile-details-heading">
        <div class="flex items-start justify-between gap-3">
          <h2 id="profile-details-heading" class="font-display text-xl font-semibold text-ink">Your details</h2>
          @if (!editing()) {
            <button type="button" (click)="startEditing(p)" class="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink hover:bg-sand-50">Edit</button>
          }
        </div>

        @if (editing()) {
          <form [formGroup]="form" (ngSubmit)="save()" class="mt-5 grid gap-4 sm:grid-cols-2" novalidate>
            <label class="text-sm font-medium text-ink-soft">First name
              <input formControlName="givenName" maxlength="100" autocomplete="given-name" class="mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink" />
              @if (form.controls.givenName.invalid && form.controls.givenName.touched) { <span class="mt-1 block text-xs font-semibold text-clay-700">First name is required.</span> }
            </label>
            <label class="text-sm font-medium text-ink-soft">Last name
              <input formControlName="familyName" maxlength="100" autocomplete="family-name" class="mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink" />
              @if (form.controls.familyName.invalid && form.controls.familyName.touched) { <span class="mt-1 block text-xs font-semibold text-clay-700">Last name is required.</span> }
            </label>
            <label class="text-sm font-medium text-ink-soft">Phone
              <input formControlName="phone" type="tel" autocomplete="tel" placeholder="+234…" class="mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink" />
              @if (form.controls.phone.invalid && form.controls.phone.touched) { <span class="mt-1 block text-xs font-semibold text-clay-700">Enter a valid phone number.</span> }
            </label>
            <label class="text-sm font-medium text-ink-soft">Date of birth
              <input formControlName="dateOfBirth" type="date" [max]="today" autocomplete="bday" class="mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink" />
            </label>
            @if (saveError()) { <p role="alert" class="text-sm font-semibold text-clay-700 sm:col-span-2">{{ saveError() }}</p> }
            <div class="flex gap-2 sm:col-span-2">
              <button type="submit" [disabled]="form.invalid || saving()" class="min-h-11 rounded-full bg-ink px-6 font-semibold text-white hover:bg-brand-900 disabled:opacity-50">{{ saving() ? 'Saving…' : 'Save' }}</button>
              <button type="button" (click)="editing.set(false)" class="min-h-11 rounded-full px-4 font-semibold text-ink-soft hover:bg-sand-50">Cancel</button>
            </div>
          </form>
        } @else {
          <dl class="mt-5 grid gap-5 [overflow-wrap:anywhere] sm:grid-cols-2">
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
            <div>
              <dt class="text-sm font-semibold text-ink-soft">Date of birth</dt>
              <dd class="mt-1 font-bold">{{ p.patient.dateOfBirth ? formatDate(p.patient.dateOfBirth) : 'Not added' }}</dd>
            </div>
            <div>
              <dt class="text-sm font-semibold text-ink-soft">SmartClinic Patient ID</dt>
              <dd class="mt-1 font-mono text-xl font-bold">{{ p.patient.patientReference }}</dd>
              <button type="button" (click)="copy()" class="mt-2 rounded-xl border border-brand-600 px-4 py-2 font-bold text-brand-700">
                Copy Patient ID
              </button>
              <p aria-live="polite" class="mt-2 text-sm">{{ feedback() }}</p>
            </div>
          </dl>
        }
      </section>

      <div class="mt-4">
        <app-health-basics-card />
        <app-reminder-settings-card />
      </div>
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
  private readonly dashboardApi = inject(PatientDashboardApiService);
  private readonly fb = inject(FormBuilder);
  readonly profile = signal<PatientPortalProfile | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly feedback = signal('');
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal('');
  readonly today = new Date().toISOString().slice(0, 10);
  readonly form = this.fb.nonNullable.group({
    givenName: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/\S/)]],
    familyName: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/\S/)]],
    phone: ['', Validators.pattern(PHONE_PATTERN)],
    dateOfBirth: [''],
  });
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
  startEditing(p: PatientPortalProfile): void {
    this.form.reset({
      givenName: p.patient.givenName,
      familyName: p.patient.familyName,
      phone: p.patient.phone ?? '',
      dateOfBirth: p.patient.dateOfBirth ?? '',
    });
    this.saveError.set('');
    this.editing.set(true);
  }
  save(): void {
    if (this.form.invalid || this.saving()) return;
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.saveError.set('');
    this.dashboardApi
      .updateProfile({
        givenName: value.givenName.trim(),
        familyName: value.familyName.trim(),
        phone: value.phone.trim() || null,
        dateOfBirth: value.dateOfBirth || null,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (updated) => {
          this.profile.set(updated);
          this.editing.set(false);
        },
        error: (error) =>
          this.saveError.set(error?.error?.message && typeof error.error.message === 'string'
            ? error.error.message
            : 'We could not save your details. Please try again.'),
      });
  }
  formatDate(value: string): string {
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
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

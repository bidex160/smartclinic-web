import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, finalize } from 'rxjs';
import {
  PatientHealthCheckHistoryResponse,
  PatientPortalProfile,
} from '../../core/models/patient-health-check-history.model';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { ReferralSummary } from '../../core/models/referral.model';
import { ReferralsApiService } from '../../core/services/referrals-api.service';

@Component({
  selector: 'app-patient-dashboard-page',
  imports: [RouterLink],
  template: ` <main class="mx-auto max-w-6xl px-5 py-10 sm:px-8">
    @if (loading()) {
      <p role="status" class="rounded-xl bg-brand-50 p-5">Loading your Health Checks…</p>
    }
    @if (error()) {
      <section role="alert" class="rounded-xl border border-red-200 bg-red-50 p-5">
        <h1 class="font-bold">We couldn't load your Health Checks.</h1>
        <p class="mt-2">{{ error() }}</p>
        <button
          type="button"
          (click)="load()"
          class="mt-4 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white"
        >
          Try again
        </button>
      </section>
    }
    @if (profile(); as value) {
      <header>
        <p class="text-sm font-bold uppercase tracking-wider text-brand-600">Patient Portal</p>
        <h1 class="mt-2 text-3xl font-bold text-brand-900">
          Welcome, {{ value.patient.givenName }}
        </h1>
      </header>
      <section
        class="mt-7 rounded-2xl border border-brand-100 bg-white p-6 shadow-soft"
        aria-labelledby="patient-id-heading"
      >
        <h2 id="patient-id-heading" class="text-sm font-bold text-slate-600">
          SmartClinic Patient ID
        </h2>
        <p class="mt-2 font-mono text-2xl font-bold text-brand-900">
          {{ value.patient.patientReference }}
        </p>
        <button
          type="button"
          (click)="copyPatientId()"
          class="mt-4 min-h-11 rounded-xl border border-brand-600 px-5 font-bold text-brand-700"
        >
          Copy ID
        </button>
        <p aria-live="polite" class="mt-2 text-sm font-semibold text-brand-700">
          {{ copyFeedback() }}
        </p>
        <p class="mt-3 text-sm text-slate-600">
          Your Patient ID identifies your SmartClinic health record. It does not give someone access
          to your health information.
        </p>
      </section>
      <section class="mt-8" aria-labelledby="summary-heading">
        <h2 id="summary-heading" class="text-2xl font-bold text-brand-900">Your Health Checks</h2>
        <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          @for (item of summary(); track item.label) {
            <article class="rounded-2xl border border-brand-100 bg-white p-5">
              <p class="text-sm font-semibold text-slate-600">{{ item.label }}</p>
              <p class="mt-2 text-3xl font-bold text-brand-900">{{ item.count }}</p>
            </article>
          }
        </div>
      </section>
      <section class="mt-8 rounded-2xl border bg-white p-6" aria-labelledby="dashboard-rewards-heading"><h2 id="dashboard-rewards-heading" class="text-2xl font-bold text-brand-900">Referrals & Rewards</h2>@if (referralsLoading()) { <p role="status" class="mt-3">Loading rewards…</p> } @else if (referralsError()) { <div role="alert" class="mt-3"><p>We could not load your referral progress.</p><button type="button" (click)="loadReferrals()" class="mt-2 font-bold text-brand-700 underline">Try again</button></div> } @else if (referrals(); as rewards) { <p class="mt-3 text-3xl font-bold">{{ rewards.availablePoints }} points</p>@if (rewards.levelProgress.currentLevel; as current) { <p class="mt-2 font-semibold">{{ current.name }} achieved</p> } @else { <p class="mt-2 font-semibold">No level achieved yet</p> }@if (rewards.levelProgress.highestConfiguredLevelReached) { <p class="mt-1 text-sm text-slate-600">Highest level reached</p> } @else if (rewards.levelProgress.nextLevel; as next) { <p class="mt-1 text-sm text-slate-600">Next: {{ next.name }}</p><div class="mt-3 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">@for (requirement of rewards.levelProgress.requirements; track requirement.targetType) { <p>{{ dashboardTargetLabel(requirement.targetType) }} {{ requirement.qualified }}/{{ requirement.required }}</p> }</div> }<a routerLink="/me/referrals" class="mt-4 inline-flex font-bold text-brand-700 underline">View Referrals & Rewards</a> }</section>
      @if (history()?.items?.length === 0) {
        <section class="mt-8 rounded-2xl bg-white p-7 text-center">
          <h2 class="text-xl font-bold">No Health Checks yet.</h2>
          <a
            routerLink="/me/book"
            class="mt-5 inline-flex min-h-12 items-center rounded-xl bg-brand-700 px-6 font-bold text-white"
            >Book your first Health Check</a
          >
        </section>
      } @else {
        <div class="mt-8 flex flex-wrap gap-3">
          <a
            routerLink="/me/health-checks"
            class="rounded-xl bg-brand-700 px-6 py-3 font-bold text-white"
            >View My Health Checks</a
          ><a
            routerLink="/me/book"
            class="rounded-xl border border-brand-600 px-6 py-3 font-bold text-brand-700"
            >Book another Health Check</a
          >
        </div>
      }
    }
  </main>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientDashboardPageComponent {
  private readonly api = inject(HealthCheckResultsApiService);
  private readonly referralsApi = inject(ReferralsApiService);
  readonly profile = signal<PatientPortalProfile | null>(null);
  readonly history = signal<PatientHealthCheckHistoryResponse | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly copyFeedback = signal('');
  readonly referrals = signal<ReferralSummary|null>(null); readonly referralsLoading = signal(false); readonly referralsError = signal(false);
  readonly summary = computed(() => {
    const items = this.history()?.items ?? [];
    const count = (category: string) =>
      items.filter((item) => item.portalCategory === category).length;
    return [
      { label: 'Awaiting payment', count: count('AWAITING_PAYMENT') },
      { label: 'Upcoming / active', count: count('UPCOMING_ACTIVE') },
      { label: 'Completed', count: count('COMPLETED_HISTORY') },
      { label: 'Needs attention', count: count('NEEDS_ATTENTION') },
    ];
  });
  constructor() {
    this.load();
    this.loadReferrals();
  }
  loadReferrals(): void { if(this.referralsLoading())return;this.referralsLoading.set(true);this.referralsError.set(false);this.referralsApi.summary().pipe(finalize(()=>this.referralsLoading.set(false))).subscribe({next:v=>this.referrals.set(v),error:()=>this.referralsError.set(true)}); }
  load(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      profile: this.api.getMyProfile(),
      history: this.api.getMyHealthChecks({ page: 1, limit: 50 }),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ profile, history }) => {
          this.profile.set(profile);
          this.history.set(history);
        },
        error: (error: HttpErrorResponse) =>
          this.error.set(
            error.status === 0
              ? 'Check your connection and try again.'
              : 'Your patient portal is unavailable right now.',
          ),
      });
  }
  async copyPatientId(): Promise<void> {
    const reference = this.profile()?.patient.patientReference;
    if (!reference) return;
    try {
      await navigator.clipboard.writeText(reference);
      this.copyFeedback.set('Patient ID copied');
    } catch {
      this.copyFeedback.set('Copy was unavailable. Select the Patient ID to copy it manually.');
    }
  }
  dashboardTargetLabel(target: string): string {
    return ({ PATIENT: 'Patients', CLINIC: 'Clinics', LABORATORY: 'Labs', PHARMACY: 'Pharmacies' } as Record<string, string>)[target] ?? target;
  }
}

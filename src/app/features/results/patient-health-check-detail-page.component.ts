import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PatientHealthCheckDetail } from '../../core/models/patient-health-check-history.model';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { UtilsService } from '../../core/services/utils.service';

@Component({
  selector: 'app-patient-health-check-detail-page',
  imports: [RouterLink],
  template: `
    <main class="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <a routerLink="/me/health-checks" class="font-bold text-brand-700">← My Health Checks</a>
      @if (loading()) {
        <p role="status" class="mt-6">Loading Health Check…</p>
      }
      @if (error()) {
        <section role="alert" class="mt-6 rounded-xl bg-red-50 p-5">
          <h1 class="text-2xl font-bold">Health Check unavailable</h1>
          <p class="mt-2">This Health Check is not available to this account.</p>
        </section>
      }
      @if (detail(); as d) {
        <header class="mt-6">
          <p class="font-mono font-bold text-brand-700">{{ d.bookingReference }}</p>
          <h1 class="mt-2 text-3xl font-bold text-brand-900">{{ d.healthCheckPackage.name }}</h1>
          <p class="mt-2 font-semibold">{{ statusLabel(d.bookingStatus) }}</p>
        </header>
        <div class="mt-7 grid gap-5 md:grid-cols-2">
          <section class="rounded-2xl border bg-white p-6">
            <h2 class="text-xl font-bold">Requested appointment</h2>
            <p class="mt-3">
              {{ utils.formatAppointment(d.preferredDate, d.preferredTimeFrom, d.preferredTimeTo) }}
            </p>
            <p class="text-sm text-slate-600">
              {{ d.preferredTimezone ?? 'Timezone not available' }}
            </p>
          </section>
          <section class="rounded-2xl border bg-white p-6">
            <h2 class="text-xl font-bold">Confirmed appointment</h2>
            @if (d.confirmedSchedule; as s) {
              <p class="mt-3">{{ utils.formatAppointment(s.date, s.timeFrom, s.timeTo) }}</p>
              <p class="text-sm text-slate-600">{{ s.timezone }}</p>
              @if (d.fulfilmentMode.code === 'PROVIDER_LOCATION' && s.providerLocation; as l) {
                <div class="mt-4 border-t pt-4">
                  <h3 class="font-bold">Appointment location</h3>
                  <address class="mt-2 not-italic">
                    <strong>{{ l.name }}</strong><br />{{ l.addressLine1 }}
                    @if (l.addressLine2) {
                      <br />{{ l.addressLine2 }}
                    }
                    <br />{{ l.city }}, {{ l.stateOrRegion }}
                    @if (l.postalCode) {
                      · {{ l.postalCode }}
                    }
                    · {{ l.countryCode }}
                  </address>
                </div>
              }
            } @else {
              <p class="mt-3 text-slate-600">Not confirmed yet</p>
            }
          </section>
          <section class="rounded-2xl border bg-white p-6">
            <h2 class="text-xl font-bold">Health Check</h2>
            <dl class="mt-3 space-y-3">
              <div>
                <dt class="text-sm text-slate-600">Fulfilment</dt>
                <dd class="font-bold">{{ d.fulfilmentMode.name }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-600">Provider</dt>
                <dd class="font-bold">{{ d.providerDisplayName ?? 'Not assigned yet' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-600">Payment</dt>
                <dd class="font-bold">
                  {{ d.fundingStatus === 'SETTLED' ? 'Payment confirmed' : 'Awaiting payment' }}
                </dd>
              </div>
            </dl>
          </section>
          @if (d.fulfilmentMode.code === 'HOME_VISIT' && d.visitAddress; as a) {
            <section class="rounded-2xl border bg-white p-6">
              <h2 class="text-xl font-bold">Home visit address</h2>
              <address class="mt-3 not-italic">
                {{ a.addressLine1 }}
                @if (a.addressLine2) {
                  <br />{{ a.addressLine2 }}
                }
                <br />{{ a.city }}, {{ a.stateOrRegion }}
                @if (a.postalCode) {
                  {{ a.postalCode }}
                }
                <br />{{ a.countryCode }}
              </address>
              @if (a.locationNote) {
                <p class="mt-3 text-sm">
                  <strong>Additional directions:</strong> {{ a.locationNote }}
                </p>
              }
            </section>
          }
          @if (d.fulfilmentMode.code === 'PROVIDER_LOCATION' && d.visitAddressSummary; as a) {
            <section class="rounded-2xl border bg-white p-6">
              <h2 class="text-xl font-bold">Your location</h2>
              <p class="mt-3">{{ a.city }}, {{ a.stateOrRegion }}, {{ a.countryCode }}</p>
              <p class="mt-2 text-sm text-slate-600">
                This submitted origin was used for matching and is separate from your confirmed
                appointment location.
              </p>
            </section>
          }
        </div>
        @if (d.hasCompletedResult) {
          <a
            [routerLink]="['/me/health-checks', d.bookingReference, 'results']"
            class="mt-7 inline-flex rounded-xl bg-brand-700 px-6 py-3 font-bold text-white"
            >View results</a
          >
        } @else {
          <p class="mt-7 rounded-xl bg-slate-100 p-4">Results are not available yet.</p>
        }
      }
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientHealthCheckDetailPageComponent {
  private readonly api = inject(HealthCheckResultsApiService);
  private readonly reference = inject(ActivatedRoute).snapshot.paramMap.get('reference') ?? '';
  readonly utils = inject(UtilsService);
  readonly detail = signal<PatientHealthCheckDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  constructor() {
    this.api
      .getMyHealthCheck(this.reference)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({ next: (detail) => this.detail.set(detail), error: () => this.error.set(true) });
  }
  statusLabel(status: string): string {
    return (
      (
        {
          AWAITING_FUNDING: 'Awaiting payment',
          PENDING_PROVIDER_MATCH: 'Finding your provider',
          PROVIDER_ASSIGNED: 'Provider assigned',
          SCHEDULED: 'Scheduled',
          IN_PROGRESS: 'Health Check in progress',
          COMPLETED: 'Completed',
          UNFULFILLABLE: 'Provider match needs review',
          CANCELLED: 'Cancelled',
          EXPIRED: 'Expired',
        } as Record<string, string>
      )[status] ?? 'Draft'
    );
  }
}

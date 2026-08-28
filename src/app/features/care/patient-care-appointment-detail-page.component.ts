import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CareAppointment } from '../../core/models/find-care.model';
import { CareAppointmentsApiService } from '../../core/services/care-appointments-api.service';
import { UtilsService } from '../../core/services/utils.service';
import { careDeliveryModeLabel } from './care-delivery-mode';
@Component({
  selector: 'app-patient-care-appointment-detail-page',
  imports: [RouterLink, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-4xl px-5 py-10 sm:px-8">
    <a routerLink="/me/care" class="font-bold text-brand-700 underline">← My Care</a>
    @if (loading()) {
      <p role="status" class="mt-6 rounded-2xl border bg-white p-6">Loading your appointment…</p>
    } @else if (error() && !appointment()) {
      <p role="alert" class="mt-6 rounded-2xl bg-red-50 p-6">
        {{ error() }}
        <button type="button" (click)="load()" class="font-bold underline">Try again</button>
      </p>
    } @else if (appointment(); as a) {
      <header class="mt-6">
        <p class="break-all text-sm font-bold uppercase text-brand-600">
          {{ a.appointmentReference }}
        </p>
        <h1 class="mt-2 text-3xl font-bold">Your appointment</h1>
        <p class="mt-2 text-lg">{{ label(a.status) }}</p>
      </header>
      @if (feedback()) {
        <p aria-live="polite" class="mt-5 rounded-xl bg-green-50 p-4 text-green-900">
          {{ feedback() }}
        </p>
      }
      @if (error()) {
        <p role="alert" class="mt-5 rounded-xl bg-red-50 p-4 text-red-800">{{ error() }}</p>
      }
      <section class="mt-6 rounded-2xl border bg-white p-6">
        <dl class="grid gap-5 sm:grid-cols-2">
          <div>
            <dt class="text-sm text-slate-500">Provider</dt>
            <dd class="font-semibold">{{ a.provider.displayName }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">Service</dt>
            <dd>{{ a.service.name }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">Delivery</dt>
            <dd>{{ deliveryModeLabel(a.deliveryMode) }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">Date and time</dt>
            <dd>
              {{ utils.formatAppointment(a.scheduledDate, a.scheduledTimeFrom, a.scheduledTimeTo) }}
            </dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">Timezone</dt>
            <dd>{{ a.timezone }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">Care Request</dt>
            <dd class="break-all">{{ a.careRequestReference }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">Location</dt>
            <dd>
              {{
                a.deliveryMode === 'VIRTUAL'
                  ? 'Online'
                  : a.deliveryMode === 'HOME_VISIT'
                    ? 'Home visit'
                    : a.providerLocation?.name || 'No specific provider location'
              }}
            </dd>
          </div>
          @if (a.providerLocation; as l) {
            <div class="sm:col-span-2">
              <dt class="text-sm text-slate-500">Appointment address</dt>
              <dd>
                {{ l.addressLine1 }}{{ l.addressLine2 ? ', ' + l.addressLine2 : '' }}, {{ l.city }},
                {{ l.stateOrRegion }} {{ l.postalCode || '' }}, {{ l.countryCode }}
              </dd>
            </div>
          }
        </dl>
        <p class="mt-6 rounded-xl bg-slate-50 p-4">{{ nextStep(a.status) }}</p>
      </section>
      @if (a.deliveryMode === 'VIRTUAL') {
        <section class="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-6">
          <h2 class="text-xl font-bold">Virtual consultation</h2>
          @if (safeMeetingUrl(a.meetingUrl); as url) {
            <p class="mt-2 text-slate-600">
              Join using the external link supplied by your provider.
            </p>
            <a
              [href]="url"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-4 inline-flex min-h-12 items-center rounded-xl bg-brand-700 px-5 py-3 font-bold text-white"
              >Join virtual consultation</a
            >
          } @else {
            <p class="mt-2 text-slate-600">Your provider has not added the meeting link yet.</p>
          }
        </section>
      }
      @if (a.status === 'SCHEDULED' || a.status === 'CONFIRMED') {
        <button
          type="button"
          (click)="cancelOpen.set(true)"
          class="mt-6 rounded-xl border border-red-300 px-5 py-3 font-bold text-red-700"
        >
          Cancel appointment
        </button>
      }
    }
    @if (cancelOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <section
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="patient-cancel-appointment-title"
          class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        >
          <h2 id="patient-cancel-appointment-title" class="text-xl font-bold">
            Cancel this appointment?
          </h2>
          <p class="mt-2 text-slate-600">
            SmartClinic will update the appointment and related Care Request together.
          </p>
          <form [formGroup]="form" (ngSubmit)="cancel()" class="mt-5">
            <label class="font-bold"
              >Reason<textarea
                formControlName="reason"
                rows="4"
                maxlength="2000"
                placeholder="Enter a cancellation reason"
                class="mt-2 w-full rounded-xl border p-3"
              ></textarea>
            </label>
            <div class="mt-5 flex justify-end gap-3">
              <button
                type="button"
                (click)="cancelOpen.set(false)"
                [disabled]="pending()"
                class="rounded-xl border px-4 py-3 font-bold"
              >
                Keep appointment</button
              ><button
                type="submit"
                [disabled]="pending() || form.invalid"
                class="rounded-xl bg-red-700 px-4 py-3 font-bold text-white disabled:opacity-50"
              >
                {{ pending() ? 'Cancelling…' : 'Cancel appointment' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    }
  </main>`,
})
export class PatientCareAppointmentDetailPageComponent {
  private readonly api = inject(CareAppointmentsApiService);
  private readonly fb = inject(FormBuilder);
  readonly utils = inject(UtilsService);
  readonly reference = inject(ActivatedRoute).snapshot.paramMap.get('reference') ?? '';
  readonly appointment = signal<CareAppointment | null>(null);
  readonly loading = signal(true);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);
  readonly feedback = signal<string | null>(null);
  readonly cancelOpen = signal(false);
  readonly deliveryModeLabel = careDeliveryModeLabel;
  readonly form = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.maxLength(2000)]],
  });
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.api
      .get(this.reference)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (a) => this.appointment.set(a),
        error: () => this.error.set('This appointment is unavailable.'),
      });
  }
  cancel() {
    if (this.form.invalid || this.pending()) return;
    this.pending.set(true);
    this.error.set(null);
    this.api
      .cancel(this.reference, this.form.controls.reason.value.trim())
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: () => {
          this.cancelOpen.set(false);
          this.feedback.set('Appointment cancelled.');
          this.load();
        },
        error: (e) => {
          this.cancelOpen.set(false);
          this.error.set(
            e?.status === 409
              ? 'This appointment changed before cancellation. We refreshed its current state.'
              : 'We could not cancel this appointment.',
          );
          this.load();
        },
      });
  }
  label(s: string) {
    return s === 'IN_PROGRESS'
      ? 'In progress'
      : s === 'NO_SHOW'
        ? 'No-show'
        : s.charAt(0) + s.slice(1).toLowerCase();
  }
  nextStep(s: string) {
    return (
      (
        {
          SCHEDULED: 'Your appointment has been scheduled.',
          CONFIRMED: 'Your appointment is confirmed.',
          IN_PROGRESS: 'Your appointment is currently in progress.',
          COMPLETED: 'This appointment has been completed.',
          CANCELLED: 'This appointment was cancelled.',
          NO_SHOW: 'This appointment was recorded as a no-show.',
        } as Record<string, string>
      )[s] ?? 'Check this page for the latest appointment status.'
    );
  }
  safeMeetingUrl(value: string | null) {
    if (!value) return null;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' ? url.toString() : null;
    } catch {
      return null;
    }
  }
}

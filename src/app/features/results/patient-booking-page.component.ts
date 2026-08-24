import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, finalize } from 'rxjs';
import { FulfilmentMode } from '../../core/models/fulfilment-mode.model';
import { HealthCheckPackage } from '../../core/models/health-check-package.model';
import { PublicBookingResponse } from '../../core/models/public-booking.model';
import { FulfilmentModesApiService } from '../../core/services/fulfilment-modes-api.service';
import { HealthCheckPackagesApiService } from '../../core/services/health-check-packages-api.service';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { UtilsService } from '../../core/services/utils.service';

@Component({
  selector: 'app-patient-booking-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: ` <main class="mx-auto max-w-4xl px-5 py-10 sm:px-8">
    <p class="text-sm font-bold uppercase tracking-wider text-brand-600">Patient booking</p>
    <h1 class="mt-2 text-3xl font-bold text-brand-900">Book a Health Check for yourself</h1>
    <p class="mt-3 text-slate-600">
      SmartClinic securely uses the Patient linked to your account. You do not need to re-enter your
      identity.
    </p>
    @if (loading()) {
      <p role="status" class="mt-6 rounded-xl bg-brand-50 p-5">Loading booking options…</p>
    }
    @if (error()) {
      <div role="alert" class="mt-6 rounded-xl bg-red-50 p-5 text-red-900">{{ error() }}</div>
    }
    @if (created(); as booking) {
      <section role="status" class="mt-7 rounded-2xl border border-brand-100 bg-white p-7">
        <h2 class="text-2xl font-bold text-brand-900">Health Check booking created</h2>
        <p class="mt-3">
          Reference: <strong class="font-mono">{{ booking.bookingReference }}</strong>
        </p>
        <p class="mt-4 rounded-xl bg-amber-50 p-4 text-amber-950">
          Payment setup for registered accounts is not available yet. This booking remains awaiting
          payment, and provider matching has not started.
        </p>
        <a
          routerLink="/me/health-checks"
          class="mt-5 inline-flex rounded-xl bg-brand-700 px-6 py-3 font-bold text-white"
          >View My Health Checks</a
        >
      </section>
    } @else if (!loading()) {
      <form [formGroup]="form" (ngSubmit)="continue()" class="mt-7 space-y-6" novalidate>
        <section class="rounded-2xl border bg-white p-6">
          <h2 class="text-xl font-bold">Health Check</h2>
          <div class="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label for="self-package" class="block text-sm font-bold">Package</label
              ><select
                id="self-package"
                formControlName="healthCheckPackageId"
                class="mt-2 min-h-12 w-full rounded-xl border px-3"
              >
                <option value="">Select package</option>
                @for (item of packages(); track item.id) {
                  <option [value]="item.id">{{ item.name }}</option>
                }
              </select>
            </div>
            <div>
              <label for="self-mode" class="block text-sm font-bold">Fulfilment mode</label
              ><select
                id="self-mode"
                formControlName="fulfilmentModeId"
                class="mt-2 min-h-12 w-full rounded-xl border px-3"
              >
                <option value="">Select fulfilment mode</option>
                @for (item of modes(); track item.id) {
                  <option [value]="item.id">{{ item.name }}</option>
                }
              </select>
            </div>
          </div>
        </section>
        <section class="rounded-2xl border bg-white p-6">
          <h2 class="text-xl font-bold">Requested appointment</h2>
          <div class="mt-5 grid gap-5 sm:grid-cols-3">
            <div>
              <label for="self-date" class="block text-sm font-bold">Appointment date</label
              ><input
                id="self-date"
                type="date"
                formControlName="preferredDate"
                class="mt-2 min-h-12 w-full rounded-xl border px-3"
              />
            </div>
            <div>
              <label for="self-time" class="block text-sm font-bold">Appointment time</label
              ><input
                id="self-time"
                type="time"
                formControlName="preferredTimeWindowStart"
                class="mt-2 min-h-12 w-full rounded-xl border px-3"
              />
            </div>
            <div>
              <label for="self-timezone" class="block text-sm font-bold">Timezone</label
              ><input
                id="self-timezone"
                formControlName="preferredTimezone"
                placeholder="e.g. Africa/Lagos"
                class="mt-2 min-h-12 w-full rounded-xl border px-3"
              />
            </div>
          </div>
        </section>
        @if (isHomeVisit()) {
          <fieldset formGroupName="visitAddress" class="rounded-2xl border bg-white p-6">
            <legend class="px-2 text-xl font-bold">Home visit address</legend>
            <div class="mt-4 grid gap-5 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label for="self-address1" class="block text-sm font-bold">Address line 1</label
                ><input
                  id="self-address1"
                  formControlName="addressLine1"
                  placeholder="e.g. 15 Ring Road"
                  class="mt-2 min-h-12 w-full rounded-xl border px-3"
                />
              </div>
              <div class="sm:col-span-2">
                <label for="self-address2" class="block text-sm font-bold"
                  >Address line 2 <span class="font-normal">(optional)</span></label
                ><input
                  id="self-address2"
                  formControlName="addressLine2"
                  placeholder="Apartment, suite or landmark (optional)"
                  class="mt-2 min-h-12 w-full rounded-xl border px-3"
                />
              </div>
              <div>
                <label for="self-city" class="block text-sm font-bold">City</label
                ><input
                  id="self-city"
                  formControlName="city"
                  placeholder="e.g. Ibadan"
                  class="mt-2 min-h-12 w-full rounded-xl border px-3"
                />
              </div>
              <div>
                <label for="self-region" class="block text-sm font-bold">State / region</label
                ><input
                  id="self-region"
                  formControlName="stateOrRegion"
                  placeholder="e.g. Oyo"
                  class="mt-2 min-h-12 w-full rounded-xl border px-3"
                />
              </div>
              <div>
                <label for="self-postal" class="block text-sm font-bold"
                  >Postal code <span class="font-normal">(optional)</span></label
                ><input
                  id="self-postal"
                  formControlName="postalCode"
                  placeholder="e.g. 200103"
                  class="mt-2 min-h-12 w-full rounded-xl border px-3"
                />
              </div>
              <div>
                <label for="self-country" class="block text-sm font-bold">Country</label
                ><select
                  id="self-country"
                  formControlName="countryCode"
                  class="mt-2 min-h-12 w-full rounded-xl border px-3"
                >
                  <option value="NG">Nigeria</option>
                </select>
              </div>
            </div>
          </fieldset>
        }
        <div>
          <label for="self-note" class="block text-sm font-bold"
            >Additional directions <span class="font-normal">(optional)</span></label
          ><textarea
            id="self-note"
            formControlName="preferredLocationNote"
            placeholder="Landmark, gate instructions, or other directions"
            maxlength="1000"
            class="mt-2 min-h-24 w-full rounded-xl border p-3"
          ></textarea>
        </div>
        @if (reviewing()) {
          <section class="rounded-2xl bg-brand-50 p-6">
            <h2 class="text-xl font-bold">Review your booking</h2>
            <dl class="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt class="text-sm text-slate-600">Package</dt>
                <dd class="font-bold">{{ selectedPackage()?.name }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-600">Fulfilment</dt>
                <dd class="font-bold">{{ selectedMode()?.name }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-600">Appointment</dt>
                <dd class="font-bold">
                  {{
                    utils.formatAppointment(
                      form.value.preferredDate,
                      form.value.preferredTimeWindowStart
                    )
                  }}
                </dd>
              </div>
              <div>
                <dt class="text-sm text-slate-600">Timezone</dt>
                <dd class="font-bold">{{ form.value.preferredTimezone }}</dd>
              </div>
            </dl>
            <p class="mt-4 text-sm text-slate-600">
              Submitting creates an awaiting-funding booking for your authenticated SELF Patient.
            </p>
          </section>
        }
        <div class="flex flex-wrap gap-3">
          @if (reviewing()) {
            <button
              type="button"
              (click)="reviewing.set(false)"
              class="min-h-12 rounded-xl border border-brand-600 px-6 font-bold text-brand-700"
            >
              Edit booking
            </button>
          }
          <button
            type="submit"
            [disabled]="pending()"
            class="min-h-12 rounded-xl bg-brand-700 px-6 font-bold text-white disabled:opacity-60"
          >
            {{
              pending() ? 'Creating booking…' : reviewing() ? 'Confirm booking' : 'Review booking'
            }}
          </button>
        </div>
      </form>
    }
  </main>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientBookingPageComponent {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly packageApi = inject(HealthCheckPackagesApiService);
  private readonly modeApi = inject(FulfilmentModesApiService);
  private readonly api = inject(HealthCheckResultsApiService);
  readonly utils = inject(UtilsService);
  readonly packages = signal<HealthCheckPackage[]>([]);
  readonly modes = signal<FulfilmentMode[]>([]);
  readonly loading = signal(true);
  readonly pending = signal(false);
  readonly reviewing = signal(false);
  readonly error = signal<string | null>(null);
  readonly created = signal<PublicBookingResponse | null>(null);
  readonly form = this.fb.group({
    healthCheckPackageId: ['', Validators.required],
    fulfilmentModeId: ['', Validators.required],
    preferredDate: ['', Validators.required],
    preferredTimeWindowStart: ['', Validators.required],
    preferredTimezone: [
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      Validators.required,
    ],
    preferredLocationNote: ['', Validators.maxLength(1000)],
    visitAddress: this.fb.group({
      addressLine1: [''],
      addressLine2: [''],
      city: [''],
      stateOrRegion: [''],
      postalCode: [''],
      countryCode: ['NG'],
    }),
  });
  readonly selectedMode = computed(
    () => this.modes().find((x) => x.id === this.form.controls.fulfilmentModeId.value) ?? null,
  );
  readonly selectedPackage = computed(
    () =>
      this.packages().find((x) => x.id === this.form.controls.healthCheckPackageId.value) ?? null,
  );
  readonly isHomeVisit = computed(() => this.selectedMode()?.code === 'HOME_VISIT');
  constructor() {
    forkJoin({ packages: this.packageApi.getPackages(), modes: this.modeApi.getFulfilmentModes() })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (x) => {
          this.packages.set(x.packages.filter((p) => p.isActive));
          this.modes.set(x.modes.filter((m) => m.isActive));
        },
        error: () => this.error.set('Booking options are unavailable right now.'),
      });
  }
  continue() {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.reviewing()) {
      this.reviewing.set(true);
      return;
    }
    if (this.pending()) return;
    const v = this.form.getRawValue();
    const a = v.visitAddress;
    if (
      this.isHomeVisit() &&
      (!a.addressLine1.trim() || !a.city.trim() || !a.stateOrRegion.trim())
    ) {
      this.error.set('Complete the required home visit address fields.');
      return;
    }
    this.pending.set(true);
    this.api
      .createMyHealthCheck({
        healthCheckPackageId: v.healthCheckPackageId,
        fulfilmentModeId: v.fulfilmentModeId,
        preferredDate: v.preferredDate,
        preferredTimeWindowStart: v.preferredTimeWindowStart,
        preferredTimezone: v.preferredTimezone.trim(),
        ...(v.preferredLocationNote.trim() && {
          preferredLocationNote: v.preferredLocationNote.trim(),
        }),
        ...(this.isHomeVisit() && {
          visitAddress: {
            addressLine1: a.addressLine1.trim(),
            ...(a.addressLine2.trim() && { addressLine2: a.addressLine2.trim() }),
            city: a.city.trim(),
            stateOrRegion: a.stateOrRegion.trim(),
            ...(a.postalCode.trim() && { postalCode: a.postalCode.trim() }),
            countryCode: a.countryCode,
          },
        }),
      })
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: (b) => this.created.set(b),
        error: (e: HttpErrorResponse) =>
          this.error.set(
            e.status === 0
              ? 'SmartClinic could not be reached. Try again.'
              : 'We could not create this Health Check. Review the details and try again.',
          ),
      });
  }
}

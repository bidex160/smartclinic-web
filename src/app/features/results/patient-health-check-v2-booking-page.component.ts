import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  HealthCheckCataloguePackage,
  HealthCheckConfigurationQuote,
  HealthCheckProviderLocation,
  HealthCheckProviderOffering,
} from '../../core/models/health-check-package.model';
import { PublicBookingResponse } from '../../core/models/public-booking.model';
import { HealthCheckPackagesApiService } from '../../core/services/health-check-packages-api.service';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { formatEarningMoney } from '../provider/provider-earning-presentation';
import { PatientPaymentPanelComponent } from './patient-payment-panel.component';

@Component({
  selector: 'app-patient-health-check-v2-booking-page',
  imports: [ReactiveFormsModule, RouterLink, NgTemplateOutlet, PatientPaymentPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-5xl px-5 py-10 sm:px-8">
    <a routerLink="/me/health-journey" class="font-bold text-brand-700">← Health journey</a>
    <header class="mt-6">
      <p class="font-bold uppercase tracking-wider text-brand-700">Book a Health Check</p>
      <h1 class="mt-2 text-3xl font-bold">Choose your check and provider</h1>
      <p class="mt-2 text-slate-600">
        Availability and pricing are confirmed for your requested time and location.
      </p>
    </header>
    @if (created(); as booking) {
      <section class="mt-7 rounded-2xl border bg-white p-6">
        <h2 class="text-2xl font-bold">Health Check booking created</h2>
        <p class="mt-2">
          Reference: <strong class="font-mono">{{ booking.bookingReference }}</strong>
        </p>
        @if (booking.commercialConfiguration; as commercial) {
          <ng-container
            [ngTemplateOutlet]="breakdown"
            [ngTemplateOutletContext]="{ $implicit: commercial }"
          ></ng-container>
        }
        <div class="mt-6"><app-patient-payment-panel [reference]="booking.bookingReference" /></div>
        <a
          [routerLink]="['/me/health-checks', booking.bookingReference]"
          class="mt-5 inline-flex font-bold text-brand-700"
          >View booking details →</a
        >
      </section>
    } @else {
      @if (catalogueLoading()) {
        <p role="status" class="mt-7 rounded-xl border bg-white p-5">
          Loading Health Check catalogue…
        </p>
      } @else if (catalogueError()) {
        <div role="alert" class="mt-7 rounded-xl bg-red-50 p-5">
          <p>Health Check options are unavailable.</p>
          <button
            type="button"
            (click)="loadCatalogue()"
            class="mt-2 font-bold text-brand-700 underline"
          >
            Try again
          </button>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="discover(1)" class="mt-7 space-y-6">
          <section class="rounded-2xl border bg-white p-6">
            <h2 class="text-xl font-bold">1. Check and appointment</h2>
            <div class="mt-5 grid gap-5 sm:grid-cols-2">
              <label class="font-bold"
                >Health Check<select
                  formControlName="packageCode"
                  (change)="contextChanged()"
                  class="mt-2 min-h-12 w-full rounded-xl border p-3"
                >
                  <option value="">Select Essential or Complete</option>
                  @for (p of packages(); track p.code) {
                    <option [value]="p.code">{{ p.name }}</option>
                  }
                </select></label
              ><label class="font-bold"
                >Fulfilment<select
                  formControlName="fulfilmentModeCode"
                  (change)="contextChanged()"
                  class="mt-2 min-h-12 w-full rounded-xl border p-3"
                >
                  <option value="">Select fulfilment</option>
                  @for (m of modes(); track m.code) {
                    <option [value]="m.code">{{ m.name }}</option>
                  }
                </select></label
              ><label class="font-bold"
                >Preferred date<input
                  type="date"
                  formControlName="preferredDate"
                  (change)="contextChanged()"
                  class="mt-2 min-h-12 w-full rounded-xl border p-3" /></label
              ><label class="font-bold"
                >Preferred time<input
                  type="time"
                  formControlName="preferredTime"
                  (change)="contextChanged()"
                  class="mt-2 min-h-12 w-full rounded-xl border p-3" /></label
              ><label class="font-bold"
                >Timezone<input
                  formControlName="timezone"
                  (input)="contextChanged()"
                  placeholder="e.g. Africa/Lagos"
                  class="mt-2 min-h-12 w-full rounded-xl border p-3"
              /></label>
            </div>
          </section>
          <section formGroupName="address" class="rounded-2xl border bg-white p-6">
            <h2 class="text-xl font-bold">2. Your location</h2>
            <p class="mt-2 text-sm text-slate-600">
              Used to check whether providers can serve your requested appointment.
            </p>
            <div class="mt-5 grid gap-5 sm:grid-cols-2">
              <label class="font-bold"
                >Address line 1<input
                  formControlName="addressLine1"
                  (input)="contextChanged()"
                  placeholder="e.g. 12 Ring Road"
                  class="mt-2 min-h-12 w-full rounded-xl border p-3" /></label
              ><label class="font-bold"
                >Address line 2 (optional)<input
                  formControlName="addressLine2"
                  (input)="contextChanged()"
                  placeholder="Apartment, suite or landmark"
                  class="mt-2 min-h-12 w-full rounded-xl border p-3" /></label
              ><label class="font-bold"
                >Country code<input
                  formControlName="countryCode"
                  (input)="contextChanged()"
                  maxlength="2"
                  placeholder="e.g. NG"
                  class="mt-2 min-h-12 w-full rounded-xl border p-3 uppercase" /></label
              ><label class="font-bold"
                >State / region<input
                  formControlName="stateOrRegion"
                  (input)="contextChanged()"
                  placeholder="e.g. Lagos"
                  class="mt-2 min-h-12 w-full rounded-xl border p-3" /></label
              ><label class="font-bold"
                >City / area<input
                  formControlName="city"
                  (input)="contextChanged()"
                  placeholder="e.g. Ikeja"
                  class="mt-2 min-h-12 w-full rounded-xl border p-3" /></label
              ><label class="font-bold"
                >Postal code (optional)<input
                  formControlName="postalCode"
                  (input)="contextChanged()"
                  placeholder="e.g. 100001"
                  class="mt-2 min-h-12 w-full rounded-xl border p-3"
              /></label>
            </div>
          </section>
          <button
            type="submit"
            [disabled]="form.invalid || discovering()"
            class="min-h-12 rounded-xl bg-brand-700 px-6 font-bold text-white disabled:opacity-50"
          >
            {{ discovering() ? 'Finding providers…' : 'Find available providers' }}
          </button>
        </form>
        @if (discoveryError()) {
          <div #blockingError tabindex="-1" role="alert" class="mt-6 rounded-xl bg-red-50 p-5">
            <p>{{ discoveryError() }}</p>
            <button
              type="button"
              (click)="discover(page())"
              class="mt-2 font-bold text-brand-700 underline"
            >
              Try again
            </button>
          </div>
        } @else if (discovered() && !offerings().length) {
          <section class="mt-6 rounded-2xl border bg-white p-6">
            <h2 class="text-xl font-bold">No providers available</h2>
            <p class="mt-2 text-slate-600">
              No providers are available for this package, location and time yet. Change your date,
              time, fulfilment, or location and try again.
            </p>
          </section>
        } @else if (offerings().length) {
          <section class="mt-8">
            <h2 class="text-2xl font-bold">3. Choose a provider</h2>
            <div class="mt-4 grid gap-4">
              @for (o of offerings(); track offeringKey(o)) {
                <button
                  type="button"
                  (click)="selectOffering(o)"
                  class="rounded-2xl border bg-white p-5 text-left focus:ring-4 focus:ring-brand-200"
                  [class.ring-4]="selectedOffering() === o"
                >
                  <span class="text-xl font-bold">{{ o.providerName }}</span
                  ><span class="mt-2 block"
                    >{{ o.fulfilmentMode.name }} ·
                    {{ money(o.basePackagePriceMinor, o.currency) }}</span
                  ><span class="mt-1 block text-sm text-slate-600"
                    >Fulfilment fee:
                    {{ money(o.fulfilmentMode.fulfilmentFeeMinor, o.currency) }}</span
                  >
                </button>
              }
            </div>
            <div class="mt-4 flex justify-between">
              <button
                type="button"
                (click)="discover(page() - 1)"
                [disabled]="page() <= 1"
                class="rounded-lg border px-4 py-2 font-bold disabled:opacity-40"
              >
                Previous</button
              ><span>Page {{ page() }} of {{ totalPages() || 1 }}</span
              ><button
                type="button"
                (click)="discover(page() + 1)"
                [disabled]="page() >= totalPages()"
                class="rounded-lg border px-4 py-2 font-bold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </section>
        }
        @if (selectedOffering(); as offering) {
          <section class="mt-8 rounded-2xl border bg-white p-6">
            <h2 class="text-2xl font-bold">4. Configure your check</h2>
            @if (offering.fulfilmentMode.code === 'PROVIDER_LOCATION') {
              <fieldset class="mt-5">
                <legend class="font-bold">Provider location</legend>
                @for (location of offering.locations; track location.reference) {
                  <label class="mt-3 flex cursor-pointer gap-3 rounded-xl border p-4"
                    ><input
                      type="radio"
                      name="provider-location"
                      [checked]="selectedLocation()?.reference === location.reference"
                      (change)="selectLocation(location)"
                    /><span
                      ><strong>{{ location.name }}</strong
                      ><span class="block text-sm"
                        >{{ location.addressLine1 }}, {{ location.city }},
                        {{ location.stateOrRegion }}</span
                      ></span
                    ></label
                  >
                }
              </fieldset>
            }
            @if (offering.addons.length) {
              <fieldset class="mt-6">
                <legend class="font-bold">Optional clinical add-ons</legend>
                @for (addon of offering.addons; track addon.code) {
                  <label
                    class="mt-3 flex cursor-pointer justify-between gap-4 rounded-xl border p-4"
                    ><span
                      ><input
                        type="checkbox"
                        class="mr-3"
                        [checked]="addonSelected(addon.code)"
                        (change)="toggleAddon(addon.code)"
                      /><strong>{{ addon.name }}</strong></span
                    ><span>{{ money(addon.priceMinor, addon.currency) }}</span></label
                  >
                }
              </fieldset>
            } @else {
              <p class="mt-5 text-sm text-slate-600">
                No optional clinical add-ons are available for this offering.
              </p>
            }
            <button
              type="button"
              (click)="requestQuote()"
              [disabled]="
                quoting() ||
                (offering.fulfilmentMode.code === 'PROVIDER_LOCATION' && !selectedLocation())
              "
              class="mt-6 min-h-12 rounded-xl bg-brand-700 px-6 font-bold text-white disabled:opacity-50"
            >
              {{ quoting() ? 'Refreshing quote…' : 'Get authoritative quote' }}
            </button>
            @if (quoteError()) {
              <p role="alert" class="mt-4 text-red-800">{{ quoteError() }}</p>
            }
          </section>
        }
        @if (quote(); as q) {
          <section
            class="mt-8 rounded-2xl border-2 border-brand-300 bg-white p-6"
            aria-live="polite"
          >
            <h2 class="text-2xl font-bold">Review your quoted configuration</h2>
            <p class="mt-2 text-sm text-slate-600">
              Pricing valid until {{ dateTime(q.expiresAt) }}. The backend validates validity again
              when you book.
            </p>
            <ng-container
              [ngTemplateOutlet]="breakdown"
              [ngTemplateOutletContext]="{ $implicit: q }"
            ></ng-container
            ><button
              type="button"
              (click)="reviewing.set(true)"
              class="mt-6 min-h-12 rounded-xl bg-brand-700 px-6 font-bold text-white"
            >
              Continue to review
            </button>
          </section>
        }
        @if (reviewing() && quote(); as q) {
          <section class="mt-8 rounded-2xl border bg-white p-6">
            <h2 class="text-2xl font-bold">Final booking review</h2>
            <dl class="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <dt class="text-sm text-slate-600">Package</dt>
                <dd class="font-bold">{{ q.package.name }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-600">Provider</dt>
                <dd class="font-bold">{{ q.provider.name }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-600">Fulfilment</dt>
                <dd class="font-bold">{{ q.fulfilmentMode.name }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-600">Appointment</dt>
                <dd class="font-bold">
                  {{ form.value.preferredDate }} at {{ form.value.preferredTime }}
                </dd>
              </div>
            </dl>
            @if (q.includedContents.length) {
              <h3 class="mt-5 font-bold">Included contents</h3>
              <ul class="mt-2 list-disc pl-5">
                @for (c of q.includedContents; track c.code) {
                  <li>{{ c.name }}</li>
                }
              </ul>
            }
            <ng-container
              [ngTemplateOutlet]="breakdown"
              [ngTemplateOutletContext]="{ $implicit: q }"
            ></ng-container>
            <div class="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                (click)="reviewing.set(false)"
                class="min-h-12 rounded-xl border px-5 font-bold"
              >
                Back</button
              ><button
                type="button"
                (click)="createBooking()"
                [disabled]="creating()"
                class="min-h-12 rounded-xl bg-brand-700 px-6 font-bold text-white disabled:opacity-50"
              >
                {{ creating() ? 'Creating booking…' : 'Confirm booking' }}
              </button>
            </div>
            @if (createError()) {
              <p role="alert" class="mt-4 text-red-800">{{ createError() }}</p>
            }
          </section>
        }
      }
    }
    <ng-template #breakdown let-c
      ><section class="mt-5 rounded-xl bg-brand-50 p-5">
        <h3 class="font-bold">Commercial breakdown</h3>
        <dl class="mt-3 grid gap-2">
          <div class="flex justify-between">
            <dt>{{ c.package.name }}</dt>
            <dd>{{ money(c.pricing.basePackagePriceMinor, c.pricing.currency) }}</dd>
          </div>
          @for (a of c.selectedAddons; track a.code) {
            <div class="flex justify-between">
              <dt>{{ a.name }}</dt>
              <dd>{{ money(a.amountMinor, c.pricing.currency) }}</dd>
            </div>
          }
          <div class="flex justify-between">
            <dt>Clinical add-ons total</dt>
            <dd>{{ money(c.pricing.clinicalAddonsTotalMinor, c.pricing.currency) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt>{{ c.fulfilmentMode.name }}</dt>
            <dd>{{ money(c.pricing.fulfilmentFeeMinor, c.pricing.currency) }}</dd>
          </div>
          <div class="flex justify-between border-t pt-2 text-lg font-bold">
            <dt>Total</dt>
            <dd>{{ money(c.pricing.totalMinor, c.pricing.currency) }}</dd>
          </div>
        </dl>
      </section></ng-template
    >
  </main>`,
})
export class PatientHealthCheckV2BookingPageComponent {
  private readonly api = inject(HealthCheckPackagesApiService);
  private readonly bookings = inject(HealthCheckResultsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly packages = signal<readonly HealthCheckCataloguePackage[]>([]);
  readonly catalogueLoading = signal(true);
  readonly catalogueError = signal(false);
  readonly discovering = signal(false);
  readonly discovered = signal(false);
  readonly discoveryError = signal('');
  readonly offerings = signal<readonly HealthCheckProviderOffering[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly selectedOffering = signal<HealthCheckProviderOffering | null>(null);
  readonly selectedLocation = signal<HealthCheckProviderLocation | null>(null);
  readonly selectedAddons = signal<readonly string[]>([]);
  readonly quoting = signal(false);
  readonly quote = signal<HealthCheckConfigurationQuote | null>(null);
  readonly quoteError = signal('');
  readonly reviewing = signal(false);
  readonly creating = signal(false);
  readonly createError = signal('');
  readonly created = signal<PublicBookingResponse | null>(null);
  private quoteRequest = 0;
  private discoveryRequest = 0;
  readonly money = formatEarningMoney;
  readonly form = this.fb.nonNullable.group({
    packageCode: ['', Validators.required],
    fulfilmentModeCode: ['', Validators.required],
    preferredDate: ['', Validators.required],
    preferredTime: ['', Validators.required],
    timezone: ['Africa/Lagos', Validators.required],
    address: this.fb.nonNullable.group({
      addressLine1: ['', Validators.required],
      addressLine2: '',
      countryCode: ['NG', [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)]],
      stateOrRegion: ['', Validators.required],
      city: ['', Validators.required],
      postalCode: '',
    }),
  });
  constructor() {
    this.loadCatalogue();
  }
  readonly modes = () => {
    const p = this.packages().find((x) => x.code === this.form.controls.packageCode.value);
    return (
      p?.fulfilmentModes.filter((x) => x.code === 'PROVIDER_LOCATION' || x.code === 'HOME_VISIT') ??
      []
    );
  };
  loadCatalogue() {
    this.catalogueLoading.set(true);
    this.catalogueError.set(false);
    this.api
      .getCatalogue()
      .pipe(finalize(() => this.catalogueLoading.set(false)))
      .subscribe({
        next: (v) => {
          const allowed = v.filter((x) => x.code === 'ESSENTIAL' || x.code === 'COMPLETE');
          this.packages.set(allowed);
          const requested = this.route.snapshot.queryParamMap.get('package');
          if (requested && allowed.some((x) => x.code === requested))
            this.form.controls.packageCode.setValue(requested);
        },
        error: () => this.catalogueError.set(true),
      });
  }
  contextChanged() {
    this.discoveryRequest++;
    this.offerings.set([]);
    this.discovered.set(false);
    this.selectedOffering.set(null);
    this.selectedLocation.set(null);
    this.selectedAddons.set([]);
    this.invalidateQuote();
  }
  discover(page: number) {
    if (this.form.invalid || page < 1) return;
    const v = this.form.getRawValue();
    this.discovering.set(true);
    const request = ++this.discoveryRequest;
    this.discoveryError.set('');
    this.api
      .discoverProviders({
        packageCode: v.packageCode as 'ESSENTIAL' | 'COMPLETE',
        fulfilmentModeCode: v.fulfilmentModeCode as 'PROVIDER_LOCATION' | 'HOME_VISIT',
        preferredDate: v.preferredDate,
        preferredTime: v.preferredTime,
        timezone: v.timezone,
        countryCode: v.address.countryCode.toUpperCase(),
        stateOrRegion: v.address.stateOrRegion,
        city: v.address.city,
        ...(v.address.postalCode && { postalCode: v.address.postalCode }),
        page,
        limit: 10,
      })
      .pipe(
        finalize(() => {
          if (request === this.discoveryRequest) this.discovering.set(false);
        }),
      )
      .subscribe({
        next: (r) => {
          if (request !== this.discoveryRequest) return;
          this.offerings.set(r.items);
          this.page.set(r.page);
          this.totalPages.set(r.totalPages);
          this.discovered.set(true);
          this.selectedOffering.set(null);
          this.invalidateQuote();
        },
        error: () => {
          if (request !== this.discoveryRequest) return;
          this.discoveryError.set(
            'Available providers could not be loaded. Review your appointment and location, then try again.',
          );
          queueMicrotask(() =>
            this.host.nativeElement.querySelector<HTMLElement>('[role=alert]')?.focus(),
          );
        },
      });
  }
  selectOffering(v: HealthCheckProviderOffering) {
    this.selectedOffering.set(v);
    this.selectedLocation.set(null);
    this.selectedAddons.set([]);
    this.invalidateQuote();
  }
  selectLocation(v: HealthCheckProviderLocation) {
    this.selectedLocation.set(v);
    this.invalidateQuote();
  }
  addonSelected(code: string) {
    return this.selectedAddons().includes(code);
  }
  toggleAddon(code: string) {
    const current = this.selectedAddons();
    this.selectedAddons.set(
      current.includes(code) ? current.filter((x) => x !== code) : [...current, code],
    );
    this.invalidateQuote();
  }
  invalidateQuote() {
    this.quoteRequest++;
    this.quote.set(null);
    this.reviewing.set(false);
    this.quoteError.set('');
  }
  requestQuote() {
    const o = this.selectedOffering(),
      l = this.selectedLocation();
    if (!o || (o.fulfilmentMode.code === 'PROVIDER_LOCATION' && !l)) return;
    const request = ++this.quoteRequest;
    this.quoting.set(true);
    this.quoteError.set('');
    this.api
      .getConfigurationQuote({
        packageCode: o.packageCode,
        providerReference: o.providerReference,
        ...(o.fulfilmentMode.code === 'PROVIDER_LOCATION' && l
          ? { providerLocationReference: l.reference }
          : {}),
        fulfilmentModeCode: o.fulfilmentMode.code,
        addonCodes: [...new Set(this.selectedAddons())],
      })
      .pipe(
        finalize(() => {
          if (request === this.quoteRequest) this.quoting.set(false);
        }),
      )
      .subscribe({
        next: (q) => {
          if (request === this.quoteRequest) this.quote.set(q);
        },
        error: () => {
          if (request === this.quoteRequest) {
            this.quote.set(null);
            this.quoteError.set(
              'This configuration is no longer available. Refresh providers and choose again.',
            );
          }
        },
      });
  }
  createBooking() {
    const q = this.quote();
    if (!q || this.creating()) return;
    const v = this.form.getRawValue();
    this.creating.set(true);
    this.createError.set('');
    this.bookings
      .createMyHealthCheck({
        configurationReference: q.configurationReference,
        preferredDate: v.preferredDate,
        preferredTimeWindowStart: v.preferredTime,
        preferredTimezone: v.timezone,
        visitAddress: {
          addressLine1: v.address.addressLine1,
          ...(v.address.addressLine2 && { addressLine2: v.address.addressLine2 }),
          city: v.address.city,
          stateOrRegion: v.address.stateOrRegion,
          ...(v.address.postalCode && { postalCode: v.address.postalCode }),
          countryCode: v.address.countryCode.toUpperCase(),
        },
      })
      .pipe(finalize(() => this.creating.set(false)))
      .subscribe({
        next: (b) => this.created.set(b),
        error: () => {
          this.createError.set(
            'This quoted option is no longer available. Return to provider selection and request a new quote.',
          );
          this.invalidateQuote();
        },
      });
  }
  offeringKey(o: HealthCheckProviderOffering) {
    return `${o.providerReference}:${o.fulfilmentMode.code}`;
  }
  dateTime(v: string | undefined) {
    return v
      ? new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(
          new Date(v),
        )
      : 'Not available';
  }
}

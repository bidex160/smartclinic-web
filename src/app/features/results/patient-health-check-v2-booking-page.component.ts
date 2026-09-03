import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ICity, IState } from 'country-state-city';
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
import { LocationDataService } from '../../core/services/location-data.service';
import { formatEarningMoney } from '../provider/provider-earning-presentation';
import { PatientPaymentPanelComponent } from './patient-payment-panel.component';

type BookingStep = 1 | 2 | 3 | 4;

@Component({
  selector: 'app-patient-health-check-v2-booking-page',
  imports: [ReactiveFormsModule, RouterLink, NgTemplateOutlet, PatientPaymentPanelComponent],
  templateUrl: './patient-health-check-v2-booking-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientHealthCheckV2BookingPageComponent {
  private readonly api = inject(HealthCheckPackagesApiService);
  private readonly bookings = inject(HealthCheckResultsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly locations = inject(LocationDataService);

  readonly steps = ['Appointment', 'Provider', 'Customise', 'Review & Pay'] as const;
  readonly currentStep = signal<BookingStep>(1);
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
  readonly creating = signal(false);
  readonly createError = signal('');
  readonly created = signal<PublicBookingResponse | null>(null);
  readonly states = signal<readonly IState[]>([]);
  readonly cities = signal<readonly ICity[]>([]);
  readonly money = formatEarningMoney;
  private quoteRequest = 0;
  private discoveryRequest = 0;

  readonly form = this.fb.nonNullable.group({
    packageCode: ['', Validators.required],
    fulfilmentModeCode: ['', Validators.required],
    preferredDate: ['', Validators.required],
    preferredTime: ['', Validators.required],
    timezone: ['Africa/Lagos', Validators.required],
    address: this.fb.nonNullable.group({
      addressLine1: [''],
      addressLine2: '',
      countryCode: ['NG', [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)]],
      stateOrRegion: ['', Validators.required],
      city: [{ value: '', disabled: true }, Validators.required],
      postalCode: '',
    }),
  });

  constructor() {
    this.states.set(this.locations.getStates('NG'));
    this.loadCatalogue();
  }

  readonly modes = () => {
    const selected = this.packages().find(
      (item) => item.code === this.form.controls.packageCode.value,
    );
    return (
      selected?.fulfilmentModes.filter(
        (mode) => mode.code === 'PROVIDER_LOCATION' || mode.code === 'HOME_VISIT',
      ) ?? []
    );
  };

  isHomeVisit(): boolean {
    return this.form.controls.fulfilmentModeCode.value === 'HOME_VISIT';
  }

  loadCatalogue(): void {
    this.catalogueLoading.set(true);
    this.catalogueError.set(false);
    this.api
      .getCatalogue()
      .pipe(finalize(() => this.catalogueLoading.set(false)))
      .subscribe({
        next: (items) => {
          const allowed = items.filter(
            (item) => item.code === 'ESSENTIAL' || item.code === 'COMPLETE',
          );
          this.packages.set(allowed);
          const requested = this.route.snapshot.queryParamMap.get('package');
          if (requested && allowed.some((item) => item.code === requested))
            this.form.controls.packageCode.setValue(requested);
        },
        error: () => this.catalogueError.set(true),
      });
  }

  packageChanged(): void {
    const mode = this.form.controls.fulfilmentModeCode;
    if (!this.modes().some((item) => item.code === mode.value)) mode.setValue('');
    this.contextChanged();
  }

  fulfilmentChanged(): void {
    const street = this.form.controls.address.controls.addressLine1;
    if (this.isHomeVisit()) street.addValidators(Validators.required);
    else {
      street.removeValidators(Validators.required);
      street.setValue('');
      this.form.controls.address.controls.addressLine2.setValue('');
      this.form.controls.address.controls.postalCode.setValue('');
    }
    street.updateValueAndValidity();
    this.contextChanged();
  }

  stateChanged(stateName: string): void {
    const city = this.form.controls.address.controls.city;
    city.enable({ emitEvent: false });
    city.setValue('');
    if (!stateName) city.disable({ emitEvent: false });
    this.form.controls.address.controls.stateOrRegion.setValue(stateName);
    this.cities.set(this.locations.getCities('NG', stateName));
    this.contextChanged();
  }

  contextChanged(): void {
    this.discoveryRequest++;
    this.offerings.set([]);
    this.discovered.set(false);
    this.selectedOffering.set(null);
    this.selectedLocation.set(null);
    this.selectedAddons.set([]);
    this.invalidateQuote();
  }

  discover(page: number): void {
    if (this.form.invalid || page < 1) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.discovering.set(true);
    const request = ++this.discoveryRequest;
    this.discoveryError.set('');
    this.api
      .discoverProviders({
        packageCode: value.packageCode as 'ESSENTIAL' | 'COMPLETE',
        fulfilmentModeCode: value.fulfilmentModeCode as 'PROVIDER_LOCATION' | 'HOME_VISIT',
        preferredDate: value.preferredDate,
        preferredTime: value.preferredTime,
        timezone: value.timezone,
        countryCode: value.address.countryCode.toUpperCase(),
        stateOrRegion: value.address.stateOrRegion,
        city: value.address.city,
        ...(value.address.postalCode && { postalCode: value.address.postalCode }),
        page,
        limit: 10,
      })
      .pipe(
        finalize(() => {
          if (request === this.discoveryRequest) this.discovering.set(false);
        }),
      )
      .subscribe({
        next: (result) => {
          if (request !== this.discoveryRequest) return;
          this.offerings.set(result.items);
          this.page.set(result.page);
          this.totalPages.set(result.totalPages);
          this.discovered.set(true);
          this.selectedOffering.set(null);
          this.invalidateQuote();
          if (result.items.length) this.goToStep(2);
        },
        error: () => {
          if (request !== this.discoveryRequest) return;
          this.discoveryError.set(
            'Available providers could not be loaded. Review your appointment and location, then try again.',
          );
          this.focusCurrentStep();
        },
      });
  }

  selectOffering(offering: HealthCheckProviderOffering): void {
    this.selectedOffering.set(offering);
    this.selectedLocation.set(null);
    this.selectedAddons.set([]);
    this.invalidateQuote();
  }

  continueToCustomise(): void {
    if (this.selectedOffering()) this.goToStep(3);
  }

  selectLocation(location: HealthCheckProviderLocation): void {
    this.selectedLocation.set(location);
    this.invalidateQuote();
  }

  addonSelected(code: string): boolean {
    return this.selectedAddons().includes(code);
  }

  toggleAddon(code: string): void {
    const current = this.selectedAddons();
    this.selectedAddons.set(
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code],
    );
    this.invalidateQuote();
  }

  invalidateQuote(): void {
    this.quoteRequest++;
    this.quote.set(null);
    this.quoteError.set('');
    this.created.set(null);
  }

  reviewBooking(): void {
    const offering = this.selectedOffering();
    const location = this.selectedLocation();
    if (!offering || (offering.fulfilmentMode.code === 'PROVIDER_LOCATION' && !location)) return;
    const request = ++this.quoteRequest;
    this.quoting.set(true);
    this.quoteError.set('');
    this.api
      .getConfigurationQuote({
        packageCode: offering.packageCode,
        providerReference: offering.providerReference,
        ...(offering.fulfilmentMode.code === 'PROVIDER_LOCATION' && location
          ? { providerLocationReference: location.reference }
          : {}),
        fulfilmentModeCode: offering.fulfilmentMode.code,
        addonCodes: [...new Set(this.selectedAddons())],
      })
      .pipe(
        finalize(() => {
          if (request === this.quoteRequest) this.quoting.set(false);
        }),
      )
      .subscribe({
        next: (result) => {
          if (request !== this.quoteRequest) return;
          this.quote.set(result);
          this.goToStep(4);
        },
        error: () => {
          if (request !== this.quoteRequest) return;
          this.quote.set(null);
          this.quoteError.set(
            'This option is no longer available. Review your provider, location or add-ons and try again.',
          );
          this.focusCurrentStep();
        },
      });
  }

  createBooking(): void {
    const confirmed = this.quote();
    if (!confirmed?.configurationReference || this.creating()) return;
    const value = this.form.getRawValue();
    this.creating.set(true);
    this.createError.set('');
    this.bookings
      .createMyHealthCheck({
        configurationReference: confirmed.configurationReference,
        preferredDate: value.preferredDate,
        preferredTimeWindowStart: value.preferredTime,
        preferredTimezone: value.timezone,
        ...(confirmed.fulfilmentMode.code === 'HOME_VISIT'
          ? {
              visitAddress: {
                addressLine1: value.address.addressLine1,
                ...(value.address.addressLine2 && { addressLine2: value.address.addressLine2 }),
                city: value.address.city,
                stateOrRegion: value.address.stateOrRegion,
                ...(value.address.postalCode && { postalCode: value.address.postalCode }),
                countryCode: value.address.countryCode.toUpperCase(),
              },
            }
          : {}),
      })
      .pipe(finalize(() => this.creating.set(false)))
      .subscribe({
        next: (booking) => {
          this.created.set(booking);
          queueMicrotask(() => {
            const payment = this.host.nativeElement.querySelector<HTMLElement>('#booking-payment');
            payment?.focus();
            if (typeof payment?.scrollIntoView === 'function')
              payment.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        },
        error: () => {
          this.createError.set(
            'This option is no longer available. Return to Customise and confirm your choices again.',
          );
          this.invalidateQuote();
          this.goToStep(3);
        },
      });
  }

  backTo(step: BookingStep): void {
    this.goToStep(step);
  }

  offeringKey(offering: HealthCheckProviderOffering): string {
    return `${offering.providerReference}:${offering.fulfilmentMode.code}`;
  }

  private goToStep(step: BookingStep): void {
    this.currentStep.set(step);
    this.focusCurrentStep();
  }

  private focusCurrentStep(): void {
    queueMicrotask(() => {
      const content = this.host.nativeElement.querySelector<HTMLElement>('#booking-step-content');
      content?.focus();
      if (typeof content?.scrollIntoView === 'function')
        content.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

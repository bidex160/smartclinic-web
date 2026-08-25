import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { forkJoin, finalize, Observable } from 'rxjs';
import { FulfilmentMode } from '../../core/models/fulfilment-mode.model';
import { HealthCheckPackage } from '../../core/models/health-check-package.model';
import {
  DayOfWeek,
  ProviderAvailability,
  ProviderAvailabilityException,
  ProviderLocation,
  ProviderService,
} from '../../core/models/provider-eligibility.model';
import { FulfilmentModesApiService } from '../../core/services/fulfilment-modes-api.service';
import { HealthCheckPackagesApiService } from '../../core/services/health-check-packages-api.service';
import { ProviderEligibilityApiService } from '../../core/services/provider-eligibility-api.service';
import { ICountry, Country, IState, ICity, City, State } from 'country-state-city';

type Tab = 'services' | 'locations' | 'availability' | 'exceptions';
interface PendingAction {
  label: string;
  run: () => Observable<unknown>;
  refresh: 'services' | 'locations' | 'availability' | 'exceptions';
  success: string;
}
function orderedTimes(control: AbstractControl): ValidationErrors | null {
  const start = control.get('startTime')?.value as string;
  const end = control.get('endTime')?.value as string;
  const stop = control.get('bookingStopTime')?.value as string;
  if (start && end && start >= end) return { timeOrder: true };
  if (stop && start && end && (stop <= start || stop > end)) return { bookingStopOrder: true };
  return null;
}
function pairedTimes(control: AbstractControl): ValidationErrors | null {
  const start = control.get('startTime')?.value as string;
  const end = control.get('endTime')?.value as string;
  if (!!start !== !!end) return { pairedTimes: true };
  return start && end && start >= end ? { timeOrder: true } : null;
}

@Component({
  selector: 'app-provider-eligibility-config',
  imports: [ReactiveFormsModule],
  templateUrl: './provider-eligibility-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderEligibilityConfigComponent implements OnInit {
  readonly providerId = input.required<string>();
  readonly providerActive = input.required<boolean>();
  readonly providerApproved = input.required<boolean>();
  readonly editable = input(true);
  readonly showReadiness = input(true);
  readonly changed = output<void>();
  private readonly api = inject(ProviderEligibilityApiService);
  private readonly packagesApi = inject(HealthCheckPackagesApiService);
  private readonly modesApi = inject(FulfilmentModesApiService);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('configError');
  readonly activeTab = signal<Tab>('services');
  readonly loading = signal(true);
  readonly mutating = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly packages = signal<HealthCheckPackage[]>([]);
  readonly modes = signal<FulfilmentMode[]>([]);
  readonly services = signal<ProviderService[]>([]);
  readonly locations = signal<ProviderLocation[]>([]);
  readonly availability = signal<ProviderAvailability[]>([]);
  readonly exceptions = signal<ProviderAvailabilityException[]>([]);
  readonly pendingAction = signal<PendingAction | null>(null);
  readonly editingLocation = signal<string | null>(null);
  readonly editingException = signal<string | null>(null);
  readonly weekdays: readonly DayOfWeek[] = [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY',
  ];
  readonly activeServices = computed(() => this.services().filter((x) => x.isActive));
  readonly activeLocations = computed(() => this.locations().filter((x) => x.isActive));
  readonly providerLocationServices = computed(() =>
    this.services().filter((s) => this.mode(s.fulfilmentModeId)?.code === 'PROVIDER_LOCATION'),
  );
  readonly activeProviderLocationServices = computed(() =>
    this.providerLocationServices().filter((service) => service.isActive),
  );
  readonly activeLinks = computed(() =>
    this.providerLocationServices()
      .filter((s) => s.isActive)
      .reduce(
        (count, s) =>
          count +
          s.providerLocationIds.filter((id) => this.activeLocations().some((l) => l.id === id))
            .length,
        0,
      ),
  );
  readonly blockers = computed(() => {
    const b: string[] = [];
    if (!this.providerApproved()) b.push('Provider onboarding is not approved');
    if (!this.providerActive()) b.push('Provider is not operationally active');
    if (!this.activeServices().length) b.push('No active service capability');
    if (!this.activeProviderLocationServices().length)
      b.push('No active provider-location capability');
    if (!this.activeLocations().length) b.push('No active provider location');
    if (
      this.providerLocationServices().some(
        (s) =>
          s.isActive &&
          !s.providerLocationIds.some((id) => this.activeLocations().some((l) => l.id === id)),
      )
    )
      b.push('An active provider-location capability has no active linked location');
    const providerLocationServiceIds = this.activeProviderLocationServices().map((item) => item.id);
    const linkedLocationIds = this.activeProviderLocationServices().flatMap(
      (item) => item.providerLocationIds,
    );
    if (
      !this.availability().some(
        (item) =>
          item.isActive &&
          (item.providerServiceId === null ||
            providerLocationServiceIds.includes(item.providerServiceId)) &&
          (item.providerLocationId === null || linkedLocationIds.includes(item.providerLocationId)),
      )
    )
      b.push('No weekly availability covering an active provider-location service');
    return b;
  });
  readonly serviceForm = this.fb.group({
    healthCheckPackageId: ['', Validators.required],
    fulfilmentModeId: ['', Validators.required],
  });
  readonly locationForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    addressLine1: ['', [Validators.required, Validators.maxLength(255)]],
    addressLine2: ['', Validators.maxLength(255)],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
    postalCode: ['', Validators.maxLength(30)],
    countryCode: ['NG', [Validators.required]],
  });
  readonly availabilityForm = this.fb.group(
    {
      dayOfWeek: this.fb.control<DayOfWeek>('MONDAY'),
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      bookingStopTime: [''],
      timezone: [Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', Validators.required],
      providerServiceId: [''],
      providerLocationId: [''],
    },
    { validators: orderedTimes },
  );
  readonly exceptionForm = this.fb.group(
    {
      date: ['', Validators.required],
      type: this.fb.control<'AVAILABLE' | 'UNAVAILABLE'>('UNAVAILABLE'),
      fullDay: [true],
      startTime: [''],
      endTime: [''],
      timezone: [Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', Validators.required],
      providerServiceId: [''],
      providerLocationId: [''],
      reason: ['', Validators.maxLength(500)],
    },
    { validators: pairedTimes },
  );
  readonly countries: ICountry[] =
  Country.getAllCountries();

locationStates: IState[] = [];
locationCities: ICity[] = [];

selectedLocationStateCode = '';
  ngOnInit() {
    this.loadAll();
    this.onLocationCountryChange('NG')
  }
  selectTab(tab: Tab) {
    this.activeTab.set(tab);
  }
  package(id: string) {
    return this.packages().find((x) => x.id === id);
  }
  mode(id: string) {
    return this.modes().find((x) => x.id === id);
  }
  location(id: string) {
    return this.locations().find((x) => x.id === id);
  }
  service(id: string) {
    return this.services().find((x) => x.id === id);
  }
  loadAll() {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      packages: this.packagesApi.getPackages(),
      modes: this.modesApi.getFulfilmentModes(),
      services: this.api.listServices(this.providerId()),
      locations: this.api.listLocations(this.providerId()),
      availability: this.api.listAvailability(this.providerId()),
      exceptions: this.api.listExceptions(this.providerId()),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (r) => {
          this.packages.set(r.packages);
          this.modes.set(r.modes);
          this.services.set(r.services);
          this.locations.set(r.locations);
          this.availability.set(r.availability);
          this.exceptions.set(r.exceptions);
        },
        error: (e) => this.handle(e, 'Provider configuration could not be loaded.'),
      });
  }
  createService() {
    if (!this.editable() || this.serviceForm.invalid || this.mutating()) {
      this.serviceForm.markAllAsTouched();
      return;
    }
    this.mutate(
      this.api.createService(this.providerId(), this.serviceForm.getRawValue()),
      'Capability added.',
      'services',
      () => this.serviceForm.reset(),
    );
  }
  createLocation() {
    if (!this.editable() || this.locationForm.invalid || this.mutating()) {
      this.locationForm.markAllAsTouched();
      return;
    }
    const v = this.locationForm.getRawValue();
    const body = {
      name: v.name.trim(),
      addressLine1: v.addressLine1.trim(),
      ...(v.addressLine2.trim() && { addressLine2: v.addressLine2.trim() }),
      city: v.city.trim(),
      state: v.state.trim(),
      ...(v.postalCode.trim() && { postalCode: v.postalCode.trim() }),
      countryCode: v.countryCode.toUpperCase(),
    };
    const operation = this.editingLocation()
      ? this.api.updateLocation(this.editingLocation()!, body)
      : this.api.createLocation(this.providerId(), body);
    this.mutate(
      operation,
      this.editingLocation() ? 'Location updated.' : 'Location added.',
      'locations',
      () => {
        this.editingLocation.set(null);
        this.locationForm.reset({ countryCode: 'NG' });
      },
    );
  }
  editLocation(value: ProviderLocation) {
    this.editingLocation.set(value.id);
    this.locationForm.setValue({
      name: value.name,
      addressLine1: value.addressLine1,
      addressLine2: value.addressLine2 ?? '',
      city: value.city,
      state: value.state,
      postalCode: value.postalCode ?? '',
      countryCode: value.countryCode,
    });
    this.activeTab.set('locations');
  }
  createAvailability() {
    if (!this.editable() || this.availabilityForm.invalid || this.mutating()) {
      this.availabilityForm.markAllAsTouched();
      return;
    }
    const v = this.availabilityForm.getRawValue();
    this.mutate(
      this.api.createAvailability(this.providerId(), {
        dayOfWeek: v.dayOfWeek,
        startTime: v.startTime,
        endTime: v.endTime,
        bookingStopTime: v.bookingStopTime || null,
        timezone: v.timezone.trim(),
        providerServiceId: v.providerServiceId || null,
        providerLocationId: v.providerLocationId || null,
      }),
      'Weekly availability added.',
      'availability',
      () =>
        this.availabilityForm.reset({
          dayOfWeek: 'MONDAY',
          bookingStopTime: '',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        }),
    );
  }
  createException() {
    if (!this.editable() || this.exceptionForm.invalid || this.mutating()) {
      this.exceptionForm.markAllAsTouched();
      return;
    }
    const v = this.exceptionForm.getRawValue();
    if (!v.fullDay && (!v.startTime || !v.endTime || v.startTime >= v.endTime)) {
      this.exceptionForm.setErrors({ timeOrder: true });
      return;
    }
    const body = {
      date: v.date,
      type: v.type,
      timezone: v.timezone.trim(),
      providerServiceId: v.providerServiceId || null,
      providerLocationId: v.providerLocationId || null,
      ...(!v.fullDay && { startTime: v.startTime, endTime: v.endTime }),
      ...(v.reason.trim() && { reason: v.reason.trim() }),
    };
    const operation = this.editingException()
      ? this.api.updateException(this.editingException()!, body)
      : this.api.createException(this.providerId(), body);
    this.mutate(
      operation,
      this.editingException() ? 'Availability exception updated.' : 'Availability exception added.',
      'exceptions',
      () => {
        this.editingException.set(null);
        this.exceptionForm.reset({
          type: 'UNAVAILABLE',
          fullDay: true,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        });
      },
    );
  }
  editException(item: ProviderAvailabilityException) {
    this.editingException.set(item.id);
    this.exceptionForm.setValue({
      date: item.date,
      type: item.type,
      fullDay: item.startTime === null,
      startTime: item.startTime?.slice(0, 5) ?? '',
      endTime: item.endTime?.slice(0, 5) ?? '',
      timezone: item.timezone,
      providerServiceId: item.providerServiceId ?? '',
      providerLocationId: item.providerLocationId ?? '',
      reason: item.reason ?? '',
    });
    this.activeTab.set('exceptions');
  }
  ask(
    label: string,
    run: () => Observable<unknown>,
    refresh: PendingAction['refresh'],
    success: string,
  ) {
    if (!this.editable()) return;
    this.pendingAction.set({ label, run, refresh, success });
  }
  confirmAction() {
    const a = this.pendingAction();
    if (!a || this.mutating()) return;
    this.pendingAction.set(null);
    this.mutate(a.run(), a.success, a.refresh);
  }
  link(serviceId: string, locationId: string) {
    if (!this.editable() || !locationId) return;
    this.mutate(
      this.api.linkLocation(serviceId, locationId),
      'Location linked to capability.',
      'services',
    );
  }
  unlink(serviceId: string, locationId: string) {
    this.ask(
      'Unlink this location from the capability?',
      () => this.api.unlinkLocation(serviceId, locationId),
      'services',
      'Location unlinked from capability.',
    );
  }
  toggleService(item: ProviderService) {
    this.ask(
      `${item.isActive ? 'Deactivate' : 'Activate'} this capability?`,
      () => this.api.setServiceActive(item.id, !item.isActive),
      'services',
      'Capability state updated.',
    );
  }
  toggleLocation(item: ProviderLocation) {
    this.ask(
      `${item.isActive ? 'Deactivate' : 'Activate'} this location?`,
      () => this.api.setLocationActive(item.id, !item.isActive),
      'locations',
      'Location state updated.',
    );
  }
  toggleAvailability(item: ProviderAvailability) {
    this.ask(
      `${item.isActive ? 'Deactivate' : 'Activate'} this availability?`,
      () => this.api.setAvailabilityActive(item.id, !item.isActive),
      'availability',
      'Availability state updated.',
    );
  }
  toggleException(item: ProviderAvailabilityException) {
    this.ask(
      `${item.isActive ? 'Deactivate' : 'Activate'} this exception?`,
      () => this.api.setExceptionActive(item.id, !item.isActive),
      'exceptions',
      'Exception state updated.',
    );
  }
  availableLocations(service: ProviderService) {
    return this.activeLocations().filter((l) => !service.providerLocationIds.includes(l.id));
  }
  onLocationCountryChange(countryCode: string): void {
  this.locationStates =
    State.getStatesOfCountry(countryCode);

  this.locationCities = [];
  this.selectedLocationStateCode = '';

  this.locationForm.patchValue({
    state: '',
    city: '',
  });
}

onLocationStateChange(stateCode: string): void {
  const countryCode =
    this.locationForm.controls.countryCode.value ?? '';

  const state = this.locationStates.find(
    (item) => item.isoCode === stateCode,
  );

  this.selectedLocationStateCode = stateCode;

  this.locationCities =
    City.getCitiesOfState(
      countryCode,
      stateCode,
    );

  this.locationForm.patchValue({
    // Save the NAME because this is what your backend
    // matching currently compares against.
    state: state?.name ?? '',
    city: '',
  });
}
  private mutate(
    operation: Observable<unknown>,
    success: string,
    refresh: PendingAction['refresh'],
    done?: () => void,
  ) {
    this.mutating.set(true);
    this.error.set(null);
    this.message.set(null);
    operation.pipe(finalize(() => this.mutating.set(false))).subscribe({
      next: () => {
        this.message.set(success);
        done?.();
        this.reload(refresh);
        this.changed.emit();
      },
      error: (e) => this.handle(e, 'Provider configuration could not be updated.'),
    });
  }
  private reload(kind: PendingAction['refresh']) {
    if (kind === 'services')
      this.api.listServices(this.providerId()).subscribe({
        next: (rows) => this.services.set(rows),
        error: (e) => this.handle(e, 'Updated data could not be refreshed.'),
      });
    if (kind === 'locations')
      this.api.listLocations(this.providerId()).subscribe({
        next: (rows) => this.locations.set(rows),
        error: (e) => this.handle(e, 'Updated data could not be refreshed.'),
      });
    if (kind === 'availability')
      this.api.listAvailability(this.providerId()).subscribe({
        next: (rows) => this.availability.set(rows),
        error: (e) => this.handle(e, 'Updated data could not be refreshed.'),
      });
    if (kind === 'exceptions')
      this.api.listExceptions(this.providerId()).subscribe({
        next: (rows) => this.exceptions.set(rows),
        error: (e) => this.handle(e, 'Updated data could not be refreshed.'),
      });
  }
  private handle(error: HttpErrorResponse, fallback: string) {
    if (error.status === 403) {
      this.error.set('You do not have permission to manage provider configuration.');
    } else {
      const messages: Record<number, string> = {
        400: 'Review the configuration values and try again.',
        404: 'This provider configuration record is no longer available.',
        409: 'This configuration conflicts with an existing capability, link, availability window, or ownership rule.',
        422: 'Review the configuration values and try again.',
      };
      this.error.set(
        error.status === 0
          ? 'SmartClinic could not be reached. Check your connection and try again.'
          : (messages[error.status] ?? fallback),
      );
    }
    queueMicrotask(() => this.errorSummary()?.nativeElement.focus());
  }
}

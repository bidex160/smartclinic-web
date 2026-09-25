import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { FulfilmentMode } from '../../core/models/fulfilment-mode.model';
import { HealthCheckPackage } from '../../core/models/health-check-package.model';
import { ProviderService } from '../../core/models/provider-eligibility.model';
import { ProviderServiceArea } from '../../core/models/provider-service-area.model';
import { FulfilmentModesApiService } from '../../core/services/fulfilment-modes-api.service';
import { HealthCheckPackagesApiService } from '../../core/services/health-check-packages-api.service';
import { ProviderEligibilityApiService } from '../../core/services/provider-eligibility-api.service';
import { ProviderSelfConfigurationApiService } from '../../core/services/provider-self-configuration-api.service';
import { ProviderServiceAreasApiService } from '../../core/services/provider-service-areas-api.service';
import { LocationDataService } from '../../core/services/location-data.service';
import { ICountry, IState, ICity } from 'country-state-city';

@Component({
  selector: 'app-provider-service-areas',
  imports: [ReactiveFormsModule],
  templateUrl: './provider-service-areas.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderServiceAreasComponent implements OnInit {
  private readonly areasApi = inject(ProviderServiceAreasApiService);
  private readonly selfApi = inject(ProviderSelfConfigurationApiService, { optional: true });
  private readonly adminApi = inject(ProviderEligibilityApiService, { optional: true });
  private readonly packagesApi = inject(HealthCheckPackagesApiService);
  private readonly modesApi = inject(FulfilmentModesApiService);
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly providerId = input<string | null>(null);
  readonly editable = input(true);
  readonly changed = output<void>();
  readonly areas = signal<ProviderServiceArea[]>([]);
  readonly services = signal<ProviderService[]>([]);
  readonly packages = signal<HealthCheckPackage[]>([]);
  readonly modes = signal<FulfilmentMode[]>([]);
  readonly loading = signal(true);
  readonly mutating = signal(false);
  readonly error = signal<string | null>(null);
  readonly status = signal<string | null>(null);
  readonly editingId = signal<string | null>(null);
  readonly form = this.fb.group({
    providerServiceId: ['', Validators.required],
    countryCode: ['NG', [Validators.required]],
    stateOrRegion: ['', [Validators.required]],
    city: [''],
    postalCode: ['', Validators.maxLength(30)],
    travelFee: [0, [Validators.required, Validators.min(0)]],
    priority: [100, [Validators.required, Validators.min(1), Validators.max(999)]],
    originLatitude: [null as number | null, [Validators.min(-90), Validators.max(90)]],
    originLongitude: [null as number | null, [Validators.min(-180), Validators.max(180)]],
    maxRadiusKm: [null as number | null, [Validators.min(0.1), Validators.max(1000)]],
  });
private readonly locationData = inject(LocationDataService);

readonly countries: ICountry[] =
  this.locationData.getCountries();

areaStates: IState[] = [];
areaCities: ICity[] = [];

readonly areaStateCode = new FormControl('', { nonNullable: true });

  ngOnInit(): void {
    this.load();
    this.onAreaCountryChange('NG')
  }

  load(): void {
    const providerId = this.providerId();
    const serviceRequest = providerId
      ? this.adminApi!.listServices(providerId)
      : this.selfApi!.listServices('authenticated-provider');
    this.loading.set(true);
    forkJoin({
      areas: providerId ? this.areasApi.listForAdmin(providerId) : this.areasApi.listOwn(),
      services: serviceRequest,
      packages: this.packagesApi.getPackages(),
      modes: this.modesApi.getFulfilmentModes(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ areas, services, packages, modes }) => {
          this.areas.set(areas);
          this.services.set(services);
          this.packages.set(packages);
          this.modes.set(modes);
        },
        error: (error) => this.handleError(error),
      });
  }

  homeVisitServices(): ProviderService[] {
    const ids = new Set(
      this.modes()
        .filter((mode) => mode.code === 'HOME_VISIT')
        .map((mode) => mode.id),
    );
    return this.services().filter(
      (service) => service.isActive && ids.has(service.fulfilmentModeId),
    );
  }

  serviceLabel(serviceId: string): string {
    const service = this.services().find((item) => item.id === serviceId);
    const pkg = this.packages().find((item) => item.id === service?.healthCheckPackageId);
    return `${pkg?.name ?? 'Smart Health Check'} · Home visit`;
  }

  edit(area: ProviderServiceArea): void {
    this.editingId.set(area.id);
    this.form.setValue({
      providerServiceId: area.providerServiceId,
      countryCode: area.countryCode,
      stateOrRegion: area.stateOrRegion,
      city: area.city ?? '',
      postalCode: area.postalCode ?? '',
      travelFee: Number(area.travelFeeMinor || 0) / 100,
      priority: area.priority ?? 100,
      originLatitude: area.originLatitude === null ? null : Number(area.originLatitude),
      originLongitude: area.originLongitude === null ? null : Number(area.originLongitude),
      maxRadiusKm: area.maxRadiusKm === null ? null : Number(area.maxRadiusKm),
    });
    this.initializeAreaGeography(area.countryCode, area.stateOrRegion, area.city ?? '');
  }

  cancel(): void {
    this.editingId.set(null);
    this.form.reset({
      providerServiceId: '',
      countryCode: 'NG',
      stateOrRegion: '',
      city: '',
      postalCode: '',
      travelFee: 0,
      priority: 100,
      originLatitude: null,
      originLongitude: null,
      maxRadiusKm: null,
    });
    this.areaStates = this.locationData.getStates('NG');
    this.areaCities = [];
    this.areaStateCode.setValue('', { emitEvent: false });
  }

  save(): void {
    if (this.form.invalid || this.mutating() || !this.editable()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const body = {
      providerServiceId: value.providerServiceId,
      countryCode: value.countryCode,
      stateOrRegion: value.stateOrRegion.trim(),
      city: value.city.trim() || null,
      postalCode: value.postalCode.trim() || null,
      // Travel pricing and matching priority are centrally managed by SmartClinic.
      priority: 100,
      // Preserve known coordinates on edit. New coordinates can be captured with the
      // browser location helper; never erase valid location intelligence silently.
      originLatitude: value.originLatitude,
      originLongitude: value.originLongitude,
      maxRadiusKm: value.maxRadiusKm,
    };
    const operation = this.editingId()
      ? this.areasApi.update(this.editingId()!, body)
      : this.areasApi.create(body);
    this.run(operation, this.editingId() ? 'Service area updated.' : 'Service area added.');
  }

  useCurrentLocation(): void {
    if (!navigator.geolocation || this.mutating()) {
      this.error.set('Current location is not available on this device. You can continue with your selected area.');
      return;
    }
    this.status.set('Getting your location…');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        this.form.patchValue({ originLatitude: coords.latitude, originLongitude: coords.longitude });
        this.status.set('Location added. SmartClinic will use it for distance and matching.');
        this.error.set(null);
      },
      () => {
        this.status.set(null);
        this.error.set('We could not use your current location. You can continue with your selected area.');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  toggle(area: ProviderServiceArea): void {
    if (!this.editable() || this.mutating()) return;
    const action = area.isActive ? 'deactivate' : 'activate';
    if (!globalThis.confirm(`Confirm ${action} for this service area?`)) return;
    this.run(this.areasApi.setActive(area.id, !area.isActive), `Service area ${action}d.`);
  }

  onAreaCountryChange(countryCode: string): void {
  this.areaStates =
    this.locationData.getStates(countryCode);

  this.areaCities = [];
  this.areaStateCode.setValue('', { emitEvent: false });

  this.form.patchValue({
    stateOrRegion: '',
    city: '',
  });
}

onAreaStateChange(stateCode: string): void {
  const countryCode =
    this.form.controls.countryCode.value ?? '';

  const selectedState = this.areaStates.find(
    (state) => state.isoCode === stateCode,
  );

  this.areaStateCode.setValue(stateCode, { emitEvent: false });

  this.areaCities =
    this.locationData.getCities(
      countryCode,
      stateCode,
    );

  this.form.patchValue({
    stateOrRegion: selectedState?.name ?? '',
    city: '',
  });
}

private initializeAreaGeography(countryCode: string, stateName: string, city: string): void {
  this.areaStates = countryCode ? this.locationData.getStates(countryCode) : [];
  this.areaCities = [];
  this.areaStateCode.setValue('', { emitEvent: false });
  const selectedState = this.areaStates.find(
    state => state.name.trim().toLowerCase() === stateName.trim().toLowerCase(),
  );
  if (selectedState) {
    this.areaStateCode.setValue(selectedState.isoCode, { emitEvent: false });
    this.areaCities = this.locationData.getCities(countryCode, selectedState.isoCode);
  }
  this.form.patchValue({ stateOrRegion: stateName, city }, { emitEvent: false });
}

  private run(
    operation: ReturnType<ProviderServiceAreasApiService['create']>,
    message: string,
  ): void {
    this.mutating.set(true);
    this.error.set(null);
    operation.pipe(finalize(() => this.mutating.set(false))).subscribe({
      next: () => {
        this.status.set(message);
        this.cancel();
        this.load();
        this.changed.emit();
      },
      error: (error) => this.handleError(error),
    });
  }

  private handleError(error: HttpErrorResponse): void {
    this.error.set(
      error.status === 409
        ? 'This service area conflicts with an existing area or service configuration.'
        : error.status === 404
          ? 'The service or service area is no longer available.'
          : error.status === 400 || error.status === 422
            ? 'Review the service-area fields and try again.'
            : error.status === 403
              ? 'You do not have access to this service-area configuration.'
              : 'Service areas could not be loaded or updated. Please try again.',
    );
  }
}

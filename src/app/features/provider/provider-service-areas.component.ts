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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
  });
private readonly locationData = inject(LocationDataService);

readonly countries: ICountry[] =
  this.locationData.getCountries();

areaStates: IState[] = [];
areaCities: ICity[] = [];

selectedAreaStateCode = '';

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
    });
  }

  cancel(): void {
    this.editingId.set(null);
    this.form.reset({
      providerServiceId: '',
      countryCode: 'NG',
      stateOrRegion: '',
      city: '',
      postalCode: '',
    });
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
    };
    const operation = this.editingId()
      ? this.areasApi.update(this.editingId()!, body)
      : this.areasApi.create(body);
    this.run(operation, this.editingId() ? 'Service area updated.' : 'Service area added.');
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
  this.selectedAreaStateCode = '';

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

  this.selectedAreaStateCode = stateCode;

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

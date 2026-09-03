import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_CONFIG } from '../config/api-config.token';
import { SKIP_AUTH_RETRY } from '../config/http-context.tokens';
import {
  CreateProviderServiceRequest,
  ProviderAvailability,
  ProviderAvailabilityException,
  ProviderAvailabilityExceptionRequest,
  ProviderAvailabilityRequest,
  ProviderLocation,
  ProviderLocationRequest,
  ProviderService,
  ProviderServiceAddonConfiguration,
  ConfigureProviderServiceAddonRequest,
  UpdateProviderServicePriceRequest,
} from '../models/provider-eligibility.model';

/** Authenticated-provider adapter. The ignored route-context argument keeps the shared editor transport-compatible; it is never sent. */
@Injectable()
export class ProviderSelfConfigurationApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_CONFIG).baseUrl}/provider`;
  private readonly mutation = new HttpContext().set(SKIP_AUTH_RETRY, true);
  listServices(_context: string) {
    return this.http.get<ProviderService[]>(`${this.base}/services`);
  }
  createService(_context: string, body: CreateProviderServiceRequest) {
    return this.http.post<ProviderService>(`${this.base}/services`, body, {
      context: this.mutation,
    });
  }
  updateServicePrice(id: string, body: UpdateProviderServicePriceRequest) {
    return this.http.patch<ProviderService>(
      `${this.base}/services/${encodeURIComponent(id)}/price`,
      body,
      { context: this.mutation },
    );
  }
  setServiceActive(id: string, active: boolean) {
    return this.http.patch<ProviderService>(
      `${this.base}/services/${encodeURIComponent(id)}/${active ? 'activate' : 'deactivate'}`,
      {},
      { context: this.mutation },
    );
  }
  getServiceAddons(id: string) {
    return this.http.get<ProviderServiceAddonConfiguration>(
      `${this.base}/services/${encodeURIComponent(id)}/addons`,
    );
  }
  configureServiceAddon(id: string, body: ConfigureProviderServiceAddonRequest) {
    return this.http.post(`${this.base}/services/${encodeURIComponent(id)}/addons`, body, {
      context: this.mutation,
    });
  }
  deactivateServiceAddon(id: string, addonCode: string) {
    return this.http.delete(
      `${this.base}/services/${encodeURIComponent(id)}/addons/${encodeURIComponent(addonCode)}`,
      { context: this.mutation },
    );
  }
  linkLocation(serviceId: string, locationId: string) {
    return this.http.post<ProviderService>(
      `${this.base}/services/${encodeURIComponent(serviceId)}/locations/${encodeURIComponent(locationId)}`,
      {},
      { context: this.mutation },
    );
  }
  unlinkLocation(serviceId: string, locationId: string) {
    return this.http.delete<void>(
      `${this.base}/services/${encodeURIComponent(serviceId)}/locations/${encodeURIComponent(locationId)}`,
      { context: this.mutation },
    );
  }
  listLocations(_context: string) {
    return this.http.get<ProviderLocation[]>(`${this.base}/locations`);
  }
  createLocation(_context: string, body: ProviderLocationRequest) {
    return this.http.post<ProviderLocation>(`${this.base}/locations`, body, {
      context: this.mutation,
    });
  }
  updateLocation(id: string, body: Partial<ProviderLocationRequest>) {
    return this.http.patch<ProviderLocation>(
      `${this.base}/locations/${encodeURIComponent(id)}`,
      body,
      { context: this.mutation },
    );
  }
  setLocationActive(id: string, active: boolean) {
    return this.http.patch<ProviderLocation>(
      `${this.base}/locations/${encodeURIComponent(id)}/${active ? 'activate' : 'deactivate'}`,
      {},
      { context: this.mutation },
    );
  }
  listAvailability(_context: string) {
    return this.http.get<ProviderAvailability[]>(`${this.base}/availability`);
  }
  createAvailability(_context: string, body: ProviderAvailabilityRequest) {
    return this.http.post<ProviderAvailability>(`${this.base}/availability`, body, {
      context: this.mutation,
    });
  }
  updateAvailability(id: string, body: Partial<ProviderAvailabilityRequest>) {
    return this.http.patch<ProviderAvailability>(
      `${this.base}/availability/${encodeURIComponent(id)}`,
      body,
      { context: this.mutation },
    );
  }
  setAvailabilityActive(id: string, active: boolean) {
    return this.http.patch<ProviderAvailability>(
      `${this.base}/availability/${encodeURIComponent(id)}/${active ? 'activate' : 'deactivate'}`,
      {},
      { context: this.mutation },
    );
  }
  listExceptions(_context: string) {
    return this.http.get<ProviderAvailabilityException[]>(`${this.base}/availability-exceptions`);
  }
  createException(_context: string, body: ProviderAvailabilityExceptionRequest) {
    return this.http.post<ProviderAvailabilityException>(
      `${this.base}/availability-exceptions`,
      body,
      { context: this.mutation },
    );
  }
  updateException(id: string, body: Partial<ProviderAvailabilityExceptionRequest>) {
    return this.http.patch<ProviderAvailabilityException>(
      `${this.base}/availability-exceptions/${encodeURIComponent(id)}`,
      body,
      { context: this.mutation },
    );
  }
  setExceptionActive(id: string, active: boolean) {
    return this.http.patch<ProviderAvailabilityException>(
      `${this.base}/availability-exceptions/${encodeURIComponent(id)}/${active ? 'activate' : 'deactivate'}`,
      {},
      { context: this.mutation },
    );
  }
}

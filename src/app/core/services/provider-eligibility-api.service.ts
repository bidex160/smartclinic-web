import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
} from '../models/provider-eligibility.model';
@Injectable({ providedIn: 'root' })
export class ProviderEligibilityApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_CONFIG).baseUrl}/admin`;
  private readonly mutation = new HttpContext().set(SKIP_AUTH_RETRY, true);
  listServices(providerId: string) {
    return this.http.get<ProviderService[]>(
      `${this.base}/providers/${encodeURIComponent(providerId)}/services`,
    );
  }
  createService(providerId: string, body: CreateProviderServiceRequest) {
    return this.http.post<ProviderService>(
      `${this.base}/providers/${encodeURIComponent(providerId)}/services`,
      body,
      { context: this.mutation },
    );
  }
  setServiceActive(id: string, active: boolean) {
    return this.http.patch<ProviderService>(
      `${this.base}/provider-services/${encodeURIComponent(id)}/${active ? 'activate' : 'deactivate'}`,
      {},
      { context: this.mutation },
    );
  }
  linkLocation(serviceId: string, locationId: string) {
    return this.http.post<ProviderService>(
      `${this.base}/provider-services/${encodeURIComponent(serviceId)}/locations/${encodeURIComponent(locationId)}`,
      {},
      { context: this.mutation },
    );
  }
  unlinkLocation(serviceId: string, locationId: string) {
    return this.http.delete<void>(
      `${this.base}/provider-services/${encodeURIComponent(serviceId)}/locations/${encodeURIComponent(locationId)}`,
      { context: this.mutation },
    );
  }
  listLocations(providerId: string) {
    return this.http.get<ProviderLocation[]>(
      `${this.base}/providers/${encodeURIComponent(providerId)}/locations`,
    );
  }
  createLocation(providerId: string, body: ProviderLocationRequest) {
    return this.http.post<ProviderLocation>(
      `${this.base}/providers/${encodeURIComponent(providerId)}/locations`,
      body,
      { context: this.mutation },
    );
  }
  updateLocation(id: string, body: Partial<ProviderLocationRequest>) {
    return this.http.patch<ProviderLocation>(
      `${this.base}/provider-locations/${encodeURIComponent(id)}`,
      body,
      { context: this.mutation },
    );
  }
  setLocationActive(id: string, active: boolean) {
    return this.http.patch<ProviderLocation>(
      `${this.base}/provider-locations/${encodeURIComponent(id)}/${active ? 'activate' : 'deactivate'}`,
      {},
      { context: this.mutation },
    );
  }
  listAvailability(providerId: string) {
    return this.http.get<ProviderAvailability[]>(
      `${this.base}/providers/${encodeURIComponent(providerId)}/availability`,
    );
  }
  createAvailability(providerId: string, body: ProviderAvailabilityRequest) {
    return this.http.post<ProviderAvailability>(
      `${this.base}/providers/${encodeURIComponent(providerId)}/availability`,
      body,
      { context: this.mutation },
    );
  }
  updateAvailability(id: string, body: Partial<ProviderAvailabilityRequest>) {
    return this.http.patch<ProviderAvailability>(
      `${this.base}/provider-availability/${encodeURIComponent(id)}`,
      body,
      { context: this.mutation },
    );
  }
  setAvailabilityActive(id: string, active: boolean) {
    return this.http.patch<ProviderAvailability>(
      `${this.base}/provider-availability/${encodeURIComponent(id)}/${active ? 'activate' : 'deactivate'}`,
      {},
      { context: this.mutation },
    );
  }
  listExceptions(providerId: string) {
    return this.http.get<ProviderAvailabilityException[]>(
      `${this.base}/providers/${encodeURIComponent(providerId)}/availability-exceptions`,
    );
  }
  createException(providerId: string, body: ProviderAvailabilityExceptionRequest) {
    return this.http.post<ProviderAvailabilityException>(
      `${this.base}/providers/${encodeURIComponent(providerId)}/availability-exceptions`,
      body,
      { context: this.mutation },
    );
  }
  updateException(id: string, body: Partial<ProviderAvailabilityExceptionRequest>) {
    return this.http.patch<ProviderAvailabilityException>(
      `${this.base}/provider-availability-exceptions/${encodeURIComponent(id)}`,
      body,
      { context: this.mutation },
    );
  }
  setExceptionActive(id: string, active: boolean) {
    return this.http.patch<ProviderAvailabilityException>(
      `${this.base}/provider-availability-exceptions/${encodeURIComponent(id)}/${active ? 'activate' : 'deactivate'}`,
      {},
      { context: this.mutation },
    );
  }
}

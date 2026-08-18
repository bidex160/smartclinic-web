import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api-config.token';
import { SKIP_AUTH_RETRY } from '../config/http-context.tokens';
import {
  ProviderHealthCheckEncounter,
  SaveHealthCheckMeasurementsRequest,
} from '../models/provider-health-check-encounter.model';

@Injectable({ providedIn: 'root' })
export class ProviderHealthCheckEncountersApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${inject(API_CONFIG).baseUrl}/provider/bookings`;
  private readonly mutationContext = new HttpContext().set(SKIP_AUTH_RETRY, true);
  private url(reference: string): string {
    return `${this.endpoint}/${encodeURIComponent(reference)}/health-check`;
  }

  get(reference: string): Observable<ProviderHealthCheckEncounter> {
    return this.http.get<ProviderHealthCheckEncounter>(this.url(reference));
  }
  start(reference: string): Observable<ProviderHealthCheckEncounter> {
    return this.http.post<ProviderHealthCheckEncounter>(
      `${this.url(reference)}/start`,
      {},
      { context: this.mutationContext },
    );
  }
  saveMeasurements(
    reference: string,
    request: SaveHealthCheckMeasurementsRequest,
  ): Observable<ProviderHealthCheckEncounter> {
    return this.http.put<ProviderHealthCheckEncounter>(
      `${this.url(reference)}/measurements`,
      request,
      { context: this.mutationContext },
    );
  }
  complete(reference: string): Observable<ProviderHealthCheckEncounter> {
    return this.http.post<ProviderHealthCheckEncounter>(
      `${this.url(reference)}/complete`,
      {},
      { context: this.mutationContext },
    );
  }
}

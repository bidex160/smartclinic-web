import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api-config.token';
import { SKIP_STAFF_AUTH } from '../config/http-context.tokens';
import { HealthCheckResult } from '../models/health-check-result.model';

@Injectable({ providedIn: 'root' })
export class HealthCheckResultsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_CONFIG).baseUrl;
  private readonly guestContext = new HttpContext().set(SKIP_STAFF_AUTH, true);

  getOwnResult(bookingReference: string): Observable<HealthCheckResult> {
    return this.http.get<HealthCheckResult>(
      `${this.baseUrl}/me/health-checks/${encodeURIComponent(bookingReference)}/results`,
    );
  }

  getGuestResult(token: string): Observable<HealthCheckResult> {
    return this.http.get<HealthCheckResult>(
      `${this.baseUrl}/public/health-results/${encodeURIComponent(token)}`,
      { context: this.guestContext, withCredentials: false },
    );
  }
}

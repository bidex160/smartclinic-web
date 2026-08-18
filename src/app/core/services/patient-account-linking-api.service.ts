import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api-config.token';
import { SKIP_AUTH_RETRY } from '../config/http-context.tokens';
import {
  LinkPatientFromResultRequest,
  PatientAccountLinkResponse,
} from '../models/patient-account-link.model';

@Injectable({ providedIn: 'root' })
export class PatientAccountLinkingApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_CONFIG).baseUrl;
  private readonly mutationContext = new HttpContext().set(SKIP_AUTH_RETRY, true);

  linkFromBooking(bookingReference: string): Observable<PatientAccountLinkResponse> {
    return this.http.post<PatientAccountLinkResponse>(
      `${this.baseUrl}/public/bookings/${encodeURIComponent(bookingReference)}/link-patient-account`,
      null,
      { withCredentials: true, context: this.mutationContext },
    );
  }

  linkFromResult(resultAccessToken: string): Observable<PatientAccountLinkResponse> {
    const request: LinkPatientFromResultRequest = { resultAccessToken };
    return this.http.post<PatientAccountLinkResponse>(
      `${this.baseUrl}/me/patient/link-from-result`,
      request,
      { context: this.mutationContext },
    );
  }
}

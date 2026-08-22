import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api-config.token';
import { SKIP_AUTH_RETRY, SKIP_STAFF_AUTH } from '../config/http-context.tokens';
import {
  ProviderOnboardingProfile,
  RegisterProviderRequest,
  UpdateProviderProfileRequest,
} from '../models/provider-onboarding.model';

@Injectable({ providedIn: 'root' })
export class ProviderOnboardingApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_CONFIG).baseUrl;
  private readonly mutationContext = new HttpContext().set(SKIP_AUTH_RETRY, true);
  private readonly publicMutationContext = new HttpContext()
    .set(SKIP_AUTH_RETRY, true)
    .set(SKIP_STAFF_AUTH, true);

  register(request: RegisterProviderRequest): Observable<ProviderOnboardingProfile> {
    return this.http.post<ProviderOnboardingProfile>(
      `${this.baseUrl}/public/providers/register`,
      request,
      {
        context: this.publicMutationContext,
      },
    );
  }

  getProfile(): Observable<ProviderOnboardingProfile> {
    return this.http.get<ProviderOnboardingProfile>(`${this.baseUrl}/provider/profile`);
  }

  updateProfile(request: UpdateProviderProfileRequest): Observable<ProviderOnboardingProfile> {
    return this.http.patch<ProviderOnboardingProfile>(`${this.baseUrl}/provider/profile`, request, {
      context: this.mutationContext,
    });
  }

  submit(): Observable<ProviderOnboardingProfile> {
    return this.http.post<ProviderOnboardingProfile>(
      `${this.baseUrl}/provider/onboarding/submit`,
      {},
      {
        context: this.mutationContext,
      },
    );
  }
}

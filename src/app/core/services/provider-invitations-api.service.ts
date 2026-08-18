import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api-config.token';
import { SKIP_AUTH_RETRY, SKIP_STAFF_AUTH } from '../config/http-context.tokens';
import {
  AcceptedProviderInvitation,
  AcceptProviderInvitationRequest,
  AdminProviderInvitation,
  CreatedProviderInvitation,
  PublicProviderInvitation,
} from '../models/provider-invitation.model';

@Injectable({ providedIn: 'root' })
export class ProviderInvitationsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_CONFIG).baseUrl;
  private readonly adminMutation = new HttpContext().set(SKIP_AUTH_RETRY, true);
  private readonly publicContext = new HttpContext()
    .set(SKIP_STAFF_AUTH, true)
    .set(SKIP_AUTH_RETRY, true);

  list(providerId: string): Observable<AdminProviderInvitation[]> {
    return this.http.get<AdminProviderInvitation[]>(
      `${this.baseUrl}/admin/providers/${encodeURIComponent(providerId)}/invitations`,
    );
  }
  create(providerId: string, email: string): Observable<CreatedProviderInvitation> {
    return this.http.post<CreatedProviderInvitation>(
      `${this.baseUrl}/admin/providers/${encodeURIComponent(providerId)}/invitations`,
      { email },
      { context: this.adminMutation },
    );
  }
  revoke(id: string): Observable<AdminProviderInvitation> {
    return this.http.post<AdminProviderInvitation>(
      `${this.baseUrl}/admin/provider-invitations/${encodeURIComponent(id)}/revoke`,
      {},
      { context: this.adminMutation },
    );
  }
  inspect(token: string): Observable<PublicProviderInvitation> {
    return this.http.get<PublicProviderInvitation>(
      `${this.baseUrl}/public/provider-invitations/${encodeURIComponent(token)}`,
      { context: this.publicContext },
    );
  }
  accept(
    token: string,
    request: AcceptProviderInvitationRequest,
  ): Observable<AcceptedProviderInvitation> {
    return this.http.post<AcceptedProviderInvitation>(
      `${this.baseUrl}/public/provider-invitations/${encodeURIComponent(token)}/accept`,
      request,
      { context: this.publicContext },
    );
  }
}

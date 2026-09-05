import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api-config.token';
import {
  CreateProviderRecruitmentInvitationRequest,
  ProviderRecruitmentInvitationResponse,
} from '../models/provider-recruitment-invitation.model';

@Injectable({ providedIn: 'root' })
export class ProviderRecruitmentInvitationsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_CONFIG).baseUrl;

  create(
    request: CreateProviderRecruitmentInvitationRequest,
  ): Observable<ProviderRecruitmentInvitationResponse> {
    return this.http.post<ProviderRecruitmentInvitationResponse>(
      `${this.base}/me/provider-invitations`,
      request,
    );
  }
}

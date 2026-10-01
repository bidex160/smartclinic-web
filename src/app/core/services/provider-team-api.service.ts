import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { API_CONFIG } from '../config/api-config.token';
import { ProviderMemberRole, ProviderMembership, ProviderTeamMember, TeamInvitationPreview, TeamInviteResult } from '../models/provider-team.model';

@Injectable({ providedIn: 'root' })
export class ProviderTeamApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_CONFIG).baseUrl;

  me() {
    return this.http.get<ProviderMembership>(`${this.base}/provider/team/me`);
  }

  list() {
    return this.http.get<{ items: readonly ProviderTeamMember[] }>(`${this.base}/provider/team`);
  }

  invite(request: { email: string; displayName?: string | null; role: ProviderMemberRole }) {
    return this.http.post<TeamInviteResult>(`${this.base}/provider/team/invitations`, request);
  }

  resend(id: string) {
    return this.http.post<TeamInviteResult>(`${this.base}/provider/team/${encodeURIComponent(id)}/resend`, {});
  }

  updateRole(id: string, role: ProviderMemberRole) {
    return this.http.patch<ProviderTeamMember>(`${this.base}/provider/team/${encodeURIComponent(id)}`, { role });
  }

  remove(id: string) {
    return this.http.delete<{ removed: true }>(`${this.base}/provider/team/${encodeURIComponent(id)}`);
  }

  inspectInvitation(token: string) {
    return this.http.get<TeamInvitationPreview>(`${this.base}/public/team-invitations/${encodeURIComponent(token)}`);
  }

  acceptInvitation(token: string) {
    return this.http.post<ProviderMembership>(`${this.base}/team-invitations/${encodeURIComponent(token)}/accept`, {});
  }
}

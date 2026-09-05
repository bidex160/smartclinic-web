export interface CreateProviderRecruitmentInvitationRequest {
  readonly organisationName: string;
  readonly email?: string;
  readonly phone?: string;
  readonly source: 'HEALTH_CHECK_NO_PROVIDER';
  readonly packageCode: string;
  readonly fulfilmentModeCode: string;
  readonly preferredDate?: string;
  readonly preferredTime?: string;
  readonly countryCode?: string;
  readonly stateOrRegion?: string;
  readonly city?: string;
}

export interface ProviderRecruitmentInvitationResponse {
  readonly reference: string;
  readonly organisationName: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly source: 'HEALTH_CHECK_NO_PROVIDER';
  readonly status: 'PENDING' | 'CONTACTED' | 'JOINED' | 'CANCELLED';
  readonly context: {
    readonly packageCode: string | null;
    readonly serviceCode: string | null;
    readonly fulfilmentModeCode: string | null;
    readonly preferredDate: string | null;
    readonly preferredTime: string | null;
    readonly countryCode: string | null;
    readonly stateOrRegion: string | null;
    readonly city: string | null;
  };
  readonly createdAt: string;
}

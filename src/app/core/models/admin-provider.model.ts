export type ProviderStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type ProviderOnboardingStatus = 'DRAFT' | 'INVITED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type ProviderType = 'INDIVIDUAL' | 'CLINIC' | 'DIAGNOSTIC_CENTRE' | 'OTHER';
export type SafeUserStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'DEACTIVATED';

export interface AdminLinkedUser {
  readonly id: string;
  readonly email: string | null;
  readonly displayName: string | null;
  readonly roles: readonly string[];
  readonly status: SafeUserStatus;
}

export interface AdminProviderListItem {
  readonly id: string;
  readonly displayName: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly professionalReference: string | null;
  readonly status: ProviderStatus;
  readonly providerType: ProviderType;
  readonly countryCode: string | null;
  readonly stateOrRegion: string | null;
  readonly city: string | null;
  readonly onboardingStatus: ProviderOnboardingStatus;
  readonly submittedAt: string | null;
  readonly reviewedAt: string | null;
  readonly reviewNote: string | null;
  readonly linkedUser: AdminLinkedUser | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AdminProviderDetail extends AdminProviderListItem {
  readonly capabilityCount: number;
  readonly locationCount: number;
}

export interface AdminProviderListResponse {
  readonly items: readonly AdminProviderListItem[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface AdminProviderFilters {
  readonly status?: ProviderStatus;
  readonly onboardingStatus?: ProviderOnboardingStatus;
  readonly linkedUserId?: string;
  readonly search?: string;
  readonly page?: number;
  readonly limit?: number;
}

export interface CreateAdminProviderRequest {
  readonly displayName: string;
  readonly email: string;
  readonly phone?: string | null;
  readonly professionalReference?: string;
  readonly providerType: ProviderType;
  readonly countryCode: string;
  readonly stateOrRegion: string;
  readonly city: string;
}

export type UpdateAdminProviderRequest = Partial<Omit<CreateAdminProviderRequest, 'email'>>;

export interface AdminCreatedProviderResponse {
  readonly provider: AdminProviderDetail;
  readonly invitation: import('./provider-invitation.model').CreatedProviderInvitation;
}

export interface RejectProviderRequest {
  readonly reviewNote?: string;
}

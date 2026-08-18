export type ProviderStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
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
  readonly professionalReference: string | null;
  readonly status: ProviderStatus;
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
  readonly linkedUserId?: string;
  readonly search?: string;
  readonly page?: number;
  readonly limit?: number;
}

export interface CreateAdminProviderRequest {
  readonly displayName: string;
  readonly professionalReference?: string;
}

export type UpdateAdminProviderRequest = Partial<CreateAdminProviderRequest>;

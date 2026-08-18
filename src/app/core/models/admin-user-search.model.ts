import { SafeUserStatus } from './admin-provider.model';
import { UserRole } from './auth.model';

export interface AdminUserProviderLink {
  readonly providerId: string;
  readonly providerDisplayName: string;
}

export interface AdminUserSearchItem {
  readonly id: string;
  readonly email: string | null;
  readonly displayName: string | null;
  readonly status: SafeUserStatus;
  readonly roles: readonly UserRole[];
  readonly providerLink: AdminUserProviderLink | null;
}

export interface AdminUserSearchResponse {
  readonly items: readonly AdminUserSearchItem[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

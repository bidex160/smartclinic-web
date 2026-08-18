export type ProviderInvitationStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';

export interface ProviderInvitationCreator {
  readonly id: string;
  readonly email: string | null;
  readonly displayName: string | null;
}

export interface AdminProviderInvitation {
  readonly id: string;
  readonly provider: { readonly displayName: string };
  readonly email: string;
  readonly status: ProviderInvitationStatus;
  readonly expiresAt: string;
  readonly acceptedAt: string | null;
  readonly revokedAt: string | null;
  readonly createdAt: string;
  readonly createdBy: ProviderInvitationCreator | null;
}

export interface CreatedProviderInvitation extends AdminProviderInvitation {
  readonly deliveryStatus: 'SENT' | 'MANUAL_REQUIRED' | 'FAILED';
  readonly manualInvitationLink?: string;
}

export interface PublicProviderInvitation {
  readonly providerDisplayName: string;
  readonly invitedEmail: string;
  readonly expiresAt: string;
}

export interface AcceptProviderInvitationRequest {
  readonly displayName: string;
  readonly password: string;
}

export interface AcceptedProviderInvitation {
  readonly providerDisplayName: string;
  readonly email: string;
  readonly status: 'ACCEPTED';
  readonly loginRequired: true;
}

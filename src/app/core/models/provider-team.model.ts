export type ProviderMemberRole = 'ADMIN' | 'DOCTOR' | 'NURSE' | 'LAB_SCIENTIST' | 'PHARMACIST' | 'FRONT_DESK';
export type ProviderMemberStatus = 'INVITED' | 'ACTIVE' | 'REMOVED';

export const PROVIDER_MEMBER_ROLES: readonly { readonly role: ProviderMemberRole; readonly label: string; readonly hint: string }[] = [
  { role: 'DOCTOR', label: 'Doctor', hint: 'Sees patients, prescribes and requests tests' },
  { role: 'NURSE', label: 'Nurse', hint: 'Appointments, patient requests and records shared with you' },
  { role: 'LAB_SCIENTIST', label: 'Lab scientist', hint: 'Test requests, results and turnaround' },
  { role: 'PHARMACIST', label: 'Pharmacist', hint: 'Prescriptions, prices and dispensing' },
  { role: 'FRONT_DESK', label: 'Front desk', hint: 'Appointments, check-in and patient connections' },
  { role: 'ADMIN', label: 'Team admin', hint: 'Manages the team and facility setup' },
];

/** The signed-in person at their facility. */
export interface ProviderMembership {
  readonly isOwner: boolean;
  readonly role: ProviderMemberRole | null;
  readonly roleLabel: string;
  readonly canManageTeam: boolean;
  readonly canSendRequests: boolean;
  readonly provider: { readonly providerReference: string; readonly displayName: string; readonly providerType: string };
}

export interface ProviderTeamMember {
  readonly id: string;
  readonly displayName: string | null;
  readonly email: string;
  readonly role: ProviderMemberRole;
  readonly roleLabel: string;
  readonly status: ProviderMemberStatus;
  readonly joinedAt: string | null;
  readonly inviteExpiresAt: string | null;
  readonly createdAt: string;
}

export interface TeamInviteResult {
  readonly member: ProviderTeamMember;
  /** Returned once, so the inviter can also share it directly. */
  readonly inviteUrl: string;
  readonly deliveryStatus: 'SENT' | 'MANUAL_REQUIRED' | 'FAILED';
}

export interface TeamInvitationPreview {
  readonly providerDisplayName: string;
  readonly providerType: string;
  readonly role: ProviderMemberRole;
  readonly roleLabel: string;
  readonly invitedEmail: string;
  readonly expiresAt: string;
}

import { ProviderOnboardingStatus, ProviderStatus, ProviderType } from './admin-provider.model';

export interface ProviderProfileFields {
  readonly displayName: string;
  readonly phone: string;
  readonly professionalReference?: string;
  readonly providerType: ProviderType;
  readonly countryCode: string;
  readonly stateOrRegion: string;
  readonly city: string;
}

export interface RegisterProviderRequest extends ProviderProfileFields {
  readonly email: string;
  readonly password: string;
}

export type UpdateProviderProfileRequest = Partial<ProviderProfileFields>;

export type ProviderOnboardingBlocker =
  | 'PROFILE_INCOMPLETE'
  | 'NO_ACTIVE_CAPABILITY'
  | 'PROVIDER_LOCATION_WITHOUT_LOCATION'
  | 'HOME_VISIT_WITHOUT_SERVICE_AREA'
  | 'NO_WEEKLY_AVAILABILITY';

export interface ProviderOnboardingReadiness {
  readonly profileComplete: boolean;
  readonly hasActiveCapability: boolean;
  readonly providerLocationReady: boolean;
  readonly homeVisitReady?: boolean;
  readonly hasAvailability: boolean;
  readonly blockers: readonly ProviderOnboardingBlocker[];
  readonly capabilityCount: number;
  readonly activeCapabilityCount: number;
  readonly locationCount: number;
  readonly activeLocationCount: number;
  readonly availabilityCount: number;
}

export interface ProviderOnboardingProfile {
  readonly displayName: string;
  readonly email: string;
  readonly phone: string | null;
  readonly professionalReference: string | null;
  readonly providerType: ProviderType;
  readonly countryCode: string | null;
  readonly stateOrRegion: string | null;
  readonly city: string | null;
  readonly status: ProviderStatus;
  readonly onboardingStatus: ProviderOnboardingStatus;
  readonly submittedAt: string | null;
  readonly reviewedAt: string | null;
  readonly reviewNote: string | null;
  readonly capabilityCount: number;
  readonly activeCapabilityCount: number;
  readonly locationCount: number;
  readonly activeLocationCount: number;
  readonly availabilityCount: number;
  readonly readiness: ProviderOnboardingReadiness;
}

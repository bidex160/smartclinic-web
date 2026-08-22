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
}

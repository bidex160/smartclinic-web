export interface ProviderServiceArea {
  readonly id: string;
  readonly providerId: string;
  readonly providerServiceId: string;
  readonly countryCode: string;
  readonly stateOrRegion: string;
  readonly city: string | null;
  readonly postalCode: string | null;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ProviderServiceAreaRequest {
  readonly providerServiceId: string;
  readonly countryCode: string;
  readonly stateOrRegion: string;
  readonly city?: string | null;
  readonly postalCode?: string | null;
}

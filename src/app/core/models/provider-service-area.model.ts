export interface ProviderServiceArea {
  readonly id: string;
  readonly providerId: string;
  readonly providerServiceId: string;
  readonly countryCode: string;
  readonly stateOrRegion: string;
  readonly city: string | null;
  readonly postalCode: string | null;
  readonly travelFeeMinor: string;
  readonly priority: number;
  readonly originLatitude: string | null;
  readonly originLongitude: string | null;
  readonly maxRadiusKm: string | null;
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
  readonly travelFeeMinor?: number;
  readonly priority?: number;
  readonly originLatitude?: number | null;
  readonly originLongitude?: number | null;
  readonly maxRadiusKm?: number | null;
}

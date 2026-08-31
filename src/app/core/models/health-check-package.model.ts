export interface HealthCheckPackage {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly benefits: string[];
  readonly estimatedDurationMinutes: number | null;
  readonly isActive: boolean;
}

export interface HealthCheckCatalogueContent {
  readonly code: string;
  readonly name: string;
  readonly category: string;
  readonly description: string | null;
}

export interface HealthCheckCataloguePackage {
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly benefits: readonly string[];
  readonly estimatedDurationMinutes: number | null;
  readonly isActive: boolean;
  readonly includedContents: readonly HealthCheckCatalogueContent[];
  readonly optionalAddons: readonly HealthCheckCatalogueContent[];
  readonly fromPriceMinor: number | null;
  readonly currency: string | null;
  readonly fulfilmentModes: readonly { code: string; name: string }[];
}

export interface HealthCheckConfigurationQuoteRequest {
  readonly packageCode: string;
  readonly providerReference: string;
  readonly providerLocationReference?: string;
  readonly fulfilmentModeCode: string;
  readonly addonCodes: readonly string[];
}

export interface HealthCheckConfigurationQuote {
  readonly configurationReference?: string;
  readonly expiresAt?: string;
  readonly package: { code: string; name: string };
  readonly provider: { reference: string; name: string };
  readonly providerLocation: HealthCheckProviderLocation | null;
  readonly fulfilmentMode: { code: string; name: string };
  readonly includedContents: readonly { code: string; name: string; category: string }[];
  readonly selectedAddons: readonly { code: string; name: string; amountMinor: number }[];
  readonly pricing: {
    currency: string;
    basePackagePriceMinor: number;
    clinicalAddonsTotalMinor: number;
    fulfilmentFeeMinor: number;
    totalMinor: number;
  };
}

export interface HealthCheckProviderDiscoveryRequest {
  readonly packageCode: 'ESSENTIAL' | 'COMPLETE';
  readonly fulfilmentModeCode: 'PROVIDER_LOCATION' | 'HOME_VISIT';
  readonly preferredDate: string;
  readonly preferredTime: string;
  readonly timezone: string;
  readonly countryCode: string;
  readonly stateOrRegion: string;
  readonly city: string;
  readonly postalCode?: string;
  readonly page?: number;
  readonly limit?: number;
}
export interface HealthCheckProviderLocation {
  readonly reference: string;
  readonly name: string;
  readonly addressLine1: string;
  readonly addressLine2: string | null;
  readonly city: string;
  readonly stateOrRegion: string;
  readonly postalCode: string | null;
  readonly countryCode: string;
}
export interface HealthCheckProviderAddon {
  readonly code: string;
  readonly name: string;
  readonly category: string;
  readonly priceMinor: number;
  readonly currency: string;
}
export interface HealthCheckProviderOffering {
  readonly providerReference: string;
  readonly providerName: string;
  readonly packageCode: string;
  readonly basePackagePriceMinor: number;
  readonly currency: string;
  readonly fulfilmentMode: {
    code: 'PROVIDER_LOCATION' | 'HOME_VISIT';
    name: string;
    fulfilmentFeeMinor: number;
  };
  readonly locations: readonly HealthCheckProviderLocation[];
  readonly addons: readonly HealthCheckProviderAddon[];
}
export interface HealthCheckProviderDiscoveryResponse {
  readonly items: readonly HealthCheckProviderOffering[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

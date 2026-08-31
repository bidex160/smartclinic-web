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
  readonly fulfilmentModeCode: string;
  readonly addonCodes: readonly string[];
}

export interface HealthCheckConfigurationQuote {
  readonly package: { code: string; name: string };
  readonly provider: { providerReference: string; name: string };
  readonly fulfilmentMode: { code: string; name: string };
  readonly includedContents: readonly { code: string; name: string; category: string }[];
  readonly selectedAddons: readonly { code: string; name: string; priceMinor: number }[];
  readonly pricing: {
    currency: string;
    basePackagePriceMinor: number;
    clinicalAddonsTotalMinor: number;
    fulfilmentFeeMinor: number;
    totalMinor: number;
  };
}

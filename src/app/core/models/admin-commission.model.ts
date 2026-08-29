export type CommissionRateSource = 'PLATFORM_DEFAULT' | 'PROVIDER_OVERRIDE';

export interface PlatformCommissionResponse {
  readonly configured: boolean;
  readonly commissionBasisPoints: number | null;
  readonly commissionPercentage: string | null;
  readonly updatedAt: string | null;
}

export interface ProviderCommissionResponse {
  readonly providerReference: string;
  readonly platformDefaultBasisPoints: number | null;
  readonly providerOverrideBasisPoints: number | null;
  readonly configured: boolean;
  readonly effectiveBasisPoints: number | null;
  readonly source: CommissionRateSource | null;
}

export interface SetCommissionRateRequest {
  readonly commissionBasisPoints: number;
}

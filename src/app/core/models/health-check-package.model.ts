export interface HealthCheckPackage {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly benefits: string[];
  readonly estimatedDurationMinutes: number | null;
  readonly prices: HealthCheckPackagePrice[];
  readonly isActive: boolean;
}

export interface HealthCheckPackagePrice {
  readonly fulfilmentModeId: string;
  readonly fulfilmentModeCode: string;
  readonly fulfilmentModeName: string;
  readonly amount: string;
  readonly currency: string;
}

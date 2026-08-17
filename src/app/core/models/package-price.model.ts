export interface PackagePrice {
  readonly id: string;
  readonly healthCheckPackageId: string;
  readonly fulfilmentModeId: string;
  readonly amount: string;
  readonly currency: string;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PackagePriceFilters {
  readonly healthCheckPackageId?: string;
  readonly fulfilmentModeId?: string;
  readonly isActive?: boolean;
}

export interface CreatePackagePriceRequest {
  readonly healthCheckPackageId: string;
  readonly fulfilmentModeId: string;
  readonly amount: string;
  readonly currency: 'NGN';
  readonly effectiveFrom: string;
  readonly effectiveTo?: string;
}

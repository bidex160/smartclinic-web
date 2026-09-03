import { HealthCheckClinicalResultType } from './health-check-clinical-content.model';

export type { HealthCheckClinicalResultType } from './health-check-clinical-content.model';

export const HEALTH_CHECK_CLINICAL_CONTENT_CATEGORIES = [
  { value: 'VITALS', label: 'Vitals' },
  { value: 'LAB', label: 'Laboratory' },
  { value: 'SCREENING', label: 'Screening' },
  { value: 'ASSESSMENT', label: 'Assessment' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'OTHER', label: 'Other' },
] as const;
export type HealthCheckClinicalContentCategory =
  (typeof HEALTH_CHECK_CLINICAL_CONTENT_CATEGORIES)[number]['value'];

export function isHealthCheckClinicalContentCategory(
  value: string,
): value is HealthCheckClinicalContentCategory {
  return HEALTH_CHECK_CLINICAL_CONTENT_CATEGORIES.some((category) => category.value === value);
}

export interface AdminHealthCheckPackageSummary {
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly benefits: readonly string[];
  readonly estimatedDurationMinutes: number | null;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly includedContentCount: number;
  readonly optionalAddonCount: number;
}

export interface AdminClinicalContent {
  readonly reference: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly category: string;
  readonly resultType: HealthCheckClinicalResultType;
  readonly unit: string | null;
  readonly displayOrder: number;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AdminPackageIncludedContent extends AdminClinicalContent {
  readonly sortOrder: number;
  readonly compositionActive: boolean;
  readonly canonicalContentActive: boolean;
}

export interface AdminPackageOptionalAddon extends AdminClinicalContent {
  readonly eligibilityActive: boolean;
  readonly canonicalContentActive: boolean;
}

export interface AdminHealthCheckPackageDetail extends Omit<
  AdminHealthCheckPackageSummary,
  'includedContentCount' | 'optionalAddonCount'
> {
  readonly includedContents: readonly AdminPackageIncludedContent[];
  readonly optionalAddons: readonly AdminPackageOptionalAddon[];
}

export interface AdminClinicalContentPage {
  readonly items: readonly AdminClinicalContent[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface AdminClinicalContentDetail extends AdminClinicalContent {
  readonly includedInPackages: readonly {
    readonly packageCode: string;
    readonly packageName: string;
    readonly sortOrder: number;
    readonly isActive: boolean;
  }[];
  readonly optionalForPackages: readonly {
    readonly packageCode: string;
    readonly packageName: string;
    readonly isActive: boolean;
  }[];
  readonly activeProviderOfferingCount: number;
}

export interface AdminClinicalContentFilters {
  readonly isActive?: boolean;
  readonly category?: string;
  readonly resultType?: HealthCheckClinicalResultType;
  readonly search?: string;
  readonly page?: number;
  readonly limit?: number;
}

export interface UpdateAdminHealthCheckPackageRequest {
  readonly name?: string;
  readonly description?: string | null;
  readonly benefits?: readonly string[];
  readonly estimatedDurationMinutes?: number | null;
}

export interface CreateAdminClinicalContentRequest {
  readonly code: string;
  readonly name: string;
  readonly description?: string | null;
  readonly category: string;
  readonly resultType: HealthCheckClinicalResultType;
  readonly unit?: string | null;
  readonly displayOrder?: number;
  readonly isActive?: boolean;
}

export interface UpdateAdminClinicalContentRequest {
  readonly name?: string;
  readonly description?: string | null;
  readonly category?: string;
  readonly displayOrder?: number;
}

export interface ReorderAdminPackageContentsRequest {
  readonly items: readonly {
    readonly clinicalContentReference: string;
    readonly sortOrder: number;
  }[];
}

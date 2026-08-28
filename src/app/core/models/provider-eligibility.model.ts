export type DayOfWeek =
  'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
export type AvailabilityExceptionType = 'AVAILABLE' | 'UNAVAILABLE';
export interface ProviderService {
  readonly id: string;
  readonly providerId: string;
  readonly healthCheckPackageId: string;
  readonly fulfilmentModeId: string;
  readonly isActive: boolean;
  readonly providerLocationIds: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}
export interface CreateProviderServiceRequest {
  readonly healthCheckPackageId: string;
  readonly fulfilmentModeId: string;
}
export interface ProviderLocation {
  readonly locationReference: string;
  readonly id: string;
  readonly providerId: string;
  readonly name: string;
  readonly addressLine1: string;
  readonly addressLine2: string | null;
  readonly city: string;
  readonly state: string;
  readonly postalCode: string | null;
  readonly countryCode: string;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}
export interface ProviderLocationRequest {
  readonly name: string;
  readonly addressLine1: string;
  readonly addressLine2?: string | null;
  readonly city: string;
  readonly state: string;
  readonly postalCode?: string | null;
  readonly countryCode: string;
}
export interface ProviderAvailability {
  readonly id: string;
  readonly providerId: string;
  readonly providerServiceId: string | null;
  readonly providerLocationId: string | null;
  readonly dayOfWeek: DayOfWeek;
  readonly startTime: string;
  readonly endTime: string;
  readonly bookingStopTime: string | null;
  readonly timezone: string;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}
export interface ProviderAvailabilityRequest {
  readonly providerServiceId?: string | null;
  readonly providerLocationId?: string | null;
  readonly dayOfWeek: DayOfWeek;
  readonly startTime: string;
  readonly endTime: string;
  readonly bookingStopTime?: string | null;
  readonly timezone: string;
}
export interface ProviderAvailabilityException {
  readonly id: string;
  readonly providerId: string;
  readonly providerServiceId: string | null;
  readonly providerLocationId: string | null;
  readonly date: string;
  readonly startTime: string | null;
  readonly endTime: string | null;
  readonly timezone: string;
  readonly type: AvailabilityExceptionType;
  readonly reason: string | null;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}
export interface ProviderAvailabilityExceptionRequest {
  readonly providerServiceId?: string | null;
  readonly providerLocationId?: string | null;
  readonly date: string;
  readonly startTime?: string | null;
  readonly endTime?: string | null;
  readonly timezone: string;
  readonly type: AvailabilityExceptionType;
  readonly reason?: string | null;
}

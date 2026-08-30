export type PatientDashboardMode = 'GETTING_STARTED' | 'ESTABLISHED';
export type PatientDashboardRecommendedAction =
  'COMPLETE_PROFILE' | 'CONNECT_PROVIDER' | 'VIEW_PROVIDER_CONNECTION' | 'FIND_CARE' | 'NONE';

export interface PatientDashboard {
  readonly patient: {
    readonly patientReference: string;
    readonly firstName: string;
    readonly displayName: string;
  };
  readonly setup: {
    readonly accountCreated: boolean;
    readonly profileComplete: boolean;
    readonly missingProfileFields: readonly string[];
    readonly hasProviderConnection: boolean;
    readonly hasConnectedProvider: boolean;
    readonly hasCareRequest: boolean;
    readonly hasHealthCheckBooking: boolean;
    readonly hasStartedCareJourney: boolean;
  };
  readonly recommendedAction: PatientDashboardRecommendedAction;
  readonly dashboardMode: PatientDashboardMode;
}

export interface PatientPortalProfile {
  readonly user: { readonly displayName: string; readonly email: string };
  readonly patient: {
    readonly patientReference: string;
    readonly givenName: string;
    readonly familyName: string;
    readonly phone: string | null;
    readonly dateOfBirth: string | null;
  };
}

export interface UpdatePatientPortalProfileRequest {
  readonly givenName?: string;
  readonly familyName?: string;
  readonly phone?: string | null;
  readonly dateOfBirth?: string | null;
}

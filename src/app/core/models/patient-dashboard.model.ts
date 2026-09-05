export type PatientDashboardMode = 'GETTING_STARTED' | 'ESTABLISHED';
export type PatientDashboardRecommendedAction =
  | 'COMPLETE_PROFILE'
  | 'CONNECT_PROVIDER'
  | 'VIEW_PROVIDER_CONNECTION'
  | 'FIND_CARE'
  | 'VIEW_APPOINTMENT'
  | 'COMPLETE_PAYMENT'
  | 'CONTINUE_SELF_CHECK'
  | 'VIEW_HEALTH_CHECK'
  | 'NONE';

export type PatientDashboardActionResourceDomain =
  | 'GUIDED_SELF_CHECK'
  | 'HEALTH_CHECK'
  | 'CARE_REQUEST'
  | 'CARE_APPOINTMENT'
  | 'PROVIDER_CONNECTION';

export type PatientDashboardActionTargetType =
  | 'PROFILE'
  | 'PAYMENT'
  | 'GUIDED_SELF_CHECK'
  | 'HEALTH_CHECK'
  | 'FIND_CARE'
  | 'CARE_APPOINTMENT'
  | 'PROVIDER_CONNECTION'
  | 'STAY_WELL';

export interface PatientDashboardRecommendedActionDetail {
  readonly type: PatientDashboardRecommendedAction;
  readonly resource: {
    readonly domain: PatientDashboardActionResourceDomain;
    readonly reference: string;
  } | null;
  readonly target: {
    readonly type: PatientDashboardActionTargetType;
  };
}

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
  /** Optional only for compatibility during a staggered backend/frontend deployment. */
  readonly recommendedActionDetail?: PatientDashboardRecommendedActionDetail;
  readonly dashboardMode: PatientDashboardMode;
}

export interface PatientPortalProfile {
  readonly user: { readonly displayName: string; readonly email: string | null };
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

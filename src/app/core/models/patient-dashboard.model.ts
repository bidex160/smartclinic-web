export type PatientDashboardMode = 'GETTING_STARTED' | 'ESTABLISHED';
export type PatientDailyRoutineType =
  | 'HYDRATION'
  | 'MOVEMENT'
  | 'BREAK'
  | 'SLEEP'
  | 'VITAMIN'
  | 'MEDICATION';

export interface PatientDailyRoutine {
  readonly reference: string;
  readonly type: PatientDailyRoutineType;
  readonly label: string;
  readonly instructions: string | null;
  readonly scheduledLocalTime: string;
  readonly timezone: string;
  readonly daysOfWeek: readonly number[];
  readonly enabled: boolean;
  readonly source: 'PATIENT' | 'PRESCRIPTION';
  /** Only present on dashboard `todayRoutines`; optional during staggered deployment. */
  readonly completedToday?: boolean;
}

/** Self-reported daily routine ticks. Never clinical adherence data. */
export interface DailyCheckInScores {
  /** 1 = very low … 5 = great. */
  readonly mood: number;
  readonly energy: number | null;
  readonly sleep: number | null;
}

export interface DailyCheckIn extends DailyCheckInScores {
  readonly localDate: string;
}

export interface UpsertDailyCheckInRequest {
  readonly mood: number;
  readonly energy?: number | null;
  readonly sleep?: number | null;
  readonly timezone: string;
}

export interface DailyCareProgress {
  readonly localDate: string;
  readonly completedReferences: readonly string[];
  readonly streakDays: number;
  /** Optional during a staggered API/Web deployment. */
  readonly bestStreak?: number;
  readonly todayCheckIn?: DailyCheckInScores | null;
  /** The last 7 local days, oldest first, ending today. */
  readonly week?: readonly { readonly localDate: string; readonly active: boolean }[];
}

export interface CreatePatientDailyRoutineRequest {
  readonly type: PatientDailyRoutineType;
  readonly label: string;
  readonly instructions?: string | null;
  readonly scheduledLocalTime: string;
  readonly timezone: string;
  readonly daysOfWeek: readonly number[];
  readonly medicationSafetyAcknowledged?: boolean;
}
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
  /** Optional during a staggered API/Web deployment. */
  readonly todayRoutines?: readonly PatientDailyRoutine[];
  /** Optional during a staggered API/Web deployment. */
  readonly dailyCare?: DailyCareProgress;
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

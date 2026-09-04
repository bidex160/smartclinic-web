export type HealthCheckEncounterStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type HealthCheckMeasurementCode =
  'BLOOD_PRESSURE' | 'BLOOD_GLUCOSE' | 'BMI' | 'TEMPERATURE' | 'OXYGEN_SATURATION' | 'PULSE';
export type HealthCheckEncounterResultType = 'NONE' | 'SINGLE_NUMERIC' | 'BLOOD_PRESSURE';
export type HealthCheckEncounterRequirementSource =
  'INCLUDED_PACKAGE_CONTENT' | 'SELECTED_ADDON';

export interface HealthCheckEncounterRequirement {
  readonly code: string;
  readonly name: string;
  readonly category: string;
  readonly resultType: HealthCheckEncounterResultType;
  readonly unit: string | null;
  readonly source: HealthCheckEncounterRequirementSource;
  readonly requiresRecordedResult: boolean;
}

export interface HealthCheckMeasurement {
  readonly code: string;
  readonly value: number;
  readonly secondaryValue: number | null;
  readonly unit: string;
  readonly recordedAt: string;
}

export interface ProviderHealthCheckEncounter {
  readonly bookingReference: string;
  readonly status: HealthCheckEncounterStatus;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
  readonly participant: { readonly givenName: string; readonly familyName: string };
  readonly healthCheckPackage: { readonly code: string; readonly name: string };
  readonly fulfilmentMode: { readonly code: string; readonly name: string };
  readonly confirmedSchedule: import('./booking-schedule.model').ConfirmedScheduleSummary | null;
  readonly visitAddress: {
    readonly addressLine1: string;
    readonly addressLine2: string | null;
    readonly city: string;
    readonly stateOrRegion: string;
    readonly postalCode: string | null;
    readonly countryCode: string;
    readonly locationNote: string | null;
  } | null;
  readonly requirements: readonly HealthCheckEncounterRequirement[];
  readonly measurements: readonly HealthCheckMeasurement[];
}

export interface AdditionalHealthCheckResult {
  readonly code: string;
  readonly value: number;
  readonly secondaryValue?: number;
}

// export interface SaveHealthCheckMeasurementsRequest {
//   readonly bloodPressure: { readonly systolic: number; readonly diastolic: number };
//   readonly bloodGlucose: { readonly value: number };
//   readonly bmi: { readonly value: number };
//   readonly temperature: { readonly value: number };
//   readonly oxygenSaturation: { readonly value: number };
//   readonly pulse: { readonly value: number };
//   readonly additionalResults?: readonly AdditionalHealthCheckResult[];
// }

export interface SaveHealthCheckMeasurementsRequest {
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };

  bloodGlucose?: {
    value: number;
  };

  bmi?: {
    value: number;
  };

  temperature?: {
    value: number;
  };

  oxygenSaturation?: {
    value: number;
  };

  pulse?: {
    value: number;
  };

  additionalResults?: AdditionalHealthCheckResult[];
}
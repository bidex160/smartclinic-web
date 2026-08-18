export type HealthCheckEncounterStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type HealthCheckMeasurementCode =
  'BLOOD_PRESSURE' | 'BLOOD_GLUCOSE' | 'BMI' | 'TEMPERATURE' | 'OXYGEN_SATURATION' | 'PULSE';

export interface HealthCheckMeasurement {
  readonly code: HealthCheckMeasurementCode;
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
  readonly measurements: readonly HealthCheckMeasurement[];
}

export interface SaveHealthCheckMeasurementsRequest {
  readonly bloodPressure: { readonly systolic: number; readonly diastolic: number };
  readonly bloodGlucose: { readonly value: number };
  readonly bmi: { readonly value: number };
  readonly temperature: { readonly value: number };
  readonly oxygenSaturation: { readonly value: number };
  readonly pulse: { readonly value: number };
}

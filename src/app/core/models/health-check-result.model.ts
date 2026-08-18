import { HealthCheckMeasurementCode } from './provider-health-check-encounter.model';

export interface HealthCheckResultMeasurement {
  readonly code: HealthCheckMeasurementCode;
  readonly value: number;
  readonly secondaryValue: number | null;
  readonly unit: string;
  readonly recordedAt: string;
}

export interface HealthCheckResult {
  readonly bookingReference: string;
  readonly completedAt: string;
  readonly healthCheckPackage: { readonly code: string; readonly name: string };
  readonly provider: { readonly displayName: string } | null;
  readonly measurements: readonly HealthCheckResultMeasurement[];
}

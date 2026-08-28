export interface HealthCheckPackage {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly benefits: string[];
  readonly estimatedDurationMinutes: number | null;
  readonly isActive: boolean;
}

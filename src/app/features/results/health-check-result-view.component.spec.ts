import { TestBed } from '@angular/core/testing';
import { HealthCheckResult } from '../../core/models/health-check-result.model';
import { HealthCheckResultViewComponent } from './health-check-result-view.component';

describe('HealthCheckResultViewComponent', () => {
  it('renders the safe completed projection and backend-provided units only', async () => {
    await TestBed.configureTestingModule({
      imports: [HealthCheckResultViewComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(HealthCheckResultViewComponent);
    fixture.componentRef.setInput('result', healthResult());
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    for (const value of [
      'SC-1',
      'Complete',
      'Care Provider',
      '120 / 80 server-bp',
      '95 server-glucose',
      '24.2 server-bmi',
      '36.8 server-temp',
      '98 server-oxygen',
      '72 server-pulse',
    ])
      expect(text).toContain(value);
    for (const forbidden of [
      'Normal',
      'Abnormal',
      'High',
      'Low',
      'Healthy',
      'Unhealthy',
      'payment',
      'funding',
      'providerId',
    ])
      expect(text).not.toContain(forbidden);
    expect(text).toContain('Clinical interpretation is not included');
  });
});
export function healthResult(): HealthCheckResult {
  const recordedAt = '2026-08-18T09:00:00Z';
  return {
    bookingReference: 'SC-1',
    completedAt: '2026-08-18T10:00:00Z',
    healthCheckPackage: { code: 'COMPLETE', name: 'Complete' },
    provider: { displayName: 'Care Provider' },
    measurements: [
      { code: 'BLOOD_PRESSURE', value: 120, secondaryValue: 80, unit: 'server-bp', recordedAt },
      {
        code: 'BLOOD_GLUCOSE',
        value: 95,
        secondaryValue: null,
        unit: 'server-glucose',
        recordedAt,
      },
      { code: 'BMI', value: 24.2, secondaryValue: null, unit: 'server-bmi', recordedAt },
      { code: 'TEMPERATURE', value: 36.8, secondaryValue: null, unit: 'server-temp', recordedAt },
      {
        code: 'OXYGEN_SATURATION',
        value: 98,
        secondaryValue: null,
        unit: 'server-oxygen',
        recordedAt,
      },
      { code: 'PULSE', value: 72, secondaryValue: null, unit: 'server-pulse', recordedAt },
    ],
  };
}

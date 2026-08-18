import { HttpErrorResponse } from '@angular/common/http';
import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HealthCheckResult } from '../../core/models/health-check-result.model';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { GuestHealthCheckResultPageComponent } from './guest-health-check-result-page.component';
import { RegisteredHealthCheckResultPageComponent } from './registered-health-check-result-page.component';

describe('health result pages', () => {
  it('renders an authenticated own result by booking reference', async () => {
    const api = { getOwnResult: vi.fn(() => of(healthResult())) };
    const fixture = await create(
      RegisteredHealthCheckResultPageComponent,
      { bookingReference: 'SC-1' },
      api,
    );
    expect(api.getOwnResult).toHaveBeenCalledWith('SC-1');
    expect(fixture.nativeElement.textContent).toContain('Care Provider');
  });
  it.each([401, 403, 404])(
    'collapses registered access status %s to a safe state',
    async (status) => {
      const api = {
        getOwnResult: vi.fn(() =>
          throwError(
            () => new HttpErrorResponse({ status, error: { message: 'another patient exists' } }),
          ),
        ),
      };
      const fixture = await create(
        RegisteredHealthCheckResultPageComponent,
        { bookingReference: 'SC-1' },
        api,
      );
      expect(fixture.nativeElement.textContent).toContain('Result unavailable');
      expect(fixture.nativeElement.textContent).not.toContain('another patient exists');
    },
  );
  it('loads a guest token without persistence and renders a valid result', async () => {
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    const api = { getGuestResult: vi.fn(() => of(healthResult())) };
    const fixture = await create(
      GuestHealthCheckResultPageComponent,
      { token: 'opaque-result-token' },
      api,
    );
    expect(api.getGuestResult).toHaveBeenCalledWith('opaque-result-token');
    expect(storage).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).not.toContain('opaque-result-token');
  });
  it.each([400, 404, 409])('uses one guest unavailable state for status %s', async (status) => {
    const api = {
      getGuestResult: vi.fn(() =>
        throwError(() => new HttpErrorResponse({ status, error: { message: 'token revoked' } })),
      ),
    };
    const fixture = await create(GuestHealthCheckResultPageComponent, { token: 'opaque' }, api);
    expect(fixture.nativeElement.textContent).toContain('This result link is no longer available.');
    expect(fixture.nativeElement.textContent).not.toContain('token revoked');
  });
  async function create<T>(component: Type<T>, params: Record<string, string>, api: object) {
    await TestBed.configureTestingModule({
      imports: [component],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(params) } },
        },
        { provide: HealthCheckResultsApiService, useValue: api },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(component);
    fixture.detectChanges();
    return fixture;
  }
});

function healthResult(): HealthCheckResult {
  const recordedAt = '2026-08-18T09:00:00Z';
  return {
    bookingReference: 'SC-1',
    completedAt: '2026-08-18T10:00:00Z',
    healthCheckPackage: { code: 'COMPLETE', name: 'Complete' },
    provider: { displayName: 'Care Provider' },
    measurements: [
      { code: 'BLOOD_PRESSURE', value: 120, secondaryValue: 80, unit: 'mmHg', recordedAt },
      { code: 'BLOOD_GLUCOSE', value: 95, secondaryValue: null, unit: 'mg/dL', recordedAt },
      { code: 'BMI', value: 24.2, secondaryValue: null, unit: 'kg/m²', recordedAt },
      { code: 'TEMPERATURE', value: 36.8, secondaryValue: null, unit: '°C', recordedAt },
      { code: 'OXYGEN_SATURATION', value: 98, secondaryValue: null, unit: '%', recordedAt },
      { code: 'PULSE', value: 72, secondaryValue: null, unit: 'bpm', recordedAt },
    ],
  };
}

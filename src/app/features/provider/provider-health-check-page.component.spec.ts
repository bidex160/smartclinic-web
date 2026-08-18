import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { ProviderHealthCheckEncounter } from '../../core/models/provider-health-check-encounter.model';
import { ProviderHealthCheckEncountersApiService } from '../../core/services/provider-health-check-encounters-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { ProviderHealthCheckPageComponent } from './provider-health-check-page.component';

describe('ProviderHealthCheckPageComponent', () => {
  it('loads and prefills the six safe measurements', async () => {
    const { component, fixture } = await setup();
    fixture.detectChanges();
    expect(component.form.getRawValue()).toEqual({
      systolic: 120,
      diastolic: 80,
      bloodGlucose: 95,
      bmi: 24.2,
      temperature: 36.8,
      oxygenSaturation: 98,
      pulse: 72,
    });
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Ada Okafor');
    expect(text).toContain('mmHg');
    for (const hidden of ['booker', 'funding', 'normal range', 'abnormal', 'interpretation'])
      expect(text).not.toContain(hidden);
  });

  it('starts a missing encounter once from backend state', async () => {
    const pending = new Subject<ProviderHealthCheckEncounter>();
    const { component, api } = await setup({
      getError: new HttpErrorResponse({ status: 404 }),
      start: () => pending,
    });
    expect(component.canStart()).toBe(true);
    component.start();
    component.start();
    expect(api.start).toHaveBeenCalledTimes(1);
    pending.next(encounter());
    pending.complete();
    expect(component.encounter()?.status).toBe('IN_PROGRESS');
  });

  it('requires both blood-pressure values and all six fields', async () => {
    const { component, api } = await setup();
    component.form.patchValue({ diastolic: null });
    component.save();
    expect(component.form.controls.diastolic.invalid).toBe(true);
    expect(api.saveMeasurements).not.toHaveBeenCalled();
  });

  it('saves once and applies authoritative returned values', async () => {
    const pending = new Subject<ProviderHealthCheckEncounter>();
    const { component, api } = await setup({ save: () => pending });
    component.save();
    component.save();
    expect(api.saveMeasurements).toHaveBeenCalledTimes(1);
    pending.next(
      encounter({
        measurements: measurements().map((item) =>
          item.code === 'PULSE' ? { ...item, value: 75 } : item,
        ),
      }),
    );
    pending.complete();
    expect(component.form.controls.pulse.value).toBe(75);
    expect(component.statusMessage()).toContain('saved');
  });

  it('requires saved measurements and explicit confirmation to complete', async () => {
    const missing = await setup({ encounter: encounter({ measurements: [] }) });
    missing.component.requestCompletion();
    missing.component.complete();
    expect(missing.api.complete).not.toHaveBeenCalled();
    TestBed.resetTestingModule();
    const ready = await setup();
    ready.component.complete();
    expect(ready.api.complete).not.toHaveBeenCalled();
    ready.component.requestCompletion();
    ready.component.complete();
    expect(ready.api.complete).toHaveBeenCalledOnce();
    expect(ready.component.completed()).toBe(true);
    expect(ready.component.form.disabled).toBe(true);
  });

  it('keeps completed encounters read-only and blocks saving', async () => {
    const { component, api, fixture } = await setup({
      encounter: encounter({ status: 'COMPLETED', completedAt: '2026-08-18T11:00:00Z' }),
    });
    component.save();
    fixture.detectChanges();
    expect(api.saveMeasurements).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('read-only');
  });

  it.each([403, 404, 409])('sanitizes workflow status %s', async (status) => {
    const options =
      status === 404
        ? { getError: new HttpErrorResponse({ status, error: { message: 'raw internals' } }) }
        : { saveError: new HttpErrorResponse({ status, error: { message: 'raw internals' } }) };
    const { component, router } = await setup(options);
    if (status !== 404) component.save();
    expect(component.error() ?? '').not.toContain('raw internals');
    if (status === 403) expect(router.navigate).toHaveBeenCalledWith(['/provider/access-denied']);
    if (status === 404) expect(component.canStart()).toBe(true);
  });

  async function setup(
    options: {
      encounter?: ProviderHealthCheckEncounter;
      getError?: HttpErrorResponse;
      saveError?: HttpErrorResponse;
      start?: () => any;
      save?: () => any;
    } = {},
  ) {
    const value = options.encounter ?? encounter();
    const api = {
      get: vi.fn(() => (options.getError ? throwError(() => options.getError) : of(value))),
      start: vi.fn(options.start ?? (() => of(encounter()))),
      saveMeasurements: vi.fn(
        options.save ??
          (() => (options.saveError ? throwError(() => options.saveError) : of(value))),
      ),
      complete: vi.fn(() =>
        of(encounter({ status: 'COMPLETED', completedAt: '2026-08-18T11:00:00Z' })),
      ),
    };
    await TestBed.configureTestingModule({
      imports: [ProviderHealthCheckPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ reference: 'SC-1' }) } },
        },
        { provide: ProviderHealthCheckEncountersApiService, useValue: api },
        { provide: AuthSessionService, useValue: { logout: () => of(true) } },
      ],
    }).compileComponents();
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(ProviderHealthCheckPageComponent);
    return { fixture, component: fixture.componentInstance, api, router };
  }
});

function encounter(
  changes: Partial<ProviderHealthCheckEncounter> = {},
): ProviderHealthCheckEncounter {
  return {
    bookingReference: 'SC-1',
    status: 'IN_PROGRESS',
    startedAt: '2026-08-18T10:00:00Z',
    completedAt: null,
    participant: { givenName: 'Ada', familyName: 'Okafor' },
    healthCheckPackage: { code: 'ESSENTIAL', name: 'Essential' },
    fulfilmentMode: { code: 'HOME_VISIT', name: 'Home Visit' },
    measurements: measurements(),
    ...changes,
  };
}
function measurements(): ProviderHealthCheckEncounter['measurements'] {
  const recordedAt = '2026-08-18T10:30:00Z';
  return [
    { code: 'BLOOD_PRESSURE', value: 120, secondaryValue: 80, unit: 'mmHg', recordedAt },
    { code: 'BLOOD_GLUCOSE', value: 95, secondaryValue: null, unit: 'mg/dL', recordedAt },
    { code: 'BMI', value: 24.2, secondaryValue: null, unit: 'kg/m²', recordedAt },
    { code: 'TEMPERATURE', value: 36.8, secondaryValue: null, unit: '°C', recordedAt },
    { code: 'OXYGEN_SATURATION', value: 98, secondaryValue: null, unit: '%', recordedAt },
    { code: 'PULSE', value: 72, secondaryValue: null, unit: 'bpm', recordedAt },
  ];
}

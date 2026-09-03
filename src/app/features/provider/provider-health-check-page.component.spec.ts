import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import {
  HealthCheckEncounterRequirement,
  ProviderHealthCheckEncounter,
  SaveHealthCheckMeasurementsRequest,
} from '../../core/models/provider-health-check-encounter.model';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { ProviderHealthCheckEncountersApiService } from '../../core/services/provider-health-check-encounters-api.service';
import { ProviderOffersApiService } from '../../core/services/provider-offers-api.service';
import { ProviderHealthCheckPageComponent } from './provider-health-check-page.component';

describe('ProviderHealthCheckPageComponent', () => {
  it('renders requirements dynamically as stacked responsive cards with provenance', async () => {
    const { fixture } = await setup();
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('[data-result-type]');
    expect(cards.length).toBe(requirements().length);
    expect(fixture.nativeElement.querySelector('[data-testid="encounter-requirements"]').className)
      .toContain('md:grid-cols-2');
    expect(fixture.nativeElement.textContent).toContain('Included in package');
    expect(fixture.nativeElement.textContent).toContain('Selected add-on');
  });

  it('renders NONE visibly without an input or fake acknowledgement', async () => {
    const { fixture } = await setup();
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('[data-result-type="NONE"]');
    expect(card.textContent).toContain('No numeric result is required');
    expect(card.querySelector('input')).toBeNull();
    expect(card.querySelector('input[type="checkbox"]')).toBeNull();
  });

  it('renders every SINGLE_NUMERIC requirement with one numeric input', async () => {
    const { fixture } = await setup();
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('[data-result-type="SINGLE_NUMERIC"]');
    expect(cards.length).toBe(6);
    for (const card of cards) {
      expect(card.querySelectorAll('input[type="number"]').length).toBe(1);
      expect(card.textContent).toMatch(/mg\/dL|kg\/m²|°C|%|bpm|mmol\/L/);
    }
  });

  it('renders legacy and additional BLOOD_PRESSURE requirements from resultType alone', async () => {
    const { fixture } = await setup();
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('[data-result-type="BLOOD_PRESSURE"]');
    expect(cards.length).toBe(2);
    for (const card of cards) {
      expect(card.querySelectorAll('input[type="number"]').length).toBe(2);
      expect(card.textContent).toContain('Systolic');
      expect(card.textContent).toContain('Diastolic');
    }
  });

  it('prefills legacy and additional persisted results by code', async () => {
    const { component } = await setup();
    const req = component.encounter()!.requirements;
    expect(component.primaryControl(req[0]).value).toBe(120);
    expect(component.secondaryControl(req[0]).value).toBe(80);
    expect(component.primaryControl(req.find((item) => item.code === 'CHOLESTEROL')!).value).toBe(4.2);
    const addonBp = req.find((item) => item.code === 'ANKLE_PRESSURE')!;
    expect(component.primaryControl(addonBp).value).toBe(118);
    expect(component.secondaryControl(addonBp).value).toBe(76);
  });

  it('maps six compatibility fields and only result-bearing additional codes', async () => {
    const { component, api } = await setup();
    component.save();
    expect(api.saveMeasurements).toHaveBeenCalledWith('SC-1', {
      bloodPressure: { systolic: 120, diastolic: 80 },
      bloodGlucose: { value: 95 },
      bmi: { value: 24.2 },
      temperature: { value: 36.8 },
      oxygenSaturation: { value: 98 },
      pulse: { value: 72 },
      additionalResults: [
        { code: 'CHOLESTEROL', value: 4.2 },
        { code: 'ANKLE_PRESSURE', value: 118, secondaryValue: 76 },
      ],
    });
    expect(JSON.stringify(api.saveMeasurements.mock.calls[0]![1])).not.toContain('CLINICIAN_REVIEW');
  });

  it('does not submit duplicate requirements or duplicate legacy codes', async () => {
    const duplicate = requirements()[0];
    const value = encounter({ requirements: [...requirements(), duplicate] });
    const { component, api } = await setup({ encounter: value });
    component.save();
    const body = api.saveMeasurements.mock.calls[0]![1];
    expect((body.additionalResults ?? []).filter((item) => item.code === 'BLOOD_PRESSURE'))
      .toHaveLength(0);
    expect((body.additionalResults ?? []).filter((item) => item.code === 'CHOLESTEROL'))
      .toHaveLength(1);
  });

  it('requires only backend-required result controls and requires both BP values', async () => {
    const { component, api } = await setup();
    const bp = component.encounter()!.requirements[0];
    component.secondaryControl(bp).setValue(null);
    component.save();
    expect(component.secondaryControl(bp).invalid).toBe(true);
    expect(api.saveMeasurements).not.toHaveBeenCalled();
  });

  it('surfaces a backend validation message while retaining contextual fallback', async () => {
    const { component } = await setup({
      saveError: new HttpErrorResponse({
        status: 400,
        error: { message: 'Blood pressure result requires both values: ANKLE_PRESSURE' },
      }),
    });
    component.save();
    expect(component.error()).toBe('Blood pressure result requires both values: ANKLE_PRESSURE');
  });

  it('does not contain thresholds, classification, interpretation, or diagnosis logic', async () => {
    const { fixture } = await setup();
    fixture.detectChanges();
    const text = (fixture.nativeElement.textContent as string).toLowerCase();
    for (const term of ['normal range', 'abnormal', 'diagnosis', 'interpretation'])
      expect(text).not.toContain(term);
  });

  it('starts once from backend schedule state and applies returned requirements', async () => {
    const pending = new Subject<ProviderHealthCheckEncounter>();
    const { component, api } = await setup({
      getError: new HttpErrorResponse({ status: 404 }),
      start: () => pending,
    });
    component.start();
    component.start();
    expect(api.start).toHaveBeenCalledTimes(1);
    pending.next(encounter());
    pending.complete();
    expect(component.encounter()?.requirements).toHaveLength(requirements().length);
  });

  it('leaves completion eligibility authoritative to the backend', async () => {
    const { component, api } = await setup({ encounter: encounter({ measurements: [] }) });
    component.requestCompletion();
    component.complete();
    expect(api.complete).toHaveBeenCalledOnce();
    expect(component.encounter()?.status).toBe('COMPLETED');
  });

  it('keeps completed encounters read-only', async () => {
    const { component, api, fixture } = await setup({
      encounter: encounter({ status: 'COMPLETED', completedAt: '2026-08-18T11:00:00Z' }),
    });
    component.save();
    fixture.detectChanges();
    expect(api.saveMeasurements).not.toHaveBeenCalled();
    expect(component.form.disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('read-only');
  });

  async function setup(
    options: {
      encounter?: ProviderHealthCheckEncounter;
      getError?: HttpErrorResponse;
      saveError?: HttpErrorResponse;
      start?: () => Subject<ProviderHealthCheckEncounter>;
    } = {},
  ) {
    const value = options.encounter ?? encounter();
    const api = {
      get: vi.fn(() => (options.getError ? throwError(() => options.getError) : of(value))),
      start: vi.fn(options.start ?? (() => of(encounter()))),
      saveMeasurements: vi.fn((_reference: string, _request: SaveHealthCheckMeasurementsRequest) =>
        options.saveError ? throwError(() => options.saveError) : of(value),
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
        {
          provide: ProviderOffersApiService,
          useValue: {
            getOffers: () =>
              of([{ bookingReference: 'SC-1', confirmedSchedule: encounter().confirmedSchedule }]),
          },
        },
        { provide: AuthSessionService, useValue: { logout: () => of(true) } },
      ],
    }).compileComponents();
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(ProviderHealthCheckPageComponent);
    return { fixture, component: fixture.componentInstance, api };
  }
});

function encounter(changes: Partial<ProviderHealthCheckEncounter> = {}): ProviderHealthCheckEncounter {
  return {
    bookingReference: 'SC-1',
    status: 'IN_PROGRESS',
    startedAt: '2026-08-18T10:00:00Z',
    completedAt: null,
    participant: { givenName: 'Ada', familyName: 'Okafor' },
    healthCheckPackage: { code: 'ESSENTIAL', name: 'Essential' },
    fulfilmentMode: { code: 'HOME_VISIT', name: 'Home Visit' },
    confirmedSchedule: {
      date: '2026-08-20',
      timeFrom: '09:00',
      timeTo: '10:00',
      timezone: 'Africa/Lagos',
      providerLocationName: null,
    },
    visitAddress: null,
    requirements: requirements(),
    measurements: measurements(),
    ...changes,
  };
}

function requirements(): HealthCheckEncounterRequirement[] {
  const single = (code: string, name: string, unit: string): HealthCheckEncounterRequirement => ({
    code,
    name,
    category: 'MEASUREMENT',
    resultType: 'SINGLE_NUMERIC',
    unit,
    source: 'INCLUDED_PACKAGE_CONTENT',
    requiresRecordedResult: true,
  });
  return [
    { ...single('BLOOD_PRESSURE', 'Blood pressure', 'mmHg'), resultType: 'BLOOD_PRESSURE' },
    single('BLOOD_GLUCOSE', 'Blood glucose', 'mg/dL'),
    single('BMI', 'BMI', 'kg/m²'),
    single('TEMPERATURE', 'Temperature', '°C'),
    single('OXYGEN_SATURATION', 'Oxygen saturation', '%'),
    single('PULSE', 'Pulse', 'bpm'),
    {
      ...single('CHOLESTEROL', 'Cholesterol', 'mmol/L'),
      source: 'SELECTED_ADDON',
    },
    {
      ...single('ANKLE_PRESSURE', 'Ankle pressure', 'mmHg'),
      resultType: 'BLOOD_PRESSURE',
      source: 'SELECTED_ADDON',
    },
    {
      code: 'CLINICIAN_REVIEW',
      name: 'Clinician review',
      category: 'SERVICE',
      resultType: 'NONE',
      unit: null,
      source: 'INCLUDED_PACKAGE_CONTENT',
      requiresRecordedResult: false,
    },
  ];
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
    { code: 'CHOLESTEROL', value: 4.2, secondaryValue: null, unit: 'mmol/L', recordedAt },
    { code: 'ANKLE_PRESSURE', value: 118, secondaryValue: 76, unit: 'mmHg', recordedAt },
  ];
}

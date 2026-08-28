import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProviderCareOperationsApiService } from '../../core/services/provider-care-operations-api.service';
import { ProviderCareRequestDetailPageComponent } from './provider-care-request-detail-page.component';
describe('ProviderCareRequestDetailPageComponent', () => {
  const request = (status = 'AWAITING_PROVIDER_RESPONSE', deliveryMode = 'IN_PERSON') => ({
    reference: 'SC-CARE-ABCDEF012345',
    status,
    service: { code: 'DENTAL', name: 'Dental care' },
    deliveryMode,
    geography: { countryCode: 'NG', stateOrRegion: 'Oyo', city: 'Ibadan' },
    preferredProvider: null,
    assignedProvider: null,
    preferredDate: '2026-09-01',
    preferredTime: '10:30',
    contactMethod: 'EMAIL',
    notes: 'Wheelchair access',
    createdAt: '2026-08-28T00:00:00Z',
    updatedAt: '2026-08-28T00:00:00Z',
    appointment: null,
  });
  async function setup(
    status = 'AWAITING_PROVIDER_RESPONSE',
    acceptFails = false,
    scheduleFails = false,
    deliveryMode = 'IN_PERSON',
  ) {
    const api = {
      getLocations: vi.fn(() =>
        of([
          {
            locationReference: 'SCPL-ABCDEF0123456789',
            name: 'Main Clinic',
            addressLine1: '1 Road',
            addressLine2: null,
            city: 'Ibadan',
            state: 'Oyo',
            postalCode: null,
            countryCode: 'NG',
            isActive: true,
          },
        ]),
      ),
      getCareRequest: vi.fn((_r: string) => of(request(status, deliveryMode))),
      acceptCareRequest: vi.fn((_r: string) =>
        acceptFails ? throwError(() => ({ status: 409 })) : of(request('PROVIDER_ACCEPTED')),
      ),
      declineCareRequest: vi.fn((_r: string, _reason: string) => of(request('DECLINED'))),
      scheduleCareRequest: vi.fn((_r: string, _body: unknown) =>
        scheduleFails
          ? throwError(() => ({ status: 409 }))
          : of({
              appointmentReference: 'SC-APT-ABCDEF012345',
              careRequestReference: 'SC-CARE-ABCDEF012345',
              status: 'SCHEDULED',
              deliveryMode: 'IN_PERSON',
              service: { code: 'DENTAL', name: 'Dental care' },
              provider: {
                providerReference: 'SCPR-ABCDEF0123456789',
                displayName: 'Clinic',
                providerType: 'CLINIC',
              },
              providerLocation: null,
              scheduledDate: '2099-09-01',
              scheduledTimeFrom: '10:00',
              scheduledTimeTo: '11:00',
              timezone: 'Africa/Lagos',
              notes: null,
              meetingUrl: null,
              createdAt: '2099-01-01',
              updatedAt: '2099-01-01',
            }),
      ),
    };
    await TestBed.configureTestingModule({
      imports: [ProviderCareRequestDetailPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ reference: 'SC-CARE-ABCDEF012345' }) },
          },
        },
        { provide: ProviderCareOperationsApiService, useValue: api },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProviderCareRequestDetailPageComponent);
    fixture.detectChanges();
    return { fixture, api };
  }
  it('loads by reference and accepts then refreshes authoritative detail', async () => {
    const { fixture, api } = await setup();
    expect(fixture.nativeElement.textContent).toContain('Accept request');
    fixture.componentInstance.accept();
    expect(api.acceptCareRequest).toHaveBeenCalledWith('SC-CARE-ABCDEF012345');
    expect(api.getCareRequest).toHaveBeenCalledTimes(2);
  });
  it('schedules accepted care with public location reference and authoritative refetch', async () => {
    const { fixture, api } = await setup('PROVIDER_ACCEPTED');
    expect(fixture.nativeElement.textContent).toContain('Schedule appointment');
    const c = fixture.componentInstance;
    c.scheduleOpen.set(true);
    c.scheduleForm.setValue({
      scheduledDate: '2099-09-01',
      scheduledTimeFrom: '10:00',
      scheduledTimeTo: '11:00',
      providerLocationReference: 'SCPL-ABCDEF0123456789',
      timezone: 'Africa/Lagos',
      notes: '',
    });
    c.schedule();
    expect(api.scheduleCareRequest).toHaveBeenCalledWith(
      'SC-CARE-ABCDEF012345',
      expect.objectContaining({ providerLocationReference: 'SCPL-ABCDEF0123456789' }),
    );
    expect(api.scheduleCareRequest.mock.calls[0]?.[1]).not.toHaveProperty('providerId');
    expect(api.getCareRequest).toHaveBeenCalledTimes(2);
  });
  it('validates interval and preserves scheduling values after overlap conflict', async () => {
    const { fixture, api } = await setup('PROVIDER_ACCEPTED', false, true);
    const c = fixture.componentInstance;
    c.scheduleForm.setValue({
      scheduledDate: '2099-09-01',
      scheduledTimeFrom: '11:00',
      scheduledTimeTo: '10:00',
      providerLocationReference: '',
      timezone: 'Africa/Lagos',
      notes: 'Keep this',
    });
    c.scheduleOpen.set(true);
    c.schedule();
    expect(api.scheduleCareRequest).not.toHaveBeenCalled();
    expect(c.scheduleError()).toContain('after start');
    c.scheduleForm.patchValue({ scheduledTimeTo: '12:00' });
    c.schedule();
    expect(c.scheduleOpen()).toBe(true);
    expect(c.scheduleForm.controls.notes.value).toBe('Keep this');
    expect(c.scheduleError()).toContain('overlaps');
  });
  it('does not send a ProviderLocation or delivery-mode override for virtual scheduling', async () => {
    const { fixture, api } = await setup('PROVIDER_ACCEPTED', false, false, 'VIRTUAL');
    const c = fixture.componentInstance;
    c.scheduleForm.setValue({
      scheduledDate: '2099-09-01',
      scheduledTimeFrom: '11:00',
      scheduledTimeTo: '12:00',
      providerLocationReference: 'SCPL-ABCDEF0123456789',
      timezone: 'Africa/Lagos',
      notes: '',
    });
    c.scheduleOpen.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Provider location');
    c.schedule();
    expect(api.scheduleCareRequest.mock.calls[0]?.[1]).not.toHaveProperty(
      'providerLocationReference',
    );
    expect(api.scheduleCareRequest.mock.calls[0]?.[1]).not.toHaveProperty('deliveryMode');
  });
  it('uses a modal and exact decline reason contract', async () => {
    const { fixture, api } = await setup();
    fixture.componentInstance.declineOpen.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).not.toBeNull();
    fixture.componentInstance.declineForm.controls.reason.setValue('Not available');
    fixture.componentInstance.confirmDecline();
    expect(api.declineCareRequest).toHaveBeenCalledWith('SC-CARE-ABCDEF012345', 'Not available');
    expect(api.getCareRequest).toHaveBeenCalledTimes(2);
  });
  it('hides response actions for unrelated statuses and refreshes stale conflicts', async () => {
    const accepted = await setup('PROVIDER_ACCEPTED');
    expect(accepted.fixture.nativeElement.textContent).not.toContain('Decline request');
    TestBed.resetTestingModule();
    const stale = await setup('AWAITING_PROVIDER_RESPONSE', true);
    stale.fixture.componentInstance.accept();
    stale.fixture.detectChanges();
    expect(stale.api.getCareRequest).toHaveBeenCalledTimes(2);
    expect(stale.fixture.nativeElement.textContent).toContain('changed before your response');
  });
});

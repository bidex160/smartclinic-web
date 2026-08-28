import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ProviderCareOperationsApiService } from '../../core/services/provider-care-operations-api.service';
import { ProviderFastTrackDetailPageComponent } from './provider-fasttrack-detail-page.component';
describe('ProviderFastTrackDetailPageComponent', () => {
  const item = (source = 'EXTERNAL_APPOINTMENT', status = 'VERIFYING') => ({
    reference: 'SC-FT-ABCDEF0123456789',
    source,
    status,
    provider: {
      providerReference: 'SCPR-ABCDEF0123456789',
      displayName: 'Dynamic Clinic',
      providerType: 'CLINIC',
    },
    service: { code: 'DENTAL', name: 'Dental care' },
    careRequestReference: source === 'SMARTCLINIC_CARE_REQUEST' ? 'SC-CARE-ABCDEF012345' : null,
    externalAppointment:
      source === 'EXTERNAL_APPOINTMENT'
        ? {
            reference: 'APT-1',
            appointmentDate: '2026-09-01',
            appointmentTime: '10:30',
            department: 'Dental',
            doctorName: 'Dr Ada',
          }
        : null,
    notes: 'Verify reception booking',
    feeMinor: 5000,
    currency: 'NGN',
    paymentReady: status === 'READY_FOR_PAYMENT',
    verifiedAt: null,
    paidAt: null,
    confirmedAt: null,
    createdAt: '2026-08-28T00:00:00Z',
    updatedAt: '2026-08-28T00:00:00Z',
  });
  async function setup(source = 'EXTERNAL_APPOINTMENT', status = 'VERIFYING') {
    const api = {
      getFastTrackRequest: vi.fn((_r: string) => of(item(source, status))),
      verifyFastTrack: vi.fn((_r: string) => of(item(source, 'READY_FOR_PAYMENT'))),
      rejectFastTrack: vi.fn((_r: string, _reason: string) => of(item(source, 'REJECTED'))),
    };
    await TestBed.configureTestingModule({
      imports: [ProviderFastTrackDetailPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ reference: 'SC-FT-ABCDEF0123456789' }) },
          },
        },
        { provide: ProviderCareOperationsApiService, useValue: api },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProviderFastTrackDetailPageComponent);
    fixture.detectChanges();
    return { fixture, api };
  }
  it('exposes verification only for external VERIFYING requests and refreshes after verify', async () => {
    const { fixture, api } = await setup();
    expect(fixture.nativeElement.textContent).toContain('Verify appointment');
    fixture.componentInstance.verifyOpen.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).not.toBeNull();
    fixture.componentInstance.verify();
    expect(api.verifyFastTrack).toHaveBeenCalledWith('SC-FT-ABCDEF0123456789');
    expect(api.getFastTrackRequest).toHaveBeenCalledTimes(2);
  });
  it('rejects with the exact required reason and refreshes', async () => {
    const { fixture, api } = await setup();
    fixture.componentInstance.rejectOpen.set(true);
    fixture.componentInstance.rejectForm.controls.reason.setValue('Appointment not found');
    fixture.componentInstance.reject();
    expect(api.rejectFastTrack).toHaveBeenCalledWith(
      'SC-FT-ABCDEF0123456789',
      'Appointment not found',
    );
    expect(api.getFastTrackRequest).toHaveBeenCalledTimes(2);
  });
  it('does not show verify or patient payment actions for SmartClinic READY_FOR_PAYMENT', async () => {
    const { fixture } = await setup('SMARTCLINIC_CARE_REQUEST', 'READY_FOR_PAYMENT');
    const text = fixture.nativeElement.textContent as string;
    expect(text).not.toContain('Verify appointment');
    expect(text).toContain('patient can now complete payment');
    expect(text).not.toContain('Pay securely');
    expect(text).not.toContain('Mark paid');
  });
});

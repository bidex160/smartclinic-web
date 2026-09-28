import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CareAppointmentsApiService } from '../../core/services/care-appointments-api.service';
import { PharmacyFulfillmentApiService } from '../../core/services/pharmacy-fulfillment-api.service';
import { PatientCareAppointmentDetailPageComponent } from './patient-care-appointment-detail-page.component';

describe('PatientCareAppointmentDetailPageComponent video care', () => {
  async function setup(status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED') {
    const api = {
      get: vi.fn(() => of(appointment(status))),
      cancel: vi.fn(),
    };
    const orders = {
      listPatientOrdersForAppointment: vi.fn(() =>
        of({ items: [], page: 1, limit: 20, total: 0, totalPages: 0 }),
      ),
    };
    await TestBed.configureTestingModule({
      imports: [PatientCareAppointmentDetailPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'SC-APT-1' } } },
        },
        { provide: CareAppointmentsApiService, useValue: api },
        { provide: PharmacyFulfillmentApiService, useValue: orders },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PatientCareAppointmentDetailPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  it.each(['SCHEDULED', 'IN_PROGRESS'] as const)(
    'shows the video room and direct provider chat while %s',
    async (status) => {
      const fixture = await setup(status);
      expect(fixture.nativeElement.querySelector('a[href="https://meet.jit.si/SmartClinic-secret"]')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('a[href="/me/care/SC-CARE-1/chat"]')).not.toBeNull();
      expect(fixture.nativeElement.textContent).toContain('Your consultation room is ready.');
      expect(fixture.nativeElement.textContent).not.toContain('private consultation room');
    },
  );

  it('does not expose a stale room after completion even if an old API response contains it', async () => {
    const fixture = await setup('COMPLETED');
    expect(fixture.nativeElement.querySelector('a[href="https://meet.jit.si/SmartClinic-secret"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('This consultation room is no longer available.');
  });
});

function appointment(status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED') {
  return {
    appointmentReference: 'SC-APT-1',
    careRequestReference: 'SC-CARE-1',
    status,
    deliveryMode: 'VIRTUAL' as const,
    service: { code: 'GENERAL_CONSULTATION', name: 'General Consultation' },
    provider: { providerReference: 'SCPR-1', displayName: 'Clinic', providerType: 'CLINIC' },
    providerLocation: null,
    scheduledDate: '2026-09-28',
    scheduledTimeFrom: '10:00',
    scheduledTimeTo: '10:30',
    timezone: 'Africa/Lagos',
    notes: null,
    meetingUrl: 'https://meet.jit.si/SmartClinic-secret',
    createdAt: '2026-09-28T08:00:00Z',
    updatedAt: '2026-09-28T08:00:00Z',
  };
}

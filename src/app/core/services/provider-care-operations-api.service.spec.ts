import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { ProviderCareOperationsApiService } from './provider-care-operations-api.service';
describe('ProviderCareOperationsApiService', () => {
  let api: ProviderCareOperationsApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: 'http://api.test/api/v1' } },
      ],
    });
    api = TestBed.inject(ProviderCareOperationsApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('uses public references for Care Request actions', () => {
    api.getCareRequest('SC-CARE-ABCDEF012345').subscribe();
    http.expectOne('http://api.test/api/v1/provider/care-requests/SC-CARE-ABCDEF012345').flush({});
    api.acceptCareRequest('SC-CARE-ABCDEF012345').subscribe();
    expect(
      http.expectOne('http://api.test/api/v1/provider/care-requests/SC-CARE-ABCDEF012345/accept')
        .request.body,
    ).toBeNull();
    api.declineCareRequest('SC-CARE-ABCDEF012345', 'Unavailable').subscribe();
    expect(
      http.expectOne('http://api.test/api/v1/provider/care-requests/SC-CARE-ABCDEF012345/decline')
        .request.body,
    ).toEqual({ reason: 'Unavailable' });
  });
  it('uses provider FastTrack commands without payment mutations', () => {
    api.verifyFastTrack('SC-FT-ABCDEF0123456789').subscribe();
    expect(
      http.expectOne(
        'http://api.test/api/v1/provider/fasttrack-requests/SC-FT-ABCDEF0123456789/verify',
      ).request.body,
    ).toBeNull();
    api.rejectFastTrack('SC-FT-ABCDEF0123456789', 'Not found').subscribe();
    expect(
      http.expectOne(
        'http://api.test/api/v1/provider/fasttrack-requests/SC-FT-ABCDEF0123456789/reject',
      ).request.body,
    ).toEqual({ reason: 'Not found' });
  });

  it('schedules and manages Care Appointments with public references', () => {
    const schedule = {
      scheduledDate: '2026-09-10',
      scheduledTimeFrom: '10:00',
      scheduledTimeTo: '10:45',
      timezone: 'Africa/Lagos',
      providerLocationReference: 'SCPL-RINGROAD',
      notes: 'Bring referral letter',
    };

    api.scheduleCareRequest('SC-CARE-ABCDEF012345', schedule).subscribe();
    expect(
      http.expectOne('http://api.test/api/v1/provider/care-requests/SC-CARE-ABCDEF012345/schedule')
        .request.body,
    ).toEqual(schedule);

    api.startAppointment('SC-CA-ABCDEF012345').subscribe();
    expect(
      http.expectOne('http://api.test/api/v1/provider/care-appointments/SC-CA-ABCDEF012345/start')
        .request.body,
    ).toBeNull();

    api.cancelAppointment('SC-CA-ABCDEF012345', 'Provider unavailable').subscribe();
    expect(
      http.expectOne('http://api.test/api/v1/provider/care-appointments/SC-CA-ABCDEF012345/cancel')
        .request.body,
    ).toEqual({ reason: 'Provider unavailable' });

    api.updateMeetingLink('SC-CA-ABCDEF012345', 'https://meet.example.test/room').subscribe();
    expect(
      http.expectOne(
        'http://api.test/api/v1/provider/care-appointments/SC-CA-ABCDEF012345/meeting-link',
      ).request.body,
    ).toEqual({ meetingUrl: 'https://meet.example.test/room' });

    api.updateMeetingLink('SC-CA-ABCDEF012345', null).subscribe();
    expect(
      http.expectOne(
        'http://api.test/api/v1/provider/care-appointments/SC-CA-ABCDEF012345/meeting-link',
      ).request.body,
    ).toEqual({ meetingUrl: null });
  });
});

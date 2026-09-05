import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { ClinicalRecordsApiService } from './clinical-records-api.service';

describe('ClinicalRecordsApiService', () => {
  let api: ClinicalRecordsApiService; let http: HttpTestingController;
  beforeEach(() => { TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_CONFIG, useValue: { baseUrl: '/api/v1' } }] }); api = TestBed.inject(ClinicalRecordsApiService); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());
  it('maps provider create, update, read and finalize to the appointment public reference', () => {
    const body = { recordType: 'CONSULTATION' as const, title: 'Consultation', consultation: { diagnosis: 'Diagnosis' } };
    api.getForProviderAppointment('SC-APT-1').subscribe(); http.expectOne('/api/v1/provider/care-appointments/SC-APT-1/clinical-record').flush({});
    api.createForProviderAppointment('SC-APT-1', body).subscribe(); const create = http.expectOne('/api/v1/provider/care-appointments/SC-APT-1/clinical-record'); expect(create.request.method).toBe('POST'); expect(create.request.body).toEqual(body); create.flush({});
    api.updateForProviderAppointment('SC-APT-1', { title: 'Updated' }).subscribe(); const update = http.expectOne('/api/v1/provider/care-appointments/SC-APT-1/clinical-record'); expect(update.request.method).toBe('PATCH'); update.flush({});
    api.finalizeForProviderAppointment('SC-APT-1').subscribe(); const finalize = http.expectOne('/api/v1/provider/care-appointments/SC-APT-1/clinical-record/finalize'); expect(finalize.request.method).toBe('POST'); expect(finalize.request.body).toBeNull(); finalize.flush({});
  });
  it('maps patient list and detail without internal identity selectors', () => {
    api.listMine(2, 10).subscribe(); const list = http.expectOne(r => r.url === '/api/v1/me/clinical-records'); expect(list.request.params.get('page')).toBe('2'); list.flush({ items: [] });
    api.getMine('SC-CLR-ABC').subscribe(); http.expectOne('/api/v1/me/clinical-records/SC-CLR-ABC').flush({});
  });
  it('uploads provider attachments as browser-owned multipart FormData and maps delete/access', () => {
    const file = new File(['content'], 'result.pdf', { type: 'application/pdf' }); api.uploadAttachment('SC-CLR-1', file).subscribe();
    const upload = http.expectOne('/api/v1/provider/clinical-records/SC-CLR-1/attachments'); expect(upload.request.method).toBe('POST'); expect(upload.request.body).toBeInstanceOf(FormData); expect((upload.request.body as FormData).get('file')).toBe(file); expect(upload.request.headers.has('Content-Type')).toBe(false); upload.flush({});
    api.deleteAttachment('SC-CLR-1', 'SC-CLA-1').subscribe(); const deletion = http.expectOne('/api/v1/provider/clinical-records/SC-CLR-1/attachments/SC-CLA-1'); expect(deletion.request.method).toBe('DELETE'); deletion.flush({ deleted: true });
    api.getProviderAttachmentAccess('SC-CLR-1', 'SC-CLA-1').subscribe(); http.expectOne('/api/v1/provider/clinical-records/SC-CLR-1/attachments/SC-CLA-1/access').flush({ url: 'https://example.test', expiresAt: '2026-08-29T11:00:00Z' });
    api.getPatientAttachmentAccess('SC-CLR-1', 'SC-CLA-1').subscribe(); http.expectOne('/api/v1/me/clinical-records/SC-CLR-1/attachments/SC-CLA-1/access').flush({ url: 'https://example.test', expiresAt: '2026-08-29T11:00:00Z' });
  });
  it('maps patient access grants, audit and provider shared records using public references', () => {
    api.searchAccessProviders('  prime  ', 2, 10).subscribe(); const directory = http.expectOne(r => r.url === '/api/v1/me/clinical-record-access-providers'); expect(directory.request.params.get('q')).toBe('prime'); expect(directory.request.params.get('page')).toBe('2'); expect(directory.request.params.get('limit')).toBe('10'); directory.flush({ items: [] });
    const body = { providerReference: 'SCPR-ABC', scope: 'SINGLE_RECORD' as const, clinicalRecordReference: 'SC-CLR-1' };
    api.createAccessGrant(body).subscribe(); const create = http.expectOne('/api/v1/me/clinical-record-access-grants'); expect(create.request.method).toBe('POST'); expect(create.request.body).toEqual(body); create.flush({});
    api.listAccessGrants(2, 10).subscribe(); const grants = http.expectOne(r => r.url === '/api/v1/me/clinical-record-access-grants'); expect(grants.request.params.get('page')).toBe('2'); grants.flush({ items: [] });
    api.getAccessGrant('SC-CRG-1').subscribe(); http.expectOne('/api/v1/me/clinical-record-access-grants/SC-CRG-1').flush({});
    api.revokeAccessGrant('SC-CRG-1').subscribe(); const revoke = http.expectOne('/api/v1/me/clinical-record-access-grants/SC-CRG-1/revoke'); expect(revoke.request.method).toBe('POST'); revoke.flush({});
    api.listAccessAudit().subscribe(); http.expectOne(r => r.url === '/api/v1/me/clinical-record-access-audit').flush({ items: [] });
    api.listShared().subscribe(); http.expectOne(r => r.url === '/api/v1/provider/shared-clinical-records').flush({ items: [] });
    api.getShared('SC-CLR-1').subscribe(); http.expectOne('/api/v1/provider/shared-clinical-records/SC-CLR-1').flush({});
    api.getSharedAttachmentAccess('SC-CLR-1', 'SC-CLA-1').subscribe(); http.expectOne('/api/v1/provider/shared-clinical-records/SC-CLR-1/attachments/SC-CLA-1/access').flush({ url: 'https://example.test', expiresAt: '2026-08-29T11:00:00Z' });
    api.getSharedHealthPassport('SCP-AB12-CD34').subscribe(); const passport = http.expectOne('/api/v1/provider/shared-health-passports/SCP-AB12-CD34'); expect(passport.request.method).toBe('GET'); passport.flush({});
  });
  it('maps provider and patient access-request routes with exact bodies and references', () => {
    const body = { patientReference: 'SCP-AB12-CD34', scope: 'RECORD_TYPE' as const, recordType: 'LAB_RESULT' as const, reason: 'Coordinate care', requestedExpiresAt: '2026-09-20T12:00:00.000Z' };
    api.createProviderAccessRequest(body).subscribe(); const create = http.expectOne('/api/v1/provider/clinical-record-access-requests'); expect(create.request.method).toBe('POST'); expect(create.request.body).toEqual(body); create.flush({});
    api.listProviderAccessRequests(2, 10).subscribe(); const providerList = http.expectOne(r => r.url === '/api/v1/provider/clinical-record-access-requests'); expect(providerList.request.params.get('page')).toBe('2'); expect(providerList.request.params.get('limit')).toBe('10'); providerList.flush({ items: [] });
    api.listPatientAccessRequests(3, 20).subscribe(); const patientList = http.expectOne(r => r.url === '/api/v1/me/clinical-record-access-requests'); expect(patientList.request.params.get('page')).toBe('3'); patientList.flush({ items: [] });
    api.approveAccessRequest('SC-CRA-ABC').subscribe(); const approve = http.expectOne('/api/v1/me/clinical-record-access-requests/SC-CRA-ABC/approve'); expect(approve.request.method).toBe('POST'); expect(approve.request.body).toBeNull(); approve.flush({});
    api.declineAccessRequest('SC-CRA-ABC').subscribe(); const decline = http.expectOne('/api/v1/me/clinical-record-access-requests/SC-CRA-ABC/decline'); expect(decline.request.method).toBe('POST'); expect(decline.request.body).toBeNull(); decline.flush({});
  });
});

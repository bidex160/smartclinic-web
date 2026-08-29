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
});

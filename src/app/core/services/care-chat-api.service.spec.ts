import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { CareChatApiService } from './care-chat-api.service';

describe('CareChatApiService', () => {
  let api: CareChatApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: 'http://api.test/api/v1' } },
      ],
    });
    api = TestBed.inject(CareChatApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('uses Care Request public references and scope-specific routes', () => {
    api.getChat('patient', 'SC-CARE-ABC').subscribe();
    http.expectOne('http://api.test/api/v1/me/care-requests/SC-CARE-ABC/chat').flush({});
    api.sendMessage('provider', 'SC-CARE-ABC', 'Hello', ['SC-CMA-ABC']).subscribe();
    expect(
      http.expectOne('http://api.test/api/v1/provider/care-requests/SC-CARE-ABC/chat/messages')
        .request.body,
    ).toEqual({ body: 'Hello', attachmentReferences: ['SC-CMA-ABC'] });
    api.markRead('provider', 'SC-CARE-ABC').subscribe();
    expect(
      http.expectOne('http://api.test/api/v1/provider/care-requests/SC-CARE-ABC/chat/read').request
        .body,
    ).toBeNull();
  });
  it('uploads with FormData and uses scope-specific authorized access routes', () => {
    const file = new File(['%PDF-'], 'report.pdf', { type: 'application/pdf' });
    api.uploadPatientAttachment('SC-CARE-ABC', file).subscribe(); const patientUpload = http.expectOne('http://api.test/api/v1/me/care-requests/SC-CARE-ABC/chat/attachments'); expect(patientUpload.request.body).toBeInstanceOf(FormData); expect((patientUpload.request.body as FormData).get('file')).toBe(file); expect(patientUpload.request.headers.has('Content-Type')).toBe(false); patientUpload.flush({});
    api.uploadProviderAttachment('SC-CARE-ABC', file).subscribe(); http.expectOne('http://api.test/api/v1/provider/care-requests/SC-CARE-ABC/chat/attachments').flush({});
    api.getPatientAttachmentAccess('SC-CARE-ABC', 'SC-CMSG-1', 'SC-CMA-1').subscribe(); http.expectOne('http://api.test/api/v1/me/care-requests/SC-CARE-ABC/chat/messages/SC-CMSG-1/attachments/SC-CMA-1/access').flush({ url: 'https://example.test', expiresAt: '' });
    api.getProviderAttachmentAccess('SC-CARE-ABC', 'SC-CMSG-1', 'SC-CMA-1').subscribe(); http.expectOne('http://api.test/api/v1/provider/care-requests/SC-CARE-ABC/chat/messages/SC-CMSG-1/attachments/SC-CMA-1/access').flush({ url: 'https://example.test', expiresAt: '' });
  });
});

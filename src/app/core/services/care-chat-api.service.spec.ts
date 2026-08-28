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
    api.sendMessage('provider', 'SC-CARE-ABC', 'Hello').subscribe();
    expect(
      http.expectOne('http://api.test/api/v1/provider/care-requests/SC-CARE-ABC/chat/messages')
        .request.body,
    ).toEqual({ body: 'Hello' });
    api.markRead('provider', 'SC-CARE-ABC').subscribe();
    expect(
      http.expectOne('http://api.test/api/v1/provider/care-requests/SC-CARE-ABC/chat/read').request
        .body,
    ).toBeNull();
  });
});

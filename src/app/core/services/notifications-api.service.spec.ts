import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { NotificationApiService } from './notifications-api.service';

describe('NotificationsApiService', () => {
  let api: NotificationApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_CONFIG, useValue: { baseUrl: '/api/v1' } }] });
    api = TestBed.inject(NotificationApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('uses the notification list contract', () => {
    api.list({ page: 2, limit: 10 }).subscribe();
    const request = http.expectOne('/api/v1/me/notifications?page=2&limit=10');
    expect(request.request.method).toBe('GET');
    request.flush({ items: [], page: 2, limit: 10, total: 0, totalPages: 0 });
  });
  it('maps unread count and mutation endpoints', () => {
    api.unreadCount().subscribe();
    http.expectOne('/api/v1/me/notifications/unread-count').flush({ unreadCount: 3 });
    api.markRead('SC-NOT-1').subscribe();
    const read = http.expectOne('/api/v1/me/notifications/SC-NOT-1/read');
    expect(read.request.method).toBe('PATCH');
    read.flush({});
    api.markAllRead().subscribe();
    const all = http.expectOne('/api/v1/me/notifications/read-all');
    expect(all.request.method).toBe('PATCH');
    all.flush({ unreadCount: 0 });
  });
});

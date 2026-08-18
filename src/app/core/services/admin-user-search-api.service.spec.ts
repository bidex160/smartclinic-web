import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { AdminUserSearchApiService } from './admin-user-search-api.service';

describe('AdminUserSearchApiService', () => {
  it('searches the protected API with query and pagination parameters', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: 'http://api.test/api/v1' } },
      ],
    });
    const api = TestBed.inject(AdminUserSearchApiService);
    const http = TestBed.inject(HttpTestingController);
    api
      .search('ada@example.test', 2, 20)
      .subscribe((response) => expect(response.items[0].providerLink).toBeNull());
    const request = http.expectOne(
      (value) =>
        value.url === 'http://api.test/api/v1/admin/users/search' &&
        value.params.get('q') === 'ada@example.test' &&
        value.params.get('page') === '2' &&
        value.params.get('limit') === '20',
    );
    expect(request.request.method).toBe('GET');
    request.flush({ items: [user()], page: 2, limit: 20, total: 21, totalPages: 2 });
    http.verify();
  });
});

function user() {
  return {
    id: 'user-id',
    email: 'ada@example.test',
    displayName: 'Ada',
    status: 'ACTIVE',
    roles: ['USER'],
    providerLink: null,
  };
}

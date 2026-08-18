import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { SKIP_AUTH_RETRY } from '../config/http-context.tokens';
import { AdminProvidersApiService } from './admin-providers-api.service';

describe('AdminProvidersApiService', () => {
  it('lists providers with supported server filters and pagination', () => {
    const { api, http } = setup();
    api
      .list({ status: 'ACTIVE', linkedUserId: 'user-id', search: 'Clinic', page: 2, limit: 10 })
      .subscribe();
    const request = http.expectOne(
      (value) =>
        value.url.endsWith('/admin/providers') &&
        value.params.get('status') === 'ACTIVE' &&
        value.params.get('linkedUserId') === 'user-id' &&
        value.params.get('search') === 'Clinic' &&
        value.params.get('page') === '2' &&
        value.params.get('limit') === '10',
    );
    expect(request.request.method).toBe('GET');
    request.flush({ items: [], page: 2, limit: 10, total: 0, totalPages: 0 });
    http.verify();
  });

  it('supports safe provider reads and all explicit mutations without replay', () => {
    const { api, http } = setup();
    api.get('provider/id').subscribe();
    http.expectOne('http://api.test/api/v1/admin/providers/provider%2Fid').flush(provider());
    const calls = [
      [api.create({ displayName: 'Care Provider' }), 'POST', '/admin/providers'],
      [
        api.update('provider-id', { displayName: 'Updated' }),
        'PATCH',
        '/admin/providers/provider-id',
      ],
      [api.activate('provider-id'), 'PATCH', '/admin/providers/provider-id/activate'],
      [api.suspend('provider-id'), 'PATCH', '/admin/providers/provider-id/suspend'],
      [api.linkUser('provider-id', 'user-id'), 'POST', '/admin/providers/provider-id/link-user'],
      [api.unlinkUser('provider-id'), 'POST', '/admin/providers/provider-id/unlink-user'],
    ] as const;
    for (const [operation, method, path] of calls) {
      operation.subscribe();
      const request = http.expectOne(`http://api.test/api/v1${path}`);
      expect(request.request.method).toBe(method);
      expect(request.request.context.get(SKIP_AUTH_RETRY)).toBe(true);
      if (path.endsWith('/link-user')) {
        expect(request.request.body).toEqual({ userId: 'user-id' });
      }
      request.flush(provider());
    }
    http.verify();
  });

  function setup() {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: 'http://api.test/api/v1' } },
      ],
    });
    return {
      api: TestBed.inject(AdminProvidersApiService),
      http: TestBed.inject(HttpTestingController),
    };
  }
});

function provider() {
  return {
    id: 'provider-id',
    displayName: 'Care Provider',
    professionalReference: null,
    status: 'PENDING',
    linkedUser: null,
    capabilityCount: 0,
    locationCount: 0,
    createdAt: '2026-08-18T08:00:00Z',
    updatedAt: '2026-08-18T08:00:00Z',
  };
}

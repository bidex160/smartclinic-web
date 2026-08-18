import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { SKIP_AUTH_RETRY, SKIP_STAFF_AUTH } from '../config/http-context.tokens';
import { ProviderInvitationsApiService } from './provider-invitations-api.service';

describe('ProviderInvitationsApiService', () => {
  it('uses typed admin invitation endpoints and never replays mutations', () => {
    const { api, http } = setup();
    api.list('provider/id').subscribe();
    http.expectOne('http://api.test/api/v1/admin/providers/provider%2Fid/invitations').flush([]);
    api.create('provider-id', 'provider@example.test').subscribe();
    const create = http.expectOne('http://api.test/api/v1/admin/providers/provider-id/invitations');
    expect(create.request.body).toEqual({ email: 'provider@example.test' });
    expect(create.request.context.get(SKIP_AUTH_RETRY)).toBe(true);
    create.flush(created());
    api.revoke('invitation/id').subscribe();
    const revoke = http.expectOne(
      'http://api.test/api/v1/admin/provider-invitations/invitation%2Fid/revoke',
    );
    expect(revoke.request.context.get(SKIP_AUTH_RETRY)).toBe(true);
    revoke.flush(summary());
    http.verify();
  });

  it('keeps public inspection and acceptance out of staff authentication', () => {
    const { api, http } = setup();
    api.inspect('secret/token').subscribe();
    const inspect = http.expectOne(
      'http://api.test/api/v1/public/provider-invitations/secret%2Ftoken',
    );
    expect(inspect.request.context.get(SKIP_STAFF_AUTH)).toBe(true);
    inspect.flush({
      providerDisplayName: 'Care Provider',
      invitedEmail: 'p***@example.test',
      expiresAt: '2026-09-01T00:00:00Z',
    });
    api.accept('token', { displayName: 'Ada', password: 'long-password-value' }).subscribe();
    const accept = http.expectOne(
      'http://api.test/api/v1/public/provider-invitations/token/accept',
    );
    expect(accept.request.body).toEqual({ displayName: 'Ada', password: 'long-password-value' });
    expect(accept.request.context.get(SKIP_STAFF_AUTH)).toBe(true);
    expect(accept.request.context.get(SKIP_AUTH_RETRY)).toBe(true);
    accept.flush({
      providerDisplayName: 'Care Provider',
      email: 'provider@example.test',
      status: 'ACCEPTED',
      loginRequired: true,
    });
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
      api: TestBed.inject(ProviderInvitationsApiService),
      http: TestBed.inject(HttpTestingController),
    };
  }
});

function summary() {
  return {
    id: 'invitation-id',
    provider: { displayName: 'Care Provider' },
    email: 'provider@example.test',
    status: 'PENDING',
    expiresAt: '2026-09-01T00:00:00Z',
    acceptedAt: null,
    revokedAt: null,
    createdAt: '2026-08-18T00:00:00Z',
    createdBy: null,
  };
}
function created() {
  return { ...summary(), invitationToken: 'a'.repeat(43) };
}

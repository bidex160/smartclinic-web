import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AdminProviderDetail } from '../../core/models/admin-provider.model';
import { AdminProvidersApiService } from '../../core/services/admin-providers-api.service';
import { AdminUserSearchApiService } from '../../core/services/admin-user-search-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { ProviderAdminDetailPageComponent } from './provider-admin-detail-page.component';
import { ProviderInvitationsApiService } from '../../core/services/provider-invitations-api.service';

describe('ProviderAdminDetailPageComponent', () => {
  it('renders safe detail, linked user, counts, and no credential data', async () => {
    const { fixture } = await setup();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Care Provider');
    expect(text).toContain('operator@example.test');
    expect(text).toContain('Unlink account');
    expect(text).not.toContain('password');
    expect(text).not.toContain('session');
  });

  it('updates only mutable basic profile fields', async () => {
    const { component, api } = await setup();
    component.profileForm.setValue({ displayName: 'Updated', professionalReference: 'REF-2' });
    component.updateProfile();
    expect(api.update).toHaveBeenCalledWith('provider-id', {
      displayName: 'Updated',
      professionalReference: 'REF-2',
    });
  });

  it('requires confirmation to activate, suspend, and unlink', async () => {
    const { component, api } = await setup({ provider: detail({ status: 'PENDING' }) });
    component.confirmAction();
    expect(api.activate).not.toHaveBeenCalled();
    component.requestConfirmation('activate');
    component.confirmAction();
    expect(api.activate).toHaveBeenCalledOnce();
    component.provider.set(detail({ status: 'ACTIVE' }));
    component.requestConfirmation('suspend');
    component.confirmAction();
    expect(api.suspend).toHaveBeenCalledOnce();
    component.requestConfirmation('unlink');
    component.confirmAction();
    expect(api.unlinkUser).toHaveBeenCalledOnce();
  });

  it('sanitizes a 409 unlink conflict', async () => {
    const { component } = await setup({
      unlinkError: new HttpErrorResponse({
        status: 409,
        error: { message: 'raw active assignment ids' },
      }),
    });
    component.requestConfirmation('unlink');
    component.confirmAction();
    expect(component.error()).toContain('active work');
    expect(component.error()).not.toContain('assignment ids');
  });

  it('validates search length and never requests a raw UUID', async () => {
    const { fixture } = await setup({ provider: detail({ linkedUser: null }) });
    const component = fixture.componentInstance;
    component.userSearchForm.controls.q.setValue('a');
    component.searchUsers();
    expect(component.userSearchForm.controls.q.touched).toBe(true);
    expect(fixture.nativeElement.querySelector('input[name="userId"]')).toBeNull();
  });

  it('renders eligibility, selects only active unlinked users, and paginates', async () => {
    const { fixture, component, usersApi } = await setup({
      provider: detail({ linkedUser: null }),
    });
    component.userSearchForm.controls.q.setValue('ad');
    component.searchUsers();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Eligible for selection');
    expect(text).toContain('Already linked to Other Provider');
    expect(text).toContain('not active');
    component.selectUser(searchUsers()[0]);
    expect(component.selectedUser()?.id).toBe('eligible-id');
    component.selectUser(searchUsers()[1]);
    expect(component.selectedUser()?.id).toBe('eligible-id');
    component.searchUsers(2);
    expect(usersApi.search).toHaveBeenLastCalledWith('ad', 2, 20);
    expect(text).not.toContain('passwordHash');
    expect(text).not.toContain('sessions');
  });

  it('requires explicit confirmation and links using only the selected user id', async () => {
    const { component, api } = await setup({ provider: detail({ linkedUser: null }) });
    component.selectUser(searchUsers()[0]);
    component.confirmAction();
    expect(api.linkUser).not.toHaveBeenCalled();
    component.requestLinkConfirmation();
    component.confirmAction();
    expect(api.linkUser).toHaveBeenCalledWith('provider-id', 'eligible-id');
    expect(component.provider()?.linkedUser?.id).toBe('eligible-id');
    expect(component.searchResponse()).toBeNull();
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it('sanitizes a concurrent 409 link conflict and refreshes provider/search state', async () => {
    const { component, api, usersApi } = await setup({
      provider: detail({ linkedUser: null }),
      linkError: new HttpErrorResponse({
        status: 409,
        error: { message: 'raw database conflict' },
      }),
    });
    component.userSearchForm.controls.q.setValue('ad');
    component.searchUsers();
    component.selectUser(searchUsers()[0]);
    component.requestLinkConfirmation();
    component.confirmAction();
    expect(component.error()).toContain('current status');
    expect(component.error()).not.toContain('database');
    expect(api.get).toHaveBeenCalledTimes(2);
    expect(usersApi.search).toHaveBeenCalledTimes(2);
  });

  it('renders SENT delivery without a manual link or copy action', async () => {
    const { component, fixture } = await setup({
      provider: detail({ linkedUser: null }),
      creationResponse: { ...invitations()[0], deliveryStatus: 'SENT' },
    });
    component.invitationForm.controls.email.setValue('provider@example.test');
    component.createInvitation();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Invitation email sent successfully.');
    expect(component.oneTimeInvitationLink()).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Copy invitation link');
  });

  it('renders MANUAL_REQUIRED delivery, shows and copies its ephemeral link', async () => {
    const { component, fixture, invitationsApi } = await setup({
      provider: detail({ linkedUser: null }),
    });
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    component.invitationForm.controls.email.setValue('PROVIDER@example.test');
    component.createInvitation();
    expect(invitationsApi.create).toHaveBeenCalledWith('provider-id', 'provider@example.test');
    expect(component.statusMessage()).toContain('not configured');
    expect(component.oneTimeInvitationLink()).toContain('/provider/setup/');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Copy invitation link');
    await component.copyInvitationLink();
    expect(writeText).toHaveBeenCalledWith(component.oneTimeInvitationLink());
    expect(invitationsApi.list).toHaveBeenCalledTimes(2);
  });

  it('treats FAILED delivery as created and preserves the manual-sharing fallback', async () => {
    const { component, fixture } = await setup({
      provider: detail({ linkedUser: null }),
      creationResponse: {
        ...invitations()[0],
        deliveryStatus: 'FAILED',
        manualInvitationLink: `https://app.example.test/provider/setup/${'b'.repeat(43)}`,
      },
    });
    component.invitationForm.controls.email.setValue('provider@example.test');
    component.createInvitation();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('email delivery failed');
    expect(text).toContain('do not need to create another invitation');
    expect(text).toContain('Copy invitation link');
    expect(component.error()).toBeNull();
  });

  it('does not retain the raw invitation token in a fresh component instance', async () => {
    const first = await setup({ provider: detail({ linkedUser: null }) });
    first.component.invitationForm.controls.email.setValue('provider@example.test');
    first.component.createInvitation();
    expect(first.component.oneTimeInvitationLink()).toBeTruthy();
    TestBed.resetTestingModule();
    const recreated = await setup({ provider: detail({ linkedUser: null }) });
    expect(recreated.component.oneTimeInvitationLink()).toBeNull();
  });

  it('renders invitation history and revokes only after confirmation', async () => {
    const { component, fixture, invitationsApi } = await setup({
      provider: detail({ linkedUser: null }),
    });
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('pending@example.test');
    expect(text).toContain('accepted@example.test');
    expect(text).not.toContain('/provider/setup/');
    expect(text).not.toContain('resend');
    const revokeButtons = [...fixture.nativeElement.querySelectorAll('button')].filter(
      (button: HTMLButtonElement) => button.textContent?.trim() === 'Revoke invitation',
    );
    expect(revokeButtons).toHaveLength(1);
    component.confirmRevoke();
    expect(invitationsApi.revoke).not.toHaveBeenCalled();
    component.requestRevoke('pending-id');
    component.confirmRevoke();
    expect(invitationsApi.revoke).toHaveBeenCalledWith('pending-id');
  });

  async function setup(
    options: {
      provider?: AdminProviderDetail;
      unlinkError?: HttpErrorResponse;
      linkError?: HttpErrorResponse;
      creationResponse?: unknown;
    } = {},
  ) {
    const value = options.provider ?? detail();
    const linkedValue = {
      ...value,
      linkedUser: {
        id: 'eligible-id',
        email: 'ada@example.test',
        displayName: 'Ada',
        roles: ['USER', 'PROVIDER'],
        status: 'ACTIVE',
      },
    } as AdminProviderDetail;
    const linkUser = vi.fn((_id: string, _userId: string) =>
      options.linkError ? throwError(() => options.linkError) : of(linkedValue),
    );
    const api = {
      get: vi.fn(() => of(linkUser.mock.calls.length && !options.linkError ? linkedValue : value)),
      update: vi.fn((_id, request) => of({ ...value, ...request })),
      activate: vi.fn(() => of({ ...value, status: 'ACTIVE' })),
      suspend: vi.fn(() => of({ ...value, status: 'SUSPENDED' })),
      unlinkUser: vi.fn(() =>
        options.unlinkError
          ? throwError(() => options.unlinkError)
          : of({ ...value, linkedUser: null }),
      ),
      linkUser,
    };
    const usersApi = {
      search: vi.fn(() =>
        of({ items: searchUsers(), page: 1, limit: 20, total: 3, totalPages: 2 }),
      ),
    };
    const invitationsApi = {
      list: vi.fn(() => of(invitations())),
      create: vi.fn(() =>
        of(
          options.creationResponse ?? {
            ...invitations()[0],
            deliveryStatus: 'MANUAL_REQUIRED',
            manualInvitationLink: `https://app.example.test/provider/setup/${'a'.repeat(43)}`,
          },
        ),
      ),
      revoke: vi.fn(() =>
        of({ ...invitations()[0], status: 'REVOKED', revokedAt: '2026-08-20T00:00:00Z' }),
      ),
    };
    await TestBed.configureTestingModule({
      imports: [ProviderAdminDetailPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'provider-id' }) } },
        },
        { provide: AdminProvidersApiService, useValue: api },
        { provide: AdminUserSearchApiService, useValue: usersApi },
        { provide: ProviderInvitationsApiService, useValue: invitationsApi },
        { provide: AuthSessionService, useValue: { logout: () => of(true) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProviderAdminDetailPageComponent);
    return { fixture, component: fixture.componentInstance, api, usersApi, invitationsApi };
  }
});

function detail(changes: Partial<AdminProviderDetail> = {}): AdminProviderDetail {
  return {
    id: 'provider-id',
    displayName: 'Care Provider',
    professionalReference: 'PR-1',
    status: 'ACTIVE',
    linkedUser: {
      id: 'user-id',
      email: 'operator@example.test',
      displayName: 'Operator',
      roles: ['PROVIDER'],
      status: 'ACTIVE',
    },
    capabilityCount: 3,
    locationCount: 2,
    createdAt: '2026-08-18T08:00:00Z',
    updatedAt: '2026-08-18T09:00:00Z',
    ...changes,
  };
}

function invitations() {
  const base = {
    provider: { displayName: 'Care Provider' },
    expiresAt: '2026-09-01T00:00:00Z',
    revokedAt: null,
    createdAt: '2026-08-18T00:00:00Z',
    createdBy: null,
  };
  return [
    {
      ...base,
      id: 'pending-id',
      email: 'pending@example.test',
      status: 'PENDING' as const,
      acceptedAt: null,
    },
    {
      ...base,
      id: 'accepted-id',
      email: 'accepted@example.test',
      status: 'ACCEPTED' as const,
      acceptedAt: '2026-08-19T00:00:00Z',
    },
    {
      ...base,
      id: 'expired-id',
      email: 'expired@example.test',
      status: 'EXPIRED' as const,
      acceptedAt: null,
    },
    {
      ...base,
      id: 'revoked-id',
      email: 'revoked@example.test',
      status: 'REVOKED' as const,
      acceptedAt: null,
      revokedAt: '2026-08-19T00:00:00Z',
    },
  ];
}

function searchUsers() {
  return [
    {
      id: 'eligible-id',
      email: 'ada@example.test',
      displayName: 'Ada',
      status: 'ACTIVE' as const,
      roles: ['USER' as const],
      providerLink: null,
    },
    {
      id: 'linked-id',
      email: 'linked@example.test',
      displayName: 'Linked',
      status: 'ACTIVE' as const,
      roles: ['PROVIDER' as const],
      providerLink: { providerId: 'other-provider', providerDisplayName: 'Other Provider' },
    },
    {
      id: 'inactive-id',
      email: 'inactive@example.test',
      displayName: 'Inactive',
      status: 'SUSPENDED' as const,
      roles: ['USER' as const],
      providerLink: null,
    },
  ];
}

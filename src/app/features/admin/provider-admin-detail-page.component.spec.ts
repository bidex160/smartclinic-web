import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AdminProviderDetail } from '../../core/models/admin-provider.model';
import { AdminProvidersApiService } from '../../core/services/admin-providers-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { ProviderAdminDetailPageComponent } from './provider-admin-detail-page.component';

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

  it('explains the user-search dependency instead of requesting a raw UUID', async () => {
    const { fixture } = await setup({ provider: detail({ linkedUser: null }) });
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('safe existing-user search');
    expect(fixture.nativeElement.querySelector('input[name="userId"]')).toBeNull();
  });

  async function setup(
    options: { provider?: AdminProviderDetail; unlinkError?: HttpErrorResponse } = {},
  ) {
    const value = options.provider ?? detail();
    const api = {
      get: vi.fn(() => of(value)),
      update: vi.fn((_id, request) => of({ ...value, ...request })),
      activate: vi.fn(() => of({ ...value, status: 'ACTIVE' })),
      suspend: vi.fn(() => of({ ...value, status: 'SUSPENDED' })),
      unlinkUser: vi.fn(() =>
        options.unlinkError
          ? throwError(() => options.unlinkError)
          : of({ ...value, linkedUser: null }),
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
        { provide: AuthSessionService, useValue: { logout: () => of(true) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProviderAdminDetailPageComponent);
    return { fixture, component: fixture.componentInstance, api };
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

import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AdminProvidersApiService } from '../../core/services/admin-providers-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { ProvidersAdminPageComponent } from './providers-admin-page.component';

describe('ProvidersAdminPageComponent', () => {
  it('renders safe provider rows and the admin navigation link', async () => {
    const { fixture } = await setup();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Care Provider');
    expect(text).toContain('Linked to Operator');
    expect(text).not.toContain('passwordHash');
    expect(text).not.toContain('refreshToken');
    expect(fixture.nativeElement.querySelector('a[href="/admin/providers/provider-id"]')).toBeTruthy();
  });

  it('applies server filters, clears them, and paginates', async () => {
    const { component, api } = await setup();
    component.filterForm.setValue({
      search: 'Care',
      status: 'ACTIVE',
      onboardingStatus: '',
      limit: 10,
    });
    component.applyFilters();
    expect(api.list).toHaveBeenLastCalledWith({
      search: 'Care',
      status: 'ACTIVE',
      page: 1,
      limit: 10,
    });
    component.goToPage(2);
    expect(api.list).toHaveBeenLastCalledWith({
      search: 'Care',
      status: 'ACTIVE',
      page: 2,
      limit: 10,
    });
    component.clearFilters();
    expect(api.list).toHaveBeenLastCalledWith({ page: 1, limit: 25 });
  });

  it('creates only backend-supported profile fields and opens detail', async () => {
    const { component, api, router } = await setup();
    component.createForm.setValue({
      displayName: ' New Provider ',
      email: 'new@example.test',
      phone: '',
      professionalReference: '',
      providerType: 'CLINIC',
      countryCode: 'ng',
      stateOrRegion: 'Lagos',
      city: 'Ikeja',
    });
    component.createProvider();
    expect(api.create).toHaveBeenCalledWith({
      displayName: 'New Provider',
      email: 'new@example.test',
      providerType: 'CLINIC',
      countryCode: 'NG',
      stateOrRegion: 'Lagos',
      city: 'Ikeja',
    });
    expect(component.createdProviderId()).toBe('provider-id');
  });

  it.each([
    ['MANUAL_REQUIRED', 'Automatic email delivery is unavailable.'],
    ['FAILED', 'email delivery failed'],
  ] as const)(
    'preserves the created provider and ephemeral link for %s delivery',
    async (deliveryStatus, message) => {
      const link = `https://app.example.test/provider/setup/${'a'.repeat(43)}`;
      const { component, api, fixture } = await setup({
        deliveryStatus,
        manualInvitationLink: link,
      });
      component.createForm.setValue({
        displayName: 'New Provider',
        email: 'new@example.test',
        phone: '',
        professionalReference: '',
        providerType: 'CLINIC',
        countryCode: 'NG',
        stateOrRegion: 'Lagos',
        city: 'Ikeja',
      });
      component.createProvider();
      fixture.detectChanges();
      expect(component.oneTimeInvitationLink()).toBe(link);
      expect(fixture.nativeElement.textContent).toContain(message);
      expect(component.error()).toBeNull();
      expect(api.create).toHaveBeenCalledOnce();
    },
  );

  async function setup(
    invitation: {
      deliveryStatus: 'SENT' | 'MANUAL_REQUIRED' | 'FAILED';
      manualInvitationLink?: string;
    } = { deliveryStatus: 'SENT' },
  ) {
    const response = { items: [provider()], page: 1, limit: 25, total: 30, totalPages: 2 };
    const api = {
      list: vi.fn(() => of(response)),
      create: vi.fn(() =>
        of({
          provider: {
            ...provider(),
            displayName: 'New Provider',
            capabilityCount: 0,
            locationCount: 0,
          },
          invitation,
        }),
      ),
    };
    await TestBed.configureTestingModule({
      imports: [ProvidersAdminPageComponent],
      providers: [
        provideRouter([]),
        { provide: AdminProvidersApiService, useValue: api },
        { provide: AuthSessionService, useValue: { logout: () => of(true) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProvidersAdminPageComponent);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    return { fixture, component: fixture.componentInstance, api, router };
  }
});

function provider() {
  return {
    id: 'provider-id',
    displayName: 'Care Provider',
    email: 'care@example.test',
    phone: null,
    professionalReference: 'PR-1',
    status: 'ACTIVE' as const,
    providerType: 'CLINIC' as const,
    countryCode: 'NG',
    stateOrRegion: 'Lagos',
    city: 'Ikeja',
    onboardingStatus: 'APPROVED' as const,
    submittedAt: '2026-08-17T08:00:00Z',
    reviewedAt: '2026-08-18T07:00:00Z',
    reviewNote: null,
    linkedUser: {
      id: 'user-id',
      email: 'operator@example.test',
      displayName: 'Operator',
      roles: ['PROVIDER'],
      status: 'ACTIVE' as const,
    },
    createdAt: '2026-08-18T08:00:00Z',
    updatedAt: '2026-08-18T08:00:00Z',
  };
}

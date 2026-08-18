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
    expect(text).toContain('operator@example.test');
    expect(text).not.toContain('passwordHash');
    expect(text).not.toContain('refreshToken');
    expect(fixture.nativeElement.querySelector('a[href="/admin/providers"]')).toBeTruthy();
  });

  it('applies server filters, clears them, and paginates', async () => {
    const { component, api } = await setup();
    component.filterForm.setValue({ search: 'Care', status: 'ACTIVE', limit: 10 });
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
    component.createForm.setValue({ displayName: ' New Provider ', professionalReference: '' });
    component.createProvider();
    expect(api.create).toHaveBeenCalledWith({ displayName: 'New Provider' });
    expect(router.navigate).toHaveBeenCalledWith(['/admin/providers', 'provider-id']);
  });

  async function setup() {
    const response = { items: [provider()], page: 1, limit: 25, total: 30, totalPages: 2 };
    const api = {
      list: vi.fn(() => of(response)),
      create: vi.fn(() =>
        of({ ...provider(), displayName: 'New Provider', capabilityCount: 0, locationCount: 0 }),
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
    professionalReference: 'PR-1',
    status: 'ACTIVE' as const,
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

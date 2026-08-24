import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AdminProviderAssignment } from '../../core/models/admin-provider-assignment.model';
import { AdminProviderAssignmentsApiService } from '../../core/services/admin-provider-assignments-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { ProviderAssignmentsPageComponent } from './provider-assignments-page.component';

describe('ProviderAssignmentsPageComponent', () => {
  it('renders the safe operational assignment list without contact or funding fields', async () => {
    const { fixture } = await setup();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Care Provider');
    expect(text).toContain('Ada Okafor');
    expect(text).toContain('Pending Provider Match');
    expect(text).not.toContain('+2348000000000');
    expect(text).not.toContain('payer@example.test');
    expect(text).not.toContain('quotedAmount');
  });

  it('links each booking reference to operational booking detail', async () => {
    const { fixture } = await setup();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('a[href="/admin/bookings/SC-2026-ABCDEF123456"]'),
    ).toBeTruthy();
  });

  it('passes booking, provider, and status filters to the API', async () => {
    const { component, api } = await setup();
    component.filterForm.setValue({
      bookingReference: 'SC-2026-ABCDEF123456',
      providerId: '10000000-0000-4000-8000-000000000001',
      status: 'DECLINED',
    });
    component.loadAssignments();
    expect(api.getAssignments).toHaveBeenLastCalledWith({
      bookingReference: 'SC-2026-ABCDEF123456',
      providerId: '10000000-0000-4000-8000-000000000001',
      status: 'DECLINED',
    });
  });

  it('expires stale offers deliberately and refreshes the list', async () => {
    const { component, api } = await setup();
    component.expireStaleOffers();
    expect(api.expireStaleOffers).toHaveBeenCalledOnce();
    expect(component.statusMessage()).toContain('2 stale offers were expired');
    expect(api.getAssignments).toHaveBeenCalledTimes(2);
  });

  async function setup() {
    const api = {
      getAssignments: vi.fn(() => of([assignment()])),
      expireStaleOffers: vi.fn(() =>
        of({ expiredCount: 2, continuedMatchingCount: 1, unfulfillableCount: 1 }),
      ),
    };
    await TestBed.configureTestingModule({
      imports: [ProviderAssignmentsPageComponent],
      providers: [
        provideRouter([]),
        { provide: AdminProviderAssignmentsApiService, useValue: api },
        { provide: AuthSessionService, useValue: { logout: () => of(true) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProviderAssignmentsPageComponent);
    return { fixture, component: fixture.componentInstance, api };
  }
});

export function assignment(
  changes: Partial<AdminProviderAssignment> = {},
): AdminProviderAssignment {
  return {
    assignmentId: 'assignment-id',
    status: 'ACCEPTED',
    offeredAt: '2026-08-24T08:00:00Z',
    expiresAt: '2026-08-24T08:30:00Z',
    respondedAt: '2026-08-24T08:10:00Z',
    acceptedAt: '2026-08-24T08:10:00Z',
    confirmedAt: null,
    bookingReference: 'SC-2026-ABCDEF123456',
    bookingStatus: 'PENDING_PROVIDER_MATCH',
    healthCheckPackage: { code: 'ESSENTIAL', name: 'Essential Health Check' },
    fulfilmentMode: { code: 'HOME_VISIT', name: 'Home visit' },
    participant: { givenName: 'Ada', familyName: 'Okafor' },
    provider: { id: '10000000-0000-4000-8000-000000000001', displayName: 'Care Provider' },
    preferredDate: '2026-08-24',
    preferredTimeWindowStart: '09:00',
    preferredTimeWindowEnd: '11:00',
    preferredTimezone: 'Africa/Lagos',
    confirmedSchedule: null,
    declineReason: null,
    ...changes,
  };
}

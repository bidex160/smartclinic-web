import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

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

  it('starts matching and refreshes the list', async () => {
    const { component, api } = await setup();
    component.matchingForm.controls.bookingReference.setValue('SC-2026-ABCDEF123456');
    component.startMatching();
    expect(api.startMatching).toHaveBeenCalledWith('SC-2026-ABCDEF123456');
    expect(component.statusMessage()).toContain('offer was created');
    expect(api.getAssignments).toHaveBeenCalledTimes(2);
  });

  it('shows a safe matching conflict without raw backend details', async () => {
    const { component } = await setup({
      startMatching: () =>
        throwError(
          () =>
            new HttpErrorResponse({
              status: 409,
              error: { message: 'raw internal workflow detail' },
            }),
        ),
    });
    component.matchingForm.controls.bookingReference.setValue('SC-2026-ABCDEF123456');
    component.startMatching();
    expect(component.error()).toContain('current workflow state');
    expect(component.error()).not.toContain('raw internal');
  });

  it('expires stale offers deliberately and refreshes the list', async () => {
    const { component, api } = await setup();
    component.expireStaleOffers();
    expect(api.expireStaleOffers).toHaveBeenCalledOnce();
    expect(component.statusMessage()).toContain('2 stale offers were expired');
    expect(api.getAssignments).toHaveBeenCalledTimes(2);
  });

  async function setup(overrides: { startMatching?: () => unknown } = {}) {
    const api = {
      getAssignments: vi.fn(() => of([assignment()])),
      startMatching: vi.fn(
        overrides.startMatching ??
          (() =>
            of({
              bookingReference: 'SC-2026-ABCDEF123456',
              bookingStatus: 'PENDING_PROVIDER_MATCH',
              outcome: 'OFFER_CREATED',
              assignmentId: 'assignment-id',
              assignmentStatus: 'OFFERED',
              offerExpiresAt: null,
            })),
      ),
      expireStaleOffers: vi.fn(() =>
        of({ expiredCount: 2, nextOffers: [{ bookingStatus: 'UNFULFILLABLE', assignment: null }] }),
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
    declineReason: null,
    ...changes,
  };
}

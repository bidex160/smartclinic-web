import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';

import { AdminProviderAssignment } from '../../core/models/admin-provider-assignment.model';
import { AdminProviderAssignmentsApiService } from '../../core/services/admin-provider-assignments-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { ProviderAssignmentDetailPageComponent } from './provider-assignment-detail-page.component';

describe('ProviderAssignmentDetailPageComponent', () => {
  it('renders safe assignment details', async () => {
    const { fixture } = await setup();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Care Provider');
    expect(text).toContain('Ada Okafor');
    expect(text).toContain('Confirm provider assignment');
    expect(text).not.toContain('+2348000000000');
    expect(text).not.toContain('payer@example.test');
  });

  it('requires explicit confirmation and updates accepted assignment state once', async () => {
    const pending = new Subject<AdminProviderAssignment>();
    const { component, api } = await setup({ confirmAssignment: () => pending });
    component.confirmAssignment();
    expect(api.confirmAssignment).not.toHaveBeenCalled();

    component.requestConfirmation();
    component.confirmAssignment();
    component.confirmAssignment();
    expect(api.confirmAssignment).toHaveBeenCalledTimes(1);
    pending.next(
      assignment({
        status: 'CONFIRMED',
        bookingStatus: 'PROVIDER_ASSIGNED',
        confirmedAt: '2026-08-24T08:20:00Z',
      }),
    );
    pending.complete();
    expect(component.assignment()?.status).toBe('CONFIRMED');
    expect(component.assignment()?.bookingStatus).toBe('PROVIDER_ASSIGNED');
  });

  it.each(['OFFERED', 'DECLINED', 'EXPIRED', 'CONFIRMED'] as const)(
    'blocks confirmation for %s state',
    async (status) => {
      const { component, api, fixture } = await setup({
        getAssignment: () => of(assignment({ status })),
      });
      component.requestConfirmation();
      component.confirmAssignment();
      fixture.detectChanges();
      expect(api.confirmAssignment).not.toHaveBeenCalled();
      expect(fixture.nativeElement.textContent).not.toContain('Yes, confirm assignment');
    },
  );

  it('shows a safe 404 assignment state', async () => {
    const { component, fixture } = await setup({
      getAssignment: () => throwError(() => new HttpErrorResponse({ status: 404 })),
    });
    fixture.detectChanges();
    expect(component.notFound()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('could not be found');
  });

  async function setup(
    overrides: Partial<{
      getAssignment: () => ReturnType<AdminProviderAssignmentsApiService['getAssignment']>;
      confirmAssignment: () => ReturnType<AdminProviderAssignmentsApiService['confirmAssignment']>;
    }> = {},
  ) {
    const api = {
      getAssignment: vi.fn(overrides.getAssignment ?? (() => of(assignment()))),
      confirmAssignment: vi.fn(
        overrides.confirmAssignment ??
          (() =>
            of(
              assignment({
                status: 'CONFIRMED',
                bookingStatus: 'PROVIDER_ASSIGNED',
              }),
            )),
      ),
    };
    await TestBed.configureTestingModule({
      imports: [ProviderAssignmentDetailPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'assignment-id' }) } },
        },
        { provide: AdminProviderAssignmentsApiService, useValue: api },
        { provide: AuthSessionService, useValue: { logout: () => of(true) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProviderAssignmentDetailPageComponent);
    return { fixture, component: fixture.componentInstance, api };
  }
});

function assignment(changes: Partial<AdminProviderAssignment> = {}): AdminProviderAssignment {
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

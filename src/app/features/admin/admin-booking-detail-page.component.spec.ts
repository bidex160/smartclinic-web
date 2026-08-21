import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';

import { AdminBookingDetail } from '../../core/models/admin-booking-detail.model';
import { AdminBookingsApiService } from '../../core/services/admin-bookings-api.service';
import { AdminProviderAssignmentsApiService } from '../../core/services/admin-provider-assignments-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { HealthCheckPackagesApiService } from '../../core/services/health-check-packages-api.service';
import { FulfilmentModesApiService } from '../../core/services/fulfilment-modes-api.service';
import { AdminBookingDetailPageComponent } from './admin-booking-detail-page.component';

describe('AdminBookingDetailPageComponent', () => {
  it('renders the safe operational projection and a confirmed assignment', async () => {
    const { fixture } = await setup();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Essential Health Check');
    expect(text).toContain('Ada Okafor');
    expect(text).toContain('Care Provider');
    expect(text).toContain('Confirmed');
    expect(text).toContain('Provider assigned');
    expect(text).not.toContain('internal-provider-id');
    expect(text).not.toContain('1990-01-01');
  });

  it('handles absent funding, payment, assignment, and registered-booker fields without inference', async () => {
    const { fixture } = await setup({
      booking: detail({
        bookerContact: {
          givenName: null,
          familyName: null,
          email: 'account@example.test',
          phone: null,
        },
        funding: { fundingStatus: null, fundingType: null, amount: null, currency: null },
        payment: { status: null, paymentReference: null, paidAt: null },
        assignment: emptyAssignment(),
      }),
    });
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('No assignment yet');
    expect(text).toContain('Not started');
    expect(text).toContain('Not available');
    expect(text).toContain('account@example.test');
    expect(text).not.toContain('Ada Okafor Not available');
  });

  it('shows Start matching only when backend readiness is READY', async () => {
    const ready = await setup({
      booking: detail({ readiness: 'READY', assignment: emptyAssignment() }),
    });
    ready.fixture.detectChanges();
    expect(button(ready.fixture, 'Start matching')).toBeTruthy();

    ready.component.booking.set(
      detail({ readiness: 'FUNDING_INCOMPLETE', assignment: emptyAssignment() }),
    );
    ready.fixture.detectChanges();
    expect(button(ready.fixture, 'Start matching')).toBeFalsy();
    expect(ready.fixture.nativeElement.textContent).toContain('Funding incomplete');
  });

  it('prevents duplicate matching and refreshes detail after success', async () => {
    const pending = new Subject<any>();
    const { component, api } = await setup({
      booking: detail({ readiness: 'READY', assignment: emptyAssignment() }),
      startMatching: () => pending,
    });
    component.startMatching();
    component.startMatching();
    expect(api.startMatching).toHaveBeenCalledTimes(1);
    pending.next({
      bookingReference: 'SC-2026-ABCDEF123456',
      bookingStatus: 'PENDING_PROVIDER_MATCH',
      outcome: 'OFFER_CREATED',
      assignmentId: 'assignment-id',
      assignmentStatus: 'OFFERED',
      offerExpiresAt: null,
    });
    pending.complete();
    expect(api.getBooking).toHaveBeenCalledTimes(2);
    expect(component.createdAssignmentId()).toBe('assignment-id');
  });

  it('shows scheduling only for PROVIDER_ASSIGNED with a confirmed assignment and prefills preferences', async () => {
    const { component, fixture } = await setup();
    fixture.detectChanges();
    expect(button(fixture, 'Schedule appointment')).toBeTruthy();
    component.openScheduleForm();
    fixture.detectChanges();
    expect(component.scheduleForm.getRawValue()).toMatchObject({
      date: '2026-09-01',
      timeFrom: '09:00',
      timeTo: '11:00',
      timezone: 'Africa/Lagos',
    });
    expect(fixture.nativeElement.textContent).toContain('proposed defaults only');
    component.booking.set(detail({ status: 'IN_PROGRESS' }));
    fixture.detectChanges();
    expect(button(fixture, 'Schedule appointment')).toBeFalsy();
  });

  it('prevents duplicate scheduling, refreshes after success, and sanitizes conflicts', async () => {
    const pending = new Subject<any>();
    const success = await setup({ schedule: () => pending });
    success.component.openScheduleForm();
    success.component.submitSchedule();
    success.component.submitSchedule();
    expect(success.api.schedule).toHaveBeenCalledOnce();
    pending.next({ bookingStatus: 'SCHEDULED' });
    pending.complete();
    expect(success.api.getBooking).toHaveBeenCalledTimes(2);
    expect(success.component.statusMessage()).toContain('scheduled successfully');
    TestBed.resetTestingModule();
    const conflict = await setup({
      schedule: () =>
        throwError(
          () =>
            new HttpErrorResponse({ status: 409, error: { message: 'raw capacity internals' } }),
        ),
    });
    conflict.component.openScheduleForm();
    conflict.component.submitSchedule();
    expect(conflict.component.error()).toContain('rescheduling workflow');
    expect(conflict.component.error()).not.toContain('raw capacity internals');
  });

  it('hides location selection for HOME_VISIT and uses named linked locations for PROVIDER_LOCATION', async () => {
    const home = await setup();
    home.component.openScheduleForm();
    home.fixture.detectChanges();
    expect(home.fixture.nativeElement.querySelector('#schedule-provider-location')).toBeNull();
    TestBed.resetTestingModule();
    const providerLocation = await setup({
      booking: detail({ fulfilmentMode: { code: 'PROVIDER_LOCATION', name: 'Provider location' } }),
      locationData: true,
    });
    providerLocation.component.openScheduleForm();
    providerLocation.fixture.detectChanges();
    const select = providerLocation.fixture.nativeElement.querySelector(
      '#schedule-provider-location',
    ) as HTMLSelectElement;
    expect(select.textContent).toContain('Ikeja Clinic');
    expect(
      providerLocation.fixture.nativeElement.querySelector(
        'input[formcontrolname="providerLocationId"]',
      ),
    ).toBeNull();
  });

  async function setup(
    options: {
      booking?: AdminBookingDetail;
      startMatching?: () => any;
      schedule?: () => any;
      locationData?: boolean;
    } = {},
  ) {
    const api = {
      getBooking: vi.fn(() => of(options.booking ?? detail())),
      schedule: vi.fn(options.schedule ?? (() => of({ bookingStatus: 'SCHEDULED' }))),
      getProviderCapabilities: vi.fn(() =>
        of(
          options.locationData
            ? [
                {
                  id: 'service',
                  providerId: '10000000-0000-4000-8000-000000000001',
                  healthCheckPackageId: 'package-id',
                  fulfilmentModeId: 'mode-id',
                  isActive: true,
                  providerLocationIds: ['location-id'],
                },
              ]
            : [],
        ),
      ),
      getProviderLocations: vi.fn(() =>
        of(
          options.locationData
            ? [
                {
                  id: 'location-id',
                  providerId: '10000000-0000-4000-8000-000000000001',
                  name: 'Ikeja Clinic',
                  addressLine1: 'Road',
                  addressLine2: null,
                  city: 'Ikeja',
                  state: 'Lagos',
                  countryCode: 'NG',
                  isActive: true,
                },
              ]
            : [],
        ),
      ),
      startMatching: vi.fn(
        options.startMatching ??
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
    };
    await TestBed.configureTestingModule({
      imports: [AdminBookingDetailPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ reference: 'SC-2026-ABCDEF123456' }) },
          },
        },
        { provide: AdminBookingsApiService, useValue: api },
        { provide: AdminProviderAssignmentsApiService, useValue: api },
        {
          provide: HealthCheckPackagesApiService,
          useValue: {
            getPackages: vi.fn(() =>
              of(options.locationData ? [{ id: 'package-id', code: 'ESSENTIAL' }] : []),
            ),
          },
        },
        {
          provide: FulfilmentModesApiService,
          useValue: {
            getFulfilmentModes: vi.fn(() =>
              of(options.locationData ? [{ id: 'mode-id', code: 'PROVIDER_LOCATION' }] : []),
            ),
          },
        },
        { provide: AuthSessionService, useValue: { logout: () => of(true) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AdminBookingDetailPageComponent);
    return { fixture, component: fixture.componentInstance, api };
  }
});

function button(fixture: any, label: string): HTMLButtonElement | undefined {
  return [...fixture.nativeElement.querySelectorAll('button')].find(
    (element: HTMLButtonElement) => element.textContent?.trim() === label,
  );
}

function emptyAssignment(): AdminBookingDetail['assignment'] {
  return {
    assignmentId: null,
    assignmentStatus: null,
    providerId: null,
    providerName: null,
    offeredAt: null,
    acceptedAt: null,
    confirmedAt: null,
    expiresAt: null,
  };
}

function detail(changes: Partial<AdminBookingDetail> = {}): AdminBookingDetail {
  return {
    bookingReference: 'SC-2026-ABCDEF123456',
    status: 'PROVIDER_ASSIGNED',
    createdAt: '2026-08-18T08:00:00Z',
    updatedAt: '2026-08-18T09:00:00Z',
    package: { code: 'ESSENTIAL', name: 'Essential Health Check' },
    fulfilmentMode: { code: 'HOME_VISIT', name: 'Home visit' },
    participant: { givenName: 'Ada', familyName: 'Okafor' },
    bookerContact: {
      givenName: 'Chidi',
      familyName: 'Okafor',
      email: 'booker@example.test',
      phone: '+2348000000000',
    },
    preferredDate: '2026-09-01',
    preferredTimeFrom: '09:00',
    preferredTimeTo: '11:00',
    preferredTimezone: 'Africa/Lagos',
    locationNote: 'Reception',
    confirmedSchedule: null,
    quotedAmount: '12500.00',
    quotedCurrency: 'NGN',
    funding: { fundingStatus: 'SETTLED', fundingType: 'SELF', amount: '12500.00', currency: 'NGN' },
    payment: {
      status: 'SUCCEEDED',
      paymentReference: 'safe-payment-ref',
      paidAt: '2026-08-18T08:30:00Z',
    },
    assignment: {
      assignmentId: 'assignment-id',
      assignmentStatus: 'CONFIRMED',
      providerId: '10000000-0000-4000-8000-000000000001',
      providerName: 'Care Provider',
      offeredAt: '2026-08-18T08:40:00Z',
      acceptedAt: '2026-08-18T08:50:00Z',
      confirmedAt: '2026-08-18T09:00:00Z',
      expiresAt: '2026-08-18T09:10:00Z',
    },
    readiness: 'ALREADY_ASSIGNED',
    ...changes,
  };
}

import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import {
  AdminMatchingQueueItem,
  AdminMatchingQueueResponse,
  MatchingQueueReadiness,
} from '../../core/models/admin-matching-queue.model';
import { AdminMatchingQueueApiService } from '../../core/services/admin-matching-queue-api.service';
import { AdminProviderAssignmentsApiService } from '../../core/services/admin-provider-assignments-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { FulfilmentModesApiService } from '../../core/services/fulfilment-modes-api.service';
import { HealthCheckPackagesApiService } from '../../core/services/health-check-packages-api.service';
import { MatchingQueuePageComponent } from './matching-queue-page.component';

describe('MatchingQueuePageComponent', () => {
  it('loads the backend default queue without changing its order', async () => {
    const second = item({
      bookingReference: 'SC-2026-BBBBBBBBBBBB',
      createdAt: '2026-08-19T09:00:00Z',
    });
    const first = item({
      bookingReference: 'SC-2026-AAAAAAAAAAAA',
      createdAt: '2026-08-20T09:00:00Z',
    });
    const { component, api } = await setup({ items: [second, first] });

    expect(api.getQueue).toHaveBeenCalledWith({ page: 1, limit: 25 });
    expect(component.response().items.map((entry) => entry.bookingReference)).toEqual([
      'SC-2026-BBBBBBBBBBBB',
      'SC-2026-AAAAAAAAAAAA',
    ]);
  });

  it('links booking references to operational booking detail', async () => {
    const { fixture } = await setup();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('a[href="/admin/bookings/SC-2026-ABCDEF123456"]'),
    ).toBeTruthy();
  });

  it('renders every readiness label and only safe operational fields', async () => {
    const readinesses: MatchingQueueReadiness[] = [
      'READY',
      'FUNDING_INCOMPLETE',
      'INCOMPLETE_SCHEDULING',
      'ACTIVE_OFFER',
      'ACCEPTED_AWAITING_CONFIRMATION',
      'UNFULFILLABLE',
      'ALREADY_ASSIGNED',
    ];
    const { fixture } = await setup({
      items: readinesses.map((readiness, index) =>
        item({ bookingReference: `SC-2026-${String(index).padStart(12, 'A')}`, readiness }),
      ),
    });
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Ready for automatic matching');
    expect(text).toContain('Funding incomplete');
    expect(text).toContain('Scheduling incomplete');
    expect(text).toContain('Provider offer active');
    expect(text).toContain('Awaiting confirmation');
    expect(text).toContain('Provider match needs review');
    expect(text).toContain('Provider assigned');
    expect(text).toContain('Ada Okafor');
    expect(text).not.toContain('+2348000000000');
    expect(text).not.toContain('patient@example.test');
    expect(text).not.toContain('1990-01-01');
    expect(text).not.toContain('candidate-provider');
  });

  it('sends applied catalogue and operational filters only on submit', async () => {
    const { component, api } = await setup();
    component.filterForm.setValue({
      bookingReference: 'sc-2026-abcdef123456',
      bookingStatus: 'UNFULFILLABLE',
      packageId: 'package-id',
      fulfilmentModeId: 'mode-id',
      preferredDate: '2026-09-01',
      providerAssignmentStatus: 'EXPIRED',
      limit: 10,
    });

    expect(api.getQueue).toHaveBeenCalledTimes(1);
    component.applyFilters();

    expect(api.getQueue).toHaveBeenLastCalledWith({
      bookingReference: 'SC-2026-ABCDEF123456',
      bookingStatus: 'UNFULFILLABLE',
      packageId: 'package-id',
      fulfilmentModeId: 'mode-id',
      preferredDate: '2026-09-01',
      providerAssignmentStatus: 'EXPIRED',
      page: 1,
      limit: 10,
    });
  });

  it('clears filters back to the backend default', async () => {
    const { component, api } = await setup();
    component.filterForm.patchValue({ bookingStatus: 'UNFULFILLABLE', limit: 10 });
    component.applyFilters();
    component.clearFilters();

    expect(component.filterForm.getRawValue().bookingStatus).toBe('');
    expect(api.getQueue).toHaveBeenLastCalledWith({ page: 1, limit: 25 });
  });

  it('uses backend pagination metadata for next and previous navigation', async () => {
    const { component, api } = await setup({ total: 30, totalPages: 2 });
    component.goToPage(2);
    expect(api.getQueue).toHaveBeenLastCalledWith({ page: 2, limit: 25 });
    component.goToPage(1);
    expect(api.getQueue).toHaveBeenLastCalledWith({ page: 1, limit: 25 });
  });

  it('does not show routine Start matching and shows Retry only for UNFULFILLABLE', async () => {
    const { fixture } = await setup({
      items: [
        item(),
        item({
          bookingReference: 'SC-2026-BBBBBBBBBBBB',
          readiness: 'UNFULFILLABLE',
          bookingStatus: 'UNFULFILLABLE',
        }),
      ],
    });
    fixture.detectChanges();
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];

    expect(buttons.some((button) => button.textContent?.trim() === 'Start matching')).toBe(false);
    expect(buttons.filter((button) => button.textContent?.trim() === 'Retry')).toHaveLength(1);
  });

  it('retries an unfulfillable booking, exposes the returned assignment, and refreshes', async () => {
    const { component, api } = await setup();
    component.retryMatching(item({ readiness: 'UNFULFILLABLE', bookingStatus: 'UNFULFILLABLE' }));

    expect(api.retryMatching).toHaveBeenCalledWith('SC-2026-ABCDEF123456');
    expect(component.statusMessage()).toContain('provider offer was created');
    expect(component.latestAssignmentId()).toBe('assignment-id');
    expect(api.getQueue).toHaveBeenCalledTimes(2);
  });

  it('handles an authoritative UNFULFILLABLE matching outcome and refreshes', async () => {
    const { component, api } = await setup({
      matchingResult: {
        bookingReference: 'SC-2026-ABCDEF123456',
        bookingStatus: 'UNFULFILLABLE',
        outcome: 'UNFULFILLABLE',
        assignmentId: null,
        assignmentStatus: null,
        offerExpiresAt: null,
      },
    });
    component.retryMatching(item({ readiness: 'UNFULFILLABLE', bookingStatus: 'UNFULFILLABLE' }));

    expect(component.statusMessage()).toContain('no eligible provider');
    expect(component.latestAssignmentId()).toBeNull();
    expect(api.getQueue).toHaveBeenCalledTimes(2);
  });

  it.each(['ACTIVE_OFFER', 'ACCEPTED_AWAITING_CONFIRMATION'] as const)(
    'links %s rows to assignments filtered by booking reference',
    async (readiness) => {
      const { fixture } = await setup({ items: [item({ readiness })] });
      fixture.detectChanges();
      const link = fixture.nativeElement.querySelector('a[href*="provider-assignments?"]');

      expect(link?.getAttribute('href')).toContain('bookingReference=SC-2026-ABCDEF123456');
    },
  );

  it('sanitizes matching conflicts without exposing backend detail', async () => {
    const { component } = await setup({
      matchingError: new HttpErrorResponse({
        status: 409,
        error: { message: 'raw candidate and workflow internals' },
      }),
    });
    component.retryMatching(item({ readiness: 'UNFULFILLABLE', bookingStatus: 'UNFULFILLABLE' }));

    expect(component.error()).toContain('another workflow is active');
    expect(component.error()).not.toContain('raw candidate');
  });

  async function setup(
    options: {
      items?: AdminMatchingQueueItem[];
      total?: number;
      totalPages?: number;
      matchingResult?: unknown;
      matchingError?: HttpErrorResponse;
    } = {},
  ) {
    const response = (): AdminMatchingQueueResponse => ({
      items: options.items ?? [item()],
      page: 1,
      limit: 25,
      total: options.total ?? options.items?.length ?? 1,
      totalPages: options.totalPages ?? 1,
    });
    const queueApi = { getQueue: vi.fn(() => of(response())) };
    const matchingResult =
      options.matchingResult ??
      ({
        bookingReference: 'SC-2026-ABCDEF123456',
        bookingStatus: 'PENDING_PROVIDER_MATCH',
        outcome: 'OFFER_CREATED',
        assignmentId: 'assignment-id',
        assignmentStatus: 'OFFERED',
        offerExpiresAt: '2026-08-24T10:00:00Z',
      } as const);
    const assignmentsApi = {
      retryMatching: vi.fn(() =>
        options.matchingError ? throwError(() => options.matchingError) : of(matchingResult),
      ),
    };
    await TestBed.configureTestingModule({
      imports: [MatchingQueuePageComponent],
      providers: [
        provideRouter([]),
        { provide: AdminMatchingQueueApiService, useValue: queueApi },
        { provide: AdminProviderAssignmentsApiService, useValue: assignmentsApi },
        {
          provide: HealthCheckPackagesApiService,
          useValue: {
            getPackages: () =>
              of([
                {
                  id: 'package-id',
                  code: 'ESSENTIAL',
                  name: 'Essential',
                  description: null,
                  benefits: [],
                  estimatedDurationMinutes: 15,
                  prices: [],
                  isActive: true,
                },
              ]),
          },
        },
        {
          provide: FulfilmentModesApiService,
          useValue: {
            getFulfilmentModes: () =>
              of([{ id: 'mode-id', code: 'HOME_VISIT', name: 'Home visit', isActive: true }]),
          },
        },
        { provide: AuthSessionService, useValue: { logout: () => of(true) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(MatchingQueuePageComponent);
    return {
      fixture,
      component: fixture.componentInstance,
      api: { ...queueApi, ...assignmentsApi },
    };
  }
});

function item(changes: Partial<AdminMatchingQueueItem> = {}): AdminMatchingQueueItem {
  return {
    bookingReference: 'SC-2026-ABCDEF123456',
    bookingStatus: 'PENDING_PROVIDER_MATCH',
    package: { code: 'ESSENTIAL', name: 'Essential Health Check' },
    fulfilmentMode: { code: 'HOME_VISIT', name: 'Home visit' },
    participant: { givenName: 'Ada', familyName: 'Okafor' },
    preferredDate: '2026-09-01',
    preferredTimeFrom: '09:00',
    preferredTimeTo: '11:00',
    preferredTimezone: 'Africa/Lagos',
    fundingStatus: 'SETTLED',
    quotedAmount: '12500.00',
    quotedCurrency: 'NGN',
    createdAt: '2026-08-18T09:00:00Z',
    updatedAt: '2026-08-18T09:00:00Z',
    currentAssignmentStatus: null,
    currentProviderName: null,
    readiness: 'READY',
    ...changes,
  };
}

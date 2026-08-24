import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import {
  PatientHealthCheckHistoryItem,
  PatientHealthCheckHistoryResponse,
} from '../../core/models/patient-health-check-history.model';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { MyHealthChecksPageComponent } from './my-health-checks-page.component';

describe('MyHealthChecksPageComponent', () => {
  it('renders history in backend order with safe statuses and nullable values', async () => {
    const { fixture } = await setup(
      response([
        item('NEWEST'),
        item('OLDER', {
          encounterStatus: null,
          providerDisplayName: null,
          hasCompletedResult: false,
        }),
      ]),
    );
    const text = fixture.nativeElement.textContent as string;
    expect(text.indexOf('NEWEST')).toBeLessThan(text.indexOf('OLDER'));
    expect(text).toContain('Finding a provider');
    expect(text).toContain('In progress');
    expect(text).toContain('Not started');
    expect(text).toContain('Not assigned yet');
    expect(text).toContain('Results not available yet');
    for (const hidden of ['funding', 'patientId', 'providerId', 'date of birth'])
      expect(text.toLowerCase()).not.toContain(hidden.toLowerCase());
  });

  it('uses hasCompletedResult alone to expose a reference-based result link', async () => {
    const available = item('AVAILABLE', {
      bookingStatus: 'AWAITING_FUNDING',
      encounterStatus: 'DRAFT',
      hasCompletedResult: true,
    });
    const unavailable = item('UNAVAILABLE', {
      bookingStatus: 'COMPLETED',
      encounterStatus: 'COMPLETED',
      hasCompletedResult: false,
    });
    const { fixture } = await setup(response([available, unavailable]));
    const links = [...fixture.nativeElement.querySelectorAll('a')].filter(
      (link: HTMLAnchorElement) => link.textContent?.includes('View results'),
    ) as HTMLAnchorElement[];
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe('/me/health-checks/AVAILABLE/results');
  });

  it('renders preferred and confirmed appointments separately with safe provider location summary', async () => {
    const scheduled = item('SCHEDULED', {
      bookingStatus: 'SCHEDULED',
      confirmedSchedule: {
        date: '2026-08-25',
        timeFrom: '12:00',
        timeTo: '13:00',
        timezone: 'Europe/London',
        providerLocationName: 'Central Clinic',
      },
    });
    const { fixture } = await setup(response([scheduled]));
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Preferred schedule');
    expect(text).toContain('2026-08-20');
    expect(text).toContain('Confirmed appointment');
    expect(text).toContain('2026-08-25');
    expect(text).toContain('Central Clinic');
    expect(text).toContain('Scheduled');
    expect(text).not.toContain('location-id');
  });

  it('renders all supported booking and encounter labels', async () => {
    const { component } = await setup(response([]));
    expect(component.bookingStatusLabel('AWAITING_FUNDING')).toBe('Awaiting payment');
    expect(component.bookingStatusLabel('PROVIDER_ASSIGNED')).toBe('Provider assigned');
    expect(component.bookingStatusLabel('IN_PROGRESS')).toBe('Health Check in progress');
    expect(component.bookingStatusLabel('UNFULFILLABLE')).toBe('Provider match needs review');
    expect(component.encounterStatusLabel('COMPLETED')).toBe('Completed');
  });

  it('applies and clears explicit filters', async () => {
    const { component, api } = await setup(response([]));
    component.filterForm.setValue({
      bookingStatus: 'COMPLETED',
      encounterStatus: 'IN_PROGRESS',
      limit: 10,
    });
    component.applyFilters();
    expect(api.getMyHealthChecks).toHaveBeenLastCalledWith({
      bookingStatus: 'COMPLETED',
      encounterStatus: 'IN_PROGRESS',
      page: 1,
      limit: 10,
    });
    component.clearFilters();
    expect(api.getMyHealthChecks).toHaveBeenLastCalledWith({ page: 1, limit: 20 });
  });

  it('uses server pagination metadata', async () => {
    const api = {
      getMyHealthChecks: vi
        .fn()
        .mockReturnValueOnce(of({ ...response([item('PAGE-ONE')]), total: 2, totalPages: 2 }))
        .mockReturnValueOnce(
          of({ ...response([item('PAGE-TWO')]), page: 2, total: 2, totalPages: 2 }),
        ),
    };
    const { component } = await setup(undefined, api);
    component.goToPage(2);
    expect(api.getMyHealthChecks).toHaveBeenLastCalledWith({ page: 2, limit: 20 });
    expect(component.response().items[0].bookingReference).toBe('PAGE-TWO');
  });

  it('shows a neutral empty state and safe retryable errors', async () => {
    const empty = await setup(response([]));
    empty.fixture.detectChanges();
    expect(empty.fixture.nativeElement.textContent).toContain(
      'No Smart Health Checks are available for this account yet.',
    );
    TestBed.resetTestingModule();
    const failed = await setup(undefined, {
      getMyHealthChecks: vi.fn(() =>
        throwError(
          () => new HttpErrorResponse({ status: 404, error: { message: 'patient link missing' } }),
        ),
      ),
    });
    expect(failed.fixture.nativeElement.textContent).toContain('Health Checks unavailable');
    expect(failed.fixture.nativeElement.textContent).not.toContain('patient link missing');
  });

  it('prevents overlapping history loads', async () => {
    const pending = new Subject<PatientHealthCheckHistoryResponse>();
    const api = { getMyHealthChecks: vi.fn(() => pending) };
    const { component } = await setup(undefined, api);
    component.load();
    expect(api.getMyHealthChecks).toHaveBeenCalledTimes(1);
    pending.next(response([]));
    pending.complete();
  });

  it('provides a secondary guest-history linking entry', async () => {
    const { fixture } = await setup(response([]));
    expect(
      fixture.nativeElement.querySelector('a[href="/me/link-health-history"]')?.textContent,
    ).toContain('Link previous guest history');
  });

  async function setup(
    value?: PatientHealthCheckHistoryResponse,
    providedApi?: { getMyHealthChecks: ReturnType<typeof vi.fn> },
  ) {
    const api = providedApi ?? { getMyHealthChecks: vi.fn(() => of(value ?? response([]))) };
    await TestBed.configureTestingModule({
      imports: [MyHealthChecksPageComponent],
      providers: [provideRouter([]), { provide: HealthCheckResultsApiService, useValue: api }],
    }).compileComponents();
    const fixture = TestBed.createComponent(MyHealthChecksPageComponent);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, api };
  }
});

function item(
  bookingReference: string,
  changes: Partial<PatientHealthCheckHistoryItem> = {},
): PatientHealthCheckHistoryItem {
  return {
    bookingReference,
    bookingStatus: 'PENDING_PROVIDER_MATCH',
    healthCheckPackage: { code: 'ESSENTIAL', name: 'Essential' },
    fulfilmentMode: { code: 'HOME_VISIT', name: 'Home visit' },
    preferredDate: '2026-08-20',
    preferredTimeFrom: '09:00',
    preferredTimeTo: '11:00',
    preferredTimezone: 'Africa/Lagos',
    confirmedSchedule: null,
    providerDisplayName: 'Care Provider',
    encounterStatus: 'IN_PROGRESS',
    startedAt: '2026-08-18T09:00:00Z',
    completedAt: null,
    hasCompletedResult: true,
    createdAt: '2026-08-18T08:00:00Z',
    updatedAt: '2026-08-18T09:00:00Z',
    ...changes,
  };
}
function response(
  items: readonly PatientHealthCheckHistoryItem[],
): PatientHealthCheckHistoryResponse {
  return { items, page: 1, limit: 20, total: items.length, totalPages: items.length ? 1 : 0 };
}

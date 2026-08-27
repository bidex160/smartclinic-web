import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AdminDashboardApiService } from '../../core/services/admin-dashboard-api.service';
import { AdminMatchingQueueApiService } from '../../core/services/admin-matching-queue-api.service';
import { AdminDashboardPageComponent } from './admin-dashboard-page.component';

describe('AdminDashboardPageComponent', () => {
  it('maps all nine authoritative metrics and requests an intervention preview', async () => {
    const { fixture, summaryApi, queueApi } = await setup(); fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    for (const label of ['Awaiting Funding','Pending Match','Scheduled','In Progress','Completed','Needs Attention','Active Offers','Pending Provider Reviews','Active Providers']) expect(text).toContain(label);
    for (const value of ['21','22','23','24','25','26','27','28','29']) expect(text).toContain(value);
    expect(summaryApi.getSummary).toHaveBeenCalledOnce();
    expect(queueApi.getQueue).toHaveBeenCalledWith({ bookingStatus: 'UNFULFILLABLE', page: 1, limit: 5 });
    expect(text).not.toMatch(/revenue|earnings|trend|%/i);
    expect(text).toContain('Referral Levels');
    expect(text.indexOf('Level 1')).toBeLessThan(text.indexOf('Level 2'));
  });

  it('keeps zero metrics visible after loading', async () => {
    const zero = { bookings: { awaitingFunding: 0, pendingProviderMatch: 0, scheduled: 0, inProgress: 0, completed: 0, needsAttention: 0 }, matching: { activeOffers: 0 }, providers: { pendingReview: 0, active: 0 } };
    const { fixture } = await setup(zero); fixture.detectChanges();
    expect((fixture.nativeElement.textContent as string).match(/0/g)?.length).toBeGreaterThanOrEqual(9);
  });

  it('shows a safe summary error and retries', async () => {
    const { fixture, component, summaryApi } = await setup(undefined, true); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('We could not load the operations summary.');
    component.loadSummary(); expect(summaryApi.getSummary).toHaveBeenCalledTimes(2);
  });

  it('renders every backend referral level without a frontend cap', async () => {
    const { fixture, component } = await setup();
    const current = component.summary()!;
    component.summary.set({ ...current, referrals: { ...current.referrals, levels: Array.from({ length: 6 }, (_, index) => ({ code: `LEVEL_${index + 1}`, name: `Tier ${index + 1}`, ordinal: index + 1, achieved: 10 - index })) } });
    fixture.detectChanges();
    for (let index = 1; index <= 6; index += 1) expect(fixture.nativeElement.textContent).toContain(`Tier ${index}`);
  });
});

async function setup(summary: any = { bookings: { awaitingFunding: 21, pendingProviderMatch: 22, scheduled: 23, inProgress: 24, completed: 25, needsAttention: 26 }, matching: { activeOffers: 27 }, providers: { pendingReview: 28, active: 29 }, referrals: { registered: 31, qualified: 32, level1Achieved: 33, levels:[{code:'LEVEL_3',name:'Level 3',ordinal:3,achieved:3},{code:'LEVEL_1',name:'Level 1',ordinal:1,achieved:20},{code:'LEVEL_2',name:'Level 2',ordinal:2,achieved:9}], pointsIssued: 34 }, withdrawals: { requested: 35, processing: 36, paid: 37, failed: 38, pointsReserved: 39 } }, fail = false) {
  const summaryApi = { getSummary: vi.fn(() => fail ? throwError(() => new Error('raw')) : of(summary)) };
  const queueApi = { getQueue: vi.fn(() => of({ items: [], page: 1, limit: 5, total: 0, totalPages: 0 })) };
  await TestBed.configureTestingModule({ imports: [AdminDashboardPageComponent], providers: [provideRouter([]), { provide: AdminDashboardApiService, useValue: summaryApi }, { provide: AdminMatchingQueueApiService, useValue: queueApi }] }).compileComponents();
  const fixture = TestBed.createComponent(AdminDashboardPageComponent);
  return { fixture, component: fixture.componentInstance, summaryApi, queueApi };
}

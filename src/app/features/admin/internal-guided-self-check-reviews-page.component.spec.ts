import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { GuidedSelfCheckOperationsApiService } from '../../core/services/guided-self-check-operations-api.service';
import { InternalGuidedSelfCheckReviewsPageComponent } from './internal-guided-self-check-reviews-page.component';
describe('InternalGuidedSelfCheckReviewsPageComponent', () => {
  const rows: any = [
    {
      reference: 'SC-GSR-ONE',
      selfCheckReference: 'SC-GSC-ONE',
      classification: 'RED',
      priority: 'URGENT',
      status: 'ASSIGNED',
      assignedAt: '2026-08-31T10:00:00Z',
      startedAt: null,
      createdAt: '2026-08-31T09:00:00Z',
    },
    {
      reference: 'SC-GSR-TWO',
      selfCheckReference: 'SC-GSC-TWO',
      classification: 'AMBER',
      priority: 'ROUTINE',
      status: 'IN_REVIEW',
      assignedAt: '2026-08-31T11:00:00Z',
      startedAt: '2026-08-31T12:00:00Z',
      createdAt: '2026-08-31T09:00:00Z',
    },
  ];
  async function setup(response: any = of({ items: rows, total: 42, page: 1, limit: 20 })) {
    const api = { listMyReviews: vi.fn(() => response) };
    await TestBed.configureTestingModule({
      imports: [InternalGuidedSelfCheckReviewsPageComponent],
      providers: [
        provideRouter([]),
        { provide: GuidedSelfCheckOperationsApiService, useValue: api },
      ],
    }).compileComponents();
    const f = TestBed.createComponent(InternalGuidedSelfCheckReviewsPageComponent);
    f.detectChanges();
    return { f, api, c: f.componentInstance };
  }
  it('loads the backend default active worklist and renders only safe public fields', async () => {
    const { f, api } = await setup();
    expect(api.listMyReviews).toHaveBeenCalledWith({ page: 1, limit: 20 });
    const text = f.nativeElement.textContent;
    expect(text).toContain('My Self-Check Reviews');
    expect(text).toContain('SC-GSR-ONE');
    expect(text).toContain('SC-GSC-ONE');
    expect(text).toContain('Urgent priority');
    expect(text).toContain('Assigned');
    expect(text).toContain('In clinical review');
    expect(text).toContain('RED · Urgent');
    expect(text).toContain('AMBER · Routine');
    expect(text).toContain('Not started');
    expect(text).toContain('Open Review');
    expect(text).not.toContain('Patient name');
    expect(text).not.toContain('Provider');
    expect(
      f.nativeElement.querySelector('a[href="/internal/guided-self-check-reviews/SC-GSR-ONE"]'),
    ).not.toBeNull();
  });
  it('preserves backend urgent-before-routine ordering', async () => {
    const { f } = await setup();
    const text = f.nativeElement.textContent;
    expect(text.indexOf('SC-GSR-ONE')).toBeLessThan(text.indexOf('SC-GSR-TWO'));
  });
  it('serializes exact filters and resets pagination while Active omits status', async () => {
    const { c, api } = await setup();
    c.page.set(3);
    c.status = 'COMPLETED';
    c.priority = 'URGENT';
    c.filtersChanged();
    expect(api.listMyReviews).toHaveBeenLastCalledWith({
      status: 'COMPLETED',
      priority: 'URGENT',
      page: 1,
      limit: 20,
    });
    c.status = '';
    c.filtersChanged();
    expect(api.listMyReviews).toHaveBeenLastCalledWith({ priority: 'URGENT', page: 1, limit: 20 });
  });
  it('sends every supported explicit historical and active status exactly', async () => {
    const { c, api } = await setup();
    for (const status of ['ASSIGNED', 'IN_REVIEW', 'COMPLETED', 'CANCELLED'] as const) {
      c.page.set(2);
      c.status = status;
      c.priority = '';
      c.filtersChanged();
      expect(api.listMyReviews).toHaveBeenLastCalledWith({ status, page: 1, limit: 20 });
    }
  });
  it('serializes exact review type and classification filters and omits both for All', async () => {
    const { c, api } = await setup();
    c.reviewType = 'INTERNAL_ROUTINE';
    c.filtersChanged();
    expect(api.listMyReviews).toHaveBeenLastCalledWith({
      reviewModel: 'INTERNAL_ROUTINE',
      classification: 'AMBER',
      page: 1,
      limit: 20,
    });
    c.reviewType = 'INTERNAL_URGENT';
    c.filtersChanged();
    expect(api.listMyReviews).toHaveBeenLastCalledWith({
      reviewModel: 'INTERNAL_URGENT',
      classification: 'RED',
      page: 1,
      limit: 20,
    });
    c.reviewType = '';
    c.filtersChanged();
    expect(api.listMyReviews).toHaveBeenLastCalledWith({ page: 1, limit: 20 });
  });
  it('shows the contextual active empty state', async () => {
    const empty = await setup(of({ items: [], total: 0, page: 1, limit: 20 }));
    expect(empty.f.nativeElement.textContent).toContain(
      'No Self-Check reviews are currently assigned to you.',
    );
  });
  it('shows safe authorization failure copy', async () => {
    const denied = await setup(throwError(() => ({ status: 403 })));
    expect(denied.f.nativeElement.textContent).toContain('do not currently have access');
  });
  it('shows an understandable initial loading state', async () => {
    const pending = new Subject<any>();
    const { f } = await setup(pending);
    expect(f.nativeElement.textContent).toContain('Loading your assigned reviews');
  });
});

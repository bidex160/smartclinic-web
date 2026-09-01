import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { GuidedSelfChecksApiService } from '../../core/services/guided-self-checks-api.service';
import { GuidedSelfCheckPageComponent } from './guided-self-check-page.component';

describe('GuidedSelfCheckPageComponent patient analysis status', () => {
  const base = (analysis: any, classification = 'AMBER'): any => ({
    reference: 'SC-GSC-ONE',
    currency: 'NGN',
    standardPriceMinor: 1,
    promotionalPriceMinor: null,
    effectivePriceMinor: 1,
    promotionApplied: false,
    fundingStatus: 'PAID',
    workflowStatus: 'COMPLETED',
    paidAt: '2026-01-01',
    canBegin: false,
    canResume: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    classificationStatus: 'CLASSIFIED',
    classification: {
      classification,
      requiresProfessionalReview: classification === 'AMBER',
      urgentAction: classification === 'RED',
      patientMessageKey: 'KEY',
      title: `${classification} result`,
      message: 'Deterministic safety guidance',
      classifiedAt: '2026-01-01',
    },
    professionalReview: null,
    professionalContact: null,
    analysis,
    nextAction: {
      type: 'FIND_CARE',
      source: 'AI_ANALYSIS',
      titleKey: 'ACTION',
      title: 'Backend selected next action',
      message: 'Backend action message',
      cta: { type: 'FIND_CARE' },
      selectedAt: '2026-01-01',
    },
  });
  async function setup(initial: any) {
    let current = initial;
    const api = { get: vi.fn(() => of(current)) };
    await TestBed.configureTestingModule({
      imports: [GuidedSelfCheckPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => 'SC-GSC-ONE' }, queryParamMap: { get: () => null } },
          },
        },
        { provide: GuidedSelfChecksApiService, useValue: api },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(GuidedSelfCheckPageComponent);
    fixture.detectChanges();
    return {
      fixture,
      component: fixture.componentInstance,
      api,
      setCurrent: (value: any) => (current = value),
    };
  }
  afterEach(() => vi.useRealTimers());
  it('does not render or poll when analysis is not required', async () => {
    vi.useFakeTimers();
    const { fixture, api } = await setup(
      base({ required: false, status: 'PENDING', humanReviewRecommended: false }),
    );
    expect(fixture.nativeElement.textContent).not.toContain('Additional review');
    await vi.advanceTimersByTimeAsync(10_000);
    expect(api.get).toHaveBeenCalledTimes(1);
    fixture.destroy();
  });
  it.each([
    ['PENDING', false, 'Additional review pending', "We're preparing an additional review"],
    ['PROCESSING', false, 'Additional review in progress', "We're reviewing the information"],
    ['COMPLETED', false, 'Additional review complete', "We've completed the additional review"],
    [
      'COMPLETED',
      true,
      'Professional review recommended',
      'A SmartClinic clinical professional should review',
    ],
    [
      'FAILED',
      false,
      'Additional review unavailable',
      "We couldn't complete the additional review",
    ],
  ])('renders %s safely', async (status, humanReviewRecommended, heading, copy) => {
    const { fixture } = await setup(
      base({
        required: true,
        status,
        humanReviewRecommended,
        conciseSummary: 'OpenAI GPT modelKey providerKey failureCode informationGaps',
      }),
    );
    const text = fixture.nativeElement.textContent;
    expect(text).toContain(heading);
    expect(text).toContain(copy);
    expect(text).toContain('AMBER result');
    expect(text).toContain('Deterministic safety guidance');
    expect(text).toContain('Backend selected next action');
    expect(text).not.toMatch(/OpenAI|GPT|modelKey|providerKey|failureCode|informationGaps/);
    fixture.destroy();
  });
  it.each(['PENDING', 'PROCESSING'])(
    'polls bounded asynchronous state for %s and stops on completion',
    async (status) => {
      vi.useFakeTimers();
      const pending = base({ required: true, status, humanReviewRecommended: false });
      const completed = base({
        required: true,
        status: 'COMPLETED',
        humanReviewRecommended: false,
      });
      const { fixture, api, setCurrent } = await setup(pending);
      setCurrent(completed);
      await vi.advanceTimersByTimeAsync(5_000);
      fixture.detectChanges();
      expect(api.get).toHaveBeenCalledTimes(2);
      expect(fixture.nativeElement.textContent).toContain('Additional review complete');
      await vi.advanceTimersByTimeAsync(10_000);
      expect(api.get).toHaveBeenCalledTimes(2);
      fixture.destroy();
    },
  );
  it.each(['COMPLETED', 'FAILED'])('does not poll terminal %s analysis', async (status) => {
    vi.useFakeTimers();
    const { fixture, api } = await setup(
      base({ required: true, status, humanReviewRecommended: false }),
    );
    await vi.advanceTimersByTimeAsync(10_000);
    expect(api.get).toHaveBeenCalledTimes(1);
    fixture.destroy();
  });
  it('stops polling when the component is destroyed', async () => {
    vi.useFakeTimers();
    const { fixture, api } = await setup(
      base({ required: true, status: 'PENDING', humanReviewRecommended: false }),
    );
    fixture.destroy();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(api.get).toHaveBeenCalledTimes(1);
  });
  it.each(['GREEN', 'RED'])(
    'does not poll %s without required analysis',
    async (classification) => {
      vi.useFakeTimers();
      const { fixture, api } = await setup(
        base({ required: false, status: 'PENDING', humanReviewRecommended: false }, classification),
      );
      await vi.advanceTimersByTimeAsync(10_000);
      expect(api.get).toHaveBeenCalledTimes(1);
      expect(fixture.nativeElement.textContent).toContain(`${classification} result`);
      fixture.destroy();
    },
  );
});

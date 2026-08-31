import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { GuidedSelfCheckOperationsApiService } from '../../core/services/guided-self-check-operations-api.service';
import { GuidedSelfCheckAnalysisDetailPageComponent } from './guided-self-check-analysis-detail-page.component';
describe('GuidedSelfCheckAnalysisDetailPageComponent', () => {
  it('renders structured decision support while classification remains AMBER and never shows raw prompts', async () => {
    const analysis: any = {
      reference: 'SC-GSCA-1',
      selfCheckReference: 'SC-GSC-1',
      classification: 'AMBER',
      status: 'COMPLETED',
      output: {
        conciseSummary: 'Internal structured summary',
        notableResponses: ['Reported symptom'],
        inconsistencies: [],
        informationGaps: ['Recent measurement'],
        suggestedOperationalPriority: 'ELEVATED',
        humanReviewSuggested: true,
        safeReasonCodes: [],
        recommendedAction: 'FIND_CARE',
        escalationSuggested: false,
      },
      providerKey: 'internal-ai',
      modelKey: 'governed',
      failureCode: null,
      createdAt: '2026-01-01',
      completedAt: '2026-01-01',
    };
    const api = { analysis: vi.fn(() => of(analysis)), processAnalysis: vi.fn(() => of(analysis)) };
    await TestBed.configureTestingModule({
      imports: [GuidedSelfCheckAnalysisDetailPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => analysis.reference } } },
        },
        { provide: GuidedSelfCheckOperationsApiService, useValue: api },
      ],
    }).compileComponents();
    const f = TestBed.createComponent(GuidedSelfCheckAnalysisDetailPageComponent);
    f.detectChanges();
    const text = f.nativeElement.textContent;
    expect(text).toContain('Classification remains AMBER');
    expect(text).toContain('AI-generated decision support');
    expect(text).toContain('Find Care');
    expect(text).not.toContain('systemInstructions');
    expect(text).not.toContain('medical conclusion');
    expect(text).not.toContain('Provider reviewer');
  });
});

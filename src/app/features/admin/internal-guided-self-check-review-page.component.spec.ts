import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { GuidedSelfCheckOperationsApiService } from '../../core/services/guided-self-check-operations-api.service';
import { InternalGuidedSelfCheckReviewPageComponent } from './internal-guided-self-check-review-page.component';
describe('InternalGuidedSelfCheckReviewPageComponent', () => {
  const detail: any = {
    reference: 'SC-GSCR-1',
    selfCheckReference: 'SC-GSC-1',
    reviewModel: 'INTERNAL_URGENT',
    classification: 'RED',
    priority: 'URGENT',
    status: 'IN_REVIEW',
    questionnaireCompletedAt: '2026-01-01',
    acknowledgedAt: '2026-01-01',
    assignedProfessional: {
      reference: 'SC-ICP-1',
      displayName: 'Dr Ada',
      professionalType: 'DOCTOR',
    },
    assignedAt: '2026-01-01',
    createdAt: '2026-01-01',
    origin: 'CLASSIFICATION_REQUIRED',
    matchedReasonCodes: [],
    urgentAction: true,
    startedAt: '2026-01-01',
    completedAt: null,
    cancelledAt: null,
    decision: null,
    patientGuidance: null,
    internalClinicalNote: null,
    contactRequired: false,
    contactStatus: 'NOT_REQUIRED',
    contactedAt: null,
    history: [],
    nextAction: null,
    allowedNextActionsByDecision: {
      NO_FURTHER_REVIEW_REQUIRED: ['SEEK_URGENT_ASSESSMENT'],
      FOLLOW_UP_RECOMMENDED: ['FIND_CARE', 'BOOK_ESSENTIAL_CHECK'],
      PATIENT_CONTACT_REQUIRED: ['REQUEST_PROFESSIONAL_CONTACT'],
      URGENT_ESCALATION_CONFIRMED: ['SEEK_URGENT_ASSESSMENT', 'FIND_CARE'],
    },
    questionnaire: {
      version: 1,
      groups: [
        {
          key: 'health',
          title: 'Health',
          sortOrder: 1,
          questions: [
            {
              key: 'symptom',
              text: 'How do you feel?',
              type: 'SHORT_TEXT',
              sortOrder: 1,
              answer: {
                state: 'KNOWN',
                value: 'Unwell',
                provenance: 'PATIENT',
                updatedAt: '2026-01-01',
              },
            },
          ],
        },
      ],
    },
  };
  it('keeps RED guidance separate and uses backend action compatibility with purposeful form copy', async () => {
    const api = {
      internalReview: vi.fn(() => of(detail)),
      startReview: vi.fn(() => of(detail)),
      completeReview: vi.fn(() => of(detail)),
    };
    await TestBed.configureTestingModule({
      imports: [InternalGuidedSelfCheckReviewPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => detail.reference } } },
        },
        { provide: GuidedSelfCheckOperationsApiService, useValue: api },
      ],
    }).compileComponents();
    const f = TestBed.createComponent(InternalGuidedSelfCheckReviewPageComponent);
    f.detectChanges();
    const c = f.componentInstance;
    c.decision = 'FOLLOW_UP_RECOMMENDED';
    f.detectChanges();
    const text = f.nativeElement.textContent;
    expect(text).toContain('Original Self-Check safety guidance');
    expect(text).toContain('Recommended next action');
    expect(c.allowedActions()).toContain('FIND_CARE');
    expect(
      f.nativeElement.querySelector(
        'textarea[placeholder="Explain the recommended next step clearly for the patient"]',
      ),
    ).not.toBeNull();
    expect(
      f.nativeElement.querySelector(
        'textarea[placeholder="Add context for the SmartClinic clinical team only"]',
      ),
    ).not.toBeNull();
    expect(text).not.toContain('Provider reviewer');
  });
});

import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { GuidedSelfCheckGovernanceApiService } from '../../core/services/guided-self-check-governance-api.service';
import { GuidedSelfCheckRulesetDetailPageComponent } from './guided-self-check-ruleset-detail-page.component';

describe('GuidedSelfCheckRulesetDetailPageComponent content modes', () => {
  const metadata: any = {
    operators: ['STATE_EQUALS', 'EQUALS', 'AND', 'OR'],
    operatorCompatibility: { STATE_EQUALS: ['BOOLEAN'], EQUALS: ['BOOLEAN'], AND: [], OR: [] },
    validationLimits: {
      maxRules: 200,
      maxConditionDepth: 8,
      maxGroupBranches: 20,
      rulesetNameMaxLength: 140,
      rulesetDescriptionMaxLength: 2000,
      ruleCodeMinLength: 3,
      ruleCodeMaxLength: 100,
      governanceNoteMaxLength: 1000,
      maxSimulationAnswers: 300,
    },
    patientMessages: [
      { key: 'GREEN_KEY', title: 'Green title', message: 'Green message' },
      { key: 'AMBER_KEY', title: 'Amber title', message: 'Amber message' },
      { key: 'RED_KEY', title: 'Red title', message: 'Red message' },
    ],
    severities: ['AMBER', 'RED'],
  };
  const questionnaire: any = {
    groups: [
      {
        key: 'g',
        title: 'Group',
        questions: [
          {
            key: 'question_key',
            text: 'Resolved questionnaire question',
            type: 'BOOLEAN',
            options: [],
            supportedAnswerStates: ['KNOWN'],
          },
        ],
      },
    ],
  };
  const actions = (edit: boolean) => ({
    edit,
    validate: true,
    simulate: true,
    submitForReview: edit,
    approve: false,
    markReady: false,
    activate: false,
    retire: true,
  });
  const detail = (status: string, edit = false, active = false): any => ({
    reference: 'SC-GCRS-ONE',
    version: 1,
    name: 'Governed rules',
    description: 'Persisted description',
    questionnaireVersion: 2,
    governanceStatus: status,
    isActive: active,
    ruleCount: 1,
    contentHash: 'a'.repeat(64),
    approvedContentHash: 'a'.repeat(64),
    approvalState: 'APPROVED',
    readiness: {
      statusReady: status === 'READY',
      approvalHashMatches: true,
      contentHashValid: true,
      classificationReady: active,
    },
    approvedAt: null,
    activatedAt: null,
    retiredAt: null,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    allowedActions: actions(edit),
    patientMessageKeys: { green: 'GREEN_KEY', amber: 'AMBER_KEY', red: 'RED_KEY' },
    rules: [
      {
        code: 'RULE_CODE',
        severity: 'AMBER',
        condition: { operator: 'EQUALS', questionKey: 'question_key', value: true },
      },
    ],
    audit: [],
  });
  async function setup(record: any) {
    const api = {
      ruleset: vi.fn(() => of(record)),
      metadata: vi.fn(() => of(metadata)),
      questionnaire: vi.fn(() => of(questionnaire)),
      validate: vi.fn(),
      simulate: vi.fn(),
      update: vi.fn(),
      transition: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [GuidedSelfCheckRulesetDetailPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'SC-GCRS-ONE' } } },
        },
        { provide: GuidedSelfCheckGovernanceApiService, useValue: api },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(GuidedSelfCheckRulesetDetailPageComponent);
    fixture.detectChanges();
    return fixture;
  }
  it('keeps DRAFT editable and does not substitute the immutable viewer', async () => {
    const f = await setup(detail('DRAFT', true));
    const text = f.nativeElement.textContent;
    expect(text).toContain('Draft content');
    expect(text).toContain('Add rule');
    expect(text).toContain('Save Draft');
    expect(f.nativeElement.querySelector('input[placeholder="CLINICAL_RULE_CODE"]')).not.toBeNull();
    expect(text).not.toContain('Immutable governed content');
  });
  it('renders READY active governed content fully read-only', async () => {
    const f = await setup(detail('READY', false, true));
    const text = f.nativeElement.textContent;
    expect(text).toContain('Ruleset content');
    expect(text).toContain('Active for new compatible Self-Checks');
    expect(text).toContain('Persisted description');
    expect(text).toContain('Version 2');
    expect(text).toContain('RULE_CODE');
    expect(text).toContain('Resolved questionnaire question');
    expect(text).toContain('Green title');
    expect(text).toContain('Amber title');
    expect(text).toContain('Red title');
    expect(text).not.toContain('Add rule');
    expect(text).not.toContain('Remove rule');
    expect(text).not.toContain('Save Draft');
    expect(f.nativeElement.querySelector('section input, section select')).toBeNull();
  });
  it('keeps RETIRED historical rules inspectable', async () => {
    const f = await setup(detail('RETIRED'));
    const text = f.nativeElement.textContent;
    expect(text).toContain('Ruleset content');
    expect(text).toContain('RULE_CODE');
    expect(text).toContain('Resolved questionnaire question');
    expect(text).toContain('Green message');
  });
});

import { TestBed } from '@angular/core/testing';
import { GovernanceConditionBuilderComponent } from './governance-condition-builder.component';
describe('GovernanceConditionBuilderComponent', () => {
  it('uses questionnaire choices and metadata compatibility without clinical defaults', async () => {
    await TestBed.configureTestingModule({
      imports: [GovernanceConditionBuilderComponent],
    }).compileComponents();
    const f = TestBed.createComponent(GovernanceConditionBuilderComponent);
    const c = f.componentInstance;
    c.metadata = {
      operators: ['STATE_EQUALS', 'EQUALS', 'INCLUDES', 'GT', 'AND', 'OR'],
      operatorCompatibility: {
        STATE_EQUALS: ['MULTI_CHOICE'],
        EQUALS: [],
        INCLUDES: ['MULTI_CHOICE'],
        GT: [],
        AND: [],
        OR: [],
      },
      validationLimits: { maxConditionDepth: 8, maxGroupBranches: 20 },
      severities: ['AMBER', 'RED'],
    } as any;
    c.questionnaire = {
      version: 1,
      schemaVersion: '1',
      isActive: true,
      groups: [
        {
          key: 'g',
          title: 'History',
          helperText: null,
          sortOrder: 1,
          questions: [
            {
              key: 'q',
              text: 'Configured question',
              helperText: null,
              type: 'MULTI_CHOICE',
              required: false,
              allowsDontKnow: true,
              supportedAnswerStates: ['KNOWN', 'DONT_KNOW'],
              options: ['BACKEND_OPTION'],
              measurementTargets: [],
              measurementMetadata: null,
              validationMetadata: null,
              sortOrder: 1,
            },
          ],
        },
      ],
    };
    c.condition = { operator: 'INCLUDES', questionKey: 'q' };
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Configured question');
    expect(f.nativeElement.textContent).toContain('Backend Option');
    expect(c.operators()).toContain('INCLUDES');
    expect(c.operators()).not.toContain('GT');
    expect(f.nativeElement.querySelector('input[type="number"]')).toBeNull();
    expect(f.nativeElement.textContent).not.toMatch(/blood pressure.*[><]\s*\d/i);
  });
  it('enforces metadata branch and depth limits only as UX constraints', async () => {
    await TestBed.configureTestingModule({
      imports: [GovernanceConditionBuilderComponent],
    }).compileComponents();
    const f = TestBed.createComponent(GovernanceConditionBuilderComponent);
    const c = f.componentInstance;
    c.metadata = {
      operators: ['AND', 'OR'],
      operatorCompatibility: { AND: [], OR: [] },
      validationLimits: { maxConditionDepth: 1, maxGroupBranches: 1 },
    } as any;
    c.questionnaire = { groups: [] } as any;
    c.condition = { operator: 'AND', conditions: [{ operator: 'OR', conditions: [] }] };
    c.depth = 1;
    expect(c.canAddChild()).toBe(false);
  });
});

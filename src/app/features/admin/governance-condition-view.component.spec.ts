import { TestBed } from '@angular/core/testing';
import { GovernanceConditionViewComponent } from './governance-condition-view.component';

describe('GovernanceConditionViewComponent', () => {
  const questionnaire: any = {
    groups: [{ questions: [{ key: 'known_question', text: 'Authoritative question text' }] }],
  };
  async function render(condition: any, metadata = questionnaire) {
    await TestBed.configureTestingModule({
      imports: [GovernanceConditionViewComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(GovernanceConditionViewComponent);
    fixture.componentInstance.condition = condition;
    fixture.componentInstance.questionnaire = metadata;
    fixture.detectChanges();
    return fixture.nativeElement.textContent as string;
  }
  it('renders EQUALS and resolves authoritative question text with stable key', async () => {
    const text = await render({ operator: 'EQUALS', questionKey: 'known_question', value: true });
    expect(text).toContain('Authoritative question text');
    expect(text).toContain('known_question');
    expect(text).toContain('Equals');
    expect(text).toContain('Yes');
  });
  it('renders STATE_EQUALS and preserves answer state', async () => {
    const text = await render({
      operator: 'STATE_EQUALS',
      questionKey: 'known_question',
      state: 'DONT_KNOW',
    });
    expect(text).toContain('State Equals');
    expect(text).toContain('Dont Know');
  });
  it('renders numeric measurement and BETWEEN operands', async () => {
    let text = await render({
      operator: 'GTE',
      questionKey: 'known_question',
      field: 'systolic',
      value: 123,
    });
    expect(text).toContain('Systolic');
    expect(text).toContain('123');
    TestBed.resetTestingModule();
    text = await render({
      operator: 'BETWEEN',
      questionKey: 'known_question',
      field: 'value',
      min: 1,
      max: 9,
    });
    expect(text).toContain('Minimum 1');
    expect(text).toContain('Maximum 9');
  });
  it('renders nested AND/OR recursively without losing leaf content', async () => {
    const text = await render({
      operator: 'AND',
      conditions: [
        { operator: 'OR', conditions: [{ operator: 'UNANSWERED', questionKey: 'known_question' }] },
      ],
    });
    expect(text).toContain('ALL conditions (AND)');
    expect(text).toContain('ANY condition (OR)');
    expect(text).toContain('Unanswered');
    expect(text).toContain('Authoritative question text');
  });
  it('falls back to the stable key when questionnaire metadata is missing', async () => {
    const text = await render(
      { operator: 'EQUALS', questionKey: 'persisted_unknown_key', value: 'PERSISTED_VALUE' },
      { groups: [] },
    );
    expect(text).toContain('persisted_unknown_key');
    expect(text).toContain('PERSISTED_VALUE');
  });
});

import { TestBed } from '@angular/core/testing';
import { SpecialistReferralNoteComponent } from './specialist-referral-note.component';

describe('SpecialistReferralNoteComponent', () => {
  async function setup(plan = '') {
    await TestBed.configureTestingModule({ imports: [SpecialistReferralNoteComponent] }).compileComponents();
    const fixture = TestBed.createComponent(SpecialistReferralNoteComponent);
    fixture.componentRef.setInput('plan', plan);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const changed = vi.fn();
    component.planChange.subscribe(changed);
    return { fixture, component, changed };
  }
  it('offers ENT and preserves the existing plan when adding a referral note', async () => {
    const { fixture, component, changed } = await setup('Existing care plan');
    expect(fixture.nativeElement.querySelector('option[value="ENT (Ear, nose and throat)"]')).not.toBeNull();
    component.form.setValue({ specialty: 'ENT (Ear, nose and throat)', destination: 'Test hospital', reason: 'Specialist review requested', nextSteps: 'Contact the clinic to arrange a visit' });
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(changed).toHaveBeenCalledWith('Existing care plan\n\nSpecialist referral note\nSpecialty: ENT (Ear, nose and throat)\nDestination: Test hospital\nReason: Specialist review requested\nTiming and next steps: Contact the clinic to arrange a visit');
    expect(component.feedback()).toContain('No referral has been sent');
    expect(component.form.controls.reason.value).toBe('');
    component.add();
    expect(changed).toHaveBeenCalledTimes(1);
  });
  it('allows a specialty outside the suggestions and rejects whitespace-only required fields', async () => {
    const { component, changed } = await setup();
    component.form.patchValue({ specialty: ' ', reason: 'Review' }); component.add();
    expect(changed).not.toHaveBeenCalled();
    component.form.patchValue({ specialty: 'Other specialist service' }); component.add();
    expect(changed).toHaveBeenCalledWith(expect.stringContaining('Specialty: Other specialist service'));
  });
  it('preserves inputs when the combined plan is too long', async () => {
    const { component, changed } = await setup('x'.repeat(9990));
    component.form.patchValue({ specialty: 'ENT', reason: 'Review' }); component.add();
    expect(changed).not.toHaveBeenCalled();
    expect(component.error()).toContain('10,000');
    expect(component.form.controls.reason.value).toBe('Review');
  });
  it('cannot change the plan while the record is saving', async () => {
    const { fixture, component, changed } = await setup();
    fixture.componentRef.setInput('disabled', true); fixture.detectChanges();
    component.form.patchValue({ specialty: 'ENT', reason: 'Review' }); component.add();
    expect(changed).not.toHaveBeenCalled();
    expect((fixture.nativeElement.querySelector('button') as HTMLButtonElement).disabled).toBe(true);
  });
});

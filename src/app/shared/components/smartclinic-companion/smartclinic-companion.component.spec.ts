import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SmartClinicCompanionComponent } from './smartclinic-companion.component';

describe('SmartClinicCompanionComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [SmartClinicCompanionComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('offers an optional guide introduction on first use', () => {
    const fixture = TestBed.createComponent(SmartClinicCompanionComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.guide__panel')).toBeNull();
    expect(fixture.nativeElement.querySelector('.guide__teaser').textContent).toContain('Not now');

    fixture.componentInstance.toggle();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Choose a friendly guide');
    expect(fixture.nativeElement.querySelector('.guide__teaser')).toBeNull();
  });

  it('explains the three main patient journeys', () => {
    const fixture = TestBed.createComponent(SmartClinicCompanionComponent);
    const component = fixture.componentInstance;
    component.finishIntroduction();
    component.explain('find-care');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Find Care helps when something is worrying you');
    const link = fixture.nativeElement.querySelector('.guide__answer a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/login?returnUrl=%2Fme%2Frequest-care');
  });

  it('keeps the voice control prominent and enables automatic speech by default', () => {
    const fixture = TestBed.createComponent(SmartClinicCompanionComponent);
    const component = fixture.componentInstance;
    component.finishIntroduction();
    fixture.detectChanges();

    expect(component.preferences().autoSpeak).toBe(true);
    if (component.supportsSpeech) {
      expect(fixture.nativeElement.querySelector('.guide__hear')).not.toBeNull();
    }
  });

  it('does not attempt to answer urgent symptoms as routine guidance', () => {
    const fixture = TestBed.createComponent(SmartClinicCompanionComponent);
    const component = fixture.componentInstance;
    component.finishIntroduction();
    component.query.set('I have chest pain');
    component.ask();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Get urgent help now');
    expect(fixture.nativeElement.textContent).toContain('not an emergency service');
  });

  it('routes test questions to Tests & Referrals instead of Stay Well', () => {
    const fixture = TestBed.createComponent(SmartClinicCompanionComponent);
    const component = fixture.componentInstance;
    component.finishIntroduction();
    component.query.set('How do I request a test?');
    component.ask();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('To request a test, scan, or medicine');
    expect(fixture.nativeElement.textContent).not.toContain('Stay Well helps you understand your health');
    const link = fixture.nativeElement.querySelector('.guide__answer a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/login?returnUrl=%2Fme%2Forders');
  });
});

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

    expect(fixture.nativeElement.textContent).toContain('Choose a friendly guide');
    expect(fixture.nativeElement.textContent).toContain('Not now');
  });

  it('explains the three main patient journeys', () => {
    const fixture = TestBed.createComponent(SmartClinicCompanionComponent);
    const component = fixture.componentInstance;
    component.finishIntroduction();
    component.explain('find-care');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Tell SmartClinic what you need help with');
    const link = fixture.nativeElement.querySelector('.guide__answer a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/login?returnUrl=%2Fme%2Frequest-care');
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
});

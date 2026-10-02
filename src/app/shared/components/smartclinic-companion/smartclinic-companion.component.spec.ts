import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { CompanionApiService } from '../../../core/services/companion-api.service';
import { LocalePreferencesService } from '../../../core/services/locale-preferences.service';
import { SmartClinicCompanionComponent } from './smartclinic-companion.component';

describe('SmartClinicCompanionComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    // Don't depend on the test machine's time zone.
    localStorage.setItem('smartclinic-locale-v1', JSON.stringify({ market: 'NG', language: 'en', source: 'chosen' }));
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

  it('tucks the launcher away while the patient types in a page form', () => {
    const fixture = TestBed.createComponent(SmartClinicCompanionComponent);
    fixture.componentInstance.skipIntroduction();
    fixture.detectChanges();
    const input = document.createElement('input');
    document.body.appendChild(input);

    input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.guide').classList).toContain('guide--tucked');

    input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.guide').classList).not.toContain('guide--tucked');
    input.remove();
  });

  describe('languages and voice', () => {
    function setup(capabilities: { answers: boolean; voices: Record<string, boolean> }, ask = vi.fn(), speech = vi.fn()) {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [SmartClinicCompanionComponent],
        providers: [provideRouter([]), { provide: CompanionApiService, useValue: { capabilities: () => of(capabilities), ask, speech } }],
      });
      const fixture = TestBed.createComponent(SmartClinicCompanionComponent);
      const component = fixture.componentInstance;
      component.finishIntroduction();
      fixture.detectChanges();
      return { fixture, component, ask, speech, locale: TestBed.inject(LocalePreferencesService) };
    }

    it('greets in the chosen language and answers there when smart answers are on', () => {
      const ask = vi.fn(() => of({ title: 'Wá dókítà', body: 'Tẹ Find Care.', route: '/me/request-care', action: 'Ṣí i', urgent: false, language: 'yo' }));
      const { fixture, component, locale } = setup({ answers: true, voices: {} }, ask);
      locale.choose('NG', 'yo');
      component.query.set('Báwo ni mo ṣe lè rí dókítà?');
      component.ask();
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.guide__message')!.textContent).toContain('Ẹ n lẹ');
      expect(ask).toHaveBeenCalledWith(expect.objectContaining({ language: 'yo', character: 'ayo', question: 'Báwo ni mo ṣe lè rí dókítà?', country: 'NG' }));
      expect(el.querySelector('.guide__answer')!.textContent).toContain('Wá dókítà');
      expect(el.querySelector('.guide__answer')!.getAttribute('lang')).toBe('yo');
    });

    it('is honest when it can only answer in English', () => {
      const { fixture, component, locale } = setup({ answers: false, voices: {} });
      locale.choose('NG', 'ha');
      component.explain('find-care');
      fixture.detectChanges();
      const bubble = (fixture.nativeElement as HTMLElement).querySelector('.guide__answer')!;
      expect(bubble.textContent).toContain('Find Care helps');
      expect(bubble.textContent).toContain('only show this in English right now, not Hausa');
      expect(bubble.getAttribute('lang')).toBe('en');
    });

    it('answers emergencies instantly in the chosen language, with a call button', () => {
      const ask = vi.fn();
      const { fixture, component, locale } = setup({ answers: true, voices: {} }, ask);
      locale.choose('RW', 'fr');
      component.query.set("J'ai une douleur thoracique");
      component.ask();
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(ask).not.toHaveBeenCalled();
      expect(el.querySelector('.guide__answer.is-urgent')!.textContent).toContain('112');
      expect(el.querySelector('a[href="tel:112"]')).not.toBeNull();
    });

    it('plays a natural voice from SmartClinic when one exists for the language', () => {
      const speech = vi.fn(() => of(new Blob([new Uint8Array([1])], { type: 'audio/mpeg' })));
      const play = vi.fn(() => Promise.resolve());
      const AudioStub = vi.fn(function (this: any) { this.play = play; this.pause = vi.fn(); });
      vi.stubGlobal('Audio', AudioStub);
      (URL as any).createObjectURL ??= () => 'blob:x';
      (URL as any).revokeObjectURL ??= () => undefined;
      const { component, locale } = setup({ answers: false, voices: { sw: true } }, vi.fn(), speech);
      locale.choose('RW', 'sw');
      component.readAloud();
      expect(speech).toHaveBeenCalledWith(expect.stringContaining('Habari'), 'sw', 'ayo', 'RW');
      expect(play).toHaveBeenCalled();
      vi.unstubAllGlobals();
    });

    it('never falls back to a robotic voice: it says the words are on screen instead', () => {
      const { fixture, component, locale } = setup({ answers: false, voices: {} });
      locale.choose('RW', 'rw');
      component.readAloud();
      fixture.detectChanges();
      expect((fixture.nativeElement as HTMLElement).querySelector('.guide__voice-note')!.textContent).toContain('Kinyarwanda voice isn’t ready yet');
    });

    it('always offers a real person', () => {
      const { fixture } = setup({ answers: false, voices: {} });
      expect((fixture.nativeElement as HTMLElement).querySelector('a.guide__person')!.getAttribute('href')).toBe('/help');
    });
  });
});

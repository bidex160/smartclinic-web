import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { LocalePreferencesService } from '../../../core/services/locale-preferences.service';
import { LanguageBarComponent } from './language-bar.component';

describe('LanguageBarComponent', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('offers the country’s languages in one tap, then goes away for good', () => {
    TestBed.configureTestingModule({ imports: [LanguageBarComponent] });
    const locale = TestBed.inject(LocalePreferencesService);
    locale.applyQuery('RW', 'rw');
    const f = TestBed.createComponent(LanguageBarComponent);
    f.detectChanges();
    const el = f.nativeElement as HTMLElement;
    expect(Array.from(el.querySelectorAll('[data-bar-language]')).map((b) => b.textContent?.trim())).toEqual(['Ikinyarwanda', 'English', 'Français', 'Kiswahili']);
    (el.querySelector('[data-bar-language="en"]') as HTMLButtonElement).click();
    f.detectChanges();
    expect(locale.language()).toBe('en');
    expect(el.querySelector('[data-language-bar]')).toBeNull();
    expect(JSON.parse(localStorage.getItem('smartclinic-locale-v1')!)).toMatchObject({ language: 'en', source: 'chosen' });
  });
});

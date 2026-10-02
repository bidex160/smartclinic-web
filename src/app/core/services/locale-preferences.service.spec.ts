import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { LocalePreferencesService, marketFromTimezone } from './locale-preferences.service';

describe('LocalePreferencesService', () => {
  beforeEach(() => localStorage.clear());
  const fresh = () => {
    TestBed.resetTestingModule();
    return TestBed.inject(LocalePreferencesService);
  };

  it('guesses the country from the phone clock', () => {
    expect(marketFromTimezone('Africa/Kigali')).toBe('RW');
    expect(marketFromTimezone('Africa/Accra')).toBe('GH');
    expect(marketFromTimezone('Africa/Lagos')).toBe('NG');
    expect(marketFromTimezone('Europe/London')).toBe('NG');
    expect(fresh().source()).toBe('clock');
  });

  it('lets the account country beat a guess, and the person’s own choice beat both', () => {
    const locale = fresh();
    locale.applyAccountCountry('RW');
    expect([locale.market(), locale.language(), locale.source()]).toEqual(['RW', 'en', 'account']); // English still fits Rwanda, so it stays
    locale.choose('GH', 'tw');
    locale.applyAccountCountry('NG');
    expect([locale.market(), locale.language()]).toEqual(['GH', 'tw']);
  });

  it('remembers choices across visits and keeps a language that fits the new country', () => {
    const locale = fresh();
    locale.choose('RW', 'fr');
    expect(fresh().language()).toBe('fr');
    const again = fresh();
    again.choose('NG');
    expect(again.language()).toBe('en');
    again.chooseLanguage('ha');
    again.choose('NG');
    expect(again.language()).toBe('ha');
  });

  it('takes country and language from links and lists local languages first', () => {
    const locale = fresh();
    locale.applyQuery('rw', 'sw');
    expect([locale.market(), locale.language()]).toEqual(['RW', 'sw']);
    expect(locale.languages().local.map((l) => l.code)).toEqual(['rw', 'en', 'fr', 'sw']);
    locale.applyQuery('XX', 'zz');
    expect(locale.market()).toBe('RW');
  });

  it('keeps Pidgin for people who chose it in the old guide', () => {
    localStorage.setItem('smartclinic-guide-preferences-v1', JSON.stringify({ language: 'pcm' }));
    expect(fresh().language()).toBe('pcm');
  });
});

import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

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

describe('localeFromDevice', () => {
  it('reads the country from the phone language region, and keeps one answer for everyone in it', async () => {
    const { localeFromDevice } = await import('./locale-preferences.service');
    expect(localeFromDevice(['en-RW'], 'Africa/Maputo')).toEqual({ market: 'RW', language: 'en', fromDevice: true });
    expect(localeFromDevice(['rw'], undefined)).toEqual({ market: 'RW', language: 'rw', fromDevice: true });
    expect(localeFromDevice(['fr-FR', 'en'], 'Africa/Kigali')).toEqual({ market: 'RW', language: 'fr', fromDevice: true });
    // A plain "en-US" phone in Kigali gets the country's main language; it's a guess, so we ask.
    expect(localeFromDevice(['en-US'], 'Africa/Kigali')).toEqual({ market: 'RW', language: 'en', fromDevice: false });
    expect(localeFromDevice([], 'Africa/Kigali')).toEqual({ market: 'RW', language: 'rw', fromDevice: false });
    expect(localeFromDevice(['yo-NG'], 'Europe/London')).toEqual({ market: 'NG', language: 'yo', fromDevice: true });
  });
});

describe('shared links and the language bar', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => { localStorage.clear(); TestBed.resetTestingModule(); });

  it('a shared link sets the sharer’s language for a new visitor, but never overrides a person’s own pick', () => {
    TestBed.resetTestingModule();
    const locale = TestBed.inject(LocalePreferencesService);
    expect(locale.guessed()).toBe(true);
    locale.applyQuery('RW', 'rw');
    expect([locale.market(), locale.language(), locale.source()]).toEqual(['RW', 'rw', 'link']);
    expect(locale.shareParams()).toBe('lang=rw&market=RW');
    locale.chooseLanguage('en');
    locale.applyQuery('RW', 'fr');
    expect([locale.language(), locale.source(), locale.guessed()]).toEqual(['en', 'chosen', false]);
  });

  it('keeps a guess when the person taps ✓, and the account language only replaces a guess', () => {
    TestBed.resetTestingModule();
    const locale = TestBed.inject(LocalePreferencesService);
    locale.applyAccountLanguage('sw');
    expect([locale.language(), locale.source()]).toEqual(['sw', 'account']);
    locale.confirm();
    expect(locale.guessed()).toBe(false);
    locale.applyAccountLanguage('yo');
    expect(locale.language()).toBe('sw');
  });
});

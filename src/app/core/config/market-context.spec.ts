import { requestedMarket, rwandaLocale, SMARTCLINIC_MARKETS } from './market-context';

describe('market context', () => {
  it('defines Rwanda without changing the global identity model', () => {
    expect(SMARTCLINIC_MARKETS.RW).toEqual({
      code: 'RW', countryName: 'Rwanda', callingCode: '+250', currency: 'RWF', timezone: 'Africa/Kigali',
    });
  });

  it('accepts only supported Rwanda locales and falls back to English', () => {
    expect(rwandaLocale('rw')).toBe('rw');
    expect(rwandaLocale('fr')).toBe('fr');
    expect(rwandaLocale('sw')).toBe('sw');
    expect(rwandaLocale('unsupported')).toBe('en');
    expect(requestedMarket('rw')).toBe('RW');
    expect(requestedMarket('KE')).toBe('NG');
  });
});

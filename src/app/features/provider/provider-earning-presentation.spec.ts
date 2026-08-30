import { earningSourceLabel, earningStatusLabel, formatCommissionBasisPoints, formatEarningMoney } from './provider-earning-presentation';

describe('Provider earning presentation', () => {
  it('formats integer minor units with ISO currency precision', () => {
    expect(formatEarningMoney(100000, 'NGN')).toContain('1,000.00');
    expect(formatEarningMoney(0, 'USD')).toContain('0.00');
    expect(formatEarningMoney(12345678900, 'USD')).toContain('123,456,789.00');
    expect(formatEarningMoney(1234, 'JPY')).toContain('1,234');
  });

  it('formats commission basis points without collapsing explicit zero', () => {
    expect(formatCommissionBasisPoints(0)).toBe('0%');
    expect(formatCommissionBasisPoints(750)).toBe('7.5%');
    expect(formatCommissionBasisPoints(1000)).toBe('10%');
  });

  it('uses accurate lifecycle labels and a future-safe source fallback', () => {
    expect(earningStatusLabel('HELD')).toBe('Held');
    expect(earningStatusLabel('PAYABLE')).toBe('Payable');
    expect(earningStatusLabel('SETTLED')).toBe('Settled');
    expect(earningStatusLabel('VOIDED')).toBe('Voided');
    expect(earningSourceLabel('PHARMACY_FULFILLMENT')).toBe('Pharmacy Fulfillment');
    expect(earningSourceLabel('NEW_SOURCE')).toBe('New Source');
  });
});

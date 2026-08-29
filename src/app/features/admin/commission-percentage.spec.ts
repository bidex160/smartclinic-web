import { basisPointsToPercentage, formatCommission, percentageToBasisPoints } from './commission-percentage';
describe('commission percentage conversion', () => {
  it.each([['10',1000],['7.5',750],['0',0],['100',10000],['0.01',1]] as const)('converts %s percent to exact basis points', (input, expected) => expect(percentageToBasisPoints(input)).toBe(expected));
  it.each(['-1','100.01','7.555','','NaN'])('rejects invalid percentage %s', input => expect(percentageToBasisPoints(input)).toBeNull());
  it('keeps unconfigured distinct from explicit zero', () => { expect(formatCommission(null)).toBe('Not configured'); expect(formatCommission(0)).toBe('0%'); expect(basisPointsToPercentage(750)).toBe('7.5'); });
});

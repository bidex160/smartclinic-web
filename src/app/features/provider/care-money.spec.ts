import { formatMinor, majorToMinor, minorToMajor } from './care-money';
describe('General Care money conversion', () => {
  it('converts major strings without floating-point multiplication', () => {
    expect(majorToMinor('15000.00', 'NGN')).toBe(1500000);
    expect(majorToMinor('3000', 'NGN')).toBe(300000);
    expect(minorToMajor('1500000', 'NGN')).toBe('15000.00');
    expect(formatMinor('1500000', 'NGN')).toContain('15,000');
  });
  it('rejects malformed, negative and excessive precision', () => {
    expect(majorToMinor('-1', 'NGN')).toBeNull();
    expect(majorToMinor('1.001', 'NGN')).toBeNull();
    expect(majorToMinor('abc', 'NGN')).toBeNull();
  });
});

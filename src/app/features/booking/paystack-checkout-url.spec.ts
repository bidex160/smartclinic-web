import { safePaystackCheckoutUrl } from './paystack-checkout-url';

describe('safePaystackCheckoutUrl', () => {
  it('accepts only the expected HTTPS Paystack checkout origin', () => {
    expect(safePaystackCheckoutUrl('https://checkout.paystack.com/pay/abc')).toBe(
      'https://checkout.paystack.com/pay/abc',
    );
    expect(safePaystackCheckoutUrl('http://checkout.paystack.com/pay/abc')).toBeNull();
    expect(safePaystackCheckoutUrl('javascript:alert(1)')).toBeNull();
    expect(safePaystackCheckoutUrl('data:text/html,unsafe')).toBeNull();
    expect(safePaystackCheckoutUrl('https://checkout.paystack.com.evil.test/pay/abc')).toBeNull();
    expect(safePaystackCheckoutUrl('not a URL')).toBeNull();
    expect(safePaystackCheckoutUrl(null)).toBeNull();
  });
});

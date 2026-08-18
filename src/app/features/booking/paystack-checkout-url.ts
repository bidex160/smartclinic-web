const PAYSTACK_CHECKOUT_HOST = 'checkout.paystack.com';

export function safePaystackCheckoutUrl(value: string | null): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== PAYSTACK_CHECKOUT_HOST) return null;
    return url.href;
  } catch {
    return null;
  }
}

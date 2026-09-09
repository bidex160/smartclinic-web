export type PaymentProvider = 'PAYSTACK' | 'OPAY';
export interface PaymentEmailRequest {
  readonly paymentEmail?: string;
  readonly paymentProvider?: PaymentProvider;
}

export interface ConnectedHospital {
  readonly hospitalCode: string;
  readonly name: string;
  readonly logo: string;
  readonly patientReference: string | null;
  readonly externalPatientReference: string | null;
}

export interface HospitalInvoiceItem {
  readonly itemReference: string;
  readonly description: string;
  readonly amount: string | null;
  readonly payable: boolean | null;
}

export interface HospitalInvoice {
  readonly hospital: ConnectedHospital;
  readonly patient: { readonly displayName: string | null; readonly externalReference: string };
  readonly reference: string | null;
  readonly date: string | null;
  readonly currency: string;
  readonly total: string | null;
  readonly outstanding: string | null;
  readonly items: readonly HospitalInvoiceItem[];
}

export interface HospitalBillPaymentItemRequest {
  readonly itemReference: string;
}

export interface HospitalBillPaymentInitializationRequest {
  readonly hospitalCode: string;
  readonly invoiceReference: string;
  readonly items: readonly HospitalBillPaymentItemRequest[];
  readonly paymentProvider?: 'PAYSTACK' | 'OPAY';
  readonly paymentEmail?: string;
}

export type HospitalBillPaymentStatus =
  | 'PENDING'
  | 'PAYMENT_RECEIVED_HOSPITAL_PENDING'
  | 'PAID'
  | 'FAILED';

export interface HospitalBillPaymentItem {
  readonly itemReference: string;
  readonly description: string;
  readonly amount: string;
}

export interface HospitalBillPayment {
  readonly reference: string;
  readonly hospitalCode: string;
  readonly invoiceReference: string;
  readonly amount: string;
  readonly currency: string;
  readonly status: HospitalBillPaymentStatus;
  readonly gatewayReference: string | null;
  readonly provider: 'PAYSTACK' | 'OPAY' | string | null;
  readonly checkoutUrl: string | null;
  readonly accessCode: string | null;
  readonly hospitalNotificationStatus: 'PENDING' | 'SENT' | 'FAILED' | string | null;
  readonly hospitalNotificationReference: string | null;
  readonly hospitalNotifiedAt: string | null;
  readonly items: readonly HospitalBillPaymentItem[];
}

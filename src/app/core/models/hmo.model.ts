export interface Hmo {
  id: string;
  name: string;
  code: string;
  verificationMethod: string;
  active: boolean;
}
export interface HmoPlan {
  id: string;
  hmoId: string;
  name: string;
  code: string;
  active: boolean;
  amountMinor: string | null;
  currency: string;
  billingPeriod: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | string;
  hmo?: Hmo;
}
export interface PatientHmoCoverage {
  id: string;
  patientId: string;
  hmoId: string;
  planId: string | null;
  memberId: string;
  policyNumber: string | null;
  memberType: 'PRINCIPAL' | 'DEPENDANT';
  employerOrganisation: string | null;
  validFrom: string | null;
  expiresAt: string | null;
  eligibilityStatus: 'UNVERIFIED' | 'ELIGIBLE' | 'INELIGIBLE' | 'EXPIRED' | 'PENDING';
  lastVerifiedAt: string | null;
  verificationReference: string | null;
  hmo?: Hmo;
  plan?: HmoPlan | null;
}
export interface HmoEnrollmentLead {
  id: string;
  patientId: string;
  userId: string;
  preferredHmoId: string | null;
  employerOrganisation: string | null;
  notes: string | null;
  status: 'NEW' | 'CONTACTED' | 'ENROLLED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  quotedAmountMinor?: string | null;
  quotedCurrency?: string | null;
  consentCapturedAt?: string | null;
  plan?: HmoPlan | null;
  preferredHmo?: Hmo | null;
  patient?: { patientReference: string; givenName: string; familyName: string; phone: string | null; email: string | null };
}
export interface HmoCase {
  reference: string;
  eligibilityStatus: string;
  eligibilityReference: string | null;
  coverage: PatientHmoCoverage;
  careRequest: any;
  hospitalProvider: any;
  createdAt: string;
}
export interface HmoFunnel {
  eligibility: number;
  authorization: number;
  careCompleted: number;
  claimsSubmitted: number;
  paid: number;
  reconciled: number;
  primedRevenueMinor: string;
}

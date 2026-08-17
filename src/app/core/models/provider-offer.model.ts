export type ProviderOfferStatus =
  'OFFERED' | 'ACCEPTED' | 'CONFIRMED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED';

export interface ProviderOfferCatalogueItem {
  readonly code: string;
  readonly name: string;
}

export interface ProviderOfferParticipant {
  readonly givenName: string;
  readonly familyName: string;
}

export interface ProviderOffer {
  readonly assignmentId: string;
  readonly status: ProviderOfferStatus;
  readonly offeredAt: string;
  readonly expiresAt: string | null;
  readonly respondedAt: string | null;
  readonly acceptedAt: string | null;
  readonly bookingReference: string;
  readonly healthCheckPackage: ProviderOfferCatalogueItem;
  readonly fulfilmentMode: ProviderOfferCatalogueItem;
  readonly participant: ProviderOfferParticipant;
  readonly preferredDate: string | null;
  readonly preferredTimeWindowStart: string | null;
  readonly preferredTimeWindowEnd: string | null;
  readonly preferredTimezone: string | null;
  readonly responseReason: string | null;
}

export interface DeclineProviderOfferRequest {
  readonly reason?: string;
}

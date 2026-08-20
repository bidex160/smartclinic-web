import { PublicBookingRelationship } from '../../core/models/public-booking.model';

export type ParticipantRelationship = PublicBookingRelationship;

export interface BookerDetails {
  readonly givenName: string;
  readonly familyName: string;
  readonly email: string;
  readonly phone: string;
}

export interface ParticipantDetails {
  readonly relationship: ParticipantRelationship;
  readonly givenName: string;
  readonly familyName: string;
  readonly dateOfBirth: string;
  readonly phone: string;
  readonly email: string;
}

export interface BookingPreferences {
  readonly preferredDate: string;
  readonly preferredTimeFrom: string;
  readonly preferredTimeTo: string;
  readonly preferredTimezone: string;
  readonly locationNote: string;
}

export interface BookingDetailsDraft {
  readonly booker: BookerDetails;
  readonly participant: ParticipantDetails;
  readonly preferences: BookingPreferences;
}

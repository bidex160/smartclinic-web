export type PartnerFacilityType = 'HOSPITAL' | 'PHARMACY' | 'LABORATORY' | 'RADIOLOGY';
export type PartnerFacilityReadiness = 'AVAILABLE_TO_JOIN' | 'JOINED' | 'FULLY_JOINED';
export interface PartnerFacilityDirectoryItem {
  id: string;
  sourceReference: string;
  displayName: string;
  facilityType: PartnerFacilityType;
  location: { city: string | null; stateOrRegion: string | null; countryCode: string };
  readiness: PartnerFacilityReadiness;
  providerReference: string | null;
  source: string;
  sourceVerifiedAt: string | null;
  availableForConnection: boolean;
}
export interface PartnerFacilityDirectoryPage {
  items: readonly PartnerFacilityDirectoryItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

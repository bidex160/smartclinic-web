export type DependantRelationshipType = 'MOTHER' | 'FATHER' | 'PARENT' | 'LEGAL_GUARDIAN' | 'CAREGIVER' | 'OTHER';
export interface DependantRelationship { readonly type: DependantRelationshipType; readonly role: string; readonly isPrimary: boolean; }
export interface Dependant { readonly patientReference: string; readonly firstName: string; readonly lastName: string; readonly displayName: string; readonly dateOfBirth: string; readonly countryCode: string; readonly stateOrRegion: string; readonly city: string; readonly relationship: DependantRelationship; }
export interface CreateDependantRequest { readonly firstName: string; readonly lastName: string; readonly dateOfBirth: string; readonly relationshipType: DependantRelationshipType; readonly countryCode: string; readonly stateOrRegion: string; readonly city: string; }
export interface DependantListResponse { readonly items: readonly Dependant[]; }
export type HealthCheckParticipantSelection = { readonly kind: 'SELF' } | { readonly kind: 'DEPENDANT'; readonly patientReference: string; readonly displayName: string };

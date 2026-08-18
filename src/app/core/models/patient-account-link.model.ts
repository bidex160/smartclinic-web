export interface PatientAccountLinkResponse {
  readonly linked: true;
  readonly patient: { readonly givenName: string; readonly familyName: string };
}

export interface LinkPatientFromResultRequest {
  readonly resultAccessToken: string;
}

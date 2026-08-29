import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_CONFIG } from '../config/api-config.token';
import { PatientProviderConnection, PatientProviderConnectionConfiguration, PatientProviderConnectionDirectoryItem, PatientProviderConnectionFundingAttempt, PatientProviderConnectionFundingResponse, PatientProviderConnectionPage, ProviderConnectionDecisionRequest, ProviderPatientConnection, StartExistingPatientLinkRequest, StartNewPatientRegistrationRequest, UpdatePatientProviderConnectionConfiguration } from '../models/patient-provider-connection.model';
@Injectable({providedIn:'root'})
export class PatientProviderConnectionsApiService {
 private readonly http=inject(HttpClient);private readonly base=inject(API_CONFIG).baseUrl;
 directory(q='',page=1,limit=10){let params=new HttpParams().set('page',page).set('limit',limit);if(q.trim())params=params.set('q',q.trim());return this.http.get<PatientProviderConnectionPage<PatientProviderConnectionDirectoryItem>>(`${this.base}/me/patient-provider-connection-providers`,{params});}
 listMine(page=1,limit=20){return this.http.get<PatientProviderConnectionPage<PatientProviderConnection>>(`${this.base}/me/patient-provider-connections`,{params:new HttpParams().set('page',page).set('limit',limit)});}
 getMine(ref:string){return this.http.get<PatientProviderConnection>(`${this.base}/me/patient-provider-connections/${encodeURIComponent(ref)}`);}
 startNew(body:StartNewPatientRegistrationRequest){return this.http.post<PatientProviderConnection>(`${this.base}/me/patient-provider-connections/new-registration`,body);}
 startExisting(body:StartExistingPatientLinkRequest){return this.http.post<PatientProviderConnection>(`${this.base}/me/patient-provider-connections/existing-link`,body);}
 resubmit(ref:string,externalPatientReference:string){return this.http.post<PatientProviderConnection>(`${this.me(ref)}/resubmit`,{externalPatientReference});}
 convert(ref:string){return this.http.post<PatientProviderConnection>(`${this.me(ref)}/convert-to-new-registration`,{consentAcknowledged:true});}
 cancel(ref:string){return this.http.post<PatientProviderConnection>(`${this.me(ref)}/cancel`,null);}
 funding(ref:string){return this.http.get<PatientProviderConnectionFundingResponse>(`${this.me(ref)}/funding`);}
 initializeFunding(ref:string){return this.http.post<PatientProviderConnectionFundingAttempt>(`${this.me(ref)}/funding/initialize`,null);}
 verifyFunding(ref:string){return this.http.post<PatientProviderConnectionFundingResponse>(`${this.me(ref)}/funding/verify-latest`,null);}
 getConfiguration(){return this.http.get<PatientProviderConnectionConfiguration>(`${this.base}/provider/patient-connections/configuration`);}
 updateConfiguration(body:UpdatePatientProviderConnectionConfiguration){return this.http.put<PatientProviderConnectionConfiguration>(`${this.base}/provider/patient-connections/configuration`,body);}
 listProvider(page=1,limit=20){return this.http.get<PatientProviderConnectionPage<ProviderPatientConnection>>(`${this.base}/provider/patient-connections`,{params:new HttpParams().set('page',page).set('limit',limit)});}
 getProvider(ref:string){return this.http.get<ProviderPatientConnection>(`${this.provider(ref)}`);}
 confirm(ref:string,body:ProviderConnectionDecisionRequest){return this.http.post<ProviderPatientConnection>(`${this.provider(ref)}/confirm`,body);}
 unable(ref:string,body:ProviderConnectionDecisionRequest={}){return this.http.post<ProviderPatientConnection>(`${this.provider(ref)}/unable-to-verify`,body);}
 reject(ref:string,body:ProviderConnectionDecisionRequest={}){return this.http.post<ProviderPatientConnection>(`${this.provider(ref)}/reject`,body);}
 private me(ref:string){return `${this.base}/me/patient-provider-connections/${encodeURIComponent(ref)}`;} private provider(ref:string){return `${this.base}/provider/patient-connections/${encodeURIComponent(ref)}`;}
}

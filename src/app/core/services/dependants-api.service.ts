import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_CONFIG } from '../config/api-config.token';
import { CreateDependantRequest, Dependant, DependantListResponse } from '../models/dependant.model';

@Injectable({ providedIn: 'root' })
export class DependantsApiService {
  private readonly http=inject(HttpClient); private readonly base=inject(API_CONFIG).baseUrl;
  getDependants(){return this.http.get<DependantListResponse>(`${this.base}/me/dependants`);}
  getDependant(patientReference:string){return this.http.get<Dependant>(`${this.base}/me/dependants/${encodeURIComponent(patientReference)}`);}
  createDependant(payload:CreateDependantRequest){return this.http.post<Dependant>(`${this.base}/me/dependants`,payload);}
}

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api-config.token';
import {
  AdminCareServiceDefinition,
  CreateAdminCareServiceDefinition,
  UpdateAdminCareServiceDefinition,
} from '../models/admin-care-service-definition.model';

@Injectable({ providedIn: 'root' })
export class AdminCareServicesApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${inject(API_CONFIG).baseUrl}/admin/care-service-definitions`;

  list(): Observable<readonly AdminCareServiceDefinition[]> {
    return this.http.get<readonly AdminCareServiceDefinition[]>(this.endpoint);
  }

  create(request: CreateAdminCareServiceDefinition): Observable<AdminCareServiceDefinition> {
    return this.http.post<AdminCareServiceDefinition>(this.endpoint, request);
  }

  update(
    id: string,
    request: UpdateAdminCareServiceDefinition,
  ): Observable<AdminCareServiceDefinition> {
    return this.http.patch<AdminCareServiceDefinition>(
      `${this.endpoint}/${encodeURIComponent(id)}`,
      request,
    );
  }
}

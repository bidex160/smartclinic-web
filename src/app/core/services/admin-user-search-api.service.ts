import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../config/api-config.token';
import { AdminUserSearchResponse } from '../models/admin-user-search.model';

@Injectable({ providedIn: 'root' })
export class AdminUserSearchApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${inject(API_CONFIG).baseUrl}/admin/users/search`;

  search(q: string, page = 1, limit = 20): Observable<AdminUserSearchResponse> {
    const params = new HttpParams().set('q', q).set('page', page).set('limit', limit);
    return this.http.get<AdminUserSearchResponse>(this.endpoint, { params });
  }
}

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../config/api-config.token';
import { CurrentUser, LoginRequest, LoginResponse } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiConfig.baseUrl}/auth/login`, request, {
      withCredentials: true,
    });
  }

  refresh(): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiConfig.baseUrl}/auth/refresh`, null, {
      withCredentials: true,
    });
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiConfig.baseUrl}/auth/logout`, null, {
      withCredentials: true,
    });
  }

  logoutAll(): Observable<void> {
    return this.http.post<void>(`${this.apiConfig.baseUrl}/auth/logout-all`, null, {
      withCredentials: true,
    });
  }

  getCurrentUser(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${this.apiConfig.baseUrl}/auth/me`);
  }
}

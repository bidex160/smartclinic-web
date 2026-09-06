import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../config/api-config.token';
import {
  CurrentUser,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiConfig.baseUrl}/auth/login`, request, {
      withCredentials: true,
    });
  }

  register(request: RegisterRequest): Observable<CurrentUser> {
    return this.http.post<CurrentUser>(`${this.apiConfig.baseUrl}/auth/register`, request);
  }
  forgotPassword(request: ForgotPasswordRequest): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(
      `${this.apiConfig.baseUrl}/auth/forgot-password`,
      request,
    );
  }
  resetPassword(request: ResetPasswordRequest): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(
      `${this.apiConfig.baseUrl}/auth/reset-password`,
      request,
    );
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

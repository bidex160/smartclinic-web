import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { API_CONFIG } from '../config/api-config.token';
import { AuthStateService } from '../services/auth-state.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authState = inject(AuthStateService);
  const apiConfig = inject(API_CONFIG);
  const router = inject(Router);
  const isApiRequest =
    request.url === apiConfig.baseUrl || request.url.startsWith(`${apiConfig.baseUrl}/`);
  const token = authState.accessToken();
  const authenticatedRequest =
    isApiRequest && token
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (isApiRequest && error instanceof HttpErrorResponse && error.status === 401) {
        authState.clear();
        void router.navigate(['/admin/login']);
      }
      return throwError(() => error);
    }),
  );
};

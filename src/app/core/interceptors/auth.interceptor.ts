import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { API_CONFIG } from '../config/api-config.token';
import { SKIP_AUTH_RETRY, SKIP_STAFF_AUTH } from '../config/http-context.tokens';
import { AuthStateService } from '../services/auth-state.service';
import { AuthSessionService } from '../services/auth-session.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authState = inject(AuthStateService);
  const apiConfig = inject(API_CONFIG);
  const authSession = inject(AuthSessionService);
  const isApiRequest =
    request.url === apiConfig.baseUrl || request.url.startsWith(`${apiConfig.baseUrl}/`);
  const token = authState.accessToken();
  const skipStaffAuth = request.context.get(SKIP_STAFF_AUTH);
  const sessionEndpoint = `${apiConfig.baseUrl}/auth/`;
  const isSessionRequest =
    request.url === `${sessionEndpoint}login` ||
    request.url === `${sessionEndpoint}refresh` ||
    request.url === `${sessionEndpoint}logout`;
  const authenticatedRequest =
    isApiRequest && token && !skipStaffAuth
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (
        isApiRequest &&
        !skipStaffAuth &&
        !isSessionRequest &&
        error instanceof HttpErrorResponse &&
        error.status === 401
      ) {
        return authSession.refreshSession().pipe(
          catchError((refreshError: unknown) => {
            authSession.handleRefreshFailure(refreshError);
            return throwError(() => refreshError);
          }),
          switchMap(() => {
            if (request.context.get(SKIP_AUTH_RETRY)) return throwError(() => error);
            const refreshedToken = authState.accessToken();
            const retry = refreshedToken
              ? request.clone({ setHeaders: { Authorization: `Bearer ${refreshedToken}` } })
              : request;
            return next(retry).pipe(
              catchError((retryError: unknown) => {
                if (retryError instanceof HttpErrorResponse && retryError.status === 401) {
                  authSession.handleRefreshFailure(retryError);
                }
                return throwError(() => retryError);
              }),
            );
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};

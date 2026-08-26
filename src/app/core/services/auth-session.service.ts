import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  catchError,
  finalize,
  firstValueFrom,
  map,
  Observable,
  of,
  shareReplay,
  tap,
  timeout,
} from 'rxjs';

import { LoginResponse } from '../models/auth.model';
import { AuthApiService } from './auth-api.service';
import { AuthStateService } from './auth-state.service';

const RESTORE_TIMEOUT_MS = 10_000;

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly authApi = inject(AuthApiService);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);
  private refreshInFlight: Observable<LoginResponse> | null = null;
  private startupAttempted = false;

  async restoreSession(): Promise<void> {
    if (this.startupAttempted) return this.authState.waitForInitialization();
    this.startupAttempted = true;
    try {
      await firstValueFrom(
        this.refreshSession().pipe(
          timeout(RESTORE_TIMEOUT_MS),
          catchError(() => of(null)),
        ),
      );
    } finally {
      this.authState.completeInitialization();
    }
  }

  refreshSession(): Observable<LoginResponse> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.authApi.refresh().pipe(
        tap((response) => this.authState.setSession(response)),
        finalize(() => (this.refreshInFlight = null)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.refreshInFlight;
  }

  logout(): Observable<boolean> {
    return this.endSession(this.authApi.logout());
  }

  logoutAll(): Observable<boolean> {
    return this.endSession(this.authApi.logoutAll());
  }

  handleRefreshFailure(error: unknown): void {
    this.authState.clear();
    void this.router.navigate(['/login']);
    if (!(error instanceof HttpErrorResponse && error.status === 401)) {
      this.authState.setError('Your session ended. Please sign in again.');
    }
  }

  private endSession(request: Observable<void>): Observable<boolean> {
    return request.pipe(
      map(() => true),
      catchError(() => of(false)),
      finalize(() => {
        this.authState.clear();
        void this.router.navigate(['/login']);
      }),
    );
  }
}

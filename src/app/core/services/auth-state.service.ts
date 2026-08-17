import { computed, Injectable, signal } from '@angular/core';

import { CurrentUser, LoginResponse } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly accessTokenState = signal<string | null>(null);
  private readonly currentUserState = signal<CurrentUser | null>(null);

  readonly accessToken = this.accessTokenState.asReadonly();
  readonly currentUser = this.currentUserState.asReadonly();
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly authenticated = computed(
    () => this.accessTokenState() !== null && this.currentUserState() !== null,
  );
  readonly canManagePricing = computed(() => {
    const roles = this.currentUserState()?.roles ?? [];
    return roles.includes('ADMIN') || roles.includes('OPERATIONS');
  });

  setSession(response: LoginResponse): void {
    this.accessTokenState.set(response.accessToken);
    this.currentUserState.set(response.user);
    this.error.set(null);
  }

  setError(message: string): void {
    this.error.set(message);
  }

  clear(): void {
    this.accessTokenState.set(null);
    this.currentUserState.set(null);
    this.loading.set(false);
    this.error.set(null);
  }
}

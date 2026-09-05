export type UserRole = 'USER' | 'ADMIN' | 'OPERATIONS' | 'PROVIDER';
export type UserStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'DEACTIVATED';

export interface CurrentUser {
  readonly id: string;
  readonly email: string | null;
  readonly displayName: string;
  readonly roles: UserRole[];
  readonly status: UserStatus;
}

export interface LoginRequest {
  readonly identifier: string;
  readonly password: string;
}

export interface LoginResponse {
  readonly accessToken: string;
  readonly user: CurrentUser;
}

export interface RegisterRequest {
  readonly givenName: string;
  readonly familyName: string;
  readonly email: string;
  readonly phone?: string;
  readonly password: string;
}

export type AuthSessionResponse = LoginResponse;

export type UserRole = 'USER' | 'ADMIN' | 'OPERATIONS' | 'PROVIDER';
export type UserStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'DEACTIVATED';

export interface CurrentUser {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly roles: UserRole[];
  readonly status: UserStatus;
}

export interface LoginRequest {
  readonly email: string;
  readonly password: string;
}

export interface LoginResponse {
  readonly accessToken: string;
  readonly user: CurrentUser;
}

export type AuthSessionResponse = LoginResponse;

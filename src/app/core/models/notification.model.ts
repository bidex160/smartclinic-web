import { UserRole } from './auth.model';

export type NotificationType =
  | 'CARE_REQUEST_ASSIGNED'
  | 'CARE_REQUEST_ACCEPTED'
  | 'CARE_REQUEST_DECLINED'
  | 'CARE_REQUEST_REASSIGNED'
  | 'CARE_REQUEST_CANCELLED'
  | 'CARE_APPOINTMENT_SCHEDULED'
  | 'CARE_APPOINTMENT_CANCELLED'
  | 'PROVIDER_ONBOARDING_SUBMITTED'
  | 'PROVIDER_APPROVED'
  | 'PROVIDER_REJECTED'
  | (string & {});

export type NotificationEntityType = 'CARE_REQUEST' | 'CARE_APPOINTMENT' | 'PROVIDER_PROFILE' | (string & {});
export type NotificationActionType = 'VIEW' | (string & {});

export interface Notification {
  readonly reference: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly entityType: NotificationEntityType;
  readonly entityReference: string;
  readonly actionType: NotificationActionType;
  readonly metadata: Record<string, unknown> | null;
  readonly readAt: string | null;
  readonly createdAt: string;
}

export interface NotificationPage {
  readonly items: readonly Notification[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface NotificationUnreadCountResponse {
  readonly unreadCount: number;
}

export interface NotificationListOptions {
  readonly page?: number;
  readonly limit?: number;
}

export type NotificationDestination = readonly [string, ...string[]];
export type NotificationUserRole = Extract<UserRole, 'USER' | 'PROVIDER'>;

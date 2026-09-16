import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_CONFIG } from '../config/api-config.token';
import { Notification, NotificationListOptions, NotificationPage, NotificationUnreadCountResponse } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_CONFIG, { optional: true })?.baseUrl ?? ''}/me/notifications`;
  list(options: NotificationListOptions = {}) { let params = new HttpParams(); if (options.page !== undefined) params = params.set('page', options.page); if (options.limit !== undefined) params = params.set('limit', options.limit); return this.http.get<NotificationPage>(this.base, { params }); }
  unreadCount() { return this.http.get<NotificationUnreadCountResponse>(`${this.base}/unread-count`); }
  markRead(reference: string) { return this.http.patch<Notification>(`${this.base}/${encodeURIComponent(reference)}/read`, null); }
  markAllRead() { return this.http.patch<NotificationUnreadCountResponse>(`${this.base}/read-all`, null); }
}

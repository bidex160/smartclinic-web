import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthStateService } from './auth-state.service';
import { Notification } from '../models/notification.model';
import { NotificationApiService } from './notifications-api.service';
import { NotificationsStateService } from './notifications-state.service';

const item = (reference: string, readAt: string | null = null): Notification => ({ reference, type: 'CARE_REQUEST_ASSIGNED', title: 'Title', message: 'Message', entityType: 'CARE_REQUEST', entityReference: 'CR-1', actionType: 'VIEW', metadata: null, readAt, createdAt: new Date().toISOString() });

describe('NotificationsStateService', () => {
  it('deduplicates live events, bounds latest rows, and only counts unread events', () => {
    const api = { unreadCount: () => of({ unreadCount: 0 }), list: () => of({ items: [], page: 1, limit: 6, total: 0, totalPages: 0 }), markRead: vi.fn(), markAllRead: vi.fn() };
    TestBed.configureTestingModule({ providers: [NotificationsStateService, { provide: NotificationApiService, useValue: api }] });
    const state = TestBed.inject(NotificationsStateService);
    expect(state.receiveRealtimeNotification(item('1'))).toBe(true);
    expect(state.receiveRealtimeNotification(item('1'))).toBe(false);
    expect(state.receiveRealtimeNotification(item('2', new Date().toISOString()))).toBe(false);
    for (let index = 3; index <= 9; index += 1) state.receiveRealtimeNotification(item(String(index)));
    expect(state.latest()).toHaveLength(6);
    expect(state.unreadCount()).toBe(8);
  });

  it('preserves unread state when marking a notification fails', () => {
    const api = { unreadCount: () => of({ unreadCount: 1 }), list: () => of({ items: [], page: 1, limit: 6, total: 0, totalPages: 0 }), markRead: () => throwError(() => new Error('offline')), markAllRead: vi.fn() };
    TestBed.configureTestingModule({ providers: [NotificationsStateService, { provide: NotificationApiService, useValue: api }] });
    const state = TestBed.inject(NotificationsStateService);
    state.receiveRealtimeNotification(item('1'));
    state.markRead(item('1')).subscribe({ error: () => undefined });
    expect(state.unreadCount()).toBe(1);
  });
});

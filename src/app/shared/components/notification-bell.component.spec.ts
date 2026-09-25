import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { AuthStateService } from '../../core/services/auth-state.service';
import { NotificationRealtimeService } from '../../core/services/notification-realtime.service';
import { NotificationsStateService } from '../../core/services/notifications-state.service';
import { NotificationNavigationService } from '../../core/services/notification-navigation.service';
import { NotificationBellComponent } from './notification-bell.component';

describe('NotificationBellComponent', () => {
  it('opens the notifications page on compact/mobile layouts', async () => {
    const navigate = vi.fn().mockResolvedValue(true);
    const closePanel = vi.fn();
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: vi.fn(() => ({ matches: true })) });

    await TestBed.configureTestingModule({
      imports: [NotificationBellComponent],
      providers: [
        provideRouter([]),
        { provide: Router, useValue: { navigate } },
        { provide: NotificationsStateService, useValue: {
          open: () => false, unreadCount: () => 6, markingAll: () => false,
          latestLoading: () => false, latestError: () => null, latest: () => [],
          activate: vi.fn(), closePanel, togglePanel: vi.fn(), markAllRead: vi.fn(),
          isMarking: () => false, markRead: vi.fn(),
        }},
        { provide: AuthStateService, useValue: {
          currentUser: () => ({ id: 'patient', roles: ['USER'] }),
          authenticated: () => true,
        }},
        { provide: NotificationRealtimeService, useValue: { start: vi.fn(), stop: vi.fn() } },
        { provide: NotificationNavigationService, useValue: { destination: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(NotificationBellComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

    expect(closePanel).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/me/notifications']);
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: originalMatchMedia });
  });
});

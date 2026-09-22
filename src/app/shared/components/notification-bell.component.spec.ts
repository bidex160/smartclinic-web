import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthStateService } from '../../core/services/auth-state.service';
import { NotificationNavigationService } from '../../core/services/notification-navigation.service';
import { NotificationRealtimeService } from '../../core/services/notification-realtime.service';
import { NotificationsStateService } from '../../core/services/notifications-state.service';
import { NotificationBellComponent } from './notification-bell.component';

describe('NotificationBellComponent accessibility', () => {
  async function setup() {
    const open = signal(false);
    const unreadCount = signal(10);
    const state = {
      open, unreadCount, activate: vi.fn(),
      togglePanel: () => open.update(value => !value),
      closePanel: () => open.set(false),
      markingAll: signal(false), latestLoading: signal(false),
      latestError: signal(null), latest: signal([]), markAllRead: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [NotificationBellComponent],
      providers: [
        provideRouter([]),
        { provide: NotificationsStateService, useValue: state },
        { provide: AuthStateService, useValue: { currentUser: () => null, authenticated: () => false } },
        { provide: NotificationNavigationService, useValue: {} },
        { provide: NotificationRealtimeService, useValue: { start: vi.fn(), stop: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(NotificationBellComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const bell = element.querySelector('button')!;
    return { fixture, element, bell, state };
  }

  it('exposes the unread count and expanded state without marking notifications read', async () => {
    const { fixture, element, bell, state } = await setup();
    expect(bell.getAttribute('aria-label')).toBe('Notifications, 10 unread');
    bell.click(); fixture.detectChanges();
    expect(bell.getAttribute('aria-expanded')).toBe('true');
    expect(element.querySelector('#notification-panel')?.textContent).toContain('No notifications yet');
    expect(state.markAllRead).not.toHaveBeenCalled();
    expect(state.unreadCount()).toBe(10);
  });

  it('closes on Escape and restores keyboard focus to the bell', async () => {
    const { fixture, element, bell } = await setup();
    bell.click(); fixture.detectChanges();
    (element.querySelector('[aria-label="Close notifications"]') as HTMLButtonElement).focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(element.querySelector('#notification-panel')).toBeNull();
    expect(document.activeElement).toBe(bell);
  });

  it('provides an explicit close button and dismisses on an outside click', async () => {
    const { fixture, element, bell, state } = await setup();
    bell.click(); fixture.detectChanges();
    (element.querySelector('[aria-label="Close notifications"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(state.open()).toBe(false);
    bell.click(); fixture.detectChanges();
    document.body.click(); fixture.detectChanges();
    expect(state.open()).toBe(false);
  });
});

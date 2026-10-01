import { Injectable, signal } from '@angular/core';

export type DeviceNotificationPermission = NotificationPermission | 'unsupported';

const DISMISSED_KEY = 'smartclinic-device-reminders-dismissed-v1';

/**
 * Mirrors in-app SmartClinic notifications (such as daily routine reminders)
 * as system notifications while the app is open in a background tab.
 *
 * Reminders when the app is fully closed need Web Push from the API; this
 * service deliberately does not pretend to provide that.
 */
@Injectable({ providedIn: 'root' })
export class DeviceNotificationsService {
  readonly permission = signal<DeviceNotificationPermission>(this.readPermission());
  readonly dismissed = signal(this.readDismissed());

  /** True when it is worth offering the "turn on reminders" prompt. */
  canOffer(): boolean {
    return this.permission() === 'default' && !this.dismissed();
  }

  async enable(): Promise<DeviceNotificationPermission> {
    if (!this.supported()) return 'unsupported';
    try {
      const result = await Notification.requestPermission();
      this.permission.set(result);
      return result;
    } catch {
      this.permission.set(this.readPermission());
      return this.permission();
    }
  }

  dismiss(): void {
    this.dismissed.set(true);
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // Preference only; the prompt simply reappears next visit.
    }
  }

  /** Shows a system notification only when the page is hidden and permission is granted. */
  show(title: string, body: string): void {
    if (this.permission() !== 'granted' || typeof document === 'undefined' || !document.hidden) return;
    try {
      new Notification(title, { body, icon: '/assets/fanvico.png', tag: 'smartclinic' });
    } catch {
      // Some mobile browsers only allow notifications from a service worker.
    }
  }

  private supported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  private readPermission(): DeviceNotificationPermission {
    return this.supported() ? Notification.permission : 'unsupported';
  }

  private readDismissed(): boolean {
    try {
      return localStorage.getItem(DISMISSED_KEY) === '1';
    } catch {
      return false;
    }
  }
}

import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_CONFIG } from '../config/api-config.token';

export type DeviceNotificationPermission = NotificationPermission | 'unsupported';

const DISMISSED_KEY = 'smartclinic-device-reminders-dismissed-v1';
const SERVICE_WORKER_URL = '/sw-push.js';

interface WebPushConfig {
  enabled: boolean;
  publicKey: string | null;
}

/**
 * SmartClinic notifications on this device.
 *
 * When the API has web push configured, the browser subscribes so reminders
 * arrive even when SmartClinic is closed. Otherwise in-app notifications are
 * mirrored as system notifications while the app is open in a background tab.
 * Either way, notifications show a title only — never health details.
 */
@Injectable({ providedIn: 'root' })
export class DeviceNotificationsService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_CONFIG).baseUrl;

  readonly permission = signal<DeviceNotificationPermission>(this.readPermission());
  readonly dismissed = signal(this.readDismissed());
  /** True once this browser is subscribed to web push for the signed-in patient. */
  readonly pushActive = signal(false);

  /** True when it is worth offering the "turn on reminders" prompt. */
  canOffer(): boolean {
    return this.permission() === 'default' && !this.dismissed();
  }

  async enable(): Promise<DeviceNotificationPermission> {
    if (!this.supported()) return 'unsupported';
    try {
      const result = await Notification.requestPermission();
      this.permission.set(result);
      if (result === 'granted') await this.syncPush();
      return result;
    } catch {
      this.permission.set(this.readPermission());
      return this.permission();
    }
  }

  /**
   * Makes sure this browser's push subscription is registered for the
   * signed-in patient. Safe to call on every visit; it never prompts.
   */
  async syncPush(): Promise<boolean> {
    if (this.readPermission() !== 'granted' || !this.pushSupported()) return false;
    try {
      const config = await firstValueFrom(this.http.get<WebPushConfig>(`${this.base}/me/web-push/config`));
      if (!config.enabled || !config.publicKey) return false;
      const registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: '/' });
      await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(config.publicKey) }));
      const json = subscription.toJSON();
      await firstValueFrom(
        this.http.post(`${this.base}/me/web-push/subscriptions`, { endpoint: json.endpoint, keys: { p256dh: json.keys?.['p256dh'], auth: json.keys?.['auth'] } }),
      );
      this.pushActive.set(true);
      return true;
    } catch {
      // Push is a bonus: in-tab notifications keep working without it.
      this.pushActive.set(false);
      return false;
    }
  }

  /**
   * Stops push to this browser, for example when the patient signs out on a
   * shared device. Call while still signed in so the API can be told.
   */
  async disconnectPush(): Promise<void> {
    this.pushActive.set(false);
    if (!this.pushSupported()) return;
    try {
      const registration = await navigator.serviceWorker.getRegistration('/');
      const subscription = await registration?.pushManager.getSubscription();
      if (!subscription) return;
      const endpoint = subscription.endpoint;
      // Unsubscribing in the browser first means nothing reaches this device even if the API call fails.
      await subscription.unsubscribe();
      await firstValueFrom(this.http.delete(`${this.base}/me/web-push/subscriptions`, { body: { endpoint } }));
    } catch {
      // Signing out must never be blocked by notification clean-up.
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

  /**
   * Shows a system notification only when the page is hidden and permission
   * is granted. Skipped when web push is active, which already delivers it.
   */
  show(title: string, body: string): void {
    if (this.pushActive() || this.permission() !== 'granted' || typeof document === 'undefined' || !document.hidden) return;
    try {
      new Notification(title, { body, icon: '/assets/fanvico.png', tag: 'smartclinic' });
    } catch {
      // Some mobile browsers only allow notifications from a service worker.
    }
  }

  private supported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  private pushSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serviceWorker' in navigator && typeof window !== 'undefined' && 'PushManager' in window;
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

function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padded = (value + '='.repeat((4 - (value.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

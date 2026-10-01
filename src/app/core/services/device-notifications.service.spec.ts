import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { API_CONFIG } from '../config/api-config.token';
import { DeviceNotificationsService } from './device-notifications.service';

describe('DeviceNotificationsService', () => {
  const created: { title: string; options: NotificationOptions }[] = [];
  let permission: NotificationPermission;

  beforeEach(() => {
    localStorage.clear();
    created.length = 0;
    permission = 'default';
    class FakeNotification {
      static get permission() { return permission; }
      static requestPermission = vi.fn(async () => (permission = 'granted'));
      constructor(title: string, options: NotificationOptions) { created.push({ title, options }); }
    }
    vi.stubGlobal('Notification', FakeNotification);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_CONFIG, useValue: { baseUrl: '/api/v1' } }],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('offers reminders until the patient enables or dismisses them', async () => {
    const service = TestBed.inject(DeviceNotificationsService);
    expect(service.canOffer()).toBe(true);
    await service.enable();
    expect(service.permission()).toBe('granted');
    expect(service.canOffer()).toBe(false);
  });

  it('remembers "Not now" without storing any health information', () => {
    TestBed.inject(DeviceNotificationsService).dismiss();
    expect(localStorage.getItem('smartclinic-device-reminders-dismissed-v1')).toBe('1');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_CONFIG, useValue: { baseUrl: '/api/v1' } }],
    });
    expect(TestBed.inject(DeviceNotificationsService).canOffer()).toBe(false);
  });

  it('only shows a system notification when granted and the page is in the background', () => {
    permission = 'granted';
    const service = TestBed.inject(DeviceNotificationsService);
    const hidden = vi.spyOn(document, 'hidden', 'get');

    hidden.mockReturnValue(false);
    service.show('Your SmartClinic routine', 'Open SmartClinic to see it.');
    expect(created).toHaveLength(0);

    hidden.mockReturnValue(true);
    service.show('Your SmartClinic routine', 'Open SmartClinic to see it.');
    expect(created).toEqual([
      { title: 'Your SmartClinic routine', options: expect.objectContaining({ body: 'Open SmartClinic to see it.' }) },
    ]);
  });

  describe('web push', () => {
    const endpoint = 'https://fcm.googleapis.com/fcm/send/device-1';
    let subscription: { endpoint: string; toJSON: () => unknown; unsubscribe: ReturnType<typeof vi.fn> } | null;
    let subscribe: ReturnType<typeof vi.fn<() => Promise<unknown>>>;
    let register: ReturnType<typeof vi.fn<() => Promise<unknown>>>;

    beforeEach(() => {
      subscription = null;
      subscribe = vi.fn(async () => {
        subscription = {
          endpoint,
          toJSON: () => ({ endpoint, keys: { p256dh: 'p-key', auth: 'a-key' } }),
          unsubscribe: vi.fn(async () => true),
        };
        return subscription;
      });
      const registration = { pushManager: { getSubscription: vi.fn(async () => subscription), subscribe } };
      register = vi.fn(async (..._args: unknown[]) => registration) as never;
      vi.stubGlobal('PushManager', class {});
      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: { register, ready: Promise.resolve(registration), getRegistration: vi.fn(async () => registration) },
      });
    });

    afterEach(() => {
      delete (navigator as unknown as Record<string, unknown>)['serviceWorker'];
    });

    async function flushUntil(http: HttpTestingController, url: string) {
      for (let i = 0; i < 20; i += 1) {
        const found = http.match(url);
        if (found.length) return found[0];
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      throw new Error(`No request to ${url}`);
    }

    it('subscribes this browser after permission is granted and registers it with the API', async () => {
      const service = TestBed.inject(DeviceNotificationsService);
      const http = TestBed.inject(HttpTestingController);

      const enabling = service.enable();
      (await flushUntil(http, '/api/v1/me/web-push/config')).flush({ enabled: true, publicKey: 'BAAA' });
      const saved = await flushUntil(http, '/api/v1/me/web-push/subscriptions');
      expect(saved.request.method).toBe('POST');
      expect(saved.request.body).toEqual({ endpoint, keys: { p256dh: 'p-key', auth: 'a-key' } });
      saved.flush({ registered: true });

      await expect(enabling).resolves.toBe('granted');
      expect(register).toHaveBeenCalledWith('/sw-push.js', { scope: '/' });
      expect(subscribe).toHaveBeenCalledWith(expect.objectContaining({ userVisibleOnly: true }));
      expect(service.pushActive()).toBe(true);
      http.verify();
    });

    it('does not subscribe when the API has web push turned off, and keeps in-tab notifications', async () => {
      permission = 'granted';
      const service = TestBed.inject(DeviceNotificationsService);
      const http = TestBed.inject(HttpTestingController);

      const syncing = service.syncPush();
      (await flushUntil(http, '/api/v1/me/web-push/config')).flush({ enabled: false, publicKey: null });
      await expect(syncing).resolves.toBe(false);
      expect(subscribe).not.toHaveBeenCalled();
      expect(service.pushActive()).toBe(false);
      http.verify();
    });

    it('never asks for permission or calls the API when notifications are not allowed', async () => {
      const service = TestBed.inject(DeviceNotificationsService);
      await expect(service.syncPush()).resolves.toBe(false);
      TestBed.inject(HttpTestingController).verify();
    });

    it('skips in-tab notifications while push is active, to avoid showing them twice', () => {
      permission = 'granted';
      const service = TestBed.inject(DeviceNotificationsService);
      vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
      service.pushActive.set(true);
      service.show('Your SmartClinic routine', 'Open SmartClinic to see it.');
      expect(created).toHaveLength(0);
    });

    it('unsubscribes this browser and tells the API on sign-out', async () => {
      await subscribe();
      const current = subscription!;
      const service = TestBed.inject(DeviceNotificationsService);
      const http = TestBed.inject(HttpTestingController);

      const disconnecting = service.disconnectPush();
      const removed = await flushUntil(http, '/api/v1/me/web-push/subscriptions');
      expect(removed.request.method).toBe('DELETE');
      expect(removed.request.body).toEqual({ endpoint });
      removed.flush({ unregistered: true });
      await disconnecting;
      expect(current.unsubscribe).toHaveBeenCalled();
      http.verify();
    });
  });
});

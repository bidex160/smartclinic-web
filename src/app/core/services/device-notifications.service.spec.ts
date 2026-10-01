import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
    TestBed.configureTestingModule({});
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
});

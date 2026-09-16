import { Injectable, inject } from '@angular/core';
import { API_CONFIG } from '../config/api-config.token';
import { AuthStateService } from './auth-state.service';
import { Notification } from '../models/notification.model';
import { NotificationsStateService } from './notifications-state.service';
import { NotificationSoundService } from './notification-sound.service';

@Injectable({ providedIn: 'root' })
export class NotificationRealtimeService {
  private readonly auth = inject(AuthStateService);
  private readonly state = inject(NotificationsStateService);
  private readonly sound = inject(NotificationSoundService);
  private readonly base = `${inject(API_CONFIG, { optional: true })?.baseUrl ?? ''}/me/notifications/stream`;
  private controller: AbortController | null = null;
  private running = false;
  private reconnectAttempt = 0;

  start(): void {
    if (this.running || !this.auth.accessToken()) return;
    this.running = true;
    this.reconnectAttempt = 0;
    void this.connect();
  }

  stop(): void {
    this.running = false;
    this.controller?.abort();
    this.controller = null;
    this.reconnectAttempt = 0;
  }

  private async connect(): Promise<void> {
    if (!this.running) return;
    const token = this.auth.accessToken();
    if (!token) { this.stop(); return; }
    this.controller = new AbortController();
    try {
      const response = await fetch(this.base, { headers: { Accept: 'text/event-stream', Authorization: `Bearer ${token}` }, signal: this.controller.signal });
      if (response.status === 401) { this.stop(); return; }
      if (!response.ok || !response.body) throw new Error('Notification stream unavailable');
      this.reconnectAttempt = 0;
      await this.read(response.body);
    } catch (error) {
      if (!this.running || (error instanceof DOMException && error.name === 'AbortError')) return;
      this.scheduleReconnect();
    }
  }

  private async read(body: ReadableStream<Uint8Array>): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (this.running) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() ?? '';
      for (const event of events) this.handleEvent(event);
    }
    if (this.running) this.scheduleReconnect();
  }

  private handleEvent(block: string): void {
    const event = block.match(/^event:\s*(.+)$/m)?.[1]?.trim();
    const data = block.match(/^data:\s*(.*)$/m)?.[1]?.trim();
    if (event !== 'notification' || !data) return;
    try {
      const notification = JSON.parse(data) as Notification;
      if (notification.reference && this.state.receiveRealtimeNotification(notification)) this.sound.play();
    } catch {
      // Ignore malformed/future events; persisted notifications remain available.
    }
  }

  private scheduleReconnect(): void {
    if (!this.running || this.reconnectAttempt >= 5) return;
    const delay = Math.min(30_000, 1000 * 2 ** this.reconnectAttempt++);
    setTimeout(() => void this.connect(), delay);
  }
}

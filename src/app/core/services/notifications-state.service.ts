import { effect, Injectable, inject, signal } from '@angular/core';
import { AuthStateService } from './auth-state.service';
import { Observable, of, tap } from 'rxjs';
import { Notification } from '../models/notification.model';
import { NotificationApiService } from './notifications-api.service';

@Injectable({ providedIn: 'root' })
export class NotificationsStateService {
  private readonly api = inject(NotificationApiService);
  private readonly auth = inject(AuthStateService);
  private ownerId: string | null = null;
  private readonly receivedReferences = new Set<string>();

  readonly latest = signal<readonly Notification[]>([]);
  readonly latestLoading = signal(false);
  readonly latestError = signal<string | null>(null);
  readonly unreadCount = signal(0);
  readonly unreadLoading = signal(false);
  readonly markingAll = signal(false);
  readonly open = signal(false);
  private readonly marking = signal<ReadonlySet<string>>(new Set());

  constructor() {
    effect(() => {
      const id = this.auth.currentUser()?.id ?? null;
      if (id !== this.ownerId) {
        this.ownerId = id;
        if (id === null) this.reset();
      }
    });
  }

  loadUnreadCount(): void {
    if (this.unreadLoading()) return;
    this.unreadLoading.set(true);
    this.api.unreadCount().subscribe({
      next: (result) => this.unreadCount.set(Math.max(0, result.unreadCount)),
      error: () => this.unreadLoading.set(false),
      complete: () => this.unreadLoading.set(false),
    });
  }

  loadLatest(limit = 6): void {
    if (this.latestLoading()) return;
    this.latestLoading.set(true);
    this.latestError.set(null);
    this.api.list({ page: 1, limit }).subscribe({
      next: (result) => this.latest.set(result.items),
      error: () => {
        this.latestError.set('Notifications are unavailable right now.');
        this.latestLoading.set(false);
      },
      complete: () => this.latestLoading.set(false),
    });
  }

  activate(): void {
    this.open.set(false);
    this.latest.set([]);
    this.latestError.set(null);
    this.loadUnreadCount();
  }

  togglePanel(): void {
    const next = !this.open();
    this.open.set(next);
    if (next && !this.latest().length && !this.latestError()) this.loadLatest();
  }

  closePanel(): void {
    this.open.set(false);
  }

  isMarking(reference: string): boolean {
    return this.marking().has(reference);
  }

  markRead(notification: Notification): Observable<Notification> {
    if (notification.readAt || this.isMarking(notification.reference)) {
      return of(notification);
    }
    const next = new Set(this.marking());
    next.add(notification.reference);
    this.marking.set(next);
    return this.api.markRead(notification.reference).pipe(
      tap({
        next: (updated) => {
          this.latest.update((items) => items.map((item) => item.reference === updated.reference ? updated : item));
          this.unreadCount.update((count) => Math.max(0, count - 1));
        },
        error: () => this.clearMarking(notification.reference),
        complete: () => this.clearMarking(notification.reference),
      }),
    );
  }

  markAllRead(): void {
    if (!this.unreadCount() || this.markingAll()) return;
    this.markingAll.set(true);
    this.api.markAllRead().subscribe({
      next: (result) => {
        this.latest.update((items) => items.map((item) => item.readAt ? item : { ...item, readAt: new Date().toISOString() }));
        this.unreadCount.set(Math.max(0, result.unreadCount));
      },
      complete: () => this.markingAll.set(false),
      error: () => this.markingAll.set(false),
    });
  }

  receiveRealtimeNotification(notification: Notification): boolean {
    const duplicate = this.receivedReferences.has(notification.reference);
    this.receivedReferences.add(notification.reference);
    if (duplicate) {
      this.latest.update((items) => items.map((item) => item.reference === notification.reference ? notification : item));
      return false;
    }
    this.latest.update((items) => [notification, ...items.filter((item) => item.reference !== notification.reference)].slice(0, 6));
    if (notification.readAt) return false;
    this.unreadCount.update((count) => count + 1);
    return true;
  }

  reset(): void {
    this.latest.set([]);
    this.latestError.set(null);
    this.unreadCount.set(0);
    this.open.set(false);
    this.marking.set(new Set());
    this.receivedReferences.clear();
  }

  private clearMarking(reference: string): void {
    const next = new Set(this.marking());
    next.delete(reference);
    this.marking.set(next);
  }
}

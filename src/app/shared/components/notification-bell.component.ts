import { ChangeDetectionStrategy, Component, ElementRef, HostListener, ViewChild, effect, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthStateService } from '../../core/services/auth-state.service';
import { Notification } from '../../core/models/notification.model';
import { NotificationNavigationService } from '../../core/services/notification-navigation.service';
import { NotificationsStateService } from '../../core/services/notifications-state.service';
import { NotificationRealtimeService } from '../../core/services/notification-realtime.service';

@Component({
  selector: 'app-notification-bell',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative" #host>
      <button #bell type="button" (click)="toggle()" [attr.aria-expanded]="state.open()"
        aria-controls="notification-panel" [attr.aria-label]="bellLabel()"
        class="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-600 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
        <svg aria-hidden="true" class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
        </svg>
        @if (state.unreadCount() > 0) {
          <span class="absolute -right-0.5 -top-0.5 min-w-5 rounded-full border-2 border-white bg-brand-700 px-1 text-center text-[10px] font-bold leading-4 text-white">{{ badge() }}</span>
        }
      </button>

      @if (state.open()) {
        <section id="notification-panel" aria-label="Notifications" class="fixed inset-x-4 top-24 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[min(23rem,calc(100vw-2rem))]">
          <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 class="font-bold text-slate-900">Notifications</h2><button type="button" (click)="close(true)" aria-label="Close notifications" class="ml-auto inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100">✕</button></div><div class="px-4">
            @if (state.unreadCount() > 0) {
              <button type="button" [disabled]="state.markingAll()" (click)="markAll()" class="inline-flex min-h-11 items-center text-sm font-bold text-brand-700 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">{{ state.markingAll() ? 'Updating…' : 'Mark all as read' }}</button>
            }
          </div>
          @if (state.latestLoading()) { <p role="status" class="px-4 py-6 text-sm text-slate-600">Loading notifications…</p> }
          @else if (state.latestError()) { <p role="alert" class="px-4 py-6 text-sm text-slate-600">{{ state.latestError() }}</p> }
          @else if (!state.latest().length) { <p class="px-4 py-6 text-sm text-slate-600">No notifications yet</p> }
          @else {
            <div class="max-h-80 overflow-y-auto">
              @for (item of state.latest(); track item.reference) {
                <button type="button" (click)="openNotification(item)" [disabled]="state.isMarking(item.reference)" [class.bg-brand-50]="!item.readAt" class="block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600">
                  <span class="block font-bold text-slate-900">{{ item.title }}</span>
                  <span class="mt-1 block text-sm text-slate-600">{{ item.message }}</span>
                  <time class="mt-1 block text-xs text-slate-500" [attr.datetime]="item.createdAt">{{ timeLabel(item.createdAt) }}</time>
                </button>
              }
            </div>
          }
          <a [routerLink]="notificationsRoute()" (click)="close()" class="block border-t border-slate-100 px-4 py-3 text-center font-bold text-brand-700 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600">View all notifications</a>
        </section>
      }
    </div>
  `,
})
export class NotificationBellComponent {
  @ViewChild('bell') private bell?: ElementRef<HTMLButtonElement>;
  readonly state = inject(NotificationsStateService);
  private readonly auth = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly mapper = inject(NotificationNavigationService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly realtime = inject(NotificationRealtimeService);

  constructor() {
    if (this.auth.currentUser()) this.state.activate();
    effect(() => {
      if (this.auth.authenticated()) this.realtime.start();
      else this.realtime.stop();
    });
  }

  toggle(): void { this.state.togglePanel(); }
  close(restoreFocus = false): void { this.state.closePanel(); if (restoreFocus) this.bell?.nativeElement.focus(); }
  markAll(): void { this.state.markAllRead(); }

  openNotification(item: Notification): void {
    const destination = this.mapper.destination(item, this.role());
    if (!item.readAt) this.state.markRead(item).subscribe({ error: () => undefined });
    this.close();
    if (destination) void this.router.navigate(destination);
  }

  bellLabel(): string {
    const count = this.state.unreadCount();
    return count ? `Notifications, ${count} unread` : 'Notifications';
  }

  badge(): string { return this.state.unreadCount() > 99 ? '99+' : String(this.state.unreadCount()); }
  notificationsRoute(): string { return this.role() === 'PROVIDER' ? '/provider/notifications' : '/me/notifications'; }

  timeLabel(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Recently';
    const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} hr ago`;
    if (minutes < 2880) return 'Yesterday';
    return date.toLocaleDateString(undefined, { dateStyle: 'medium' });
  }

  @HostListener('document:keydown.escape') onEscape(): void { if (this.state.open()) this.close(true); }
  @HostListener('document:click', ['$event']) onDocumentClick(event: MouseEvent): void {
    if (this.state.open() && !this.host.nativeElement.contains(event.target as Node)) this.close();
  }

  private role(): 'USER' | 'PROVIDER' | null {
    const roles = this.auth.currentUser()?.roles ?? [];
    return roles.includes('PROVIDER') ? 'PROVIDER' : roles.includes('USER') ? 'USER' : null;
  }
}

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthStateService } from '../../core/services/auth-state.service';
import { Notification } from '../../core/models/notification.model';
import { NotificationNavigationService } from '../../core/services/notification-navigation.service';
import { NotificationApiService } from '../../core/services/notifications-api.service';
import { NotificationsStateService } from '../../core/services/notifications-state.service';

@Component({
  selector: 'app-notifications-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-4xl px-5 py-8 sm:px-8">
      <a [routerLink]="homeRoute()" class="font-bold text-brand-700">← Dashboard</a>
      <header class="mt-5 flex flex-wrap items-end justify-between gap-4"><div><h1 class="text-3xl font-bold">Notifications</h1><p class="mt-2 text-slate-600">Updates about your care and SmartClinic activity will appear here.</p></div>@if (unreadCount() > 0) {<button type="button" (click)="markAll()" [disabled]="markingAll()" class="rounded-xl border px-4 py-3 font-bold text-brand-700">{{ markingAll() ? 'Updating…' : 'Mark all as read' }}</button>}</header>
      @if (loading()) { <p role="status" class="mt-6">Loading notifications…</p> }
      @else if (error()) { <p role="alert" class="mt-6 rounded-xl bg-red-50 p-4">{{ error() }} <button type="button" (click)="load()" class="font-bold underline">Try again</button></p> }
      @else if (!items().length) { <p class="mt-6 rounded-2xl border bg-white p-6">No notifications yet</p> }
      @else {
        <div class="mt-6 grid gap-3">@for (item of items(); track item.reference) {<button type="button" (click)="open(item)" class="rounded-2xl border p-4 text-left shadow-sm hover:border-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600" [class.bg-brand-50]="!item.readAt"><span class="block font-bold">{{ item.title }}</span><span class="mt-1 block text-slate-600">{{ item.message }}</span><time class="mt-2 block text-xs text-slate-500" [attr.datetime]="item.createdAt">{{ timeLabel(item.createdAt) }}</time></button>}</div>
        <nav class="mt-6 flex items-center justify-between" aria-label="Notification pages"><button type="button" (click)="load(page()-1)" [disabled]="page() <= 1" class="rounded-lg border px-4 py-2 font-bold">Previous</button><span>Page {{ page() }} of {{ totalPages() || 1 }}</span><button type="button" (click)="load(page()+1)" [disabled]="page() >= totalPages()" class="rounded-lg border px-4 py-2 font-bold">Next</button></nav>
      }
    </main>
  `,
})
export class NotificationsPageComponent {
  private readonly api = inject(NotificationApiService);
  private readonly state = inject(NotificationsStateService);
  private readonly auth = inject(AuthStateService);
  private readonly mapper = inject(NotificationNavigationService);
  private readonly router = inject(Router);
  readonly items = signal<readonly Notification[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly markingAll = signal(false);
  readonly unreadCount = this.state.unreadCount;

  constructor() { this.load(); }
  homeRoute(): string { return this.auth.isProvider() ? '/provider/dashboard' : '/me/dashboard'; }
  load(page = this.page()): void {
    if (page < 1) return;
    this.loading.set(true); this.error.set(null);
    this.api.list({ page, limit: 20 }).subscribe({ next: (result) => { this.items.set(result.items); this.page.set(result.page); this.totalPages.set(result.totalPages); }, error: () => { this.error.set('Notifications are unavailable right now.'); this.loading.set(false); }, complete: () => this.loading.set(false) });
  }
  markAll(): void {
    if (!this.unreadCount() || this.markingAll()) return;
    this.markingAll.set(true);
    this.api.markAllRead().subscribe({ next: (result) => { this.items.update((items) => items.map((item) => item.readAt ? item : { ...item, readAt: new Date().toISOString() })); this.state.unreadCount.set(Math.max(0, result.unreadCount)); }, complete: () => this.markingAll.set(false), error: () => this.markingAll.set(false) });
  }
  open(item: Notification): void {
    if (!item.readAt) this.state.markRead(item).subscribe({ next: (updated) => this.items.update((items) => items.map((x) => x.reference === updated.reference ? updated : x)), error: () => undefined });
    const role = this.auth.isProvider() ? 'PROVIDER' : this.auth.isPatient() ? 'USER' : null;
    const destination = this.mapper.destination(item, role);
    if (destination) void this.router.navigate(destination);
  }
  timeLabel(value: string): string { const date = new Date(value); if (Number.isNaN(date.getTime())) return 'Recently'; const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000)); if (minutes < 1) return 'Just now'; if (minutes < 60) return `${minutes} min ago`; if (minutes < 1440) return `${Math.floor(minutes / 60)} hr ago`; if (minutes < 2880) return 'Yesterday'; return date.toLocaleDateString(undefined, { dateStyle: 'medium' }); }
}

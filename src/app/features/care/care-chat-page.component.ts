import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, exhaustMap, finalize, forkJoin, timer } from 'rxjs';
import { CareChatDetail, CareChatMessage, CareChatScope } from '../../core/models/find-care.model';
import { CareChatApiService } from '../../core/services/care-chat-api.service';
import { UtilsService } from '../../core/services/utils.service';
import { careDeliveryModeLabel } from './care-delivery-mode';

@Component({
  selector: 'app-care-chat-page',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-4xl px-4 py-8 sm:px-8">
    <a [routerLink]="backLink" class="font-bold text-brand-700 underline">← Care Request</a>
    @if (loading()) {
      <p role="status" class="mt-6 rounded-2xl border bg-white p-6">Loading care chat…</p>
    } @else if (unavailable()) {
      <section class="mt-6 rounded-2xl border bg-white p-7">
        <h1 class="text-2xl font-bold">Care chat unavailable</h1>
        <p class="mt-2 text-slate-600">{{ unavailable() }}</p>
      </section>
    } @else if (error() && !chat()) {
      <section role="alert" class="mt-6 rounded-2xl bg-red-50 p-6">
        <p>{{ error() }}</p>
        <button type="button" (click)="load()" class="mt-3 font-bold underline">Try again</button>
      </section>
    } @else if (chat(); as detail) {
      <header class="mt-6 rounded-2xl border bg-white p-6">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="break-all text-sm font-bold uppercase text-brand-600">
              {{ detail.careRequestReference }}
            </p>
            <h1 class="mt-2 text-3xl font-bold">
              {{ scope === 'patient' ? 'Chat with provider' : 'Chat with patient' }}
            </h1>
            <p class="mt-2 font-semibold">{{ detail.participant.displayName }}</p>
            <p class="text-sm text-slate-600">{{ detail.service.name }}</p>
          </div>
          @if (detail.unreadCount > 0) {
            <span class="rounded-full bg-brand-700 px-3 py-1 text-sm font-bold text-white"
              >{{ detail.unreadCount }} unread</span
            >
          }
        </div>
        @if (detail.appointment; as a) {
          <p class="mt-4 rounded-xl bg-slate-50 p-3">
            {{ utils.formatAppointment(a.scheduledDate, a.scheduledTimeFrom, a.scheduledTimeTo) }} ·
            {{ deliveryModeLabel(a.deliveryMode) }}
            <a
              [routerLink]="appointmentLink(a.reference)"
              class="ml-2 font-bold text-brand-700 underline"
              >View appointment</a
            >
          </p>
        }
      </header>
      @if (error()) {
        <p role="alert" class="mt-4 rounded-xl bg-red-50 p-3 text-red-800">{{ error() }}</p>
      }
      <section
        class="mt-5 overflow-hidden rounded-2xl border bg-slate-50"
        aria-labelledby="messages-heading"
      >
        <h2 id="messages-heading" class="sr-only">Messages</h2>
        <div #messageRegion tabindex="0" class="max-h-[58vh] min-h-80 overflow-y-auto p-4 sm:p-6">
          @if (hasEarlier()) {
            <div class="mb-5 text-center">
              <button
                type="button"
                (click)="loadEarlier()"
                [disabled]="olderLoading()"
                class="rounded-xl border bg-white px-4 py-2 font-bold disabled:opacity-50"
              >
                {{ olderLoading() ? 'Loading…' : 'Load earlier messages' }}
              </button>
            </div>
          }
          @if (!messages().length) {
            <p class="py-16 text-center text-slate-600">
              No messages yet. Start the conversation when you're ready.
            </p>
          }
          @for (message of messages(); track messageKey(message)) {
            <article class="mb-3 flex" [class.justify-end]="isMine(message)">
              <div
                class="max-w-[85%] rounded-2xl px-4 py-3 shadow-sm"
                [class.bg-brand-700]="isMine(message)"
                [class.text-white]="isMine(message)"
                [class.bg-white]="!isMine(message)"
              >
                <p
                  class="text-xs font-bold"
                  [class.text-brand-100]="isMine(message)"
                  [class.text-slate-500]="!isMine(message)"
                >
                  {{ isMine(message) ? 'You' : otherLabel }}
                </p>
                <p class="mt-1 whitespace-pre-wrap break-words">{{ message.body }}</p>
                <p
                  class="mt-1 text-right text-xs"
                  [class.text-brand-100]="isMine(message)"
                  [class.text-slate-500]="!isMine(message)"
                >
                  {{ messageTime(message.createdAt) }}
                  @if (isMine(message) && message.readAt) {
                    · Read
                  }
                </p>
              </div>
            </article>
          }
        </div>
        @if (detail.canSendMessages) {
          <form
            [formGroup]="composer"
            (ngSubmit)="send()"
            class="sticky bottom-0 border-t bg-white p-4"
          >
            <label for="chat-message" class="font-bold">Message</label>
            <div class="mt-2 flex items-end gap-3">
              <textarea
                #composerInput
                id="chat-message"
                formControlName="body"
                maxlength="4000"
                rows="2"
                (keydown)="composerKeydown($event)"
                placeholder="Write a message"
                class="min-h-12 flex-1 resize-y rounded-xl border p-3"
              ></textarea
              ><button
                type="submit"
                [disabled]="sending() || !composer.controls.body.value.trim()"
                class="min-h-12 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-50"
              >
                {{ sending() ? 'Sending…' : 'Send' }}
              </button>
            </div>
          </form>
        } @else {
          <p class="border-t bg-white p-4 text-center font-semibold text-slate-600">
            This conversation is now read-only.
          </p>
        }
      </section>
    }
  </main>`,
})
export class CareChatPageComponent {
  private readonly api = inject(CareChatApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  readonly utils = inject(UtilsService);
  readonly scope = (this.route.snapshot.data['chatScope'] ?? 'patient') as CareChatScope;
  readonly reference = this.route.snapshot.paramMap.get('reference') ?? '';
  readonly backLink =
    this.scope === 'patient'
      ? ['/me/care', this.reference]
      : ['/provider/care-requests', this.reference];
  readonly chat = signal<CareChatDetail | null>(null);
  readonly messages = signal<readonly CareChatMessage[]>([]);
  readonly loading = signal(true);
  readonly sending = signal(false);
  readonly olderLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly unavailable = signal<string | null>(null);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly composer = this.fb.nonNullable.group({
    body: ['', [Validators.required, Validators.maxLength(4000)]],
  });
  readonly deliveryModeLabel = careDeliveryModeLabel;
  private pollingStarted = false;
  @ViewChild('messageRegion') private messageRegion?: ElementRef<HTMLElement>;
  @ViewChild('composerInput') private composerInput?: ElementRef<HTMLTextAreaElement>;
  constructor() {
    this.load();
  }
  get otherLabel() {
    return this.scope === 'patient'
      ? (this.chat()?.participant.displayName ?? 'Provider')
      : (this.chat()?.participant.displayName ?? 'Patient');
  }
  appointmentLink(reference: string) {
    return this.scope === 'patient'
      ? ['/me/care/appointments', reference]
      : ['/provider/care-appointments', reference];
  }
  load() {
    this.loading.set(true);
    this.error.set(null);
    this.unavailable.set(null);
    forkJoin({
      chat: this.api.getChat(this.scope, this.reference),
      messages: this.api.getMessages(this.scope, this.reference, 1, 30),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (value) => {
          this.chat.set(value.chat);
          this.page.set(1);
          this.totalPages.set(value.messages.totalPages);
          this.messages.set([...value.messages.items].reverse());
          this.markReadIfNeeded(value.chat, value.messages.items);
          this.scrollBottom();
          this.startPolling();
        },
        error: (e) => {
          if (e?.status === 404 || e?.status === 409)
            this.unavailable.set(
              this.scope === 'patient'
                ? 'Chat becomes available after a provider accepts your care request.'
                : 'Chat becomes available after this request is accepted.',
            );
          else this.error.set('We could not load this care chat.');
        },
      });
  }
  send() {
    const body = this.composer.controls.body.value.trim();
    if (!body || this.sending()) return;
    this.sending.set(true);
    this.error.set(null);
    this.api
      .sendMessage(this.scope, this.reference, body)
      .pipe(finalize(() => this.sending.set(false)))
      .subscribe({
        next: () => {
          this.composer.reset();
          this.refreshAfterSend();
        },
        error: (e) => {
          this.error.set(
            e?.status === 409
              ? 'This conversation changed and may now be read-only. Your message was not removed.'
              : 'We could not send your message. Your text is still here.',
          );
          this.refreshDetail();
        },
      });
  }
  composerKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      this.send();
    }
  }
  loadEarlier() {
    if (this.olderLoading() || !this.hasEarlier()) return;
    const region = this.messageRegion?.nativeElement;
    const oldHeight = region?.scrollHeight ?? 0;
    this.olderLoading.set(true);
    const next = this.page() + 1;
    this.api
      .getMessages(this.scope, this.reference, next, 30)
      .pipe(finalize(() => this.olderLoading.set(false)))
      .subscribe({
        next: (value) => {
          this.page.set(next);
          this.totalPages.set(value.totalPages);
          this.messages.set(this.merge([...value.items].reverse(), this.messages()));
          queueMicrotask(() => {
            if (region) region.scrollTop = region.scrollHeight - oldHeight;
          });
        },
        error: () => this.error.set('Earlier messages could not be loaded.'),
      });
  }
  hasEarlier() {
    return this.page() < this.totalPages();
  }
  isMine(message: CareChatMessage) {
    return message.senderType === (this.scope === 'patient' ? 'PATIENT' : 'PROVIDER');
  }
  messageKey(message: CareChatMessage) {
    return `${message.senderType}|${message.createdAt}|${message.body}`;
  }
  messageTime(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? ''
      : new Intl.DateTimeFormat('en-NG', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }).format(date);
  }
  private applyNewest(items: readonly CareChatMessage[]) {
    const nearBottom = this.isNearBottom();
    const incoming = [...items].reverse();
    const prior = this.messages();
    const merged = this.merge(prior, incoming);
    const changed = merged.length !== prior.length;
    this.messages.set(merged);
    if (items.some((m) => !this.isMine(m) && !m.readAt)) this.markRead();
    if (changed && nearBottom) this.scrollBottom();
  }
  private merge(first: readonly CareChatMessage[], second: readonly CareChatMessage[]) {
    const map = new Map<string, CareChatMessage>();
    for (const message of [...first, ...second]) map.set(this.messageKey(message), message);
    return [...map.values()].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }
  private markReadIfNeeded(chat: CareChatDetail, items: readonly CareChatMessage[]) {
    if (chat.unreadCount > 0 || items.some((m) => !this.isMine(m) && !m.readAt)) this.markRead();
  }
  private markRead() {
    this.api
      .markRead(this.scope, this.reference)
      .subscribe({ next: () => this.refreshDetail(), error: () => {} });
  }
  private refreshDetail() {
    this.api
      .getChat(this.scope, this.reference)
      .subscribe({ next: (value) => this.chat.set(value), error: () => {} });
  }
  private refreshAfterSend() {
    this.api.getMessages(this.scope, this.reference, 1, 30).subscribe({
      next: (value) => {
        this.applyNewest(value.items);
        this.scrollBottom();
        this.composerInput?.nativeElement.focus();
      },
      error: () => this.error.set('Message sent, but the conversation could not be refreshed.'),
    });
  }
  private isNearBottom() {
    const el = this.messageRegion?.nativeElement;
    return !el || el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }
  private scrollBottom() {
    queueMicrotask(() => {
      const el = this.messageRegion?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
  private startPolling() {
    if (this.pollingStarted) return;
    this.pollingStarted = true;
    timer(5000, 5000)
      .pipe(
        exhaustMap(() =>
          forkJoin({
            chat: this.api.getChat(this.scope, this.reference),
            messages: this.api.getMessages(this.scope, this.reference, 1, 30),
          }).pipe(catchError(() => EMPTY)),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => {
        this.chat.set(value.chat);
        this.applyNewest(value.messages.items);
      });
  }
}

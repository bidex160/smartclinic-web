import { isAwaitingProviderApproval, ProviderApprovalNoticeComponent } from '../../../shared/components/provider-approval-notice/provider-approval-notice';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { IntegrationsOverview, ProviderApiKeyView, WebhookDeliveryView } from '../../../core/models/provider-integrations.model';
import { ProviderIntegrationsApiService } from '../../../core/services/provider-integrations-api.service';
import { ProviderMembershipService } from '../../../core/services/provider-membership.service';

const EVENTS: readonly { readonly type: string; readonly when: string }[] = [
  { type: 'request.patient_responded', when: 'Your patient approved or declined a request you sent' },
  { type: 'request.updated', when: 'They chose a place, it accepted, referred it on, or dispensed it' },
  { type: 'request.results_ready', when: 'The lab entered results' },
  { type: 'handoff.received', when: 'A patient chose you, or a facility referred a patient to you' },
];

/** API keys and a webhook, so a facility's own EMR, lab or pharmacy system can connect. */
@Component({
  selector: 'app-provider-integrations-page',
  imports: [ProviderApprovalNoticeComponent, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
      <a routerLink="/provider/dashboard" class="text-sm font-semibold text-brand-700">← Dashboard</a>
      <header class="mt-3">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">{{ membership.membership()?.provider?.displayName ?? 'Your facility' }}</p>
        <h1 class="font-display mt-1 text-3xl font-semibold text-ink sm:text-4xl">Connect your system</h1>
        <p class="mt-2 max-w-2xl text-ink-soft">Most facilities don’t need this — your team can do everything in SmartClinic. If you run an EMR, lab or pharmacy system, connect it here to send requests and get updates automatically.</p>
      </header>

      @if (!membership.canManageTeam()) {
        <p role="alert" class="mt-6 rounded-2xl bg-sand-100 p-5 text-ink-soft">Only the facility owner or a team admin can manage integrations.</p>
      } @else if (loading()) {
        <div role="status" class="mt-6 grid gap-3"><div class="h-40 animate-pulse rounded-2xl bg-sand-200"></div><div class="h-40 animate-pulse rounded-2xl bg-sand-200"></div><span class="sr-only">Loading integrations…</span></div>
      } @else if (loadError()) {
        @if (awaitingApproval()) { <app-provider-approval-notice feature="Connecting your system" /> } @else {
        <p role="alert" class="mt-6 rounded-2xl bg-clay-50 p-5 text-clay-700">Integrations couldn’t be loaded. <button type="button" (click)="load()" class="font-semibold underline">Try again</button></p>
        }
      } @else {
        <!-- API keys -->
        <section class="sc-card mt-6 p-5 sm:p-6" aria-labelledby="keys-heading">
          <div class="flex items-start gap-3">
            <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 font-display text-lg font-semibold text-brand-800" aria-hidden="true">1</span>
            <div class="min-w-0">
              <h2 id="keys-heading" class="font-display text-xl font-semibold text-ink">API keys</h2>
              <p class="mt-1 text-sm text-ink-soft">Your system sends a key with each call. Make one per system, so you can switch one off without the others.</p>
            </div>
          </div>

          <form [formGroup]="keyForm" (submit)="$event.preventDefault(); createKey()" class="mt-4 flex flex-col gap-2 sm:flex-row" novalidate>
            <label class="min-w-0 flex-1"><span class="sr-only">Key name</span>
              <input formControlName="name" maxlength="80" placeholder="Name, e.g. Hospital EMR" class="min-h-12 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink" data-key-name />
            </label>
            <button type="submit" [disabled]="keyForm.invalid || creating()" class="min-h-12 rounded-full bg-ink px-6 font-semibold text-white hover:bg-brand-900 disabled:opacity-50" data-create-key>{{ creating() ? 'Creating…' : 'Create key' }}</button>
          </form>

          @if (newKey(); as created) {
            <div class="mt-4 rounded-2xl bg-ochre-50 p-4 ring-1 ring-ochre-100" role="status" data-new-key>
              <p class="font-semibold text-ink">Copy this key now — you won’t see it again.</p>
              <p class="mt-1 text-sm text-ink-soft">Store it in your system’s settings, not in an email or chat.</p>
              <code class="mt-3 block break-all rounded-xl bg-white p-3 font-mono text-sm text-ink ring-1 ring-ink/10">{{ created.key }}</code>
              <div class="mt-3 flex flex-wrap gap-2">
                <button type="button" (click)="copy(created.key)" class="min-h-10 rounded-full bg-ink px-4 text-sm font-semibold text-white hover:bg-brand-900">Copy key</button>
                <button type="button" (click)="newKey.set(null)" class="min-h-10 rounded-full px-4 text-sm font-semibold text-ink-soft hover:bg-white">I’ve saved it</button>
              </div>
            </div>
          }

          @if (activeKeys().length || revokedKeys().length) {
            <ul class="mt-4 divide-y divide-ink/[0.06] overflow-hidden rounded-2xl ring-1 ring-ink/[0.06]">
              @for (key of activeKeys(); track key.id) {
                <li class="flex flex-wrap items-center justify-between gap-3 bg-white p-4" data-key>
                  <div class="min-w-0">
                    <p class="font-semibold text-ink">{{ key.name }}</p>
                    <p class="text-sm text-ink-muted"><span class="font-mono">{{ key.keyPrefix }}_…</span> · {{ key.lastUsedAt ? 'Last used ' + date(key.lastUsedAt) : 'Not used yet' }}</p>
                  </div>
                  @if (confirmingRevoke() === key.id) {
                    <div class="flex gap-2">
                      <button type="button" (click)="revoke(key)" class="min-h-10 rounded-full bg-clay-700 px-4 text-sm font-semibold text-white">Switch off</button>
                      <button type="button" (click)="confirmingRevoke.set(null)" class="min-h-10 rounded-full px-3 text-sm font-semibold text-ink-soft hover:bg-sand-50">Keep</button>
                    </div>
                  } @else {
                    <button type="button" (click)="confirmingRevoke.set(key.id)" class="min-h-10 rounded-full px-3 text-sm font-semibold text-ink-soft hover:bg-sand-50">Revoke</button>
                  }
                </li>
              }
              @for (key of revokedKeys(); track key.id) {
                <li class="flex items-center justify-between gap-3 bg-sand-50 p-4 text-sm text-ink-muted" data-key-revoked>
                  <span><span class="font-semibold">{{ key.name }}</span> <span class="ml-1 font-mono">{{ key.keyPrefix }}_…</span></span>
                  <span>Revoked {{ date(key.revokedAt!) }}</span>
                </li>
              }
            </ul>
          }
        </section>

        <!-- Webhook -->
        <section class="sc-card mt-6 p-5 sm:p-6" aria-labelledby="webhook-heading">
          <div class="flex items-start gap-3">
            <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 font-display text-lg font-semibold text-brand-800" aria-hidden="true">2</span>
            <div class="min-w-0">
              <h2 id="webhook-heading" class="font-display text-xl font-semibold text-ink">Updates to your system <span class="text-base font-normal text-ink-muted">(optional)</span></h2>
              <p class="mt-1 text-sm text-ink-soft">We send a signed message to your address when something changes. It carries reference numbers only, never health details.</p>
            </div>
          </div>

          @if (!overview()?.webhooksAvailable) {
            <p class="mt-4 rounded-2xl bg-sand-100 p-4 text-sm text-ink-soft" data-webhooks-off>Updates aren’t switched on for SmartClinic yet. Your API keys work now; check back for updates.</p>
          } @else {
            <form [formGroup]="hookForm" (submit)="$event.preventDefault(); saveWebhook(false)" class="mt-4 flex flex-col gap-2 sm:flex-row" novalidate>
              <label class="min-w-0 flex-1"><span class="sr-only">Webhook address</span>
                <input formControlName="url" type="url" inputmode="url" placeholder="https://emr.yourhospital.ng/smartclinic" class="min-h-12 w-full rounded-xl border border-ink/15 bg-white px-3 font-mono text-sm text-ink" data-webhook-url />
              </label>
              <button type="submit" [disabled]="hookForm.invalid || savingHook()" class="min-h-12 rounded-full bg-ink px-6 font-semibold text-white hover:bg-brand-900 disabled:opacity-50" data-save-webhook>{{ savingHook() ? 'Saving…' : overview()?.webhook ? 'Update' : 'Save' }}</button>
            </form>
            @if (hookForm.controls.url.invalid && hookForm.controls.url.touched) { <p class="mt-1 text-xs font-semibold text-clay-700">Use an address that starts with https://</p> }

            @if (newSecret(); as secret) {
              <div class="mt-4 rounded-2xl bg-ochre-50 p-4 ring-1 ring-ochre-100" role="status" data-new-secret>
                <p class="font-semibold text-ink">Copy your signing secret now — you won’t see it again.</p>
                <p class="mt-1 text-sm text-ink-soft">Your system uses it to check each message really came from SmartClinic.</p>
                <code class="mt-3 block break-all rounded-xl bg-white p-3 font-mono text-sm text-ink ring-1 ring-ink/10">{{ secret }}</code>
                <div class="mt-3 flex flex-wrap gap-2">
                  <button type="button" (click)="copy(secret)" class="min-h-10 rounded-full bg-ink px-4 text-sm font-semibold text-white hover:bg-brand-900">Copy secret</button>
                  <button type="button" (click)="newSecret.set(null)" class="min-h-10 rounded-full px-4 text-sm font-semibold text-ink-soft hover:bg-white">I’ve saved it</button>
                </div>
              </div>
            }

            @if (overview()?.webhook) {
              <div class="mt-4 flex flex-wrap gap-2">
                <button type="button" (click)="test()" [disabled]="testing()" class="min-h-10 rounded-full bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50" data-test-webhook>{{ testing() ? 'Sending…' : 'Send test' }}</button>
                <button type="button" (click)="saveWebhook(true)" class="min-h-10 rounded-full border border-ink/15 bg-white px-4 text-sm font-semibold text-ink hover:bg-sand-50">New secret</button>
                @if (confirmingRemoveHook()) {
                  <button type="button" (click)="removeWebhook()" class="min-h-10 rounded-full bg-clay-700 px-4 text-sm font-semibold text-white">Stop updates</button>
                  <button type="button" (click)="confirmingRemoveHook.set(false)" class="min-h-10 rounded-full px-3 text-sm font-semibold text-ink-soft hover:bg-sand-50">Keep</button>
                } @else {
                  <button type="button" (click)="confirmingRemoveHook.set(true)" class="min-h-10 rounded-full px-3 text-sm font-semibold text-ink-soft hover:bg-sand-50">Remove</button>
                }
              </div>

              <h3 class="mt-6 text-sm font-semibold text-ink">Recent messages</h3>
              @if (!deliveries().length) {
                <p class="mt-2 text-sm text-ink-muted">None yet. Press “Send test” to check your address.</p>
              } @else {
                <ul class="mt-2 grid gap-1.5 text-sm">
                  @for (d of deliveries(); track d.id) {
                    <li class="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-sand-50 px-3 py-2" data-delivery>
                      <span class="font-mono text-ink">{{ d.eventType }}</span>
                      <span class="flex items-center gap-2 text-ink-muted">
                        {{ date(d.createdAt) }}
                        <span class="rounded-full px-2 py-0.5 text-xs font-semibold ring-1 {{ deliveryTone(d) }}" data-delivery-status>{{ deliveryLabel(d) }}</span>
                      </span>
                    </li>
                  }
                </ul>
              }
            }

            <details class="group mt-6 rounded-2xl bg-sand-50 p-4 ring-1 ring-ink/[0.06]">
              <summary class="cursor-pointer list-none text-sm font-semibold text-ink">Messages we send <span class="float-right transition group-open:rotate-45" aria-hidden="true">+</span></summary>
              <dl class="mt-3 grid gap-2 text-sm">
                @for (e of events; track e.type) {
                  <div><dt class="font-mono text-ink">{{ e.type }}</dt><dd class="text-ink-soft">{{ e.when }}</dd></div>
                }
              </dl>
            </details>
          }
        </section>

        <!-- Quick start -->
        <section class="sc-card mt-6 p-5 sm:p-6" aria-labelledby="start-heading">
          <div class="flex items-start gap-3">
            <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 font-display text-lg font-semibold text-brand-800" aria-hidden="true">3</span>
            <div class="min-w-0">
              <h2 id="start-heading" class="font-display text-xl font-semibold text-ink">For your developer</h2>
              <p class="mt-1 text-sm text-ink-soft">Send a test request by a patient’s SmartClinic ID. The patient approves it in their app and picks any lab or pharmacy on SmartClinic.</p>
            </div>
          </div>
          <div class="mt-4 inline-flex rounded-full bg-sand-100 p-1" role="group" aria-label="API format">
            <button type="button" (click)="format.set('json')" [attr.aria-pressed]="format() === 'json'" class="min-h-10 rounded-full px-4 text-sm font-semibold {{ format() === 'json' ? 'bg-white text-ink shadow-sm' : 'text-ink-soft' }}">Simple JSON</button>
            <button type="button" (click)="format.set('fhir')" [attr.aria-pressed]="format() === 'fhir'" class="min-h-10 rounded-full px-4 text-sm font-semibold {{ format() === 'fhir' ? 'bg-white text-ink shadow-sm' : 'text-ink-soft' }}">HL7 FHIR R4</button>
          </div>
          @if (format() === 'fhir') {
            <p class="mt-3 text-sm text-ink-soft">For EMRs that already speak FHIR. Same key. Base URL <span class="break-all font-mono text-ink">{{ fhirBase }}</span></p>
          }
          <pre class="mt-3 overflow-x-auto rounded-2xl bg-ink p-4 text-xs leading-relaxed text-white/90" data-curl><code>{{ format() === 'fhir' ? fhirExample : curlExample }}</code></pre>
          <div class="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" (click)="copy(format() === 'fhir' ? fhirExample : curlExample)" class="min-h-10 rounded-full border border-ink/15 bg-white px-4 text-sm font-semibold text-ink hover:bg-sand-50">Copy example</button>
            <a routerLink="/developers" class="text-sm font-semibold text-brand-700 underline underline-offset-4">Full guide for your IT team →</a>
          </div>
          @if (format() === 'fhir') {
            <p class="mt-3 text-sm text-ink-muted">Also: <span class="font-mono">GET /metadata</span>, <span class="font-mono">Patient?identifier=</span>, <span class="font-mono">MedicationRequest</span>, <span class="font-mono">DiagnosticReport?based-on=</span>, <span class="font-mono">POST</span> a Bundle, <span class="font-mono">$cancel</span>.</p>
          } @else {
            <p class="mt-3 text-sm text-ink-muted">Also: <span class="font-mono">GET /integrations/requests</span>, <span class="font-mono">GET /integrations/requests/&#123;reference&#125;</span>, <span class="font-mono">POST /integrations/requests/&#123;reference&#125;/cancel</span>, <span class="font-mono">GET /integrations/patients/&#123;SmartClinic ID&#125;</span>.</p>
          }
        </section>

        <p aria-live="polite" class="mt-4 text-sm font-semibold text-leaf-700">{{ copied() }}</p>
        @if (actionError()) { <p role="alert" class="mt-2 text-sm font-semibold text-clay-700">{{ actionError() }}</p> }
      }
    </main>
  `,
})
export class ProviderIntegrationsPageComponent {
  private readonly api = inject(ProviderIntegrationsApiService);
  private readonly fb = inject(FormBuilder);
  readonly membership = inject(ProviderMembershipService);

  readonly events = EVENTS;
  readonly overview = signal<IntegrationsOverview | null>(null);
  readonly deliveries = signal<readonly WebhookDeliveryView[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly awaitingApproval = signal(false);
  readonly creating = signal(false);
  readonly newKey = signal<{ key: string } | null>(null);
  readonly newSecret = signal<string | null>(null);
  readonly savingHook = signal(false);
  readonly testing = signal(false);
  readonly confirmingRevoke = signal<string | null>(null);
  readonly confirmingRemoveHook = signal(false);
  readonly copied = signal('');
  readonly actionError = signal('');

  readonly activeKeys = computed(() => (this.overview()?.apiKeys ?? []).filter((k) => !k.revokedAt));
  readonly revokedKeys = computed(() => (this.overview()?.apiKeys ?? []).filter((k) => !!k.revokedAt));

  readonly keyForm = this.fb.nonNullable.group({ name: ['', [Validators.required, Validators.maxLength(80)]] });
  readonly hookForm = this.fb.nonNullable.group({ url: ['', [Validators.required, Validators.pattern(/^https:\/\/\S+$/), Validators.maxLength(500)]] });

  readonly curlExample = [
    `curl -X POST ${this.api.base}/integrations/requests \\`,
    `  -H "Authorization: Bearer $SMARTCLINIC_KEY" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{"patientReference":"SCP-ABCD-1234","type":"LABORATORY",`,
    `       "diagnosticItems":[{"name":"Malaria parasite (MP)"}]}'`,
  ].join('\n');
  readonly format = signal<'json' | 'fhir'>('json');
  readonly fhirBase = `${this.api.base}/fhir/r4`;
  readonly fhirExample = [
    `curl -X POST ${this.fhirBase}/ServiceRequest \\`,
    `  -H "Authorization: Bearer $SMARTCLINIC_KEY" \\`,
    `  -H "Content-Type: application/fhir+json" \\`,
    `  -d '{"resourceType":"ServiceRequest","status":"active","intent":"order",`,
    `       "category":[{"coding":[{"system":"http://snomed.info/sct","code":"108252007"}]}],`,
    `       "code":{"text":"Malaria parasite (MP)"},`,
    `       "subject":{"reference":"Patient/SCP-ABCD-1234"}}'`,
  ].join('\n');

  constructor() {
    this.load();
  }

  load(): void {
    if (!this.membership.canManageTeam()) {
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.loadError.set(false);
    this.awaitingApproval.set(false);
    this.api
      .overview()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (overview) => {
          this.overview.set(overview);
          this.deliveries.set(overview.deliveries);
          if (overview.webhook) this.hookForm.setValue({ url: overview.webhook.url });
        },
        error: (e: unknown) => { this.awaitingApproval.set(isAwaitingProviderApproval(e)); this.loadError.set(true); },
      });
  }

  createKey(): void {
    if (this.keyForm.invalid || this.creating()) return;
    this.creating.set(true);
    this.actionError.set('');
    this.api
      .createKey(this.keyForm.getRawValue().name.trim())
      .pipe(finalize(() => this.creating.set(false)))
      .subscribe({
        next: (created) => {
          const { key, ...view } = created;
          this.newKey.set({ key });
          this.overview.update((o) => (o ? { ...o, apiKeys: [view, ...o.apiKeys] } : o));
          this.keyForm.reset({ name: '' });
        },
        error: (error) => this.actionError.set(this.message(error, 'The key couldn’t be created. Try again.')),
      });
  }

  revoke(key: ProviderApiKeyView): void {
    this.actionError.set('');
    this.api.revokeKey(key.id).subscribe({
      next: (updated) => {
        this.confirmingRevoke.set(null);
        this.overview.update((o) => (o ? { ...o, apiKeys: o.apiKeys.map((k) => (k.id === key.id ? updated : k)) } : o));
      },
      error: () => this.actionError.set('The key couldn’t be revoked. Try again.'),
    });
  }

  saveWebhook(rotateSecret: boolean): void {
    if (this.hookForm.invalid || this.savingHook()) {
      this.hookForm.markAllAsTouched();
      return;
    }
    this.savingHook.set(true);
    this.actionError.set('');
    this.api
      .saveWebhook(this.hookForm.getRawValue().url.trim(), rotateSecret)
      .pipe(finalize(() => this.savingHook.set(false)))
      .subscribe({
        next: (saved) => {
          if (saved.signingSecret) this.newSecret.set(saved.signingSecret);
          const now = new Date().toISOString();
          this.overview.update((o) =>
            o ? { ...o, webhook: { url: saved.url, isActive: saved.isActive, createdAt: o.webhook?.createdAt ?? now, updatedAt: now } } : o,
          );
        },
        error: (error) => this.actionError.set(this.message(error, 'The address couldn’t be saved. Try again.')),
      });
  }

  removeWebhook(): void {
    this.actionError.set('');
    this.api.removeWebhook().subscribe({
      next: () => {
        this.confirmingRemoveHook.set(false);
        this.newSecret.set(null);
        this.deliveries.set([]);
        this.hookForm.reset({ url: '' });
        this.overview.update((o) => (o ? { ...o, webhook: null } : o));
      },
      error: () => this.actionError.set('Updates couldn’t be stopped. Try again.'),
    });
  }

  test(): void {
    this.testing.set(true);
    this.actionError.set('');
    this.api
      .testWebhook()
      .pipe(finalize(() => this.testing.set(false)))
      .subscribe({
        next: (result) => this.deliveries.set(result.items),
        error: (error) => this.actionError.set(this.message(error, 'The test couldn’t be sent. Try again.')),
      });
  }

  deliveryLabel(d: WebhookDeliveryView): string {
    if (d.status === 'DELIVERED') return 'Delivered';
    if (d.status === 'FAILED') return d.lastStatusCode ? `Failed (${d.lastStatusCode})` : 'Failed';
    return d.attemptCount ? `Retrying${d.lastStatusCode ? ` (${d.lastStatusCode})` : ''}` : 'Sending';
  }

  deliveryTone(d: WebhookDeliveryView): string {
    if (d.status === 'DELIVERED') return 'bg-leaf-50 text-leaf-700 ring-leaf-100';
    if (d.status === 'FAILED') return 'bg-clay-50 text-clay-700 ring-clay-100';
    return 'bg-ochre-50 text-ochre-700 ring-ochre-100';
  }

  async copy(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.copied.set('Copied.');
    } catch {
      this.copied.set('Copy was unavailable. Select the text and copy it.');
    }
  }

  date(value: string): string {
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
  }

  private message(error: unknown, fallback: string): string {
    const text = (error as { error?: { message?: unknown } })?.error?.message;
    return typeof text === 'string' ? text : fallback;
  }
}

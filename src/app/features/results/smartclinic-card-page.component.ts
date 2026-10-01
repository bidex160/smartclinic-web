import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { PatientHealthBasics } from '../../core/models/health-basics.model';
import { PatientPortalProfile } from '../../core/models/patient-health-check-history.model';
import { HealthBasicsApiService } from '../../core/services/health-basics-api.service';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { QrCodeComponent } from '../../shared/components/qr-code.component';

interface WakeLockSentinelLike {
  release(): Promise<void>;
}

/**
 * The patient's SmartClinic card, made to be shown to a receptionist or nurse.
 * The QR code holds only the SmartClinic ID; health basics are shown on screen
 * to whoever the patient chooses to show, and are never stored on the device.
 */
@Component({
  selector: 'app-smartclinic-card-page',
  imports: [RouterLink, QrCodeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-md px-4 pb-10 pt-5 sm:pt-10">
      <a routerLink="/me/profile" class="text-sm font-semibold text-brand-700">← Me</a>

      @if (loading()) {
        <div role="status" class="mt-4 h-[32rem] animate-pulse rounded-[2rem] bg-sand-200"><span class="sr-only">Loading your card…</span></div>
      } @else if (!profile()) {
        <p role="alert" class="mt-6 rounded-2xl bg-clay-50 p-5 text-clay-700">Your SmartClinic card is unavailable right now. Check your connection and try again.</p>
      } @else if (profile(); as p) {
        <article class="relative mt-4 overflow-hidden rounded-[2rem] bg-ink p-6 text-white shadow-lift" aria-labelledby="card-holder" data-smartclinic-card>
          <div class="sc-motif pointer-events-none absolute inset-0 opacity-[0.07]" aria-hidden="true"></div>
          <div class="sc-weave absolute inset-x-0 top-0" aria-hidden="true"></div>
          <div class="relative">
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-2">
                <img src="/assets/fanvico.png" alt="" class="size-8 rounded-lg bg-white/10 p-0.5" />
                <span class="font-display text-lg font-semibold">SmartClinic</span>
              </span>
              <span class="text-[10px] font-semibold uppercase tracking-[0.18em] text-ochre-300">Patient card</span>
            </div>

            <h1 id="card-holder" class="font-display mt-5 text-[1.9rem] font-semibold leading-tight">{{ p.patient.givenName }} {{ p.patient.familyName }}</h1>
            @if (p.patient.dateOfBirth) {
              <p class="mt-0.5 text-sm text-white/70">Born {{ formatDate(p.patient.dateOfBirth) }}</p>
            }

            <div class="mx-auto mt-5 w-56 rounded-2xl bg-white p-2 shadow-lift">
              <app-qr-code [value]="p.patient.patientReference" [label]="'SmartClinic ID ' + p.patient.patientReference" />
            </div>
            <p class="mt-3 text-center font-mono text-2xl font-bold tracking-[0.12em]" data-card-id>{{ p.patient.patientReference }}</p>
            <p class="text-center text-xs text-white/60">SmartClinic ID</p>

            <dl class="mt-6 grid grid-cols-2 gap-3" data-card-basics>
              <div class="rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10">
                <dt class="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">Blood group</dt>
                <dd class="font-display mt-1 text-2xl font-semibold">{{ basics()?.bloodGroup ?? '—' }}</dd>
              </div>
              <div class="rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10">
                <dt class="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">Genotype</dt>
                <dd class="font-display mt-1 text-2xl font-semibold">{{ basics()?.genotype ?? '—' }}</dd>
              </div>
              <div class="col-span-2 rounded-2xl p-3 ring-1 {{ basics()?.allergies ? 'bg-clay-500/25 ring-clay-500/50' : 'bg-white/[0.07] ring-white/10' }}">
                <dt class="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">Allergies</dt>
                <dd class="mt-1 font-semibold">{{ basics()?.allergies ?? 'None recorded' }}</dd>
              </div>
              @if (basics()?.conditions) {
                <div class="col-span-2 rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10">
                  <dt class="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">Ongoing conditions</dt>
                  <dd class="mt-1 font-semibold">{{ basics()?.conditions }}</dd>
                </div>
              }
              @if (basics()?.emergencyContactPhone; as phone) {
                <div class="col-span-2 rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10">
                  <dt class="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">Emergency contact</dt>
                  <dd class="mt-1 font-semibold">
                    {{ basics()?.emergencyContactName ?? 'Contact' }}@if (basics()?.emergencyContactRelationship) { <span class="font-normal text-white/70"> ({{ basics()?.emergencyContactRelationship }})</span> }
                    · <a [href]="'tel:' + phone" class="text-ochre-300 underline underline-offset-2">{{ phone }}</a>
                  </dd>
                </div>
              }
            </dl>
            <p class="mt-4 text-[11px] leading-4 text-white/55">Health details are entered by the cardholder and are not clinically verified. The QR code contains only the SmartClinic ID.</p>
          </div>
        </article>

        @if (basicsUnavailable()) {
          <p role="status" class="mt-3 text-sm text-ink-muted">Your health basics couldn’t be loaded, so only your ID is shown.</p>
        } @else if (!hasBasics()) {
          <a routerLink="/me/profile" class="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-ochre-50 p-4 text-sm text-ochre-700 ring-1 ring-ochre-100">
            <span><strong class="font-semibold">Add your blood group, genotype and allergies</strong> so staff can help you faster.</span>
            <span aria-hidden="true">→</span>
          </a>
        }
        <div class="mt-4 flex flex-wrap gap-2">
          <button type="button" (click)="copyId(p.patient.patientReference)" class="min-h-11 rounded-full border border-ink/15 bg-white px-5 text-sm font-semibold text-ink hover:bg-sand-50">Copy ID</button>
          <a routerLink="/me/profile" class="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-brand-700 hover:bg-white">Edit details</a>
        </div>
        <p aria-live="polite" class="mt-2 text-sm text-leaf-700">{{ feedback() }}</p>
      }
    </main>
  `,
})
export class SmartClinicCardPageComponent {
  private readonly profileApi = inject(HealthCheckResultsApiService);
  private readonly basicsApi = inject(HealthBasicsApiService);
  private wakeLock: WakeLockSentinelLike | null = null;

  readonly loading = signal(true);
  readonly profile = signal<PatientPortalProfile | null>(null);
  readonly basics = signal<PatientHealthBasics | null>(null);
  readonly basicsUnavailable = signal(false);
  readonly feedback = signal('');

  constructor() {
    forkJoin({
      profile: this.profileApi.getMyProfile().pipe(catchError(() => of(null))),
      basics: this.basicsApi.get().pipe(
        catchError(() => {
          this.basicsUnavailable.set(true);
          return of(null);
        }),
      ),
    }).subscribe(({ profile, basics }) => {
      this.profile.set(profile);
      this.basics.set(basics);
      this.loading.set(false);
    });
    void this.keepScreenOn();
    inject(DestroyRef).onDestroy(() => void this.wakeLock?.release().catch(() => undefined));
  }

  hasBasics(): boolean {
    const b = this.basics();
    return !!b && !!(b.bloodGroup || b.genotype || b.allergies || b.conditions || b.emergencyContactPhone);
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
  }

  async copyId(reference: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(reference);
      this.feedback.set('SmartClinic ID copied.');
    } catch {
      this.feedback.set('Copy was unavailable. Read the ID from the card.');
    }
  }

  /** Keep the screen awake while the card is being shown at a desk, where supported. */
  private async keepScreenOn(): Promise<void> {
    const wakeLock = (navigator as Navigator & { wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinelLike> } }).wakeLock;
    if (!wakeLock) return;
    try {
      this.wakeLock = await wakeLock.request('screen');
    } catch {
      // Not allowed (battery saver, permissions); the card still works.
    }
  }
}

import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { LocationFieldsComponent } from '../location-fields.component';
import {
  COMMITMENTS,
  ENTRANCES,
  GROUP_TYPES,
  Mode,
  MODES,
  PROVIDER_TYPES,
  RegistrationResult,
  ROLES,
  whatsappNumber,
} from '../join-portal.types';

type Status = 'idle' | 'submitting' | 'success' | 'error';
type ReferralStatus = 'idle' | 'checking' | 'valid' | 'invalid';

@Component({
  selector: 'app-join-portal',
  standalone: true,
  imports: [CommonModule, LocationFieldsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './join-portal.component.html',
})
export class JoinPortalComponent implements AfterViewInit {
  private http = inject(HttpClient);

  readonly modes = MODES;
  readonly roles = ROLES;
  readonly commitments = COMMITMENTS;
  readonly providerTypes = PROVIDER_TYPES;
  readonly groupTypes = GROUP_TYPES;
  readonly entrances = ENTRANCES;

  mode = signal<Mode>('Builder');
  status = signal<Status>('idle');
  registration = signal<RegistrationResult | null>(null);
  referralCodeInput = signal('');
  referrerName = signal('');
  referralStatus = signal<ReferralStatus>('idle');

  @ViewChild('joinForm') formRef?: ElementRef<HTMLFormElement>;

  get isEntity(): boolean {
    const m = this.mode();
    return m === 'Organisation' || m === 'Group' || m === 'Family';
  }

  ngAfterViewInit(): void {
    // Mirrors the original's useEffect: read ?type= and ?ref= from the URL
    // on mount, deferred a tick the same way setTimeout(…, 0) did.
    setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const requested = params.get('type');
      const referredBy = (params.get('ref') || '').trim().toUpperCase();
      if (referredBy) {
        this.referralCodeInput.set(referredBy);
        void this.checkReferrer(referredBy);
      }
      if (this.modes.includes(requested as Mode)) {
        this.mode.set(requested as Mode);
      }
    }, 0);
  }

  selectMode(m: Mode): void {
    this.mode.set(m);
    this.status.set('idle');
  }

  async checkReferrer(value: string): Promise<void> {
    const code = value.trim().toUpperCase();
    if (!code) {
      this.referrerName.set('');
      this.referralStatus.set('idle');
      return;
    }
    this.referralStatus.set('checking');
    this.http
      .get<{ name: string }>(`/api/referrer?code=${encodeURIComponent(code)}`)
      .pipe(
        catchError(() => {
          this.referrerName.set('');
          this.referralStatus.set('invalid');
          return of(null);
        }),
      )
      .subscribe((data) => {
        if (data) {
          this.referrerName.set(data.name);
          this.referralStatus.set('valid');
        }
      });
  }

  onReferralInput(value: string): void {
    this.referralCodeInput.set(value.toUpperCase());
    this.referralStatus.set('idle');
    this.referrerName.set('');
  }

  async submit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.status.set('submitting');
    const form = event.currentTarget as HTMLFormElement;
    try {
      const values: Record<string, unknown> = Object.fromEntries(
        new FormData(form).entries(),
      );
      values['accountType'] = this.mode();
      values['referredByCode'] = this.referralCodeInput();

      const data = await fetch('/api/join', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(values),
      }).then((response) => {
        if (!response.ok) throw new Error('Registration failed');
        return response.json() as Promise<RegistrationResult>;
      });

      this.registration.set(data);
      form.reset();
      this.status.set('success');
      document.querySelector('#join-portal')?.scrollIntoView({ behavior: 'smooth' });
    } catch {
      this.status.set('error');
    }
  }

  resetToForm(): void {
    this.registration.set(null);
    this.status.set('idle');
  }

  copy(text: string): void {
    navigator.clipboard.writeText(text);
  }

  get referralCode(): string {
    return this.registration()?.referralCode ?? '';
  }

  get link(): string {
    const suffix = this.mode() === 'Professional' ? '&type=Professional' : '';
    return `https://join.smartclinicnetwork.com/?ref=${this.referralCode}${suffix}#join-portal`;
  }

  get confirmationText(): string {
    const r = this.registration();
    if (!r) return '';
    return `Hello ${r.registeredName}, your Smart Clinic Exchange registration was successful. Please tap this secure link to confirm it: ${r.confirmationLink}`;
  }

  get confirmationEmail(): string {
    const r = this.registration();
    if (!r) return '';
    const subject = encodeURIComponent('Confirm your Smart Clinic Exchange registration');
    const body = encodeURIComponent(this.confirmationText);
    return `mailto:${encodeURIComponent(r.email)}?subject=${subject}&body=${body}`;
  }

  get confirmationWhatsApp(): string {
    const r = this.registration();
    if (!r) return '';
    return `https://wa.me/${whatsappNumber(r.phone)}?text=${encodeURIComponent(this.confirmationText)}`;
  }

  get shareWhatsAppLink(): string {
    return `https://wa.me/?text=${encodeURIComponent(
      `Join me in building the Smart Clinic Network: ${this.link}`,
    )}`;
  }

  get successTitle(): string {
    switch (this.mode()) {
      case 'Builder':
        return 'Welcome to the founding community.';
      case 'Professional':
        return 'Your Clinical Builder profile is underway.';
      case 'Individual':
        return 'This individual is now connected.';
      case 'Family':
        return 'This family is now connected.';
      case 'Group':
        return 'This group has joined the network.';
      default:
        return 'This care provider has joined the network.';
    }
  }
}

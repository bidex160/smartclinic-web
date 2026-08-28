import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthSessionService } from '../../core/services/auth-session.service';

@Component({
  selector: 'app-patient-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <aside
      class="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-brand-900 p-5 text-white lg:flex"
    >
      <a routerLink="/" class="flex items-center gap-3 rounded-lg focus:ring-4 focus:ring-white/30"
        ><span class="grid size-10 place-items-center rounded-xl bg-white font-bold text-brand-800"
          >S</span
        ><span
          ><strong class="block">SmartClinic</strong
          ><small class="uppercase tracking-wider text-brand-100">Patient Portal</small></span
        ></a
      >
      <nav class="mt-9 grid gap-2" aria-label="Patient portal">
        @for (item of navigation; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="bg-white/15"
            [routerLinkActiveOptions]="{ exact: item.exact }"
            class="min-h-11 rounded-xl px-4 py-3 font-semibold hover:bg-white/10 focus:ring-4 focus:ring-white/30"
            >{{ item.label }}</a
          >
        }
      </nav>
      <button
        type="button"
        (click)="logout()"
        class="mt-auto min-h-11 rounded-xl border border-white/30 px-4 text-left font-bold focus:ring-4 focus:ring-white/30"
      >
        Sign out
      </button>
    </aside>
    <header class="border-b bg-white px-5 py-4 lg:hidden">
      <div class="flex items-center justify-between">
        <a routerLink="/me/dashboard" class="font-bold text-brand-900"
          >SmartClinic · Patient Portal</a
        ><button
          type="button"
          (click)="menuOpen.set(!menuOpen())"
          [attr.aria-expanded]="menuOpen()"
          aria-controls="patient-mobile-nav"
          class="min-h-11 rounded-lg border px-4 font-bold"
        >
          Menu
        </button>
      </div>
      @if (menuOpen()) {
        <nav id="patient-mobile-nav" class="mt-4 grid gap-2" aria-label="Patient portal mobile">
          @for (item of navigation; track item.route) {
            <a
              [routerLink]="item.route"
              (click)="menuOpen.set(false)"
              class="rounded-lg px-3 py-3 font-bold text-brand-800"
              >{{ item.label }}</a
            >
          }
          <button
            type="button"
            (click)="logout()"
            class="rounded-lg px-3 py-3 text-left font-bold text-brand-800"
          >
            Sign out
          </button>
        </nav>
      }
    </header>
    <div class="min-h-screen bg-slate-50 lg:ml-64"><router-outlet /></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientLayoutComponent {
  private readonly session = inject(AuthSessionService);
  readonly menuOpen = signal(false);
  readonly navigation = [
    { label: 'Dashboard', route: '/me/dashboard', exact: true },
    { label: 'My Health Checks', route: '/me/health-checks', exact: true },
    { label: 'Book Health Check', route: '/me/book', exact: true },
    { label: 'My Care', route: '/me/care', exact: false },
    { label: 'FastTrack', route: '/me/fasttrack', exact: false },
    { label: 'My Impact', route: '/me/impact', exact: true },
    { label: 'Referrals & Rewards', route: '/me/referrals', exact: true },
    { label: 'Profile', route: '/me/profile', exact: true },
  ] as const;
  logout(): void {
    this.session.logout().subscribe();
  }
}

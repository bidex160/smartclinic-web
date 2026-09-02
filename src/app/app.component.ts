import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthStateService } from './core/services/auth-state.service';
import { AuthSessionService } from './core/services/auth-session.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly authState = inject(AuthStateService);
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);

  readonly menuOpen = signal(false);

  readonly currentUrl = signal(this.router.url);

  readonly portalRoute = computed(() => {
    const url = this.currentUrl();

    return url.startsWith('/admin') || url.startsWith('/provider') || url.startsWith('/me');
  });
  readonly mySmartClinicRoute = computed(() =>
    this.authState.isPatient() ? '/me/dashboard' : '/login',
  );

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects);
        this.menuOpen.set(false);
      });
  }

  logout(): void {
    this.menuOpen.set(false);
    this.session.logout().subscribe();
  }
}

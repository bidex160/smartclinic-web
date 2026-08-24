import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStateService } from './core/services/auth-state.service';
import { AuthSessionService } from './core/services/auth-session.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly authState = inject(AuthStateService);
  private readonly session = inject(AuthSessionService);
  readonly menuOpen = signal(false);

  logout(): void {
    this.menuOpen.set(false);
    this.session.logout().subscribe();
  }
}

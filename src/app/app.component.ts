import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthStateService } from './core/services/auth-state.service';
import { AuthSessionService } from './core/services/auth-session.service';
import { filter } from 'rxjs';
import { SmartClinicCompanionComponent } from "./shared/components/smartclinic-companion/smartclinic-companion.component";
import { LocationDataService } from './core/services/location-data.service';
import { AccountLocaleSync, LocalePreferencesService } from './core/services/locale-preferences.service';
import { LocalePickerComponent } from './shared/components/locale-picker/locale-picker.component';
import { TranslatePipe } from './core/services/translation.service';
import { NudgesApiService } from './core/services/family-kids-api.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet, SmartClinicCompanionComponent, LocalePickerComponent, TranslatePipe],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly authState = inject(AuthStateService);
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly locationDataService = inject(LocationDataService);
  private readonly locale = inject(LocalePreferencesService);
  private readonly accountLocale = inject(AccountLocaleSync);
  private readonly nudges = inject(NudgesApiService);
  private lastSyncedLanguage: string | null = null;


  readonly menuOpen = signal(false);

  readonly currentUrl = signal(this.router.url);

  readonly portalRoute = computed(() => {
    const url = this.currentUrl();

    return url.startsWith('/admin') || url.startsWith('/provider') || url.startsWith('/me');
  });
  readonly mySmartClinicRoute = computed(() =>
    this.authState.isPatient() ? '/me/dashboard' : '/login',
  );

   readonly patientPortalRoute = computed(() => this.currentUrl().startsWith('/me'));

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects);
        this.menuOpen.set(false);
        // A link that names a country or language (e.g. /register?market=RW&lang=rw) is remembered.
        const query = this.router.parseUrl(event.urlAfterRedirects).queryParamMap;
        if (query.has('market') || query.has('lang')) this.locale.applyQuery(query.get('market'), query.get('lang'));
        if (this.authState.isPatient()) this.accountLocale.sync();
      });
    void this.locationDataService.ready().catch(() => undefined);
    // Daily reminders are written on the server, so it needs to know the person's language.
    effect(() => {
      const language = this.locale.language();
      const patient = this.authState.isPatient();
      untracked(() => {
        if (!patient || !this.nudges.available() || language === this.lastSyncedLanguage) return;
        const first = this.lastSyncedLanguage === null;
        this.lastSyncedLanguage = language;
        if (first && language === 'en') return; // default already
        this.nudges.update({ language, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos' }).subscribe({ error: () => undefined });
      });
    });
  }

  logout(): void {
    this.menuOpen.set(false);
    this.session.logout().subscribe();
  }
}

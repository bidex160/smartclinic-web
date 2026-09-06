import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withPreloading } from '@angular/router';

import { routes } from './app.routes';
import { API_CONFIG } from './core/config/api-config.token';
import { PUBLIC_SITE_CONFIG } from './core/config/public-site-config.token';
import { environment } from '../environments/environment';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthSessionService } from './core/services/auth-session.service';
import { SelectivePreloadingStrategy } from './core/config/selective-preloadin-strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withPreloading(SelectivePreloadingStrategy)),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    { provide: API_CONFIG, useValue: environment.api },
    { provide: PUBLIC_SITE_CONFIG, useValue: environment.publicSite },
    provideAppInitializer(() => inject(AuthSessionService).restoreSession()),
  ],
};

import { InjectionToken } from '@angular/core';

export type ExternalNavigator = (url: string) => void;

export const EXTERNAL_NAVIGATOR = new InjectionToken<ExternalNavigator>('EXTERNAL_NAVIGATOR', {
  providedIn: 'root',
  factory: () => (url: string) => window.location.assign(url),
});

import { InjectionToken } from '@angular/core';

export interface PublicSiteConfig {
  readonly whatsappUrl: string | null;
}

export const PUBLIC_SITE_CONFIG = new InjectionToken<PublicSiteConfig>(
  'SmartClinic public site configuration',
);

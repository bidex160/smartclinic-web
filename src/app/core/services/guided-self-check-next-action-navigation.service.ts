import { Injectable } from '@angular/core';
import { GuidedSelfCheckNextAction } from '../models/guided-self-check.model';
@Injectable({ providedIn: 'root' })
export class GuidedSelfCheckNextActionNavigationService {
  target(
    action: GuidedSelfCheckNextAction,
  ): { commands: string[]; queryParams?: Record<string, string> } | null {
    if (action.cta.type === 'HEALTH_CHECK_PACKAGE' && action.cta.packageCode === 'ESSENTIAL')
      return { commands: ['/me/book'], queryParams: { package: 'ESSENTIAL' } };
    if (
      (action.cta.type === 'FIND_CARE' || action.cta.type === 'URGENT_ASSESSMENT') &&
      action.cta.domain === 'CARE_REQUEST'
    )
      return { commands: ['/request-care'] };
    if (action.cta.type === 'NONE') return { commands: ['/me/health-passport'] };
    return null;
  }
}

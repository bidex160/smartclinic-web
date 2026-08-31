import { GuidedSelfCheckNextAction } from '../models/guided-self-check.model';
import { GuidedSelfCheckNextActionNavigationService } from './guided-self-check-next-action-navigation.service';
describe('GuidedSelfCheckNextActionNavigationService', () => {
  const service = new GuidedSelfCheckNextActionNavigationService();
  const action = (
    type: GuidedSelfCheckNextAction['cta']['type'],
    extra: Record<string, string> = {},
  ): GuidedSelfCheckNextAction =>
    ({
      type: 'FIND_CARE',
      source: 'AI_ANALYSIS',
      titleKey: 'x',
      title: 'x',
      message: 'x',
      cta: { type, ...extra },
      selectedAt: '2026-01-01',
    }) as GuidedSelfCheckNextAction;
  it('maps semantic Health Check and Find Care targets centrally', () => {
    expect(service.target(action('HEALTH_CHECK_PACKAGE', { packageCode: 'ESSENTIAL' }))).toEqual({
      commands: ['/me/book'],
      queryParams: { package: 'ESSENTIAL' },
    });
    expect(service.target(action('FIND_CARE', { domain: 'CARE_REQUEST' }))).toEqual({
      commands: ['/request-care'],
    });
    expect(service.target(action('URGENT_ASSESSMENT', { domain: 'CARE_REQUEST' }))).toEqual({
      commands: ['/request-care'],
    });
  });
  it('does not invent a professional-contact route', () =>
    expect(service.target(action('PROFESSIONAL_CONTACT'))).toBeNull());
});

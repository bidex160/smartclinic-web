import { routes } from '../../app.routes';
import { authenticatedUserGuard } from '../results/authenticated-user.guard';
import { providerGuard } from '../provider/provider-auth.guard';

describe('Health Records routing', () => {
  it('registers guarded patient list and detail routes', () => {
    const me = routes.find(route => route.path === 'me');
    const list = me?.children?.find(route => route.path === 'health-records');
    const detail = me?.children?.find(route => route.path === 'health-records/:reference');
    expect(list?.canActivate).toContain(authenticatedUserGuard);
    expect(detail?.canActivate).toContain(authenticatedUserGuard);
  });
  it('registers guarded sharing, audit and provider shared-record routes', () => {
    const me = routes.find(route => route.path === 'me');
    for (const path of ['health-records/sharing', 'health-records/sharing/new', 'health-records/sharing/:reference', 'health-records/access-history']) {
      expect(me?.children?.find(route => route.path === path)?.canActivate).toContain(authenticatedUserGuard);
    }
    const provider = routes.find(route => route.path === 'provider');
    for (const path of ['shared-health-records', 'shared-health-records/:reference']) {
      expect(provider?.children?.find(route => route.path === path)?.canActivate).toContain(providerGuard);
    }
  });
});

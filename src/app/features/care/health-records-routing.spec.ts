import { routes } from '../../app.routes';
import { authenticatedUserGuard } from '../results/authenticated-user.guard';

describe('Health Records routing', () => {
  it('registers guarded patient list and detail routes', () => {
    const me = routes.find(route => route.path === 'me');
    const list = me?.children?.find(route => route.path === 'health-records');
    const detail = me?.children?.find(route => route.path === 'health-records/:reference');
    expect(list?.canActivate).toContain(authenticatedUserGuard);
    expect(detail?.canActivate).toContain(authenticatedUserGuard);
  });
});

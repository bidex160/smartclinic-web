import { routes } from '../../app.routes';
import { adminPricingGuard } from './admin-auth.guards';

describe('Admin Care Services routing', () => {
  it('registers /admin/care-services under the existing guarded Admin layout', () => {
    const admin = routes.find(route => route.path === 'admin');
    const careServices = admin?.children?.find(route => route.path === 'care-services');
    expect(careServices).toBeDefined();
    expect(careServices?.canActivate).toContain(adminPricingGuard);
  });
});

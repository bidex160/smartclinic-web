import { routes } from '../../app.routes';
import { adminPricingGuard } from './admin-auth.guards';
describe('Admin commission settings routing', () => {
  it('registers the route under the guarded Admin layout', () => { const route = routes.find(item => item.path === 'admin')?.children?.find(item => item.path === 'commission-settings'); expect(route).toBeDefined(); expect(route?.canActivate).toContain(adminPricingGuard); });
});

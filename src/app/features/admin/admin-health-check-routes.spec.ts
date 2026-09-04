import { routes } from '../../app.routes';
import { adminOnlyGuard } from './admin-auth.guards';

describe('Admin Health Check catalogue routes', () => {
  it('registers all catalogue routes under the Admin layout with the ADMIN-only guard', () => {
    const admin = routes.find((route) => route.path === 'admin');
    const expected = [
      'health-checks/packages',
      'health-checks/packages/new',
      'health-checks/packages/:code',
      'health-checks/clinical-contents',
      'health-checks/clinical-contents/:reference',
    ];
    for (const path of expected)
      expect(admin?.children?.find((route) => route.path === path)?.canActivate).toEqual([
        adminOnlyGuard,
      ]);
  });
});

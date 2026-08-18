import { Routes } from '@angular/router';
import {
  hasBookingSelectionsGuard,
  hasCompleteBookingDraftGuard,
  hasSelectedPackageGuard,
} from './features/booking/booking-flow.guards';
import { adminPricingGuard } from './features/admin/admin-auth.guards';
import { providerGuard } from './features/provider/provider-auth.guard';
import { authenticatedUserGuard } from './features/results/authenticated-user.guard';

export const routes: Routes = [
  {
    path: '',
    title: 'SmartClinic | Your health check, made simple',
    loadComponent: () =>
      import('./features/home/home-page.component').then(
        (component) => component.HomePageComponent,
      ),
  },
  {
    path: 'health-check/packages',
    title: 'Choose a Smart Health Check | SmartClinic',
    loadComponent: () =>
      import('./features/health-check/package-selection-page.component').then(
        (component) => component.PackageSelectionPageComponent,
      ),
  },
  {
    path: 'book/fulfilment',
    title: 'Choose fulfilment | SmartClinic',
    canActivate: [hasSelectedPackageGuard],
    loadComponent: () =>
      import('./features/booking/fulfilment-selection-page.component').then(
        (component) => component.FulfilmentSelectionPageComponent,
      ),
  },
  {
    path: 'book/details',
    title: 'Booking details | SmartClinic',
    canActivate: [hasBookingSelectionsGuard],
    loadComponent: () =>
      import('./features/booking/booking-details-page.component').then(
        (component) => component.BookingDetailsPageComponent,
      ),
  },
  {
    path: 'book/review',
    title: 'Review your booking | SmartClinic',
    canActivate: [hasCompleteBookingDraftGuard],
    loadComponent: () =>
      import('./features/booking/booking-review-page.component').then(
        (component) => component.BookingReviewPageComponent,
      ),
  },
  {
    path: 'book/confirmation/:reference',
    title: 'Booking confirmation | SmartClinic',
    loadComponent: () =>
      import('./features/booking/booking-confirmation-page.component').then(
        (component) => component.BookingConfirmationPageComponent,
      ),
  },
  {
    path: 'me/link-health-history',
    title: 'Link existing health history | SmartClinic',
    canActivate: [authenticatedUserGuard],
    loadComponent: () =>
      import('./features/results/link-health-history-page.component').then(
        (component) => component.LinkHealthHistoryPageComponent,
      ),
  },
  {
    path: 'me/health-checks',
    title: 'My Health Checks | SmartClinic',
    canActivate: [authenticatedUserGuard],
    loadComponent: () =>
      import('./features/results/my-health-checks-page.component').then(
        (component) => component.MyHealthChecksPageComponent,
      ),
  },
  {
    path: 'me/health-checks/:bookingReference/results',
    title: 'My Smart Health Check result | SmartClinic',
    canActivate: [authenticatedUserGuard],
    loadComponent: () =>
      import('./features/results/registered-health-check-result-page.component').then(
        (component) => component.RegisteredHealthCheckResultPageComponent,
      ),
  },
  {
    path: 'health-results/:token',
    title: 'Smart Health Check result | SmartClinic',
    loadComponent: () =>
      import('./features/results/guest-health-check-result-page.component').then(
        (component) => component.GuestHealthCheckResultPageComponent,
      ),
  },
  {
    path: 'admin/login',
    title: 'Staff sign in | SmartClinic',
    loadComponent: () =>
      import('./features/admin/admin-login-page.component').then(
        (component) => component.AdminLoginPageComponent,
      ),
  },
  {
    path: 'provider/access-denied',
    title: 'Provider access required | SmartClinic',
    loadComponent: () =>
      import('./features/provider/provider-access-denied-page.component').then(
        (component) => component.ProviderAccessDeniedPageComponent,
      ),
  },
  {
    path: 'provider/setup/:token',
    title: 'Provider account setup | SmartClinic',
    loadComponent: () =>
      import('./features/provider/provider-setup-page.component').then(
        (component) => component.ProviderSetupPageComponent,
      ),
  },
  {
    path: 'provider/offers',
    title: 'My offers | SmartClinic',
    canActivate: [providerGuard],
    loadComponent: () =>
      import('./features/provider/provider-offers-page.component').then(
        (component) => component.ProviderOffersPageComponent,
      ),
  },
  {
    path: 'provider/offers/:id',
    title: 'Offer details | SmartClinic',
    canActivate: [providerGuard],
    loadComponent: () =>
      import('./features/provider/provider-offer-detail-page.component').then(
        (component) => component.ProviderOfferDetailPageComponent,
      ),
  },
  {
    path: 'provider/bookings/:reference/health-check',
    title: 'Smart Health Check encounter | SmartClinic',
    canActivate: [providerGuard],
    loadComponent: () =>
      import('./features/provider/provider-health-check-page.component').then(
        (component) => component.ProviderHealthCheckPageComponent,
      ),
  },
  {
    path: 'admin/access-denied',
    title: 'Access denied | SmartClinic',
    loadComponent: () =>
      import('./features/admin/admin-access-denied-page.component').then(
        (component) => component.AdminAccessDeniedPageComponent,
      ),
  },
  {
    path: 'admin/package-prices',
    title: 'Package pricing | SmartClinic',
    canActivate: [adminPricingGuard],
    loadComponent: () =>
      import('./features/admin/package-prices-admin-page.component').then(
        (component) => component.PackagePricesAdminPageComponent,
      ),
  },
  {
    path: 'admin/providers',
    title: 'Providers | SmartClinic',
    canActivate: [adminPricingGuard],
    loadComponent: () =>
      import('./features/admin/providers-admin-page.component').then(
        (component) => component.ProvidersAdminPageComponent,
      ),
  },
  {
    path: 'admin/providers/:id',
    title: 'Provider details | SmartClinic',
    canActivate: [adminPricingGuard],
    loadComponent: () =>
      import('./features/admin/provider-admin-detail-page.component').then(
        (component) => component.ProviderAdminDetailPageComponent,
      ),
  },
  {
    path: 'admin/matching-queue',
    title: 'Provider matching queue | SmartClinic',
    canActivate: [adminPricingGuard],
    loadComponent: () =>
      import('./features/admin/matching-queue-page.component').then(
        (component) => component.MatchingQueuePageComponent,
      ),
  },
  {
    path: 'admin/provider-assignments',
    title: 'Provider assignments | SmartClinic',
    canActivate: [adminPricingGuard],
    loadComponent: () =>
      import('./features/admin/provider-assignments-page.component').then(
        (component) => component.ProviderAssignmentsPageComponent,
      ),
  },
  {
    path: 'admin/bookings/:reference',
    title: 'Operational booking detail | SmartClinic',
    canActivate: [adminPricingGuard],
    loadComponent: () =>
      import('./features/admin/admin-booking-detail-page.component').then(
        (component) => component.AdminBookingDetailPageComponent,
      ),
  },
  {
    path: 'admin/provider-assignments/:id',
    title: 'Provider assignment details | SmartClinic',
    canActivate: [adminPricingGuard],
    loadComponent: () =>
      import('./features/admin/provider-assignment-detail-page.component').then(
        (component) => component.ProviderAssignmentDetailPageComponent,
      ),
  },
  {
    path: '**',
    title: 'Page not found | SmartClinic',
    loadComponent: () =>
      import('./features/not-found/not-found-page.component').then(
        (component) => component.NotFoundPageComponent,
      ),
  },
];

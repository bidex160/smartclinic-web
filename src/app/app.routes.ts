import { Routes } from '@angular/router';
import {
  hasBookingSelectionsGuard,
  hasCompleteBookingDraftGuard,
  hasSelectedPackageGuard,
} from './features/booking/booking-flow.guards';
import { adminPricingGuard } from './features/admin/admin-auth.guards';
import { providerGuard } from './features/provider/provider-auth.guard';
import { authenticatedUserGuard } from './features/results/authenticated-user.guard';
import { AdminLayoutComponent } from './features/admin/admin-layout.component';
import { ProviderLayoutComponent } from './features/provider/provider-layout.component';
import { PatientLayoutComponent } from './features/results/patient-layout.component';

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
    path: 'register',
    title: 'Create a patient account | SmartClinic',
    loadComponent: () =>
      import('./features/auth/patient-register-page.component').then(
        (component) => component.PatientRegisterPageComponent,
      ),
  },
  {
    path: 'me',
    component: PatientLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'access-denied',
        loadComponent: () =>
          import('./features/results/patient-access-denied-page.component').then(
            (c) => c.PatientAccessDeniedPageComponent,
          ),
      },
      {
        path: 'dashboard',
        title: 'Patient dashboard | SmartClinic',
        canActivate: [authenticatedUserGuard],
        loadComponent: () =>
          import('./features/results/patient-dashboard-page.component').then(
            (c) => c.PatientDashboardPageComponent,
          ),
      },
      {
        path: 'profile',
        title: 'My profile | SmartClinic',
        canActivate: [authenticatedUserGuard],
        loadComponent: () =>
          import('./features/results/patient-profile-page.component').then(
            (c) => c.PatientProfilePageComponent,
          ),
      },
      {
        path: 'book',
        title: 'Book a Health Check | SmartClinic',
        canActivate: [authenticatedUserGuard],
        loadComponent: () =>
          import('./features/results/patient-booking-page.component').then(
            (c) => c.PatientBookingPageComponent,
          ),
      },
      {
        path: 'link-health-history',
        title: 'Link existing health history | SmartClinic',
        canActivate: [authenticatedUserGuard],
        loadComponent: () =>
          import('./features/results/link-health-history-page.component').then(
            (c) => c.LinkHealthHistoryPageComponent,
          ),
      },
      {
        path: 'health-checks',
        title: 'My Health Checks | SmartClinic',
        canActivate: [authenticatedUserGuard],
        loadComponent: () =>
          import('./features/results/my-health-checks-page.component').then(
            (c) => c.MyHealthChecksPageComponent,
          ),
      },
      {
        path: 'health-checks/:reference',
        title: 'Health Check detail | SmartClinic',
        canActivate: [authenticatedUserGuard],
        loadComponent: () =>
          import('./features/results/patient-health-check-detail-page.component').then(
            (c) => c.PatientHealthCheckDetailPageComponent,
          ),
      },
      {
        path: 'health-checks/:bookingReference/results',
        title: 'My Smart Health Check result | SmartClinic',
        canActivate: [authenticatedUserGuard],
        loadComponent: () =>
          import('./features/results/registered-health-check-result-page.component').then(
            (c) => c.RegisteredHealthCheckResultPageComponent,
          ),
      },
    ],
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
    path: 'provider/register',
    title: 'Provider application | SmartClinic',
    loadComponent: () =>
      import('./features/provider/provider-register-page.component').then(
        (component) => component.ProviderRegisterPageComponent,
      ),
  },

  {
    path: 'provider',
    component: ProviderLayoutComponent,
    children: [
      {
        path: 'access-denied',
        title: 'Provider access required | SmartClinic',
        loadComponent: () =>
          import('./features/provider/provider-access-denied-page.component').then(
            (component) => component.ProviderAccessDeniedPageComponent,
          ),
      },
      {
        path: 'setup/:token',
        title: 'Provider account setup | SmartClinic',
        loadComponent: () =>
          import('./features/provider/provider-setup-page.component').then(
            (component) => component.ProviderSetupPageComponent,
          ),
      },
      {
        path: 'dashboard',
        title: 'Provider dashboard | SmartClinic',
        canActivate: [providerGuard],
        loadComponent: () =>
          import('./features/provider/provider-dashboard-page.component').then(
            (component) => component.ProviderDashboardPageComponent,
          ),
      },
      {
        path: 'profile',
        title: 'Provider onboarding profile | SmartClinic',
        canActivate: [providerGuard],
        loadComponent: () =>
          import('./features/provider/provider-profile-page.component').then(
            (component) => component.ProviderProfilePageComponent,
          ),
      },
      {
        path: 'appointments',
        title: 'Provider appointments | SmartClinic',
        canActivate: [providerGuard],
        loadComponent: () =>
          import('./features/provider/provider-appointments-page.component').then(
            (component) => component.ProviderAppointmentsPageComponent,
          ),
      },
      {
        path: 'offers',
        title: 'My offers | SmartClinic',
        canActivate: [providerGuard],
        loadComponent: () =>
          import('./features/provider/provider-offers-page.component').then(
            (component) => component.ProviderOffersPageComponent,
          ),
      },
      {
        path: 'offers/:id',
        title: 'Offer details | SmartClinic',
        canActivate: [providerGuard],
        loadComponent: () =>
          import('./features/provider/provider-offer-detail-page.component').then(
            (component) => component.ProviderOfferDetailPageComponent,
          ),
      },
      {
        path: 'bookings/:reference/health-check',
        title: 'Smart Health Check encounter | SmartClinic',
        canActivate: [providerGuard],
        loadComponent: () =>
          import('./features/provider/provider-health-check-page.component').then(
            (component) => component.ProviderHealthCheckPageComponent,
          ),
      },
    ],
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Operations dashboard | SmartClinic',
        canActivate: [adminPricingGuard],
        loadComponent: () =>
          import('./features/admin/admin-dashboard-page.component').then(
            (component) => component.AdminDashboardPageComponent,
          ),
      },
      {
        path: 'access-denied',
        title: 'Access denied | SmartClinic',
        loadComponent: () =>
          import('./features/admin/admin-access-denied-page.component').then(
            (component) => component.AdminAccessDeniedPageComponent,
          ),
      },
      {
        path: 'package-prices',
        title: 'Package pricing | SmartClinic',
        canActivate: [adminPricingGuard],
        loadComponent: () =>
          import('./features/admin/package-prices-admin-page.component').then(
            (component) => component.PackagePricesAdminPageComponent,
          ),
      },
      {
        path: 'providers',
        title: 'Providers | SmartClinic',
        canActivate: [adminPricingGuard],
        loadComponent: () =>
          import('./features/admin/providers-admin-page.component').then(
            (component) => component.ProvidersAdminPageComponent,
          ),
      },
      {
        path: 'providers/:id',
        title: 'Provider details | SmartClinic',
        canActivate: [adminPricingGuard],
        loadComponent: () =>
          import('./features/admin/provider-admin-detail-page.component').then(
            (component) => component.ProviderAdminDetailPageComponent,
          ),
      },
      {
        path: 'matching-queue',
        title: 'Provider matching queue | SmartClinic',
        canActivate: [adminPricingGuard],
        loadComponent: () =>
          import('./features/admin/matching-queue-page.component').then(
            (component) => component.MatchingQueuePageComponent,
          ),
      },
      {
        path: 'provider-assignments',
        title: 'Provider assignments | SmartClinic',
        canActivate: [adminPricingGuard],
        loadComponent: () =>
          import('./features/admin/provider-assignments-page.component').then(
            (component) => component.ProviderAssignmentsPageComponent,
          ),
      },
      {
        path: 'bookings/:reference',
        title: 'Operational booking detail | SmartClinic',
        canActivate: [adminPricingGuard],
        loadComponent: () =>
          import('./features/admin/admin-booking-detail-page.component').then(
            (component) => component.AdminBookingDetailPageComponent,
          ),
      },
      {
        path: 'provider-assignments/:id',
        title: 'Provider assignment details | SmartClinic',
        canActivate: [adminPricingGuard],
        loadComponent: () =>
          import('./features/admin/provider-assignment-detail-page.component').then(
            (component) => component.ProviderAssignmentDetailPageComponent,
          ),
      },
    ],
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

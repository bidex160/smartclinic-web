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
    path: 'join',
    title: 'Choose a Smart Health Check | SmartClinic',
    loadComponent: () =>
      import('./features/join/join.component').then((component) => component.JoinComponent),
  },
  {
    path: 'request-care',
    title: 'Find Care | SmartClinic',
    loadComponent: () =>
      import('./features/care/find-care-page.component').then((c) => c.FindCarePageComponent),
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
    path: 'login',
    title: 'Sign in to My SmartClinic | SmartClinic',
    loadComponent: () =>
      import('./features/auth/login-page.component').then(
        (component) => component.LoginPageComponent,
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
        path: 'referrals',
        title: 'Referrals & Rewards | SmartClinic',
        canActivate: [authenticatedUserGuard],
        loadComponent: () =>
          import('./features/results/referrals-page.component').then(
            (c) => c.ReferralsPageComponent,
          ),
      },
      {
        path: 'impact',
        title: 'My Impact | SmartClinic',
        canActivate: [authenticatedUserGuard],
        loadComponent: () =>
          import('./features/results/my-impact-page.component').then(
            (c) => c.MyImpactPageComponent,
          ),
      },
      {
        path: 'health-records',
        title: 'Health Records | SmartClinic',
        canActivate: [authenticatedUserGuard],
        loadComponent: () =>
          import('./features/care/health-records-page.component').then(
            (c) => c.HealthRecordsPageComponent,
          ),
      },
      {
        path: 'providers',
        title: 'My Providers | SmartClinic',
        canActivate: [authenticatedUserGuard],
        loadComponent: () =>
          import('./features/connections/my-providers-page.component').then(
            (c) => c.MyProvidersPageComponent,
          ),
      },
      {
        path: 'providers/connect',
        title: 'Connect to a Provider | SmartClinic',
        canActivate: [authenticatedUserGuard],
        loadComponent: () =>
          import('./features/connections/connect-provider-page.component').then(
            (c) => c.ConnectProviderPageComponent,
          ),
      },
      {
        path: 'providers/:reference',
        title: 'Provider Connection | SmartClinic',
        canActivate: [authenticatedUserGuard],
        loadComponent: () =>
          import('./features/connections/provider-connection-detail-page.component').then(
            (c) => c.ProviderConnectionDetailPageComponent,
          ),
      },
      {
        path: 'prescriptions',
        title: 'Prescriptions | SmartClinic',
        canActivate: [authenticatedUserGuard],
        loadComponent: () =>
          import('./features/care/prescriptions-page.component').then(
            (c) => c.PrescriptionsPageComponent,
          ),
      },
      {
        path: 'prescriptions/:reference',
        title: 'Prescription | SmartClinic',
        canActivate: [authenticatedUserGuard],
        loadComponent: () =>
          import('./features/care/prescription-detail-page.component').then(
            (c) => c.PrescriptionDetailPageComponent,
          ),
      },
      {
        path: 'health-records/sharing',
        title: 'Manage Health Record Sharing | SmartClinic',
        canActivate: [authenticatedUserGuard],
        loadComponent: () =>
          import('./features/care/health-record-sharing-page.component').then(
            (c) => c.HealthRecordSharingPageComponent,
          ),
      },
      {
        path: 'health-records/sharing/new',
        title: 'Share Health Records | SmartClinic',
        canActivate: [authenticatedUserGuard],
        loadComponent: () =>
          import('./features/care/new-health-record-sharing-page.component').then(
            (c) => c.NewHealthRecordSharingPageComponent,
          ),
      },
      {
        path: 'health-records/sharing/:reference',
        title: 'Health Record Access | SmartClinic',
        canActivate: [authenticatedUserGuard],
        loadComponent: () =>
          import('./features/care/health-record-sharing-detail-page.component').then(
            (c) => c.HealthRecordSharingDetailPageComponent,
          ),
      },
      {
        path: 'health-records/access-history',
        title: 'Health Record Access History | SmartClinic',
        canActivate: [authenticatedUserGuard],
        loadComponent: () =>
          import('./features/care/health-record-access-history-page.component').then(
            (c) => c.HealthRecordAccessHistoryPageComponent,
          ),
      },
      {
        path: 'health-records/:reference',
        title: 'Clinical Record | SmartClinic',
        canActivate: [authenticatedUserGuard],
        loadComponent: () =>
          import('./features/care/health-record-detail-page.component').then(
            (c) => c.HealthRecordDetailPageComponent,
          ),
      },
      {
        path: 'care',
        title: 'My Care | SmartClinic',
        canActivate: [authenticatedUserGuard],
        loadComponent: () =>
          import('./features/care/my-care-page.component').then((c) => c.MyCarePageComponent),
      },
      {
        path: 'care/appointments/:reference',
        title: 'My Care appointment | SmartClinic',
        canActivate: [authenticatedUserGuard],
        loadComponent: () =>
          import('./features/care/patient-care-appointment-detail-page.component').then(
            (c) => c.PatientCareAppointmentDetailPageComponent,
          ),
      },
      {
        path: 'care/:reference/chat',
        title: 'Care chat | SmartClinic',
        canActivate: [authenticatedUserGuard],
        data: { chatScope: 'patient' },
        loadComponent: () =>
          import('./features/care/care-chat-page.component').then((c) => c.CareChatPageComponent),
      },
      {
        path: 'care/:reference',
        title: 'Care Request | SmartClinic',
        canActivate: [authenticatedUserGuard],
        loadComponent: () =>
          import('./features/care/care-detail-page.component').then(
            (c) => c.CareDetailPageComponent,
          ),
      },
      {
        path: 'fasttrack',
        title: 'My FastTrack requests | SmartClinic',
        canActivate: [authenticatedUserGuard],
        loadComponent: () =>
          import('./features/care/fasttrack-list-page.component').then(
            (c) => c.FastTrackListPageComponent,
          ),
      },
      {
        path: 'fasttrack/new',
        title: 'Request FastTrack | SmartClinic',
        canActivate: [authenticatedUserGuard],
        loadComponent: () =>
          import('./features/care/external-fasttrack-page.component').then(
            (c) => c.ExternalFastTrackPageComponent,
          ),
      },
      {
        path: 'fasttrack/:reference',
        title: 'FastTrack request | SmartClinic',
        canActivate: [authenticatedUserGuard],
        loadComponent: () =>
          import('./features/care/fasttrack-detail-page.component').then(
            (c) => c.FastTrackDetailPageComponent,
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
        path: 'payment-return/:reference',
        title: 'Verify Health Check payment | SmartClinic',
        canActivate: [authenticatedUserGuard],
        loadComponent: () =>
          import('./features/results/patient-payment-return-page.component').then(
            (c) => c.PatientPaymentReturnPageComponent,
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
        path: 'care-services',
        title: 'General Care Services | SmartClinic',
        canActivate: [providerGuard],
        loadComponent: () =>
          import('./features/provider/provider-care-services-page.component').then(
            (component) => component.ProviderCareServicesPageComponent,
          ),
      },
      {
        path: 'shared-health-records',
        title: 'Shared Health Records | SmartClinic',
        canActivate: [providerGuard],
        loadComponent: () =>
          import('./features/provider/provider-shared-health-records-page.component').then(
            (c) => c.ProviderSharedHealthRecordsPageComponent,
          ),
      },
      {
        path: 'patient-connections/configuration',
        title: 'Patient Connection Settings | SmartClinic',
        canActivate: [providerGuard],
        loadComponent: () =>
          import('./features/provider/provider-patient-connections-configuration-page.component').then(
            (c) => c.ProviderPatientConnectionsConfigurationPageComponent,
          ),
      },
      {
        path: 'patient-connections',
        title: 'Patient Connections | SmartClinic',
        canActivate: [providerGuard],
        loadComponent: () =>
          import('./features/provider/provider-patient-connections-page.component').then(
            (c) => c.ProviderPatientConnectionsPageComponent,
          ),
      },
      {
        path: 'patient-connections/:reference',
        title: 'Patient Connection | SmartClinic',
        canActivate: [providerGuard],
        loadComponent: () =>
          import('./features/provider/provider-patient-connection-detail-page.component').then(
            (c) => c.ProviderPatientConnectionDetailPageComponent,
          ),
      },
      {
        path: 'pharmacy-orders',
        title: 'Pharmacy Orders | SmartClinic',
        canActivate: [providerGuard],
        loadComponent: () =>
          import('./features/provider/provider-pharmacy-orders-page.component').then(
            (c) => c.ProviderPharmacyOrdersPageComponent,
          ),
      },
      {
        path: 'pharmacy-orders/:reference',
        title: 'Pharmacy Order | SmartClinic',
        canActivate: [providerGuard],
        loadComponent: () =>
          import('./features/provider/provider-pharmacy-order-detail-page.component').then(
            (c) => c.ProviderPharmacyOrderDetailPageComponent,
          ),
      },
      {
        path: 'service-units',
        title: 'Service Units | SmartClinic',
        canActivate: [providerGuard],
        loadComponent: () =>
          import('./features/provider/provider-service-units-page.component').then(
            (c) => c.ProviderServiceUnitsPageComponent,
          ),
      },
      {
        path: 'shared-health-records/:reference',
        title: 'Shared Clinical Record | SmartClinic',
        canActivate: [providerGuard],
        loadComponent: () =>
          import('./features/provider/provider-shared-health-record-detail-page.component').then(
            (c) => c.ProviderSharedHealthRecordDetailPageComponent,
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
        path: 'care-requests',
        title: 'Provider Care Requests | SmartClinic',
        canActivate: [providerGuard],
        loadComponent: () =>
          import('./features/provider/provider-care-requests-page.component').then(
            (c) => c.ProviderCareRequestsPageComponent,
          ),
      },
      {
        path: 'care-requests/:reference/chat',
        title: 'Provider care chat | SmartClinic',
        canActivate: [providerGuard],
        data: { chatScope: 'provider' },
        loadComponent: () =>
          import('./features/care/care-chat-page.component').then((c) => c.CareChatPageComponent),
      },
      {
        path: 'care-requests/:reference',
        title: 'Provider Care Request | SmartClinic',
        canActivate: [providerGuard],
        loadComponent: () =>
          import('./features/provider/provider-care-request-detail-page.component').then(
            (c) => c.ProviderCareRequestDetailPageComponent,
          ),
      },
      {
        path: 'care-appointments',
        title: 'Provider Care Appointments | SmartClinic',
        canActivate: [providerGuard],
        loadComponent: () =>
          import('./features/provider/provider-care-appointments-page.component').then(
            (c) => c.ProviderCareAppointmentsPageComponent,
          ),
      },
      {
        path: 'care-appointments/:reference',
        title: 'Provider Care Appointment | SmartClinic',
        canActivate: [providerGuard],
        loadComponent: () =>
          import('./features/provider/provider-care-appointment-detail-page.component').then(
            (c) => c.ProviderCareAppointmentDetailPageComponent,
          ),
      },
      {
        path: 'fasttrack',
        title: 'Provider FastTrack | SmartClinic',
        canActivate: [providerGuard],
        loadComponent: () =>
          import('./features/provider/provider-fasttrack-page.component').then(
            (c) => c.ProviderFastTrackPageComponent,
          ),
      },
      {
        path: 'fasttrack/:reference',
        title: 'Provider FastTrack request | SmartClinic',
        canActivate: [providerGuard],
        loadComponent: () =>
          import('./features/provider/provider-fasttrack-detail-page.component').then(
            (c) => c.ProviderFastTrackDetailPageComponent,
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
        path: 'referrals',
        title: 'Referrals | SmartClinic',
        canActivate: [adminPricingGuard],
        loadComponent: () =>
          import('./features/admin/admin-referrals-page.component').then(
            (c) => c.AdminReferralsPageComponent,
          ),
      },
      {
        path: 'care-services',
        title: 'Care Services | SmartClinic',
        canActivate: [adminPricingGuard],
        loadComponent: () =>
          import('./features/admin/admin-care-services-page.component').then(
            (component) => component.AdminCareServicesPageComponent,
          ),
      },
      {
        path: 'reward-withdrawals',
        title: 'Reward withdrawals | SmartClinic',
        canActivate: [adminPricingGuard],
        loadComponent: () =>
          import('./features/admin/admin-reward-withdrawals-page.component').then(
            (c) => c.AdminRewardWithdrawalsPageComponent,
          ),
      },
      {
        path: 'commission-settings',
        title: 'Commission Settings | SmartClinic',
        canActivate: [adminPricingGuard],
        loadComponent: () =>
          import('./features/admin/admin-commission-settings-page.component').then(
            (component) => component.AdminCommissionSettingsPageComponent,
          ),
      },
      {
        path: 'reward-withdrawals/:reference',
        title: 'Reward withdrawal detail | SmartClinic',
        canActivate: [adminPricingGuard],
        loadComponent: () =>
          import('./features/admin/admin-reward-withdrawal-detail-page.component').then(
            (c) => c.AdminRewardWithdrawalDetailPageComponent,
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
